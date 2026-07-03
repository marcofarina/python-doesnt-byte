/**
 * Editor di livelli PyQuest (spec step 17) — `/level-editor`.
 *
 * Strumento interno d'autore, non linkato in navbar e `noindex`: disegna un
 * livello (palette + paint click&drag, resize griglia, form metadati), lo vede
 * girare nell'anteprima live `<PyQuest levelData={draft} />`, e ne esporta il
 * JSON da incollare in `static/pyquest/<mondo>/world.json`.
 *
 * Il modello interno (`Draft`) è comodo per l'editing (muri come array di bool,
 * eroe/goal/entità come oggetti); `draftToLevel` lo proietta sullo schema
 * `LevelDef` (speculare al world.json) e `levelToDraft` fa il verso inverso in
 * import. La validazione ricalca le regole del plugin build-time
 * (`plugins/pyquest/index.js`) così l'anteprima segnala in anticipo ciò che
 * romperebbe la build.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Head from '@docusaurus/Head';
import BrowserOnly from '@docusaurus/BrowserOnly';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPenRuler,
  faPlus,
  faTrash,
  faCopy,
  faFileImport,
  faRobot,
} from '@fortawesome/free-solid-svg-icons';
import clsx from 'clsx';
import type { CSSProperties } from 'react';
import PyQuest from '@site/src/components/PyQuest';
import {
  ENEMY_KINDS,
  RESOURCE_KINDS,
  enemyVisual,
  resourceVisual,
  GOAL_ICON,
} from '@site/src/components/PyQuest/characters';
import { FACING_DEG } from '@site/src/components/PyQuest/GameScene';
import { copyToClipboard } from '@site/src/theme/PyRunner/clipboard';
import type {
  EnemyBehavior,
  EnemyDef,
  Facing,
  LevelDef,
  ResourceDef,
  WinCond,
} from '@site/src/components/PyQuest/types';
import styles from './level-editor.module.css';

// --- Costanti d'autore --------------------------------------------------------

type Tool = 'wall' | 'floor' | 'hero' | 'goal' | 'enemy' | 'resource';

const FACINGS: Facing[] = ['north', 'east', 'south', 'west'];
const FACING_LABEL: Record<Facing, string> = {
  north: 'nord',
  east: 'est',
  south: 'sud',
  west: 'ovest',
};
const BEHAVIORS: EnemyBehavior[] = ['static', 'melee'];
const WIN_TYPES: WinCond['type'][] = ['reach', 'collect', 'defeat'];

const MIN_SIZE = 3;
const MAX_SIZE = 15;
const DEFAULT_SIZE = 7;
/** Tetto sui punti vita: la scena renderizza un'icona per PV (cuori/pip). */
const MAX_HP = 99;

const PALETTE: { tool: Tool; label: string }[] = [
  { tool: 'wall', label: 'Muro' },
  { tool: 'floor', label: 'Pavimento' },
  { tool: 'hero', label: 'Eroe' },
  { tool: 'goal', label: 'Bandiera' },
  { tool: 'enemy', label: 'Nemico' },
  { tool: 'resource', label: 'Risorsa' },
];

// --- Modello di editing -------------------------------------------------------

interface Draft {
  id: string;
  title: string;
  width: number;
  height: number;
  /** Muri: `walls[y * width + x]`. */
  walls: boolean[];
  hero: { x: number; y: number; facing: Facing; hp: number };
  goal: { x: number; y: number } | null;
  enemies: EnemyDef[];
  resources: ResourceDef[];
  win: WinCond[];
  hints: string[];
  par: number;
  maxSteps: number | null;
  starterCode: string;
  solution: string;
}

/** Stanza vuota bordata di muri, eroe in alto a sinistra, bandiera in fondo. */
function emptyDraft(width: number, height: number): Draft {
  const walls: boolean[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const border = x === 0 || y === 0 || x === width - 1 || y === height - 1;
      walls.push(border);
    }
  }
  return {
    id: 'nuovo-livello',
    title: 'Nuovo livello',
    width,
    height,
    walls,
    hero: { x: 1, y: 1, facing: 'east', hp: 3 },
    goal: { x: width - 2, y: height - 2 },
    enemies: [],
    resources: [],
    win: [{ type: 'reach' }],
    hints: ['Primo suggerimento.'],
    par: 1,
    maxSteps: null,
    starterCode: '# Scrivi qui il codice iniziale che vede lo studente.\n',
    solution: '',
  };
}

function allIds(d: Draft): Set<string> {
  return new Set([
    ...d.enemies.map((e) => e.id),
    ...d.resources.map((r) => r.id),
  ]);
}

