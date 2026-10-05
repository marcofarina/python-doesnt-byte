/**
 * Client module: garantisce che Brython sia caricato e inizializzato esattamente
 * una volta. Espone una Promise risolta quando __BRYTHON__ è pronto e l'init è
 * stato chiamato.
 *
 * Gli <script> di Brython NON sono in <head>: li iniettiamo qui on-demand, solo
 * quando una pagina monta davvero un runner (vedi src/theme/PyRunner). Così le
 * pagine senza runner non scaricano ~1,1 MB di core + stdlib. Le coordinate
 * (URL + SRI) arrivano dai global data del plugin `pyrunner`.
 */

import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';

export interface BrythonConfig {
  mainSrc: string;
  mainIntegrity?: string;
  stdlibSrc: string;
  stdlibIntegrity?: string;
}

declare global {
  interface Window {
    __BRYTHON__?: {
      runPythonSource: (
        src: string,
        options?: { pythonpath?: string[]; cache?: boolean },
      ) => void;
      curdir?: string;
      VFS?: Record<string, [string, string, ...unknown[]]>;
    };
    brython?: (opts?: {
      debug?: number;
      pythonpath?: string[];
      cache?: boolean;
    }) => void;
    __PYRUNNER_BOOTED__?: Promise<void>;
  }
}

const BOOT_TIMEOUT_MS = 15_000;
const POLL_INTERVAL_MS = 50;

function waitFor(predicate: () => boolean): Promise<void> {
  return new Promise((resolve, reject) => {
    const t0 = Date.now();
    const tick = () => {
      if (predicate()) return resolve();
      if (Date.now() - t0 > BOOT_TIMEOUT_MS) {
        return reject(new Error('Timeout: Brython non caricato'));
      }
      window.setTimeout(tick, POLL_INTERVAL_MS);
    };
    tick();
  });
}

/**
 * Inietta uno <script> on-demand e risolve quando ha finito di caricare.
 * Idempotente: se un tag con lo stesso `src` esiste già, si aggancia al suo
 * caricamento invece di duplicarlo. SRI + crossorigin/referrerpolicy si
 * applicano solo se è passato un `integrity` (es. script cross-origin da CDN);
 * con Brython self-hostato (same-origin) non servono.
 */
function injectScript(src: string, integrity?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[data-pyrunner-src="${CSS.escape(src)}"]`,
    );
    if (existing) {
      if (existing.dataset.loaded === '1') return resolve();
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener(
        'error',
        () => reject(new Error(`Errore caricamento ${src}`)),
        { once: true },
      );
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.dataset.pyrunnerSrc = src;
    if (integrity) {
      s.integrity = integrity;
      s.crossOrigin = 'anonymous';
      s.referrerPolicy = 'no-referrer';
    }
    s.addEventListener(
      'load',
      () => {
        s.dataset.loaded = '1';
        resolve();
      },
      { once: true },
    );
    s.addEventListener(
      'error',
      () => reject(new Error(`Errore caricamento ${src}`)),
      { once: true },
    );
    document.head.appendChild(s);
  });
}

/**
 * Imposta `__BRYTHON__.curdir`, la cartella della pagina, come fa `brython()`.
 *
 * Il core definisce `runPythonSource` appena è caricato, quindi i controlli di
 * `ensureBrython` lo vedono «già inizializzato» e `brython()` non parte mai: ma
 * è `brython()` che imposta `curdir`, e l'`os` della stdlib lo legge in testa al
 * modulo. Senza, `import os` e `import random` (che fa `from os import urandom`)
 * falliscono con `AttributeError: … no attribute 'curdir'`.
 *
 * Non chiamiamo `brython()` per ottenerlo: con `debug: 0` spegnerebbe
 * `__debug__` e quindi gli `assert` del codice dello studente. Riproduciamo
 * solo l'assegnazione che ci serve, con la stessa formula.
 */
function ensureCurdir(): void {
  const b = window.__BRYTHON__;
  if (!b || b.curdir !== undefined) return;
  const parts = window.location.href.split('#')[0].split('/');
  parts.pop();
  b.curdir = parts.join('/');
}

/**
 * Corregge `random.seed()` di Brython perché dia le sequenze di CPython.
 *
 * Il generatore (Mersenne Twister) di `_random` è identico a quello di CPython;
 * sbaglia solo la scomposizione del seme in chiavi da 32 bit, che fa in base
 * `2**32 - 1` invece di `2**32`. Sotto `2**32 - 1` la chiave è `[seme]` per
 * tutti e due, sopra diverge: e ci finiscono anche i semi stringa e bytes, che
 * `random.py` trasforma in interi enormi (`random.seed("drago")`). Il difetto è
 * ancora nel `master` di Brython.
 *
 * Il modulo JS vive come sorgente nella VFS della stdlib e si valuta al primo
 * `import random`: correggiamo il testo prima che accada. Se il testo non c'è
 * più (Brython aggiornato), non tocchiamo niente; `prova_random.js` in
 * `pm/PyQuest/tools/` dice se la divergenza è tornata.
 *
 * Resta diverso il seme float: Brython calcola `hash()` dei float in un altro
 * modo, e `_random` semina con quell'hash.
 */
function fixRandomSeed(): void {
  const entry = window.__BRYTHON__?.VFS?._random;
  if (!entry || typeof entry[1] !== 'string') return;
  entry[1] = entry[1].replace(
    'var int32_1 = 2n ** 32n - 1n',
    'var int32_1 = 2n ** 32n',
  );
}

function patchRuntime(): void {
  ensureCurdir();
  fixRandomSeed();
}

export function ensureBrython(
  libUrl: string,
  brython?: BrythonConfig,
): Promise<void> {
  if (!ExecutionEnvironment.canUseDOM) {
    return Promise.resolve();
  }
  if (window.__PYRUNNER_BOOTED__) return window.__PYRUNNER_BOOTED__;

  window.__PYRUNNER_BOOTED__ = (async () => {
    // Se __BRYTHON__ è già inizializzato (es. perché un altro runner sulla
    // pagina ha già chiamato brython()), non rifacciamo init: stessa libDir.
    if (
      window.__BRYTHON__ &&
      typeof window.__BRYTHON__.runPythonSource === 'function'
    ) {
      patchRuntime();
      return;
    }
    // Carichiamo gli script on-demand se `brython()` non è ancora disponibile.
    // L'ordine conta: il core (`brython.min.js`) definisce __BRYTHON__, poi lo
    // stdlib vi registra i moduli. Se le coordinate non ci sono (compat),
    // aspettiamo che qualcun altro li carichi.
    if (typeof window.brython !== 'function') {
      if (brython) {
        await injectScript(brython.mainSrc, brython.mainIntegrity);
        await injectScript(brython.stdlibSrc, brython.stdlibIntegrity);
      }
      await waitFor(() => typeof window.brython === 'function');
    }
    // Re-check: durante l'await un altro runner potrebbe aver già chiamato brython()
    if (
      window.__BRYTHON__ &&
      typeof window.__BRYTHON__.runPythonSource === 'function'
    ) {
      patchRuntime();
      return;
    }
    window.brython!({
      debug: 0,
      pythonpath: [libUrl],
      cache: true,
    });
    fixRandomSeed();
  })();

  return window.__PYRUNNER_BOOTED__;
}
