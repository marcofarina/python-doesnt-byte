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
      return;
    }
    window.brython!({
      debug: 0,
      pythonpath: [libUrl],
      cache: true,
    });
  })();

  return window.__PYRUNNER_BOOTED__;
}
