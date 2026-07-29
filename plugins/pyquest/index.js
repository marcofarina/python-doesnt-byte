const path = require('path');
const fs = require('fs');

const PLUGIN_NAME = 'pyquest';

const DEFAULT_OPTIONS = {
  // I mondi vivono in static/pyquest/<world>/world.json (uno per cartella).
  worldsDir: 'pyquest',
};

// I facing validi (specular a DIRS in static/bry-libs/pyquest.py).
const FACINGS = ['north', 'east', 'south', 'west'];
const ENEMY_BEHAVIORS = ['static', 'melee'];
const WIN_TYPES = ['reach', 'collect', 'defeat'];
// Versioni di schema che questo plugin sa leggere (spec D8).
const KNOWN_SCHEMA_VERSIONS = [1];

// --- Validazione build-time ---------------------------------------------------
//
// Fallire il build (throw) su dati malformati è coerente con `onBrokenLinks:
// 'throw'`: meglio un mondo rotto che ferma la CI di un livello che esplode nel
// browser dello studente.

class WorldError extends Error {}

/**
 * Guardia quoting (spec step 7): i campi stringa che finiscono nel modello a
 * runtime vengono iniettati in Python dentro una stringa triple-quoted
 * (`'''<json>'''` in runLevel.ts). Un apice, una virgoletta o un backslash in
 * quei campi potrebbero rompere quella stringa o iniettare codice. Li vietiamo
 * a monte: sono identificatori corti d'autore (facing, kind, id, legenda,
 * righe mappa), non prosa — nessuna ragione legittima per avere `'"\`.
 */
function assertSafeString(value, where) {
  if (typeof value !== 'string') {
    throw new WorldError(`${where}: atteso una stringa, trovato ${typeof value}.`);
  }
  if (/['"\\]/.test(value)) {
    throw new WorldError(
      `${where}: la stringa "${value}" contiene un carattere vietato (' " \\). ` +
        'Questi campi vengono iniettati nel motore Python: usa solo identificatori semplici.',
    );
  }
  // Niente caratteri di controllo (newline compresi): romperebbero il JSON su
  // una riga o la stringa Python.
  if (/[\x00-\x1f]/.test(value)) {  // eslint-disable-line no-control-regex
    throw new WorldError(`${where}: la stringa contiene caratteri di controllo non ammessi.`);
  }
}

function assertInt(value, where) {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new WorldError(`${where}: atteso un intero, trovato ${JSON.stringify(value)}.`);
  }
}

function assertPoint(pt, where) {
  if (!pt || typeof pt !== 'object') {
    throw new WorldError(`${where}: atteso un punto {x, y}.`);
  }
  assertInt(pt.x, `${where}.x`);
  assertInt(pt.y, `${where}.y`);
}

/**
 * Geometria della griglia già validata: dimensioni + celle muro, per i check
 * di posizione (entità dentro i bordi e mai su una cella `wall`).
 */
function gridGeometry(grid) {
  const walls = new Set();
  grid.rows.forEach((row, y) => {
    Array.from(row).forEach((ch, x) => {
      if (grid.legend[ch] === 'wall') walls.add(`${x},${y}`);
    });
  });
  return { width: grid.rows[0].length, height: grid.rows.length, walls };
}

function assertOnFloor(pt, geo, where) {
  if (pt.x < 0 || pt.y < 0 || pt.x >= geo.width || pt.y >= geo.height) {
    throw new WorldError(
      `${where}: (${pt.x}, ${pt.y}) è fuori dalla griglia ${geo.width}×${geo.height}.`,
    );
  }
  if (geo.walls.has(`${pt.x},${pt.y}`)) {
    throw new WorldError(`${where}: (${pt.x}, ${pt.y}) è su una cella muro.`);
  }
}

