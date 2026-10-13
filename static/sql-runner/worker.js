/**
 * SQLRunner — Web Worker.
 *
 * Esegue SQL (sql.js / SQLite WASM) fuori dal main thread: una query runaway
 * (CROSS JOIN gigante, WITH RECURSIVE infinita) non blocca mai la pagina; il
 * bridge sul main thread fa da watchdog e in caso di timeout chiama
 * worker.terminate() e fa respawn al run successivo.
 *
 * File statico volutamente NON bundlato da webpack (niente `new Worker(new URL)`
 * dentro il build Docusaurus): viene caricato da static/sql-runner/worker.js e
 * carica il glue sql.js self-hosted via importScripts (same-origin, niente CDN).
 *
 * Protocollo messaggi (vedi src/theme/SQLRunner/sqlBridge.ts per i tipi):
 *   in:  {type:'boot', glueUrl, wasmUrl}
 *   out: {type:'ready'} | {type:'boot-error', message}
 *   in:  {type:'run', id, instanceId, sql, dataset?: {key, text},
 *         stateful, maxRows, check?: {reference, control}, snapshot?}
 *   out: {type:'result', id, results, rowsModified, freshDb, durationMs,
 *         verdict?: {esito, messaggio}, authorError?, snapshot?}
 *      | {type:'error', id, message, snapshot?}
 *   in:  {type:'reset-db', id, instanceId}
 *   out: {type:'db-reset', id}
 *   in:  {type:'seed-snapshot', id, dataset?: {key, text}}
 *   out: {type:'seed-snapshot', id, snapshot} | {type:'error', id, message}
 *
 * Con `snapshot: true` nel messaggio `run`, sia `result` sia `error` portano
 * `snapshot`: la foto delle tabelle dopo il run, confrontata con quelle di
 * prima (pannello «Database», vedi la sezione «Foto del DB» più sotto).
 *
 * Strategia di restore: per ogni dataset costruiamo UNA volta il DB dal dump
 * .sql e ne teniamo lo snapshot serializzato (db.export() → Uint8Array).
 * - stateless (default): a OGNI run apriamo un DB fresco dallo snapshot →
 *   DROP/DELETE dello studente vengono ripristinati in modo invisibile.
 * - stateful: il DB vive tra un run e l'altro (lezioni su INSERT/UPDATE);
 *   si riparte dallo snapshot con "Reset DB", o dopo un terminate del worker.
 *
 * Verifica degli esercizi (`check`, runner dentro <Challenge>): vedi
 * verifyRun più sotto. La query di riferimento non tocca mai il DB dello
 * studente: gira su una copia del DB com'era PRIMA della sua esecuzione.
 */

/* global initSqlJs, importScripts */
'use strict';

let SQL = null;

/** datasetKey → Uint8Array (snapshot del DB seed). '' = DB vuoto. */
const seeds = new Map();

/** instanceId → { db, datasetKey } per i blocchi stateful. */
const liveDbs = new Map();

/** Cap difensivo sui byte serializzati per result-set (oltre a maxRows). */
const MAX_RESULT_BYTES = 256 * 1024;
/** Cap sul numero di result-set per run (script con molte SELECT). */
const MAX_RESULT_SETS = 20;
/**
 * Righe tenute per la verifica, indipendenti da maxRows (che vale solo per la
 * tabella mostrata). Gli esercizi del libro stanno molto sotto.
 */
const VERIFY_MAX_ROWS = 5000;
/** Limite heap SQLite per connessione (PRAGMA hard_heap_limit), 64 MiB. */
const HARD_HEAP_LIMIT = 64 * 1024 * 1024;

/**
 * PRAGMA per-connessione: non sopravvivono alla serializzazione, vanno
 * ri-applicati a ogni apertura (anche da snapshot).
 */
