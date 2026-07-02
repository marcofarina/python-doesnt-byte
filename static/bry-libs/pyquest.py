# pyquest.py — modello logico dei mini-giochi a griglia (PyQuest).
#
# Motore trace-based (spec D1): il codice studente viene eseguito davvero, per
# intero e sincrono, contro questo modello in puro Python. Ogni azione aggiorna
# il modello ED emette subito un evento `game_event` via notify(); React (lato
# TS) accumula la trace e la anima dopo. I sensori leggono lo stato corrente del
# modello (aggiornato durante l'esecuzione vera), quindi i cicli condizionati
# funzionano.
#
# Decisione step 6 (spike sys.settrace, 2026-07-02): guardia NON attivata,
# rischio residuo ACCETTATO. Misure in Brython 3.12 nel browser:
#   - settrace con eventi 'line' funziona SOLO nei frame di funzione
#     (400 005 eventi su un loop 200k in funzione; overhead ~20-27x, ~2-6 us/evento);
#   - il codice a livello modulo — cioè il codice studente, exec-utato da
#     brython_runner — NON genera line events (1 solo evento su loop da 300k
#     iterazioni top-level), quindi la guardia non vedrebbe proprio il caso
#     canonico `while True: pass`;
#   - frame.f_trace sul frame corrente è accettato ma inefficace (0 eventi);
#   - il raise dal tracer nei frame di funzione ha semantica rotta:
#     sys.settrace(None) chiamato dentro il tracer non disattiva il tracing e
#     l'eccezione riesplode durante le righe dell'handler, scavalcando l'except.
# Quindi: `while True: pass` senza chiamate API blocca il main thread come oggi
# in PyRunner; i loop che chiamano qualcosa sono mitigati da step_count e
# sensor_count qui sotto.

import json
from config import Config  # type: ignore
from py_back_trace import notify  # type: ignore

__all__ = [
    '_load_level',
    'move', 'turn_left', 'turn_right',
    'is_blocked', 'on_goal',
]

# --- Costanti -----------------------------------------------------------------

MAX_STEPS_DEFAULT = 500
MAX_SENSOR_READS = 100_000

# y cresce verso il basso; facing in north|east|south|west.
DIRS = {
    'north': (0, -1),
    'east': (1, 0),
    'south': (0, 1),
    'west': (-1, 0),
}

_TURN_LEFT = {'north': 'west', 'west': 'south', 'south': 'east', 'east': 'north'}
_TURN_RIGHT = {'north': 'east', 'east': 'south', 'south': 'west', 'west': 'north'}


# --- Eccezioni di fine partita ------------------------------------------------

class StepLimitError(Exception):
    """Superato il tetto di azioni (o di letture sensore): ciclo non terminante."""
    pass


# --- Modello ------------------------------------------------------------------

class Hero:
    def __init__(self, x, y, facing, hp):
        self.x = x
        self.y = y
        self.facing = facing
        self.hp = hp
        self.inventory = {}


class World:
    def __init__(self, data):
        grid = data['grid']
        legend = grid['legend']
        rows = grid['rows']
        self.height = len(rows)
        self.width = len(rows[0]) if rows else 0
        self.walls = set()
        for y, row in enumerate(rows):
            for x, ch in enumerate(row):
                if legend.get(ch) == 'wall':
                    self.walls.add((x, y))

        h = data['hero']
        self.hero = Hero(h['x'], h['y'], h.get('facing', 'east'), h.get('hp', 3))

        g = data.get('goal')
        self.goal = (g['x'], g['y']) if g else None

        self.win_spec = data.get('win', [])
        self.max_steps = data.get('maxSteps', MAX_STEPS_DEFAULT)

        self.step_count = 0
        self.sensor_count = 0
        self.won = False
        self.dead = False

    def is_walkable(self, x, y):
        if x < 0 or y < 0 or x >= self.width or y >= self.height:
            return False
        if (x, y) in self.walls:
            return False
        return True

    def tick(self):
        # I nemici si muovono qui (step 13). Nel nucleo movimento è un no-op.
        pass


_world = None  # riassegnato a ogni _load_level → nessuna contaminazione tra run


def _load_level(json_str):
    global _world
    _world = World(json.loads(json_str))


# --- Emissione eventi (D4: payload = stringa JSON) ----------------------------

def _emit(ev):
    notify(Config.NODE_ID, {'type': 'game_event', 'payload': json.dumps(ev)})


# --- Guardie di sicurezza -----------------------------------------------------

def _action_guard():
    _world.step_count += 1
    if _world.step_count > _world.max_steps:
        _emit({'t': 'step_limit'})
        raise StepLimitError(
            'Hai superato le %d mosse: forse un ciclo non si ferma mai. '
            'Controlla la condizione del tuo `while`.' % _world.max_steps
        )


def _sensor_guard():
    _world.sensor_count += 1
    if _world.sensor_count > MAX_SENSOR_READS:
        _emit({'t': 'step_limit'})
        raise StepLimitError(
            'Hai interrogato i sensori troppe volte senza agire: '
            'probabilmente un `while` gira a vuoto. Fai muovere il tuo eroe.'
        )


# --- Ciclo del mondo ----------------------------------------------------------

def _after_action():
    _world.tick()
    _check_win()


def _cond_met(cond):
    t = cond.get('type')
    if t == 'reach':
        return _world.goal is not None and (_world.hero.x, _world.hero.y) == _world.goal
    # collect / defeat: implementati allo step 13. Finché non lo sono, la
    # condizione è considerata NON soddisfatta (mai vittoria fantasma).
    return False


def _check_win():
    if _world.won:
        return
    if not _world.win_spec:
        return
    for cond in _world.win_spec:
        if not _cond_met(cond):
            return
    _world.won = True
    _emit({'t': 'win'})


# --- API studente: azioni -----------------------------------------------------

def move():
    # La guardia scatta PRIMA del check `won`: a mondo congelato le azioni
    # restano no-op ma costano comunque un passo, altrimenti un
    # `while True: move()` dopo la vittoria ciclerebbe per sempre senza che
    # nessun contatore avanzi (main thread bloccato).
    _action_guard()
    if _world.won:
        return
    hero = _world.hero
    dx, dy = DIRS[hero.facing]
    nx, ny = hero.x + dx, hero.y + dy
    if _world.is_walkable(nx, ny):
        hero.x, hero.y = nx, ny
        _emit({'t': 'move', 'x': nx, 'y': ny, 'f': hero.facing})
    else:
        _emit({'t': 'bump', 'x': nx, 'y': ny})
    _after_action()


def turn_left():
    _action_guard()
    if _world.won:
        return
    _world.hero.facing = _TURN_LEFT[_world.hero.facing]
    _emit({'t': 'turn', 'f': _world.hero.facing})
    _after_action()


def turn_right():
    _action_guard()
    if _world.won:
        return
    _world.hero.facing = _TURN_RIGHT[_world.hero.facing]
    _emit({'t': 'turn', 'f': _world.hero.facing})
    _after_action()


# --- API studente: sensori (gratuiti, senza tick) -----------------------------

def is_blocked():
    _sensor_guard()
    hero = _world.hero
    dx, dy = DIRS[hero.facing]
    return not _world.is_walkable(hero.x + dx, hero.y + dy)


def on_goal():
    _sensor_guard()
    return _world.goal is not None and (_world.hero.x, _world.hero.y) == _world.goal