function validateGrid(grid, where) {
  if (!grid || typeof grid !== 'object') {
    throw new WorldError(`${where}: manca la griglia.`);
  }
  const { legend, rows } = grid;
  if (!legend || typeof legend !== 'object') {
    throw new WorldError(`${where}.legend: attesa una mappa carattere→ruolo.`);
  }
  for (const [ch, role] of Object.entries(legend)) {
    assertSafeString(ch, `${where}.legend (chiave)`);
    assertSafeString(role, `${where}.legend['${ch}']`);
  }
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new WorldError(`${where}.rows: atteso un array non vuoto di righe.`);
  }
  const width = rows[0].length;
  rows.forEach((row, i) => {
    assertSafeString(row, `${where}.rows[${i}]`);
    if (row.length !== width) {
      throw new WorldError(
        `${where}.rows[${i}]: larghezza ${row.length} ≠ ${width} (griglia non rettangolare).`,
      );
    }
    for (const ch of row) {
      if (!(ch in legend)) {
        throw new WorldError(
          `${where}.rows[${i}]: il carattere "${ch}" non è nella legenda.`,
        );
      }
    }
  });
}

function validateLevel(level, where) {
  if (!level || typeof level !== 'object') {
    throw new WorldError(`${where}: livello non valido.`);
  }
  assertSafeString(level.id, `${where}.id`);
  if (typeof level.title !== 'string' || !level.title) {
    throw new WorldError(`${where}.title: titolo mancante.`);
  }

  validateGrid(level.grid, `${where}.grid`);
  const geo = gridGeometry(level.grid);

  const { hero } = level;
  assertPoint(hero, `${where}.hero`);
  assertOnFloor(hero, geo, `${where}.hero`);
  if (hero.facing !== undefined && !FACINGS.includes(hero.facing)) {
    throw new WorldError(`${where}.hero.facing: "${hero.facing}" non è un facing valido.`);
  }
  if (hero.hp !== undefined) assertInt(hero.hp, `${where}.hero.hp`);

  if (level.goal !== undefined) {
    assertPoint(level.goal, `${where}.goal`);
    assertOnFloor(level.goal, geo, `${where}.goal`);
  }

  const ids = new Set();
  for (const [i, e] of (level.enemies ?? []).entries()) {
    const w = `${where}.enemies[${i}]`;
    assertSafeString(e.id, `${w}.id`);
    if (ids.has(e.id)) throw new WorldError(`${w}.id: "${e.id}" duplicato.`);
    ids.add(e.id);
    assertSafeString(e.kind, `${w}.kind`);
    assertPoint(e, w);
    assertOnFloor(e, geo, w);
    assertInt(e.hp, `${w}.hp`);
    if (!ENEMY_BEHAVIORS.includes(e.behavior)) {
      throw new WorldError(`${w}.behavior: "${e.behavior}" non valido (static|melee).`);
    }
  }
  for (const [i, r] of (level.resources ?? []).entries()) {
    const w = `${where}.resources[${i}]`;
    assertSafeString(r.id, `${w}.id`);
    if (ids.has(r.id)) throw new WorldError(`${w}.id: "${r.id}" duplicato.`);
    ids.add(r.id);
    assertSafeString(r.kind, `${w}.kind`);
    assertPoint(r, w);
    assertOnFloor(r, geo, w);
  }

  if (!Array.isArray(level.win) || level.win.length === 0) {
    throw new WorldError(`${where}.win: attesa almeno una condizione di vittoria.`);
  }
  for (const [i, cond] of level.win.entries()) {
    const w = `${where}.win[${i}]`;
    if (!cond || !WIN_TYPES.includes(cond.type)) {
      throw new WorldError(`${w}.type: atteso uno di ${WIN_TYPES.join('|')}.`);
    }
    if (cond.type === 'reach' && level.goal === undefined) {
      throw new WorldError(`${w}: vittoria "reach" ma il livello non ha un goal.`);
    }
    if (cond.type === 'collect') {
      assertSafeString(cond.kind, `${w}.kind`);
      assertInt(cond.qty, `${w}.qty`);
    }
    if (cond.type === 'defeat') {
      if (cond.kind !== undefined) assertSafeString(cond.kind, `${w}.kind`);
      if (cond.count !== undefined) assertInt(cond.count, `${w}.count`);
    }
  }

  if (typeof level.starterCode !== 'string') {
    throw new WorldError(`${where}.starterCode: codice iniziale mancante.`);
  }
  if (
    !Array.isArray(level.hints) ||
    level.hints.length < 1 ||
    level.hints.length > 3 ||
    level.hints.some((h) => typeof h !== 'string' || !h)
  ) {
    throw new WorldError(`${where}.hints: attesi da 1 a 3 suggerimenti (stringhe non vuote).`);
  }
  if (level.maxSteps !== undefined) assertInt(level.maxSteps, `${where}.maxSteps`);
  assertInt(level.par, `${where}.par`);
  if (level.par < 1) {
    throw new WorldError(`${where}.par: atteso ≥ 1, trovato ${level.par}.`);
  }
}

