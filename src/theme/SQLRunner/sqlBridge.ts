/**
 * Bridge tra mondo React e il Web Worker SQL (static/sql-runner/worker.js).
 *
 * Responsabilità:
 *  - lifecycle del worker: spawn lazy al primo run, boot (importScripts del
 *    glue sql.js self-hosted + WASM), respawn dopo un terminate;
 *  - watchdog: se il worker non risponde entro `timeoutMs` (query runaway:
 *    CROSS JOIN gigante, WITH RECURSIVE infinita) → worker.terminate(),
 *    la pagina resta reattiva e il run successivo riparte da zero;
 *  - cache dei dataset: il testo .sql viene fetch-ato una volta per pagina e
 *    riusato da tutti i blocchi; lo snapshot binario del seed vive nel worker.
 *
 * Il worker è un singleton per pagina: i blocchi stateless aprono comunque un
 * DB fresco a ogni run; i blocchi stateful hanno ciascuno il proprio DB keyed
 * per instanceId. Un terminate (timeout) butta via anche i DB stateful degli
 * altri blocchi: al run successivo ripartono dal seed con `freshDb: true`, e
 * il componente mostra la notice "database ripristinato".
 */

import type { SqlRunOutcome } from './types';

export interface SqlRunnerUrls {
  workerUrl: string;
  glueUrl: string;
  wasmUrl: string;
}

export interface SqlRunRequest {
  instanceId: string;
  sql: string;
  /** Chiave del dataset (path relativo a static/sql-datasets/, senza .sql). */
  datasetKey?: string;
  /** URL assoluto (con baseUrl) del file .sql del dataset. */
  datasetUrl?: string;
  stateful: boolean;
  maxRows: number;
  timeoutMs: number;
  /**
   * Verifica dell'esercizio (runner dentro <Challenge>): la query di
   * riferimento (`### POST`) e l'eventuale controllo sullo stato del DB
   * (`### CONTROLLO`). Semantica in static/sql-runner/worker.js, verifyRun.
   */
  check?: { reference: string; control: string | null };
}

export class SqlTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(
      `Esecuzione interrotta dopo ${Math.round(timeoutMs / 1000)} s: la query non terminava. ` +
        'Il database è stato ripristinato.',
    );
    this.name = 'SqlTimeoutError';
  }
}

interface Pending {
  resolve: (value: unknown) => void;
  reject: (err: Error) => void;
  timer: number;
}

interface WorkerMessage {
  type: 'ready' | 'boot-error' | 'result' | 'error' | 'db-reset';
  id?: number;
  message?: string;
  results?: SqlRunOutcome['results'];
  rowsModified?: number;
  freshDb?: boolean;
  durationMs?: number;
  verdict?: SqlRunOutcome['verdict'];
  authorError?: string;
}

/** Timeout per il boot del worker (fetch glue+wasm su rete lenta). */
const BOOT_TIMEOUT_MS = 30_000;

let worker: Worker | null = null;
let bootPromise: Promise<void> | null = null;
let nextId = 1;
const pending = new Map<number, Pending>();

/** Cache modulo-level del testo dei dataset, condivisa fra i blocchi. */
const datasetCache = new Map<string, Promise<string>>();

function fetchDataset(key: string, url: string): Promise<string> {
  let cached = datasetCache.get(key);
  if (!cached) {
    cached = fetch(url).then((res) => {
      if (!res.ok) {
        throw new Error(
          `Dataset «${key}» non trovato (HTTP ${res.status}): ${url}`,
        );
      }
      return res.text();
    });
    // Un fetch fallito non deve avvelenare la cache per i run successivi.
    cached.catch(() => datasetCache.delete(key));
    datasetCache.set(key, cached);
  }
  return cached;
}

/** Uccide il worker e rigetta tutte le richieste in volo. */
function killWorker(reason: Error) {
  worker?.terminate();
  worker = null;
  bootPromise = null;
  for (const [, p] of pending) {
    window.clearTimeout(p.timer);
    p.reject(reason);
  }
  pending.clear();
}

