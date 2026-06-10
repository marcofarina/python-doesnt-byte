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
 *         stateful, maxRows}
 *   out: {type:'result', id, results, rowsModified, freshDb, durationMs}
 *      | {type:'error', id, message}
 *   in:  {type:'reset-db', id, instanceId}
 *   out: {type:'db-reset', id}
 *
 * Strategia di restore: per ogni dataset costruiamo UNA volta il DB dal dump
 * .sql e ne teniamo lo snapshot serializzato (db.export() → Uint8Array).
 * - stateless (default): a OGNI run apriamo un DB fresco dallo snapshot →
 *   DROP/DELETE dello studente vengono ripristinati in modo invisibile.
 * - stateful: il DB vive tra un run e l'altro (lezioni su INSERT/UPDATE);
 *   si riparte dallo snapshot con "Reset DB", o dopo un terminate del worker.
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
function runScript(db, sqlText, maxRows) {
  const results = [];
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
      let truncated = false;
      let bytes = 0;
      let totalRows = 0;
      while (stmt.step()) {
        totalRows++;
        if (truncated) continue; // continua a contare, non a raccogliere
        const raw = stmt.get();
        const row = raw.map(cellValue);
        for (const v of row) bytes += approxBytes(v);
        rows.push(row);
        if (rows.length >= maxRows || bytes >= MAX_RESULT_BYTES) {
          truncated = true;
        }
      }
      if (results.length < MAX_RESULT_SETS) {
        results.push({ columns, rows, truncated, totalRows });
      }
    } finally {
      stmt.free();
    }
  }

  const rowsModified = totalChanges(db) - before;
  return { results, rowsModified: Math.max(0, rowsModified) };
}

function handleRun(msg) {
  const { id, instanceId, sql, dataset, stateful, maxRows } = msg;
  const t0 = Date.now();

  // 1. Seed: costruito una sola volta per dataset, poi snapshot in cache.
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
      return;
    }
  }

  // 2. Database: fresco dallo snapshot (stateless) o vivo tra i run (stateful).
  let db = null;
  let freshDb = false;
  let live = null;
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

  // 3. Esecuzione.
  try {
    const { results, rowsModified } = runScript(db, sql, maxRows);
    postMessage({
      type: 'result',
      id,
      results,
      rowsModified,
      freshDb,
      durationMs: Date.now() - t0,
    });
  } catch (e) {
    postMessage({ type: 'error', id, message: e.message });
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