function validateWorld(world, file) {
  if (!world || typeof world !== 'object') {
    throw new WorldError(`${file}: JSON del mondo non valido.`);
  }
  if (!KNOWN_SCHEMA_VERSIONS.includes(world.schemaVersion)) {
    throw new WorldError(
      `${file} → schemaVersion: ${JSON.stringify(world.schemaVersion)} non riconosciuta ` +
        `(note: ${KNOWN_SCHEMA_VERSIONS.join(', ')}).`,
    );
  }
  assertSafeString(world.id, `${file} → id`);
  if (!Array.isArray(world.levels) || world.levels.length === 0) {
    throw new WorldError(`${file}: il mondo non ha livelli.`);
  }
  const levelIds = new Set();
  world.levels.forEach((lvl, i) => {
    validateLevel(lvl, `${file} → levels[${i}] (${lvl && lvl.id})`);
    if (levelIds.has(lvl.id)) {
      throw new WorldError(`${file}: id livello "${lvl.id}" duplicato.`);
    }
    levelIds.add(lvl.id);
  });
}

function loadWorlds(worldsAbsDir) {
  const worlds = {};
  if (!fs.existsSync(worldsAbsDir)) {
    console.warn(
      `[pyquest] Directory mondi non trovata: ${worldsAbsDir} — nessun mondo caricato.`,
    );
    return worlds;
  }
  for (const entry of fs.readdirSync(worldsAbsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const file = path.join(worldsAbsDir, entry.name, 'world.json');
    if (!fs.existsSync(file)) continue;
    let world;
    try {
      world = JSON.parse(fs.readFileSync(file, 'utf-8'));
    } catch (err) {
      throw new WorldError(`${file}: JSON illeggibile — ${err.message}`);
    }
    validateWorld(world, file);
    if (world.id in worlds) {
      throw new WorldError(`[pyquest] id mondo "${world.id}" duplicato (${file}).`);
    }
    worlds[world.id] = world;
  }
  return worlds;
}

/**
 * I global data di Docusaurus finiscono nel bundle principale, servito a ogni
 * pagina del sito. `solution` serve solo all'autore (calibrare il par, provare
 * il livello nell'editor): il client non la legge mai, quindi la togliamo —
 * meno peso su ogni pagina e la risposta non arriva in faccia allo studente
 * insieme al livello. Resta nel world.json su disco, che è servito come file
 * statico: chi la cerca la trova, non è una protezione.
 */
function stripAuthorFields(world) {
  return {
    ...world,
    levels: world.levels.map(({ solution: _solution, ...level }) => level),
  };
}

module.exports = function pyquestPlugin(context, pluginOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...pluginOptions };
  const staticRoot =
    (context.siteConfig.staticDirectories &&
      context.siteConfig.staticDirectories[0]) ||
    'static';
  const worldsAbsDir = path.join(context.siteDir, staticRoot, opts.worldsDir);

  return {
    name: PLUGIN_NAME,

    async loadContent() {
      return { worlds: loadWorlds(worldsAbsDir) };
    },

    async contentLoaded({ content, actions }) {
      const worlds = {};
      for (const [id, world] of Object.entries(content.worlds)) {
        worlds[id] = stripAuthorFields(world);
      }
      actions.setGlobalData({ worlds });
    },

    getPathsToWatch() {
      return [path.join(worldsAbsDir, '**/world.json')];
    },
  };
};

module.exports.PLUGIN_NAME = PLUGIN_NAME;