function ensureWorker(urls: SqlRunnerUrls): Promise<void> {
  if (worker && bootPromise) return bootPromise;

  const w = new Worker(urls.workerUrl);
  worker = w;

  w.onmessage = (event: MessageEvent<WorkerMessage>) => {
    const msg = event.data;
    if (msg.id == null) return; // ready/boot-error gestiti dal bootPromise
    const p = pending.get(msg.id);
    if (!p) return;
    pending.delete(msg.id);
    window.clearTimeout(p.timer);
    if (msg.type === 'error') {
      p.reject(new Error(msg.message ?? 'Errore SQL sconosciuto'));
    } else {
      p.resolve(msg);
    }
  };

  w.onerror = (event) => {
    // Errore irrecuperabile nel worker (es. OOM WASM): respawn al run dopo.
    killWorker(new Error(`Errore nel worker SQL: ${event.message}`));
  };

  bootPromise = new Promise<void>((resolve, reject) => {
    const bootTimer = window.setTimeout(() => {
      killWorker(new Error('Timeout nel caricamento del motore SQL'));
      reject(new Error('Timeout nel caricamento del motore SQL'));
    }, BOOT_TIMEOUT_MS);

    const onBoot = (event: MessageEvent<WorkerMessage>) => {
      const msg = event.data;
      if (msg.type === 'ready') {
        window.clearTimeout(bootTimer);
        w.removeEventListener('message', onBoot);
        resolve();
      } else if (msg.type === 'boot-error') {
        window.clearTimeout(bootTimer);
        w.removeEventListener('message', onBoot);
        killWorker(new Error(msg.message ?? 'Boot del motore SQL fallito'));
        reject(new Error(msg.message ?? 'Boot del motore SQL fallito'));
      }
    };
    // Listener aggiuntivo solo per la fase di boot (onmessage resta il router).
    w.addEventListener('message', onBoot);
    w.postMessage({
      type: 'boot',
      glueUrl: urls.glueUrl,
      wasmUrl: urls.wasmUrl,
    });
  });

  return bootPromise;
}

function postWithWatchdog<T>(
  message: Record<string, unknown>,
  timeoutMs: number,
): Promise<T> {
  const w = worker;
  if (!w) return Promise.reject(new Error('Worker SQL non disponibile'));
  const id = nextId++;
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      pending.delete(id);
      // Terminate: unico modo per fermare SQL sincrono dentro il worker.
      killWorker(new SqlTimeoutError(timeoutMs));
      reject(new SqlTimeoutError(timeoutMs));
    }, timeoutMs);
    pending.set(id, {
      resolve: resolve as (value: unknown) => void,
      reject,
      timer,
    });
    w.postMessage({ ...message, id });
  });
}

export async function runSql(
  urls: SqlRunnerUrls,
  req: SqlRunRequest,
): Promise<SqlRunOutcome> {
  // Fetch del dataset PRIMA di toccare il worker: su errore di rete il motore
  // non viene nemmeno scaricato.
  let dataset: { key: string; text: string } | null = null;
  if (req.datasetKey && req.datasetUrl) {
    dataset = {
      key: req.datasetKey,
      text: await fetchDataset(req.datasetKey, req.datasetUrl),
    };
  }

  await ensureWorker(urls);

  const msg = await postWithWatchdog<WorkerMessage>(
    {
      type: 'run',
      instanceId: req.instanceId,
      sql: req.sql,
      dataset,
      stateful: req.stateful,
      maxRows: req.maxRows,
      check: req.check,
    },
    req.timeoutMs,
  );

  return {
    results: msg.results ?? [],
    rowsModified: msg.rowsModified ?? 0,
    freshDb: msg.freshDb ?? false,
    durationMs: msg.durationMs ?? 0,
    verdict: msg.verdict,
    authorError: msg.authorError,
  };
}

const POST_RE = /^###\s*POST\s*$/i;
const CONTROL_RE = /^###\s*CONTROLLO\s*$/i;

/**
 * Divide il sorgente di un fence SQL: il codice dello studente, poi la query
 * di riferimento dopo `### POST` e il controllo dopo `### CONTROLLO`, entrambi
 * nascosti. Senza marker il codice resta identico al sorgente.
 */
export function splitSqlSource(raw: string): {
  code: string;
  reference: string;
  control: string;
} {
  const lines = raw.split('\n');
  if (!lines.some((l) => POST_RE.test(l) || CONTROL_RE.test(l))) {
    return { code: raw, reference: '', control: '' };
  }
  const parts: Record<'code' | 'reference' | 'control', string[]> = {
    code: [],
    reference: [],
    control: [],
  };
  let section: keyof typeof parts = 'code';
  for (const line of lines) {
    if (POST_RE.test(line)) section = 'reference';
    else if (CONTROL_RE.test(line)) section = 'control';
    else parts[section].push(line);
  }
  return {
    code: parts.code.join('\n').replace(/\s+$/, ''),
    reference: parts.reference.join('\n').trim(),
    control: parts.control.join('\n').trim(),
  };
}

export async function resetDb(
  urls: SqlRunnerUrls,
  instanceId: string,
): Promise<void> {
  // Se il worker non esiste non c'è alcuno stato da ripristinare.
  if (!worker) return;
  await ensureWorker(urls);
  await postWithWatchdog({ type: 'reset-db', instanceId }, 5_000);
}