/** Primo `prefix + n` (n ≥ 1) non ancora usato. */
function freeId(prefix: string, used: Set<string>): string {
  let n = 1;
  while (used.has(`${prefix}${n}`)) n++;
  return `${prefix}${n}`;
}

/** Copia di `arr` con l'elemento in posizione `i` sostituito da `next`. */
function replaceAt<T>(arr: T[], i: number, next: T): T[] {
  return arr.map((x, j) => (j === i ? next : x));
}

/** Copia di `arr` senza l'elemento in posizione `i`. */
function removeAt<T>(arr: T[], i: number): T[] {
  return arr.filter((_, j) => j !== i);
}

// --- Proiezioni Draft ↔ LevelDef ---------------------------------------------

function draftToLevel(d: Draft): LevelDef {
  const rows: string[] = [];
  for (let y = 0; y < d.height; y++) {
    let row = '';
    for (let x = 0; x < d.width; x++) {
      row += d.walls[y * d.width + x] ? '#' : '.';
    }
    rows.push(row);
  }
  const level: LevelDef = {
    id: d.id,
    title: d.title,
    grid: { legend: { '#': 'wall', '.': 'floor' }, rows },
    hero: d.hero,
    win: d.win,
    starterCode: d.starterCode,
    hints: d.hints,
    par: d.par,
  };
  if (d.goal) level.goal = d.goal;
  if (d.enemies.length) level.enemies = d.enemies;
  if (d.resources.length) level.resources = d.resources;
  if (d.solution.trim()) level.solution = d.solution;
  if (d.maxSteps != null) level.maxSteps = d.maxSteps;
  return level;
}

/**
 * Import: proietta un `LevelDef` (già filtrato da `handleImport`) sul modello.
 * I campi stringa e numerici vengono coercitivamente normalizzati: un JSON
 * scritto a mano può avere tipi sbagliati o campi mancanti, e un draft con
 * `undefined` dove i form si aspettano un valore renderebbe gli input
 * uncontrolled (o farebbe crashare la pagina) invece di mostrare un errore
 * di validazione. I fallback sono valori invalidi apposta ('' e 0/-1): la
 * validazione li segnala, senza riparare il livello di nascosto.
 */
function str(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

function num(v: unknown, fallback: number): number {
  return typeof v === 'number' ? v : fallback;
}

function levelToDraft(level: LevelDef): Draft {
  const rows = level.grid.rows;
  const height = rows.length;
  const width = rows[0].length;
  const wallChars = new Set(
    Object.entries(level.grid.legend)
      .filter(([, role]) => role === 'wall')
      .map(([ch]) => ch),
  );
  const walls: boolean[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      walls.push(wallChars.has(rows[y][x]));
    }
  }
  return {
    id: str(level.id),
    title: str(level.title),
    width,
    height,
    walls,
    hero: {
      x: num(level.hero.x, -1),
      y: num(level.hero.y, -1),
      facing: FACINGS.includes(level.hero.facing) ? level.hero.facing : 'east',
      hp: num(level.hero.hp ?? 3, 0),
    },
    goal: level.goal ?? null,
    enemies: (Array.isArray(level.enemies) ? level.enemies : []).map((e) => ({
      ...e,
      id: str(e.id),
      kind: str(e.kind),
      x: num(e.x, -1),
      y: num(e.y, -1),
      hp: num(e.hp, 0),
    })),
    resources: (Array.isArray(level.resources) ? level.resources : []).map(
      (r) => ({
        ...r,
        id: str(r.id),
        kind: str(r.kind),
        x: num(r.x, -1),
        y: num(r.y, -1),
      }),
    ),
    win: level.win.map((c) =>
      c.type === 'collect'
        ? { ...c, kind: str(c.kind), qty: num(c.qty, 0) }
        : c.type === 'defeat'
          ? {
              ...c,
              kind: c.kind === undefined ? undefined : str(c.kind),
              count: c.count === undefined ? undefined : num(c.count, 0),
            }
          : c,
    ),
    hints: level.hints,
    par: num(level.par, 0),
    maxSteps: level.maxSteps == null ? null : num(level.maxSteps, 0),
    starterCode: str(level.starterCode),
    solution: str(level.solution),
  };
}

// --- Validazione (ricalca plugins/pyquest/index.js) ---------------------------