function applyConnectionPragmas(db) {
  db.exec('PRAGMA foreign_keys = ON;');
  try {
    db.exec('PRAGMA hard_heap_limit = ' + HARD_HEAP_LIMIT + ';');
  } catch (e) {
    // Build SQLite senza hard_heap_limit: il watchdog resta l'ultima difesa.
  }
}

function buildSeed(datasetKey, sqlText) {
  const db = new SQL.Database();
  applyConnectionPragmas(db);
  try {
    db.exec(sqlText);
    const snapshot = db.export();
    seeds.set(datasetKey, snapshot);
    return snapshot;
  } finally {
    db.close();
  }
}

function openFromSeed(datasetKey) {
  const snapshot = datasetKey ? seeds.get(datasetKey) : null;
  const db = snapshot ? new SQL.Database(snapshot) : new SQL.Database();
  applyConnectionPragmas(db);
  return db;
}

/** Converte un valore di cella in qualcosa di serializzabile e renderizzabile. */
function cellValue(v) {
  if (v instanceof Uint8Array) return '‹BLOB ' + v.length + ' byte›';
  return v; // number | string | null
}

function approxBytes(v) {
  if (v == null) return 4;
  return String(v).length;
}

// ─── Foto del DB per il pannello «Database» ─────────────────────────────────
//
// Piano pm/piano-2026-10-pannello-database.md, fase T1. Con `snapshot: true`
// il worker legge le tabelle dopo il run e le confronta con quelle di prima:
// per un blocco normale «prima» è il seed, per un blocco stateful il DB com'era
// prima di questo run. Le righe si riconoscono per rowid: dopo un DELETE e un
// INSERT SQLite può riusare il rowid, e la riga risulta «modificata» invece che
// tolta più nuova (limite accettato nel piano). Le tabelle WITHOUT ROWID e
// quelle oltre SNAPSHOT_DIFF_MAX_ROWS si mostrano senza confronto.

/** Righe confrontate per tabella; oltre, la tabella si mostra senza confronto. */
const SNAPSHOT_DIFF_MAX_ROWS = 2000;
/** Righe mostrate per tabella, più tutte quelle cambiate (e righe tolte). */
const SNAPSHOT_SHOWN_ROWS = 100;
/** Tabelle nella foto: i dataset del libro ne hanno poche. */
const SNAPSHOT_MAX_TABLES = 20;
/** Un testo lungo in una cella si accorcia nella foto (non nel confronto). */
const SNAPSHOT_CELL_MAX_CHARS = 200;

/** datasetKey → lettura delle tabelle del seed ('' = DB vuoto). */
const seedDumps = new Map();

