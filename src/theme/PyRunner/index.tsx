import { useCallback, useMemo, useRef, useState } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import { usePluginData } from '@docusaurus/useGlobalData';
import clsx from 'clsx';
import { Editor, type EditorHandle } from './Editor';
import { Output } from './Output';
import { Toolbar } from './Toolbar';
import { runPython, splitSource } from './bryBridge';
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
  if (!data) {
    return (
      <div className={styles.error}>
        PyRunner: plugin <code>pyrunner</code> non registrato in
        docusaurus.config.ts
      </div>
    );
  }

  const rawSource = useMemo(() => {
    if (props.src) {
      const found = data.examples[props.src];
      if (found == null) {
        return `# PyRunner: file non trovato → static/${data.examplesDir}/${props.src}\n`;
      }
      return found;
    }
    if (typeof props.code === 'string') return props.code;
    return typeof props.children === 'string' ? props.children : '';
  }, [props.src, props.code, props.children, data]);

  const { pre, code, post } = useMemo(() => splitSource(rawSource), [rawSource]);

  const title =
    props.title ??
    (props.src
      ? props.src.split('/').pop()?.replace(/\.py$/, '') ?? 'python'
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
  const editorRef = useRef<EditorHandle | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const maxLines = coerceNumber(props.maxLines, 20);
  const readonly = coerceBool(props.readonly);
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
      libUrl: data.libUrl,
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
  }, [code, pre, post, codeId, data.libUrl]);

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

  // maxLines → max-height CSS inline (line-height ~1.55 × 0.95em base 16px ≈ ~24px/riga)
  const maxHeight = `${maxLines * 1.55}em`;

  return (
    <div className={clsx(styles.runner, 'notranslate')}>
      <Toolbar
        title={title}
        status={status}
        hasEdits={hasEdits}
        code={currentCode}
        onRun={handleRun}
        onReset={handleReset}
      />
      <div
        className={styles.editorWrap}
        style={{ maxHeight }}
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
    </div>
  );
}

export default function PyRunner(props: PyRunnerProps) {
  return (
    <BrowserOnly
      fallback={
        <pre className={styles.fallback}>
          <code>{typeof props.children === 'string' ? props.children : ''}</code>
        </pre>
      }
    >
      {() => <PyRunnerInner {...props} />}
    </BrowserOnly>
  );
}
