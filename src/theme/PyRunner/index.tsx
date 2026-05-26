import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import { usePluginData } from '@docusaurus/useGlobalData';
import useBaseUrl from '@docusaurus/useBaseUrl';
import clsx from 'clsx';
import { Editor, type EditorHandle } from './Editor';
import { Output } from './Output';
import { Toolbar } from './Toolbar';
import { runPython, splitSource } from './bryBridge';
import { encodeCode, DEFAULT_EXPLAIN_PROMPT, buildExplainText } from './share';
import type { LogEntry, RunStatus } from './types';
import styles from './styles.module.css';

export interface PyRunnerProps {
  /** Path relativo a `static/<examplesDir>/`. Mutuamente esclusivo con `code`/`children`. */
  src?: string;
  /** Sorgente inline (iniettato dal remark plugin per ```py live```). */
  code?: string;
  /** Sorgente inline (alternativa scritta a mano). */
  children?: string;
  /** Titolo mostrato in toolbar. Default: nome file. */
  title?: string;
  /** Disabilita l'editing. */
  readonly?: boolean | string;
  /** Numero massimo di righe visibili prima dello scroll interno. Default: 20. */
  maxLines?: number | string;
  /** Esegue subito al mount. */
  runOnMount?: boolean;
  /** Nasconde sempre il bottone fullscreen (default: visibile solo se il codice scrolla). */
  noFullscreen?: boolean | string;
  /** Nasconde il bottone "Spiegamelo facile". */
  noExplain?: boolean | string;
  /** Prompt custom per "Spiegamelo facile". Placeholder: `{code}`, `{contextTitle}`. */
  explainPrompt?: string;
  /** Modalità "playground" → niente bottone fullscreen, niente cornice esterna extra. */
  embedded?: boolean;
}

function coerceBool(v: unknown): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') return v === '' || v === 'true';
  return false;
}

function coerceNumber(v: unknown, fallback: number): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

interface PyRunnerGlobalData {
  libUrl: string;
  examplesDir: string;
  examples: Record<string, string>;
}

/**
 * Genera un codeId stabile a partire da una stringa. Stesso input → stesso id,
 * input diverso → id diverso, sufficiente per non collidere fra istanze sulla
 * stessa pagina.
 */
function makeCodeId(seed: string): string {
  let hash = 5381;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 33) ^ seed.charCodeAt(i);
  }
  // codeId deve essere un identifier Python valido (no `-`, niente leading digit)
  const h = (hash >>> 0).toString(36);
  return `pyr_${h}`;
}

