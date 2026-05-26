/**
 * Bridge tra mondo React e Brython.
 *
 * Protocollo (riusato dal plugin upstream, supportato dai file Python esistenti
 * in `static/bry-libs/`):
 *   - chiamiamo `__BRYTHON__.runPythonSource(src, { pythonpath: [libUrl] })`
 *   - lo script Python (`brython_runner.run`) rimpiazza stdout/stderr con un
 *     oggetto che fa `dispatchEvent('bry_notify', { detail: {type, output} })`
 *     sul div `py_<codeId>`
 *   - qui ascoltiamo quegli eventi e li propaghiamo via callback
 */

import { ensureBrython } from '@site/src/pyBoot';

export type LogKind = 'stdout' | 'stderr';

export interface RunOptions {
  codeId: string;
  preCode?: string;
  postCode?: string;
  libUrl: string;
  onStart: () => void;
  onLog: (kind: LogKind, text: string) => void;
  onDone: (durationMs: number) => void;
  onError?: (err: Error) => void;
}

interface BryNotifyDetail {
  type: 'start' | 'done' | 'stdout' | 'stderr';
  output?: string;
  time?: number;
}

const BRY_EVENT = 'bry_notify';

function communicatorId(codeId: string): string {
  return `py_${codeId}`;
}

function outputDivId(codeId: string): string {
  // Deve combaciare con `Config.OUTPUT_DIV` in static/bry-libs/config.py
  // (`{node_id}_brython_result`), che brython_runner.py legge via document[…].
  return `${codeId}_brython_result`;
}

function ensureCommunicatorDiv(codeId: string): HTMLDivElement {
  const id = communicatorId(codeId);
  let div = document.getElementById(id) as HTMLDivElement | null;
  if (!div) {
    div = document.createElement('div');
    div.id = id;
    div.style.display = 'none';
    document.body.appendChild(div);
  }
  // RESULT_DIV è usato dal codice Python (es. turtle) per scrivere output grafico.
  // Lo creiamo anche se per ora non lo mostriamo: serve a brython_runner per non fallire.
  const outId = outputDivId(codeId);
  if (!document.getElementById(outId)) {
    const out = document.createElement('div');
    out.id = outId;
    out.style.display = 'none';
    document.body.appendChild(out);
  }
  return div;
}

function sanitizePyScript(s: string): string {
  // Replica della sanitization upstream: i triple-quote nel codice utente
  // romperebbero il wrapper run("""...""").
  return s.replace(/\\/g, '\\\\').replace(/"""/g, '\\"\\"\\"');
}

export function runPython(code: string, opts: RunOptions): () => void {
  const {
    codeId,
    preCode = '',
    postCode = '',
    libUrl,
    onStart,
    onLog,
    onDone,
    onError,
  } = opts;

  const startTime = Date.now();
  const div = ensureCommunicatorDiv(codeId);

  const listener = (event: Event) => {
    const detail = (event as CustomEvent<BryNotifyDetail>).detail;
    if (!detail) return;
    switch (detail.type) {
      case 'start':
        onStart();
        break;
      case 'done':
        onDone(Date.now() - startTime);
        break;
      case 'stdout':
      case 'stderr':
        if (detail.output) onLog(detail.type, detail.output);
        break;
    }
  };

  div.addEventListener(BRY_EVENT, listener);

  const cleanup = () => {
    div.removeEventListener(BRY_EVENT, listener);
  };

  const lineShift = preCode
    .trim()
    .split(/\n/)
    .filter((l) => l.length > 0).length;
  const pre = lineShift > 0 ? `${preCode.trim()}\n` : '';
  const post = postCode.trim().length > 0 ? `\n${postCode.trim()}` : '';
  const userCode = `${pre}${code}${post}`;
  // Newline di sicurezza prima della chiusura del triple-quote: se userCode
  // termina con `"`, evita la concatenazione `"` + `"""` → SyntaxError.
  const wrapped = `from brython_runner import run\nrun("""${sanitizePyScript(userCode)}\n""", '${codeId}', ${lineShift})\n`;

  ensureBrython(libUrl)
    .then(() => {
      // setTimeout 0 garantisce che il div nel DOM sia visibile al codice Python.
      window.setTimeout(() => {
        if (!window.__BRYTHON__) {
          onError?.(new Error('Brython non disponibile dopo init'));
          return;
        }
        try {
          window.__BRYTHON__.runPythonSource(wrapped, {
            pythonpath: [libUrl],
            cache: true,
          });
        } catch (err) {
          onError?.(err instanceof Error ? err : new Error(String(err)));
        }
      }, 0);
    })
    .catch((err) => {
      onError?.(err instanceof Error ? err : new Error(String(err)));
    });

  return cleanup;
}

/**
 * Split di un sorgente con i marker ### PRE e ### POST.
 * Compatibile con la sintassi del plugin upstream.
 */
const SPLIT_RE =
  /^(?:(?<pre>.*?)\n###\s*PRE\s*)?(?<code>.*?)(?:\n###\s*POST\s*(?<post>.*))?$/s;

export function splitSource(raw: string): {
  pre: string;
  code: string;
  post: string;
} {
  const m = raw.replace(/\s*\n$/, '').match(SPLIT_RE);
  const g = m?.groups ?? {};
  return {
    pre: g.pre || '',
    code: g.code || '',
    post: g.post || '',
  };
}
