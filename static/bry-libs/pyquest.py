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
    'move', 'turn_left', 'turn_right', 'attack', 'collect',
    'is_blocked', 'enemy_ahead', 'on_goal', 'on_resource',
    'health', 'inventory',
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


class GameOverError(Exception):
    """L'eroe è morto: aborta i cicli in corso su un eroe ormai fuori gioco.

    L'evento `death` è già in trace quando questa viene sollevata, quindi lato
    React la sconfitta si mostra come UI dedicata (non come pannello d'errore):
    la precedenza degli esiti è won > failed > error.
    """
    pass


def _sign(d):
    return (d > 0) - (d < 0)


# --- Modello ------------------------------------------------------------------

class Hero:
    def __init__(self, x, y, facing, hp):
        self.x = x
        self.y = y
        self.facing = facing
        self.hp = hp
        self.inventory = {}


class Enemy:
    def __init__(self, data):
        self.id = data['id']
        self.kind = data['kind']
        self.x = data['x']
        self.y = data['y']
        self.hp = data['hp']
        self.behavior = data.get('behavior', 'static')
        self.alive = True


class Resource:
    def __init__(self, data):
        self.id = data['id']
        self.kind = data['kind']
        self.x = data['x']
        self.y = data['y']
        self.collected = False


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

        self.enemies = [Enemy(e) for e in data.get('enemies', [])]
        self.resources = [Resource(r) for r in data.get('resources', [])]

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

    def enemy_at(self, x, y):
        """Nemico VIVO nella cella (x, y), oppure None."""
        for e in self.enemies:
            if e.alive and (e.x, e.y) == (x, y):
                return e
        return None

    def resource_at(self, x, y):
        """Risorsa NON raccolta nella cella (x, y), oppure None."""
        for r in self.resources:
            if not r.collected and (r.x, r.y) == (x, y):
                return r
        return None

    def _enemy_can_enter(self, x, y):
        # Un nemico non entra in muri/bordi, sulla cella dell'eroe (là attacca)
        # né sopra un altro nemico vivo (niente sovrapposizioni).
        if not self.is_walkable(x, y):
            return False
        if (x, y) == (self.hero.x, self.hero.y):
            return False
        return self.enemy_at(x, y) is None

    def _hero_take_hit(self, by_id):
        self.hero.hp -= 1
        _emit({'t': 'hero_hit', 'hp': self.hero.hp, 'by': by_id})
        if self.hero.hp <= 0:
            self.dead = True
            _emit({'t': 'death'})
            raise GameOverError(
                'Il tuo eroe è caduto. Ripensa la strategia: attacca prima di '
                'finire circondato, oppure evita i nemici.'
            )

    def _enemy_step(self, e):
        # Un passo «greedy» verso l'eroe: prima l'asse col delta maggiore (a
        # parità l'asse x), poi l'altro asse; se entrambi sono bloccati, fermo.
        dx = self.hero.x - e.x
        dy = self.hero.y - e.y
        if abs(dx) >= abs(dy):
            candidates = ((_sign(dx), 0), (0, _sign(dy)))
        else:
            candidates = ((0, _sign(dy)), (_sign(dx), 0))
        for sx, sy in candidates:
            if sx == 0 and sy == 0:
                continue
            nx, ny = e.x + sx, e.y + sy
            if self._enemy_can_enter(nx, ny):
                e.x, e.y = nx, ny
                _emit({'t': 'enemy_move', 'id': e.id, 'x': nx, 'y': ny})
                return

    def tick(self):
        # Turno dei nemici dopo ogni azione: ordine di lista, deterministico,
        # zero RNG. `static` attacca solo se adiacente; `melee` attacca se
        # adiacente, altrimenti fa un passo verso l'eroe.
        for e in self.enemies:
            if not e.alive:
                continue
            adjacent = abs(e.x - self.hero.x) + abs(e.y - self.hero.y) == 1
            if adjacent:
                self._hero_take_hit(e.id)
            elif e.behavior == 'melee':
                self._enemy_step(e)


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
    if t == 'collect':
        kind = cond.get('kind')
        qty = cond.get('qty', 1)
        return _world.hero.inventory.get(kind, 0) >= qty
    if t == 'defeat':
        kind = cond.get('kind')
        count = cond.get('count')
        targets = [e for e in _world.enemies if kind is None or e.kind == kind]
        defeated = sum(1 for e in targets if not e.alive)
        if count is not None:
            return defeated >= count
        # «tutti i nemici (di quel kind)»: il guard len>0 evita la vittoria
        # fantasma se, per errore d'autore, non ci sono nemici da sconfiggere.
        return len(targets) > 0 and defeated == len(targets)
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
    # Muro/bordo o nemico davanti: no-op + bump (mai eccezione, spec D7).
    if _world.is_walkable(nx, ny) and _world.enemy_at(nx, ny) is None:
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


def attack():
    _action_guard()
    if _world.won:
        return
    hero = _world.hero
    dx, dy = DIRS[hero.facing]
    tx, ty = hero.x + dx, hero.y + dy
    target = _world.enemy_at(tx, ty)
    if target is not None:
        target.hp -= 1
        _emit({'t': 'attack', 'x': tx, 'y': ty, 'hit': True})
        _emit({'t': 'enemy_hit', 'id': target.id, 'hp': target.hp})
        if target.hp <= 0:
            target.alive = False
            _emit({'t': 'defeat', 'id': target.id})
    else:
        _emit({'t': 'attack', 'x': tx, 'y': ty, 'hit': False})
    _after_action()


def collect():
    _action_guard()
    if _world.won:
        return
    hero = _world.hero
    res = _world.resource_at(hero.x, hero.y)
    if res is not None:
        res.collected = True
        hero.inventory[res.kind] = hero.inventory.get(res.kind, 0) + 1
        _emit({'t': 'collect', 'id': res.id, 'kind': res.kind})
    else:
        _emit({'t': 'bump', 'x': hero.x, 'y': hero.y})
    _after_action()


# --- API studente: sensori (gratuiti, senza tick) -----------------------------

def is_blocked():
    _sensor_guard()
    hero = _world.hero
    dx, dy = DIRS[hero.facing]
    nx, ny = hero.x + dx, hero.y + dy
    return not _world.is_walkable(nx, ny) or _world.enemy_at(nx, ny) is not None


def enemy_ahead():
    _sensor_guard()
    hero = _world.hero
    dx, dy = DIRS[hero.facing]
    return _world.enemy_at(hero.x + dx, hero.y + dy) is not None


def on_goal():
    _sensor_guard()
    return _world.goal is not None and (_world.hero.x, _world.hero.y) == _world.goal


def on_resource():
    _sensor_guard()
    return _world.resource_at(_world.hero.x, _world.hero.y) is not None


def health():
    _sensor_guard()
    return _world.hero.hp


def inventory(kind=None):
    _sensor_guard()
    inv = _world.hero.inventory
    if kind is None:
        return sum(inv.values())
    return inv.get(kind, 0)
