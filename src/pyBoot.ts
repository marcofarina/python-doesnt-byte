/**
 * Client module: garantisce che Brython sia inizializzato esattamente una volta.
 * Espone una Promise risolta quando __BRYTHON__ è pronto e l'init è stato chiamato.
 *
 * Il plugin server (`plugins/pyrunner`) inietta gli <script> di Brython in <head>
 * con `defer`. Qui aspettiamo che siano caricati e chiamiamo `brython({...})`.
 */

import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';

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

export function ensureBrython(libUrl: string): Promise<void> {
  if (!ExecutionEnvironment.canUseDOM) {
    return Promise.resolve();
  }
  if (window.__PYRUNNER_BOOTED__) return window.__PYRUNNER_BOOTED__;

  window.__PYRUNNER_BOOTED__ = (async () => {
    // Se __BRYTHON__ è già inizializzato (es. perché docusaurus-live-brython
    // ha già chiamato brython()), non rifacciamo init: la sua libDir è la stessa.
    if (
      window.__BRYTHON__ &&
      typeof window.__BRYTHON__.runPythonSource === 'function'
    ) {
      return;
    }
    // Altrimenti aspettiamo che brython() sia disponibile (script defer caricato)
    // e lo invochiamo noi una sola volta.
    await waitFor(() => typeof window.brython === 'function');
    // Re-check: durante l'await upstream potrebbe aver già chiamato brython()
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