function PyRunnerInner(props: PyRunnerProps) {
  const data = usePluginData('pyrunner') as PyRunnerGlobalData | undefined;
  const libUrl = data?.libUrl ?? '';
  const examples = data?.examples;
  const examplesDir = data?.examplesDir ?? '';

  const rawSource = useMemo(() => {
    if (props.src) {
      const found = examples?.[props.src];
      if (found == null) {
        return `# PyRunner: file non trovato → static/${examplesDir}/${props.src}\n`;
      }
      return found;
    }
    if (typeof props.code === 'string') return props.code;
    return typeof props.children === 'string' ? props.children : '';
  }, [props.src, props.code, props.children, examples, examplesDir]);

  const { pre, code, post } = useMemo(
    () => splitSource(rawSource),
    [rawSource],
  );

  const title =
    props.title ??
    (props.src
      ? (props.src.split('/').pop()?.replace(/\.py$/, '') ?? 'python')
      : 'python');

  const codeId = useMemo(
    () => makeCodeId(props.src ?? rawSource),
    [props.src, rawSource],
  );

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [status, setStatus] = useState<RunStatus>('idle');
  const [duration, setDuration] = useState<number | null>(null);
  const [hasEdits, setHasEdits] = useState(false);
  const [currentCode, setCurrentCode] = useState(code);
  const [overflowing, setOverflowing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const editorWrapRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<EditorHandle | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const toastTimerRef = useRef<number | undefined>(undefined);
  const playgroundUrl = useBaseUrl('/playground');

  const maxLines = coerceNumber(props.maxLines, 20);
  const readonly = coerceBool(props.readonly);
  const noFullscreen = coerceBool(props.noFullscreen) || !!props.embedded;
  const noExplain = coerceBool(props.noExplain);
  const lineCount = code.split('\n').length;
  const showLineNumbers = lineCount > 1;

  const handleRun = useCallback(() => {
    const current = editorRef.current?.getCode() ?? code;
    setLogs([]);
    setStatus('running');
    setDuration(null);

    cleanupRef.current?.();
    cleanupRef.current = runPython(current, {
      codeId,
      preCode: pre,
      postCode: post,
      libUrl,
      onStart: () => {
        setLogs([]);
      },
      onLog: (kind, text) => {
        setLogs((prev) => [...prev, { kind, text }]);
        if (kind === 'stderr') setStatus('error');
      },
      onDone: (durationMs) => {
        setStatus((s) => (s === 'error' ? s : 'done'));
        setDuration(durationMs);
      },
      onError: (err) => {
        setStatus('error');
        setLogs((prev) => [
          ...prev,
          { kind: 'stderr', text: `[PyRunner] ${err.message}\n` },
        ]);
      },
    });
  }, [code, pre, post, codeId, libUrl]);

  const handleReset = useCallback(() => {
    editorRef.current?.setCode(code);
    setHasEdits(false);
    setCurrentCode(code);
    setLogs([]);
    setStatus('idle');
    setDuration(null);
  }, [code]);

  const handleChange = useCallback(
    (next: string) => {
      setCurrentCode(next);
      setHasEdits(next !== code);
    },
    [code],
  );

  const showToast = useCallback((msg: string) => {
    window.clearTimeout(toastTimerRef.current);
    setToast(msg);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 2000);
  }, []);

  useEffect(() => () => window.clearTimeout(toastTimerRef.current), []);

  const handleFullscreen = useCallback(() => {
    const params = new URLSearchParams();
    if (props.src && !hasEdits) {
      params.set('src', props.src);
    } else {
      params.set('code', encodeCode(currentCode));
    }
    if (title) params.set('title', title);
    if (props.explainPrompt) {
      params.set('p', encodeCode(props.explainPrompt));
    }
    const url = `${playgroundUrl}?${params.toString()}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [
    props.src,
    props.explainPrompt,
    hasEdits,
    currentCode,
    title,
    playgroundUrl,
  ]);

  const handleExplain = useCallback(() => {
    const template = props.explainPrompt ?? DEFAULT_EXPLAIN_PROMPT;
    const rawTitle =
      (typeof document !== 'undefined' && document.title) || title || '';
    // Docusaurus aggiunge "| <siteTitle>" al document.title: lo togliamo per
    // tenere solo il nome della lezione.
    const contextTitle = rawTitle.split(' | ')[0].trim();
    const text = buildExplainText(template, currentCode, contextTitle);
    const copy =
      navigator.clipboard?.writeText.bind(navigator.clipboard) ??
      (async (t: string) => {
        const { default: c } = await import('copy-text-to-clipboard');
        c(t);
      });
    Promise.resolve(copy(text))
      .then(() => showToast('Prompt copiato'))
      .catch(() => showToast('Copia non riuscita'));
  }, [props.explainPrompt, currentCode, title, showToast]);

  // Osserva overflow: ricalcola quando cambia il codice o quando il wrapper
  // si ridimensiona (font caricato, mobile rotation, ecc.).
  useEffect(() => {
    const el = editorWrapRef.current;
    if (!el) return;
    const check = () => {
      setOverflowing(el.scrollHeight - el.clientHeight > 2);
    };
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    const inner = el.querySelector('.cm-scroller');
    if (inner) ro.observe(inner);
    return () => ro.disconnect();
  }, [currentCode]);

  // maxLines → max-height CSS inline (line-height ~1.55 × 0.95em base 16px ≈ ~24px/riga)
  const maxHeight = `${maxLines * 1.55}em`;

  if (!data) {
    return (
      <div className={styles.error}>
        PyRunner: plugin <code>pyrunner</code> non registrato in
        docusaurus.config.ts
      </div>
    );
  }

  return (
    <div
      className={clsx(
        styles.runner,
        props.embedded && styles.runnerEmbedded,
        'notranslate',
      )}
    >
      <Toolbar
        title={title}
        status={status}
        hasEdits={hasEdits}
        code={currentCode}
        onRun={handleRun}
        onReset={handleReset}
        showFullscreen={!noFullscreen && overflowing}
        onFullscreen={handleFullscreen}
        showExplain={!noExplain}
        onExplain={handleExplain}
      />
      <div
        ref={editorWrapRef}
        className={styles.editorWrap}
        style={props.embedded ? undefined : { maxHeight }}
      >
        <Editor
          initialCode={code}
          showLineNumbers={showLineNumbers}
          readonly={readonly}
          onChange={handleChange}
          onRun={handleRun}
          handleRef={editorRef}
        />
      </div>
      <Output logs={logs} status={status} durationMs={duration} />
      {toast && (
        <div className={styles.toast} role="status" aria-live="polite">
          {toast}
        </div>
      )}
    </div>
  );
}

export default function PyRunner(props: PyRunnerProps) {
  return (
    <BrowserOnly
      fallback={
        <pre className={styles.fallback}>
          <code>
            {typeof props.children === 'string' ? props.children : ''}
          </code>
        </pre>
      }
    >
      {() => <PyRunnerInner {...props} />}
    </BrowserOnly>
  );
}