function quoteIdent(name) {
  return '"' + String(name).replace(/"/g, '""') + '"';
}

function selectAll(db, sqlText) {
  const stmt = db.prepare(sqlText);
  try {
    const columns = stmt.getColumnNames();
    const rows = [];
    while (stmt.step()) rows.push(stmt.get().map(cellValue));
    return { columns, rows };
  } finally {
    stmt.free();
  }
}

/**
 * Legge le tabelle utente del DB: name → {columns, rows: [{rowid, values}],
 * totalRows, comparable}. `comparable` è falso senza rowid o oltre il cap: in
 * quel caso `rows` contiene solo le prime SNAPSHOT_SHOWN_ROWS righe.
 */
function dumpDb(db) {
  const tables = new Map();
  const names = selectAll(
    db,
    "SELECT name FROM sqlite_master WHERE type = 'table' " +
      "AND name NOT LIKE 'sqlite\\_%' ESCAPE '\\' ORDER BY rowid",
  ).rows.map((r) => r[0]);

  for (const name of names.slice(0, SNAPSHOT_MAX_TABLES)) {
    const q = quoteIdent(name);
    const totalRows = selectAll(db, 'SELECT count(*) FROM ' + q).rows[0][0];
    const tooMany = totalRows > SNAPSHOT_DIFF_MAX_ROWS;
    const limit = tooMany ? ' LIMIT ' + SNAPSHOT_SHOWN_ROWS : '';
    let read = null;
    let hasRowid = true;
    try {
      read = selectAll(db, 'SELECT _rowid_, * FROM ' + q + ' ORDER BY _rowid_' + limit);
    } catch (e) {
      // WITHOUT ROWID, o una colonna che si chiama _rowid_: niente confronto.
      hasRowid = false;
      read = selectAll(db, 'SELECT * FROM ' + q + limit);
    }
    const rows = read.rows.map((values) =>
      hasRowid
        ? { rowid: values[0], values: values.slice(1) }
        : { rowid: null, values },
    );
    tables.set(name, {
      columns: hasRowid ? read.columns.slice(1) : read.columns,
      rows,
      totalRows,
      comparable: hasRowid && !tooMany,
    });
  }
  return tables;
}

function seedDump(datasetKey) {
  let dump = seedDumps.get(datasetKey);
  if (!dump) {
    const db = openFromSeed(datasetKey);
    try {
      dump = dumpDb(db);
    } finally {
      db.close();
    }
    seedDumps.set(datasetKey, dump);
  }
  return dump;
}

function shortCell(v) {
  return typeof v === 'string' && v.length > SNAPSHOT_CELL_MAX_CHARS
    ? v.slice(0, SNAPSHOT_CELL_MAX_CHARS) + '…'
    : v;
}

function shownRow(row, extra) {
  return Object.assign({ rowid: row.rowid, values: row.values.map(shortCell) }, extra);
}

/**
 * Confronta due letture e costruisce la foto per il pannello (DbSnapshot in
 * src/theme/SQLRunner/types.ts). Una tabella che prima non c'era vale come
 * tabella vuota: tutte le sue righe sono nuove.
 */
function buildSnapshot(before, after) {
  const tables = [];
  let changedRows = 0;

  for (const [name, now] of after) {
    const prev = before.get(name);
    const comparable = now.comparable && (!prev || prev.comparable);
    if (!comparable) {
      tables.push({
        name,
        columns: now.columns,
        rows: now.rows.slice(0, SNAPSHOT_SHOWN_ROWS).map((r) => shownRow(r)),
        totalRows: now.totalRows,
        removed: [],
        removedTotal: 0,
        status: prev ? 'unchanged' : 'created',
        diffSkipped: true,
      });
      continue;
    }

    // Colonne per nome: dopo un ALTER TABLE le posizioni possono cambiare.
    const prevCols = prev ? prev.columns : [];
    const prevIndex = now.columns.map((c) => prevCols.indexOf(c));
    const prevRows = new Map((prev ? prev.rows : []).map((r) => [r.rowid, r]));

    const rows = [];
    let changedHere = 0;
    now.rows.forEach((row, i) => {
      const old = prevRows.get(row.rowid);
      let extra = null;
      if (!old) {
        extra = { change: 'added' };
      } else {
        prevRows.delete(row.rowid);
        const changedCells = [];
        row.values.forEach((v, c) => {
          const j = prevIndex[c];
          const was = j < 0 ? null : old.values[j];
          if (v !== was) changedCells.push(c);
        });
        if (changedCells.length > 0) extra = { change: 'modified', changedCells };
      }
      if (extra) changedHere++;
      if (extra || i < SNAPSHOT_SHOWN_ROWS) rows.push(shownRow(row, extra));
    });
    // Le righe rimaste in prevRows non ci sono più.
    const removedAll = [...prevRows.values()];
    changedHere += removedAll.length;
    changedRows += changedHere;

    tables.push({
      name,
      columns: now.columns,
      rows,
      totalRows: now.totalRows,
      removed: removedAll.slice(0, SNAPSHOT_SHOWN_ROWS).map((r) => shownRow(r)),
      removedTotal: removedAll.length,
      status: !prev ? 'created' : changedHere > 0 ? 'changed' : 'unchanged',
      diffSkipped: false,
    });
  }

  const droppedTables = [...before.keys()].filter((n) => !after.has(n));
  return { tables, droppedTables, changedRows };
}

/** total_changes() di SQLite: contatore cumulativo di righe INSERT/UPDATE/DELETE. */
function totalChanges(db) {
  const res = db.exec('SELECT total_changes()');
  return res[0].values[0][0];
}

/**
 * Esegue lo script SQL statement per statement, raccogliendo i result-set
 * con cap su righe e byte (il troncamento avviene QUI, prima del postMessage:
 * 500k righe non devono mai attraversare il confine del worker).
 */
function runScript(db, sqlText, maxRows, keepLast) {
  const results = [];
  // Ultimo result-set completo (fino a VERIFY_MAX_ROWS), solo per la verifica.
  let last = null;
  const before = totalChanges(db);

  for (const stmt of db.iterateStatements(sqlText)) {
    try {
      const columns = stmt.getColumnNames();
      if (columns.length === 0) {
        // Statement senza result-set (CREATE/INSERT/UPDATE/...): esegui e basta.
        while (stmt.step()) {
          /* esaurisce lo statement */
        }
        continue;
      }
      const rows = [];
      const full = keepLast ? [] : null;
      let truncated = false;
      let bytes = 0;
      let totalRows = 0;
      while (stmt.step()) {
        totalRows++;
        const keepFull = full !== null && full.length < VERIFY_MAX_ROWS;
        if (truncated && !keepFull) continue; // continua a contare, non a raccogliere
        const row = stmt.get().map(cellValue);
        if (keepFull) full.push(row);
        if (truncated) continue;
        for (const v of row) bytes += approxBytes(v);
        rows.push(row);
        if (rows.length >= maxRows || bytes >= MAX_RESULT_BYTES) {
          truncated = true;
        }
      }
      if (results.length < MAX_RESULT_SETS) {
        results.push({ columns, rows, truncated, totalRows });
      }
      if (full !== null) last = { columns, rows: full, totalRows };
    } finally {
      stmt.free();
    }
  }

  const rowsModified = totalChanges(db) - before;
  return { results, rowsModified: Math.max(0, rowsModified), last };
}

// ─── Verifica degli esercizi ────────────────────────────────────────────────
//
// L'autore scrive nel fence, dopo il codice dello studente:
//   ### POST       la soluzione di riferimento (nascosta)
//   ### CONTROLLO  facoltativo: una SELECT sullo stato del DB dopo l'esecuzione
//
// 1. Il riferimento gira su una copia del DB com'era prima dell'esecuzione
//    dello studente (stessa partenza, nessun effetto sul suo DB).
// 2. Se il riferimento produce un result-set, l'ultimo result-set dello
//    studente deve coincidere con il suo ultimo.
// 3. Se c'è il CONTROLLO, la stessa SELECT sul DB dello studente (in un
//    SAVEPOINT annullato subito dopo) e sulla copia deve dare lo stesso
//    risultato: è così che si verificano INSERT, UPDATE e DELETE.
//
// Regole del confronto:
// - l'ordine delle righe conta solo se la query di riferimento (o il
//   controllo) contiene ORDER BY;
// - i nomi delle colonne non contano (COUNT(*) e COUNT(*) AS n sono la stessa
//   colonna) e nemmeno il loro ordine: SELECT anno, titolo vale quanto
//   SELECT titolo, anno. Contano il numero di colonne e i valori. Si provano
//   l'ordine dello studente, l'allineamento per nome e, fino a
//   MAX_PERMUTED_COLUMNS colonne, tutte le permutazioni;
// - i numeri si confrontano a 12 cifre significative (AVG, divisioni).

/** Ultimo result-set di uno script, completo fino a VERIFY_MAX_ROWS. */
function lastResultSet(db, sqlText) {
  let last = null;
  for (const stmt of db.iterateStatements(sqlText)) {
    try {
      const columns = stmt.getColumnNames();
      if (columns.length === 0) {
        while (stmt.step()) {
          /* esaurisce lo statement */
        }
        continue;
      }
      const rows = [];
      let totalRows = 0;
      while (stmt.step()) {
        totalRows++;
        if (rows.length < VERIFY_MAX_ROWS) rows.push(stmt.get().map(cellValue));
      }
      last = { columns, rows, totalRows };
    } finally {
      stmt.free();
    }
  }
  return last;
}

function hasOrderBy(sqlText) {
  const noComments = sqlText
    .replace(/--[^\n]*/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ');
  return /\border\s+by\b/i.test(noComments);
}

function rowKey(row) {
  return JSON.stringify(
    row.map((v) => (typeof v === 'number' ? Number(v.toPrecision(12)) : v)),
  );
}

function sameMultiset(a, b) {
  const sa = a.slice().sort();
  const sb = b.slice().sort();
  return sa.every((k, i) => k === sb[i]);
}

/** Oltre, le permutazioni (n!) costano troppo: restano ordine e nomi. */
const MAX_PERMUTED_COLUMNS = 5;

function permutations(n) {
  if (n === 0) return [[]];
  const out = [];
  for (const rest of permutations(n - 1)) {
    for (let i = 0; i <= rest.length; i++) {
      out.push([...rest.slice(0, i), n - 1, ...rest.slice(i)]);
    }
  }
  return out;
}

/**
 * Ordini delle colonne dello studente da provare contro il riferimento:
 * index[k] = colonna dello studente che corrisponde alla colonna k attesa.
 */
function columnOrders(student, expected) {
  const n = expected.columns.length;
  const orders = [[...Array(n).keys()]];
  const norm = (c) => String(c).toLowerCase();
  const stu = student.columns.map(norm);
  const byName = expected.columns.map((c) => stu.indexOf(norm(c)));
  if (new Set(stu).size === n && byName.every((i) => i >= 0)) {
    orders.push(byName);
  }
  if (n <= MAX_PERMUTED_COLUMNS) orders.push(...permutations(n));
  return orders;
}

/**
 * null se i due result-set coincidono, altrimenti il motivo:
 * {kind: 'none' | 'columns' | 'more' | 'fewer' | 'order' | 'values', n, m}
 * (n = dello studente, m = atteso).
 */
function compareSets(student, expected, ordered) {
  if (!student) return { kind: 'none' };
  if (student.columns.length !== expected.columns.length) {
    return {
      kind: 'columns',
      n: student.columns.length,
      m: expected.columns.length,
    };
  }
  const n = student.totalRows;
  const m = expected.totalRows;
  if (n > m) return { kind: 'more', n, m };
  if (n < m) return { kind: 'fewer', n, m };
  const b = expected.rows.map(rowKey);
  let wrongOrder = false;
  for (const index of columnOrders(student, expected)) {
    const a = student.rows.map((row) => rowKey(index.map((i) => row[i])));
    if (!sameMultiset(a, b)) continue;
    if (!ordered || a.every((k, i) => k === b[i])) return null;
    wrongOrder = true;
  }
  return wrongOrder ? { kind: 'order' } : { kind: 'values', n, m };
}

function count(n, one, many) {
  return n === 1 ? 'una ' + one : n + ' ' + many;
}

function resultMessage(diff) {
  switch (diff.kind) {
    case 'none':
      return 'La query non mostra nessun risultato: l’esercizio chiede una SELECT.';
    case 'columns':
      return (
        'Il risultato ha ' +
        count(diff.n, 'colonna', 'colonne') +
        ': ' +
        (diff.m === 1 ? 'ne serve una.' : 'ne servono ' + diff.m + '.')
      );
    case 'more':
      return 'Il risultato ha righe in più: ' + diff.n + ' invece di ' + diff.m + '.';
    case 'fewer':
      return 'Al risultato mancano delle righe: ' + diff.n + ' invece di ' + diff.m + '.';
    case 'order':
      return 'Le righe sono giuste, ma in un ordine diverso: controlla ORDER BY.';
    default:
      return 'Il numero di righe è giusto, ma i valori non coincidono.';
  }
}

function controlMessage(diff) {
  switch (diff.kind) {
    case 'more':
      return (
        'Dopo l’esecuzione il database ha righe in più del previsto: ' +
        diff.n + ' invece di ' + diff.m + '.'
      );
    case 'fewer':
      return (
        'Dopo l’esecuzione al database mancano delle righe: ' +
        diff.n + ' invece di ' + diff.m + '.'
      );
    default:
      return 'Dopo l’esecuzione il database non è come dovrebbe: alcuni valori non coincidono.';
  }
}

/**
 * Esito della verifica. `baseline` è lo snapshot del DB prima dell'esecuzione
 * dello studente (null = DB vuoto). Un errore dell'autore (riferimento o
 * controllo che non girano) vale «non risolto» con il testo generico e torna
 * in authorError, che il bridge scrive in console.
 */
function verifyRun(db, baseline, studentLast, check) {
  const refDb = baseline ? new SQL.Database(baseline) : new SQL.Database();
  applyConnectionPragmas(refDb);
  try {
    let expectedLast;
    try {
      expectedLast = lastResultSet(refDb, check.reference);
    } catch (e) {
      return { authorError: 'la query di riferimento (### POST) fallisce: ' + e.message };
    }
    if (!expectedLast && !check.control) {
      return {
        authorError:
          'la query di riferimento non produce righe e manca ### CONTROLLO: niente da confrontare',
      };
    }
    if (expectedLast) {
      const diff = compareSets(studentLast, expectedLast, hasOrderBy(check.reference));
      if (diff) return { verdict: { esito: 'non-risolto', messaggio: resultMessage(diff) } };
    }
    if (check.control) {
      let expectedCtrl;
      let studentCtrl;
      try {
        expectedCtrl = lastResultSet(refDb, check.control);
        db.exec('SAVEPOINT pdb_verifica');
        try {
          studentCtrl = lastResultSet(db, check.control);
        } finally {
          db.exec('ROLLBACK TO pdb_verifica; RELEASE pdb_verifica;');
        }
      } catch (e) {
        return { authorError: 'la query di controllo (### CONTROLLO) fallisce: ' + e.message };
      }
      if (!expectedCtrl) {
        return { authorError: 'la query di controllo (### CONTROLLO) non produce righe' };
      }
      const diff = compareSets(studentCtrl, expectedCtrl, hasOrderBy(check.control));
      if (diff) return { verdict: { esito: 'non-risolto', messaggio: controlMessage(diff) } };
    }
    return { verdict: { esito: 'risolto', messaggio: null } };
  } finally {
    refDb.close();
  }
}

/**
 * Seed: costruito una sola volta per dataset, poi snapshot in cache. Restituisce
 * la chiave ('' = DB vuoto), oppure null dopo aver mandato l'errore.
 */
function ensureSeed(id, dataset) {
  const datasetKey = dataset ? dataset.key : '';
  if (datasetKey && !seeds.has(datasetKey)) {
    try {
      buildSeed(datasetKey, dataset.text);
    } catch (e) {
      postMessage({
        type: 'error',
        id,
        message: 'Errore nel dataset «' + datasetKey + '»: ' + e.message,
      });
      return null;
    }
  }
  return datasetKey;
}

/** La foto del DB dopo un run; un errore nella lettura non deve coprire quello del run. */
function snapshotAfter(db, before) {
  try {
    return buildSnapshot(before, dumpDb(db));
  } catch (e) {
    return undefined;
  }
}

function handleRun(msg) {
  const { id, instanceId, sql, dataset, stateful, maxRows, check, snapshot } = msg;
  const t0 = Date.now();

  // 1. Seed.
  const datasetKey = ensureSeed(id, dataset);
  if (datasetKey === null) return;

  // 2. Database: fresco dallo snapshot (stateless) o vivo tra i run (stateful).
  let db = null;
  let freshDb = false;
  let live = null;
  // Per la verifica: il DB com'era prima dell'esecuzione dello studente.
  let baseline = null;
  if (stateful) {
    live = liveDbs.get(instanceId);
    if (live && live.datasetKey === datasetKey) {
      db = live.db;
    } else {
      if (live) live.db.close();
      db = openFromSeed(datasetKey);
      liveDbs.set(instanceId, { db, datasetKey });
      freshDb = true;
    }
  } else {
    db = openFromSeed(datasetKey);
    freshDb = true;
  }
  if (check) {
    if (freshDb) {
      baseline = datasetKey ? seeds.get(datasetKey) : null;
    } else {
      // export() chiude e riapre la connessione: i PRAGMA vanno riapplicati.
      baseline = db.export();
      applyConnectionPragmas(db);
    }
  }

  // Per il pannello «Database»: le tabelle com'erano prima del run.
  let before = null;
  if (snapshot) {
    try {
      before = freshDb ? seedDump(datasetKey) : dumpDb(db);
    } catch (e) {
      before = null;
    }
  }

  // 3. Esecuzione, poi verifica (solo se lo script dello studente è andato:
  // un errore SQL arriva come 'error' e il componente lo conta come tale).
  try {
    const { results, rowsModified, last } = runScript(db, sql, maxRows, !!check);
    // Prima della verifica: il CONTROLLO gira in un SAVEPOINT sul DB dello studente.
    const shot = before ? snapshotAfter(db, before) : undefined;
    const outcome = check ? verifyRun(db, baseline, last, check) : {};
    postMessage({
      type: 'result',
      id,
      results,
      rowsModified,
      freshDb,
      durationMs: Date.now() - t0,
      verdict: outcome.verdict,
      authorError: outcome.authorError,
      snapshot: shot,
    });
  } catch (e) {
    // Le istruzioni eseguite prima dell'errore restano nel DB: la foto le mostra.
    const shot = before ? snapshotAfter(db, before) : undefined;
    postMessage({ type: 'error', id, message: e.message, snapshot: shot });
    if (stateful) {
      // Errore in stateful: il DB resta com'è (l'errore SQL non lo corrompe,
      // SQLite fa rollback dello statement fallito).
    }
  } finally {
    if (!stateful) db.close();
  }
}

self.onmessage = function (event) {
  const msg = event.data;
  switch (msg.type) {
    case 'boot':
      try {
        importScripts(msg.glueUrl);
        initSqlJs({ locateFile: () => msg.wasmUrl }).then(
          (mod) => {
            SQL = mod;
            postMessage({ type: 'ready' });
          },
          (e) => postMessage({ type: 'boot-error', message: String(e) }),
        );
      } catch (e) {
        postMessage({ type: 'boot-error', message: String(e) });
      }
      break;

    case 'run':
      if (!SQL) {
        postMessage({ type: 'error', id: msg.id, message: 'Worker non inizializzato' });
        return;
      }
      handleRun(msg);
      break;

    case 'seed-snapshot': {
      if (!SQL) {
        postMessage({ type: 'error', id: msg.id, message: 'Worker non inizializzato' });
        return;
      }
      const datasetKey = ensureSeed(msg.id, msg.dataset);
      if (datasetKey === null) return;
      try {
        const dump = seedDump(datasetKey);
        postMessage({ type: 'seed-snapshot', id: msg.id, snapshot: buildSnapshot(dump, dump) });
      } catch (e) {
        postMessage({ type: 'error', id: msg.id, message: e.message });
      }
      break;
    }

    case 'reset-db': {
      const live = liveDbs.get(msg.instanceId);
      if (live) {
        live.db.close();
        liveDbs.delete(msg.instanceId);
      }
      postMessage({ type: 'db-reset', id: msg.id });
      break;
    }
  }
};