const FORBIDDEN = /['"\\]/;
// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u001f]/;

function safeId(v: unknown): boolean {
  return (
    typeof v === 'string' &&
    v.length > 0 &&
    !FORBIDDEN.test(v) &&
    !CONTROL.test(v)
  );
}

/** Intero ≥ min: gli input `type="number"` lasciano passare anche i decimali. */
function intAtLeast(v: unknown, min: number): boolean {
  return typeof v === 'number' && Number.isInteger(v) && v >= min;
}

/** Punti vita sensati: intero in [1, MAX_HP] (la scena disegna un'icona a PV). */
function validHp(v: unknown): boolean {
  return intAtLeast(v, 1) && (v as number) <= MAX_HP;
}

/** Elenco di problemi che romperebbero l'import in world.json (vuoto = ok). */
function validateDraft(d: Draft): string[] {
  const errs: string[] = [];
  // Cella valida per un'entità: dentro la griglia e non su un muro (il plugin
  // fa lo stesso check con assertOnFloor). Raggiungibile via import: il paint
  // non permette di creare queste configurazioni.
  const onFloor = (x: number, y: number) =>
    Number.isInteger(x) &&
    Number.isInteger(y) &&
    x >= 0 &&
    y >= 0 &&
    x < d.width &&
    y < d.height &&
    !d.walls[y * d.width + x];

  if (!safeId(d.id)) {
    errs.push(
      'L’id deve essere non vuoto e senza apici, virgolette o backslash.',
    );
  }
  if (!d.title.trim()) errs.push('Il titolo è obbligatorio.');

  if (!onFloor(d.hero.x, d.hero.y)) {
    errs.push('L’eroe è fuori dalla griglia o su una cella muro.');
  }
  if (!validHp(d.hero.hp)) {
    errs.push(
      `I punti vita dell’eroe devono essere un intero tra 1 e ${MAX_HP}.`,
    );
  }

  if (d.goal && !onFloor(d.goal.x, d.goal.y)) {
    errs.push('La bandiera è fuori dalla griglia o su una cella muro.');
  }

  if (d.win.length === 0) {
    errs.push('Serve almeno una condizione di vittoria.');
  }
  for (const cond of d.win) {
    if (cond.type === 'reach' && !d.goal) {
      errs.push('Vittoria «raggiungi» ma il livello non ha una bandiera.');
    }
    if (cond.type === 'collect') {
      if (!safeId(cond.kind))
        errs.push('Vittoria «raccogli»: tipo risorsa non valido.');
      if (!intAtLeast(cond.qty, 1)) {
        errs.push(
          'Vittoria «raccogli»: la quantità deve essere un intero ≥ 1.',
        );
      }
    }
    if (cond.type === 'defeat') {
      if (cond.kind !== undefined && !safeId(cond.kind)) {
        errs.push('Vittoria «sconfiggi»: tipo nemico non valido.');
      }
      if (cond.count !== undefined && !intAtLeast(cond.count, 1)) {
        errs.push(
          'Vittoria «sconfiggi»: il conteggio deve essere un intero ≥ 1.',
        );
      }
    }
  }

  const ids = new Set<string>();
  for (const e of d.enemies) {
    if (!safeId(e.id) || ids.has(e.id))
      errs.push(`Nemico con id non valido o duplicato: «${e.id}».`);
    ids.add(e.id);
    if (!safeId(e.kind)) errs.push(`Nemico «${e.id}»: tipo non valido.`);
    if (!onFloor(e.x, e.y))
      errs.push(`Nemico «${e.id}»: fuori dalla griglia o su una cella muro.`);
    if (!validHp(e.hp))
      errs.push(
        `Nemico «${e.id}»: i punti vita devono essere un intero tra 1 e ${MAX_HP}.`,
      );
    if (!BEHAVIORS.includes(e.behavior))
      errs.push(`Nemico «${e.id}»: comportamento non valido (static|melee).`);
  }
  for (const r of d.resources) {
    if (!safeId(r.id) || ids.has(r.id))
      errs.push(`Risorsa con id non valido o duplicato: «${r.id}».`);
    ids.add(r.id);
    if (!safeId(r.kind)) errs.push(`Risorsa «${r.id}»: tipo non valido.`);
    if (!onFloor(r.x, r.y))
      errs.push(`Risorsa «${r.id}»: fuori dalla griglia o su una cella muro.`);
  }

  if (
    d.hints.length < 1 ||
    d.hints.length > 3 ||
    d.hints.some((h) => typeof h !== 'string' || !h.trim())
  ) {
    errs.push('Servono da uno a tre suggerimenti, tutti non vuoti.');
  }
  if (!intAtLeast(d.par, 1)) {
    errs.push('Il par deve essere un intero ≥ 1.');
  }
  if (d.maxSteps != null && !intAtLeast(d.maxSteps, 1)) {
    errs.push('maxSteps deve essere un intero ≥ 1.');
  }
  return errs;
}

// --- Griglia editabile --------------------------------------------------------

interface GridStyle extends CSSProperties {
  '--ed-cols'?: number;
  '--ed-rows'?: number;
}

function EditableGrid({
  draft,
  tool,
  paint,
}: {
  draft: Draft;
  tool: Tool;
  paint: (x: number, y: number) => void;
}) {
  const painting = useRef(false);

  useEffect(() => {
    const up = () => {
      painting.current = false;
    };
    window.addEventListener('mouseup', up);
    return () => window.removeEventListener('mouseup', up);
  }, []);

  const enemyAt = (x: number, y: number) =>
    draft.enemies.find((e) => e.x === x && e.y === y);
  const resourceAt = (x: number, y: number) =>
    draft.resources.find((r) => r.x === x && r.y === y);

  const boardStyle: GridStyle = {
    '--ed-cols': draft.width,
    '--ed-rows': draft.height,
  };

  // Celle in ordine row-major: l'auto-placement della griglia CSS le posiziona
  // da solo (niente coordinate inline per cella; l'ordine è load-bearing).
  const cells = [];
  for (let y = 0; y < draft.height; y++) {
    for (let x = 0; x < draft.width; x++) {
      const wall = draft.walls[y * draft.width + x];
      const isHero = draft.hero.x === x && draft.hero.y === y;
      const isGoal = draft.goal?.x === x && draft.goal?.y === y;
      const enemy = enemyAt(x, y);
      const resource = resourceAt(x, y);
      cells.push(
        <button
          type="button"
          key={`${x},${y}`}
          className={clsx(
            styles.cell,
            wall ? styles.cellWall : styles.cellFloor,
          )}
          title={`(${x}, ${y})`}
          aria-label={`Cella ${x}, ${y}`}
          onMouseDown={(e) => {
            e.preventDefault();
            painting.current = true;
            paint(x, y);
          }}
          onMouseEnter={(e) => {
            // e.buttons: se il tasto è stato rilasciato fuori dalla finestra
            // il mouseup su window non arriva mai — non fidarsi del solo ref.
            if (
              painting.current &&
              (e.buttons & 1) === 1 &&
              (tool === 'wall' || tool === 'floor')
            ) {
              paint(x, y);
            }
          }}
        >
          {isGoal && (
            <FontAwesomeIcon
              icon={GOAL_ICON}
              className={clsx(styles.mark, styles.markGoal)}
            />
          )}
          {resource && (
            <FontAwesomeIcon
              icon={resourceVisual(resource.kind).icon}
              className={clsx(styles.mark, styles.markResource)}
            />
          )}
          {enemy && (
            <FontAwesomeIcon
              icon={enemyVisual(enemy.kind).icon}
              className={clsx(styles.mark, styles.markEnemy)}
            />
          )}
          {isHero && (
            <span
              className={clsx(styles.mark, styles.markHero)}
              style={{
                transform: `rotate(${FACING_DEG[draft.hero.facing]}deg)`,
              }}
            >
              <FontAwesomeIcon icon={faRobot} />
            </span>
          )}
        </button>,
      );
    }
  }

  return (
    <div className={styles.board} style={boardStyle}>
      {cells}
    </div>
  );
}

// --- Editor completo (client-only) -------------------------------------------

function LevelEditorInner() {
  const [draft, setDraft] = useState<Draft>(() =>
    emptyDraft(DEFAULT_SIZE, DEFAULT_SIZE),
  );
  const [tool, setTool] = useState<Tool>('wall');
  // Testo grezzo degli input dimensione: applicare il resize (con clamp) a ogni
  // keystroke distruggerebbe la griglia digitando — «12» passa per «1», e il
  // campo svuotato varrebbe 0 → troncamento a MIN_SIZE con perdita di muri ed
  // entità. Il resize scatta solo quando il testo è un intero nel range.
  const [sizeText, setSizeText] = useState({
    width: String(DEFAULT_SIZE),
    height: String(DEFAULT_SIZE),
  });
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const level = useMemo(() => draftToLevel(draft), [draft]);
  const errors = useMemo(() => validateDraft(draft), [draft]);
  const exportJson = useMemo(() => JSON.stringify(level, null, 2), [level]);

  const paint = useCallback(
    (x: number, y: number) => {
      setDraft((d) => {
        const i = y * d.width + x;
        const isWall = d.walls[i];
        switch (tool) {
          case 'wall': {
            if (d.hero.x === x && d.hero.y === y) return d; // niente muro sull’eroe
            const hasGoal = d.goal !== null && d.goal.x === x && d.goal.y === y;
            const hasEntity =
              d.enemies.some((e) => e.x === x && e.y === y) ||
              d.resources.some((r) => r.x === x && r.y === y);
            // Già muro e niente da spazzare via: no-op (il trascinamento su
            // muri esistenti non deve rifare draft → anteprima a ogni cella).
            if (isWall && !hasGoal && !hasEntity) return d;
            const walls = [...d.walls];
            walls[i] = true;
            return {
              ...d,
              walls,
              goal: hasGoal ? null : d.goal,
              enemies: d.enemies.filter((e) => !(e.x === x && e.y === y)),
              resources: d.resources.filter((r) => !(r.x === x && r.y === y)),
            };
          }
          case 'floor': {
            if (!isWall) return d;
            const walls = [...d.walls];
            walls[i] = false;
            return { ...d, walls };
          }
          case 'hero': {
            if (isWall) return d;
            return { ...d, hero: { ...d.hero, x, y } };
          }
          case 'goal': {
            if (isWall) return d;
            if (d.goal && d.goal.x === x && d.goal.y === y)
              return { ...d, goal: null };
            return { ...d, goal: { x, y } };
          }
          case 'enemy': {
            if (isWall || (d.hero.x === x && d.hero.y === y)) return d;
            const existing = d.enemies.find((e) => e.x === x && e.y === y);
            if (existing)
              return { ...d, enemies: d.enemies.filter((e) => e !== existing) };
            const id = freeId('e', allIds(d));
            return {
              ...d,
              enemies: [
                ...d.enemies,
                { id, kind: 'bug', x, y, hp: 2, behavior: 'melee' },
              ],
            };
          }
          case 'resource': {
            if (isWall || (d.hero.x === x && d.hero.y === y)) return d;
            const existing = d.resources.find((r) => r.x === x && r.y === y);
            if (existing)
              return {
                ...d,
                resources: d.resources.filter((r) => r !== existing),
              };
            const id = freeId('r', allIds(d));
            return {
              ...d,
              resources: [...d.resources, { id, kind: 'gem', x, y }],
            };
          }
          default:
            return d;
        }
      });
    },
    [tool],
  );

  const resize = useCallback((dim: 'width' | 'height', raw: string) => {
    setSizeText((s) => ({ ...s, [dim]: raw }));
    const size = Number(raw);
    if (!Number.isInteger(size) || size < MIN_SIZE || size > MAX_SIZE) return;
    setDraft((d) => {
      const width = dim === 'width' ? size : d.width;
      const height = dim === 'height' ? size : d.height;
      const walls: boolean[] = [];
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          walls.push(
            x < d.width && y < d.height ? d.walls[y * d.width + x] : false,
          );
        }
      }
      const inB = (p: { x: number; y: number }) => p.x < width && p.y < height;
      const hero = inB(d.hero)
        ? d.hero
        : {
            ...d.hero,
            x: Math.min(d.hero.x, width - 1),
            y: Math.min(d.hero.y, height - 1),
          };
      return {
        ...d,
        width,
        height,
        walls,
        hero,
        goal: d.goal && inB(d.goal) ? d.goal : null,
        enemies: d.enemies.filter(inB),
        resources: d.resources.filter(inB),
      };
    });
  }, []);

  const patch = useCallback((p: Partial<Draft>) => {
    setDraft((d) => ({ ...d, ...p }));
  }, []);

  const handleImport = useCallback(() => {
    setImportError(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(importText);
    } catch {
      setImportError('JSON non valido.');
      return;
    }
    const lvl = parsed as LevelDef;
    if (
      !lvl ||
      typeof lvl !== 'object' ||
      !lvl.grid ||
      !Array.isArray(lvl.grid.rows) ||
      lvl.grid.rows.length === 0 ||
      lvl.grid.rows.some((row) => typeof row !== 'string') ||
      !lvl.hero ||
      !Array.isArray(lvl.win) ||
      !Array.isArray(lvl.hints)
    ) {
      setImportError(
        'Non sembra un livello PyQuest (mancano grid/hero/win/hints).',
      );
      return;
    }
    // Il plugin rifiuta le griglie non rettangolari; qui il modello a walls[]
    // le «riparerebbe» in silenzio (righe corte → pavimento, righe lunghe
    // troncate), riscrivendo la geometria — meglio rifiutare anche noi.
    if (lvl.grid.rows.some((row) => row.length !== lvl.grid.rows[0].length)) {
      setImportError(
        'Griglia non rettangolare: tutte le righe devono avere la stessa lunghezza.',
      );
      return;
    }
    // Il form può rendere solo i tipi che conosce: win e hints malformati
    // farebbero crashare il render, meglio rifiutarli con un messaggio.
    if (
      lvl.win.some(
        (c) =>
          !c ||
          typeof c !== 'object' ||
          !(WIN_TYPES as string[]).includes(c.type),
      )
    ) {
      setImportError(
        'Condizioni di vittoria non riconosciute (attesi reach/collect/defeat).',
      );
      return;
    }
    if (lvl.hints.some((h) => typeof h !== 'string')) {
      setImportError('I suggerimenti devono essere stringhe.');
      return;
    }
    if (
      [
        ...(Array.isArray(lvl.enemies) ? lvl.enemies : []),
        ...(Array.isArray(lvl.resources) ? lvl.resources : []),
      ].some((e) => !e || typeof e !== 'object')
    ) {
      setImportError('Nemici o risorse malformati (attesi oggetti).');
      return;
    }
    try {
      const next = levelToDraft(lvl);
      setDraft(next);
      setSizeText({ width: String(next.width), height: String(next.height) });
      setImportText('');
    } catch {
      setImportError('Livello illeggibile: controlla la struttura.');
    }
  }, [importText]);

  const handleCopy = useCallback(() => {
    copyToClipboard(exportJson)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => setCopied(false));
  }, [exportJson]);

  return (
    <div className={styles.editor}>
      {/* Colonna sinistra: disegno + anteprima */}
      <div className={styles.canvasCol}>
        <section className={styles.panel}>
          <div className={styles.paletteRow}>
            <div className={styles.palette} role="group" aria-label="Strumenti">
              {PALETTE.map((p) => (
                <button
                  key={p.tool}
                  type="button"
                  className={clsx(
                    styles.paletteBtn,
                    tool === p.tool && styles.paletteActive,
                  )}
                  aria-pressed={tool === p.tool}
                  onClick={() => setTool(p.tool)}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className={styles.sizeCtrl}>
              <label>
                Larghezza
                <input
                  type="number"
                  min={MIN_SIZE}
                  max={MAX_SIZE}
                  value={sizeText.width}
                  onChange={(e) => resize('width', e.target.value)}
                  onBlur={() =>
                    setSizeText({
                      width: String(draft.width),
                      height: String(draft.height),
                    })
                  }
                />
              </label>
              <label>
                Altezza
                <input
                  type="number"
                  min={MIN_SIZE}
                  max={MAX_SIZE}
                  value={sizeText.height}
                  onChange={(e) => resize('height', e.target.value)}
                  onBlur={() =>
                    setSizeText({
                      width: String(draft.width),
                      height: String(draft.height),
                    })
                  }
                />
              </label>
            </div>
          </div>
          <p className={styles.hint}>
            Seleziona uno strumento e disegna sulla griglia (muro e pavimento
            supportano il trascinamento). Con «Nemico» o «Risorsa» clicca una
            cella occupata per rimuoverla; con «Bandiera» clicca la bandiera per
            toglierla.
          </p>
          <EditableGrid draft={draft} tool={tool} paint={paint} />
        </section>

        <section className={styles.panel}>
          <Heading as="h2" className={styles.panelTitle}>
            Anteprima
          </Heading>
          {errors.length > 0 && (
            <ul className={styles.errors}>
              {errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}
          {/* Anteprima solo su draft valido: un livello che la validazione
              rifiuta salterebbe le guardie che il plugin garantisce a build
              time (quoting delle stringhe iniettate in Python, geometria).
              PyQuest assorbe live i cambi di levelData e starterCode. */}
          {errors.length === 0 ? (
            <PyQuest levelData={level} character="byte" />
          ) : (
            <p className={styles.hint}>
              Correggi gli errori qui sopra per vedere l’anteprima.
            </p>
          )}
        </section>
      </div>

      {/* Colonna destra: metadati + import/export */}
      <div className={styles.formCol}>
        <section className={styles.panel}>
          <Heading as="h2" className={styles.panelTitle}>
            Metadati
          </Heading>
          <div className={styles.fieldGrid}>
            <label className={styles.field}>
              <span>Id (kebab-case, univoco nel mondo)</span>
              <input
                type="text"
                value={draft.id}
                onChange={(e) => patch({ id: e.target.value })}
              />
            </label>
            <label className={styles.field}>
              <span>Titolo</span>
              <input
                type="text"
                value={draft.title}
                onChange={(e) => patch({ title: e.target.value })}
              />
            </label>
            <label className={styles.field}>
              <span>Eroe — orientamento</span>
              <select
                value={draft.hero.facing}
                onChange={(e) =>
                  patch({
                    hero: { ...draft.hero, facing: e.target.value as Facing },
                  })
                }
              >
                {FACINGS.map((f) => (
                  <option key={f} value={f}>
                    {FACING_LABEL[f]}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span>Eroe — punti vita</span>
              <input
                type="number"
                min={1}
                max={MAX_HP}
                value={draft.hero.hp}
                onChange={(e) =>
                  patch({
                    hero: {
                      ...draft.hero,
                      hp: Math.min(MAX_HP, Number(e.target.value) || 1),
                    },
                  })
                }
              />
            </label>
            <label className={styles.field}>
              <span>Par (azioni ottimali)</span>
              <input
                type="number"
                min={1}
                value={draft.par}
                onChange={(e) => patch({ par: Number(e.target.value) || 1 })}
              />
            </label>
            <label className={styles.field}>
              <span>maxSteps (opzionale)</span>
              <input
                type="number"
                min={1}
                value={draft.maxSteps ?? ''}
                placeholder="default 500"
                onChange={(e) =>
                  patch({
                    maxSteps: e.target.value ? Number(e.target.value) : null,
                  })
                }
              />
            </label>
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <Heading as="h2" className={styles.panelTitle}>
              Vittoria
            </Heading>
            <button
              type="button"
              className={styles.addBtn}
              onClick={() => patch({ win: [...draft.win, { type: 'reach' }] })}
            >
              <FontAwesomeIcon icon={faPlus} /> Condizione
            </button>
          </div>
          {draft.win.map((cond, i) => (
            <div key={i} className={styles.row}>
              <select
                value={cond.type}
                onChange={(e) => {
                  const type = e.target.value as WinCond['type'];
                  const next: WinCond =
                    type === 'reach'
                      ? { type: 'reach' }
                      : type === 'collect'
                        ? { type: 'collect', kind: 'gem', qty: 1 }
                        : { type: 'defeat' };
                  patch({ win: replaceAt(draft.win, i, next) });
                }}
              >
                {WIN_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t === 'reach'
                      ? 'raggiungi bandiera'
                      : t === 'collect'
                        ? 'raccogli'
                        : 'sconfiggi'}
                  </option>
                ))}
              </select>
              {cond.type === 'collect' && (
                <>
                  <select
                    value={cond.kind}
                    onChange={(e) =>
                      patch({
                        win: replaceAt(draft.win, i, {
                          ...cond,
                          kind: e.target.value,
                        }),
                      })
                    }
                  >
                    {RESOURCE_KINDS.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    value={cond.qty}
                    className={styles.numSmall}
                    onChange={(e) =>
                      patch({
                        win: replaceAt(draft.win, i, {
                          ...cond,
                          qty: Number(e.target.value) || 1,
                        }),
                      })
                    }
                  />
                </>
              )}
              {cond.type === 'defeat' && (
                <>
                  <select
                    value={cond.kind ?? ''}
                    onChange={(e) =>
                      patch({
                        win: replaceAt(draft.win, i, {
                          ...cond,
                          kind: e.target.value || undefined,
                        }),
                      })
                    }
                  >
                    <option value="">qualsiasi tipo</option>
                    {ENEMY_KINDS.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    value={cond.count ?? ''}
                    placeholder="tutti"
                    className={styles.numSmall}
                    onChange={(e) =>
                      patch({
                        win: replaceAt(draft.win, i, {
                          ...cond,
                          count: e.target.value
                            ? Number(e.target.value)
                            : undefined,
                        }),
                      })
                    }
                  />
                </>
              )}
              <button
                type="button"
                className={styles.iconBtn}
                aria-label="Rimuovi condizione"
                onClick={() => patch({ win: removeAt(draft.win, i) })}
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
            </div>
          ))}
        </section>

        {draft.enemies.length > 0 && (
          <section className={styles.panel}>
            <Heading as="h2" className={styles.panelTitle}>
              Nemici
            </Heading>
            {draft.enemies.map((e, i) => (
              <div key={e.id} className={styles.row}>
                <span className={styles.rowId}>
                  {e.id} ({e.x},{e.y})
                </span>
                <select
                  value={e.kind}
                  onChange={(ev) =>
                    patch({
                      enemies: replaceAt(draft.enemies, i, {
                        ...e,
                        kind: ev.target.value,
                      }),
                    })
                  }
                >
                  {ENEMY_KINDS.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  max={MAX_HP}
                  value={e.hp}
                  className={styles.numSmall}
                  aria-label="Punti vita nemico"
                  onChange={(ev) =>
                    patch({
                      enemies: replaceAt(draft.enemies, i, {
                        ...e,
                        hp: Math.min(MAX_HP, Number(ev.target.value) || 1),
                      }),
                    })
                  }
                />
                <select
                  value={e.behavior}
                  onChange={(ev) =>
                    patch({
                      enemies: replaceAt(draft.enemies, i, {
                        ...e,
                        behavior: ev.target.value as EnemyBehavior,
                      }),
                    })
                  }
                >
                  {BEHAVIORS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className={styles.iconBtn}
                  aria-label="Rimuovi nemico"
                  onClick={() => patch({ enemies: removeAt(draft.enemies, i) })}
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
            ))}
          </section>
        )}

        {draft.resources.length > 0 && (
          <section className={styles.panel}>
            <Heading as="h2" className={styles.panelTitle}>
              Risorse
            </Heading>
            {draft.resources.map((r, i) => (
              <div key={r.id} className={styles.row}>
                <span className={styles.rowId}>
                  {r.id} ({r.x},{r.y})
                </span>
                <select
                  value={r.kind}
                  onChange={(ev) =>
                    patch({
                      resources: replaceAt(draft.resources, i, {
                        ...r,
                        kind: ev.target.value,
                      }),
                    })
                  }
                >
                  {RESOURCE_KINDS.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className={styles.iconBtn}
                  aria-label="Rimuovi risorsa"
                  onClick={() =>
                    patch({ resources: removeAt(draft.resources, i) })
                  }
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
            ))}
          </section>
        )}

        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <Heading as="h2" className={styles.panelTitle}>
              Suggerimenti (1–3)
            </Heading>
            {draft.hints.length < 3 && (
              <button
                type="button"
                className={styles.addBtn}
                onClick={() => patch({ hints: [...draft.hints, ''] })}
              >
                <FontAwesomeIcon icon={faPlus} /> Suggerimento
              </button>
            )}
          </div>
          {draft.hints.map((h, i) => (
            <div key={i} className={styles.row}>
              <input
                type="text"
                className={styles.grow}
                value={h}
                aria-label={`Suggerimento ${i + 1}`}
                onChange={(e) =>
                  patch({ hints: replaceAt(draft.hints, i, e.target.value) })
                }
              />
              {draft.hints.length > 1 && (
                <button
                  type="button"
                  className={styles.iconBtn}
                  aria-label="Rimuovi suggerimento"
                  onClick={() => patch({ hints: removeAt(draft.hints, i) })}
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              )}
            </div>
          ))}
        </section>

        <section className={styles.panel}>
          <Heading as="h2" className={styles.panelTitle}>
            Codice iniziale
          </Heading>
          <textarea
            className={styles.code}
            rows={6}
            value={draft.starterCode}
            spellCheck={false}
            onChange={(e) => patch({ starterCode: e.target.value })}
          />
          <Heading as="h2" className={styles.panelTitle}>
            Soluzione (opzionale, per calibrare il par)
          </Heading>
          <textarea
            className={styles.code}
            rows={6}
            value={draft.solution}
            spellCheck={false}
            onChange={(e) => patch({ solution: e.target.value })}
          />
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <Heading as="h2" className={styles.panelTitle}>
              Esporta JSON
            </Heading>
            <button
              type="button"
              className={styles.addBtn}
              onClick={handleCopy}
            >
              <FontAwesomeIcon icon={faCopy} /> {copied ? 'Copiato!' : 'Copia'}
            </button>
          </div>
          <p className={styles.hint}>
            Incolla questo oggetto in <code>levels</code> dentro
            <code> static/pyquest/&lt;mondo&gt;/world.json</code>.
          </p>
          <textarea
            className={styles.code}
            rows={10}
            value={exportJson}
            readOnly
            spellCheck={false}
            aria-label="JSON esportato"
          />

          <div className={styles.panelHead}>
            <Heading as="h2" className={styles.panelTitle}>
              Importa JSON
            </Heading>
            <button
              type="button"
              className={styles.addBtn}
              onClick={handleImport}
            >
              <FontAwesomeIcon icon={faFileImport} /> Importa
            </button>
          </div>
          {importError && <p className={styles.importError}>{importError}</p>}
          <textarea
            className={styles.code}
            rows={6}
            value={importText}
            spellCheck={false}
            placeholder="Incolla qui il JSON di un livello per ricaricarlo nell’editor…"
            aria-label="JSON da importare"
            onChange={(e) => setImportText(e.target.value)}
          />
        </section>
      </div>
    </div>
  );
}

export default function LevelEditorPage(): JSX.Element {
  return (
    <Layout
      title="Editor livelli PyQuest"
      description="Strumento d’autore per disegnare i livelli di PyQuest."
    >
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <main className={styles.page}>
        <div className={styles.header}>
          <Heading as="h1">
            <FontAwesomeIcon icon={faPenRuler} className={styles.headerIcon} />{' '}
            Editor livelli PyQuest
          </Heading>
          <p>
            Strumento interno d’autore. Disegna la mappa, riempi i metadati,
            provala nell’anteprima e incolla il JSON in un{' '}
            <code>world.json</code>.
          </p>
        </div>
        <BrowserOnly
          fallback={<div className={styles.loading}>Caricamento…</div>}
        >
          {() => <LevelEditorInner />}
        </BrowserOnly>
      </main>
    </Layout>
  );
}
