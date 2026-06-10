import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import useBaseUrl from '@docusaurus/useBaseUrl';
import clsx from 'clsx';
import { sql, SQLite } from '@codemirror/lang-sql';
import { Editor, type EditorHandle } from '../PyRunner/Editor';
import { Toolbar } from '../PyRunner/Toolbar';
import { coerceBool, coerceNumber } from '../PyRunner/coerce';
import { copyToClipboard } from '../PyRunner/clipboard';
import { buildExplainText } from '../PyRunner/share';
import { Output } from './Output';
import { runSql, resetDb, type SqlRunnerUrls } from './sqlBridge';
import type { RunStatus, SqlRunOutcome } from './types';
import pyStyles from '../PyRunner/styles.module.css';

export interface SQLRunnerProps {
  /** Sorgente inline (iniettato dal remark plugin per ```sql live```). */
  code?: string;
  /** Sorgente inline (alternativa scritta a mano). */
  children?: string;
  /**
   * Dataset seed: path relativo a `static/sql-datasets/`, senza estensione
   * `.sql` (es. `archivista/biblioteca`). Se assente il DB parte vuoto
   * (legittimo per lezioni su CREATE TABLE).
   */
  dataset?: string;
  /** Titolo mostrato in toolbar. Default: nome dataset o "sql". */
  title?: string;
  /** Disabilita l'editing. */
  readonly?: boolean | string;
  /** Numero massimo di righe visibili prima dello scroll interno. Default: 12. */
  maxLines?: number | string;
  /** Cap di righe per result-set (enforced nel worker). Default: 100. */
  maxRows?: number | string;
  /** Watchdog: oltre questo limite il worker viene terminato. Default: 5000 ms. */
  timeout?: number | string;
  /**
   * Il DB sopravvive tra un run e l'altro (lezioni su INSERT/UPDATE).
   * Default: false → restore trasparente dal seed a ogni esecuzione.
   */
  stateful?: boolean | string;
  /** Esegue subito al mount. */
  runOnMount?: boolean | string;
  /** Nasconde il bottone "Spiegamelo facile". */
  noExplain?: boolean | string;
  /** Prompt custom per "Spiegamelo facile". Placeholder: `{code}`, `{contextTitle}`. */
  explainPrompt?: string;
}

const DEFAULT_MAX_LINES = 12;
const DEFAULT_MAX_ROWS = 100;
const DEFAULT_TIMEOUT_MS = 5_000;
const TOAST_DURATION_MS = 2000;

const DEFAULT_SQL_EXPLAIN_PROMPT = `Sto studiando le basi di dati e il linguaggio SQL da un manuale scolastico in italiano. Spiegami questa query in modo semplice, come se avessi 16 anni e fossi alle prime armi. Concentrati sul "perché" più che sul "come". Se ci sono concetti chiave (selezione, proiezione, join, raggruppamento, vincoli, ecc.) nominali esplicitamente. Rispondi in italiano.

Contesto della lezione: {contextTitle}

Query:
\`\`\`sql
{code}
\`\`\`
`;

const sqlLanguage = sql({ dialect: SQLite, upperCaseKeywords: true });

function SQLRunnerInner(props: SQLRunnerProps) {
  const code = useMemo(() => {
    if (typeof props.code === 'string') return props.code;
    return typeof props.children === 'string' ? props.children : '';
  }, [props.code, props.children]);

  const datasetKey = props.dataset;
  const title =
    props.title ?? (datasetKey ? datasetKey.split('/').pop() : 'sql');

  // useId è stabile tra i render e unico per istanza sulla pagina: due
  // blocchi stateful con lo stesso codice non condividono il DB per sbaglio.
  const instanceId = useId();

  const workerUrl = useBaseUrl('/sql-runner/worker.js');
  const glueUrl = useBaseUrl('/sql-runner/sql-wasm.js');
  const wasmUrl = useBaseUrl('/sql-runner/sql-wasm.wasm');
  const datasetUrl = useBaseUrl(`/sql-datasets/${datasetKey ?? ''}.sql`);
  const urls: SqlRunnerUrls = useMemo(
    () => ({ workerUrl, glueUrl, wasmUrl }),
    [workerUrl, glueUrl, wasmUrl],
  );

  const maxLines = coerceNumber(props.maxLines, DEFAULT_MAX_LINES);
  const maxRows = coerceNumber(props.maxRows, DEFAULT_MAX_ROWS);
  const timeoutMs = coerceNumber(props.timeout, DEFAULT_TIMEOUT_MS);
  const readonly = coerceBool(props.readonly);
  const stateful = coerceBool(props.stateful);
  const runOnMount = coerceBool(props.runOnMount);
  const noExplain = coerceBool(props.noExplain);

  const [status, setStatus] = useState<RunStatus>('idle');
  const [outcome, setOutcome] = useState<SqlRunOutcome | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [restoredNotice, setRestoredNotice] = useState(false);
  const [hasEdits, setHasEdits] = useState(false);
  const [currentCode, setCurrentCode] = useState(code);
  const [toast, setToast] = useState<string | null>(null);
  const editorRef = useRef<EditorHandle | null>(null);
  const toastTimerRef = useRef<number | undefined>(undefined);
  // true dopo il primo run riuscito: serve a distinguere il primo open del DB
  // (freshDb "fisiologico") da un restore dopo terminate/reset.
  const hasRunRef = useRef(false);
  const runningRef = useRef(false);

  const showToast = useCallback((msg: string) => {
    window.clearTimeout(toastTimerRef.current);
    setToast(msg);
    toastTimerRef.current = window.setTimeout(
      () => setToast(null),
      TOAST_DURATION_MS,
    );
  }, []);

  useEffect(() => () => window.clearTimeout(toastTimerRef.current), []);

  const handleRun = useCallback(() => {
    if (runningRef.current) return;
    runningRef.current = true;
    const current = editorRef.current?.getCode() ?? code;
    setStatus('running');
    setError(null);
    setRestoredNotice(false);

    runSql(urls, {
      instanceId,
      sql: current,
      datasetKey,
      datasetUrl: datasetKey ? datasetUrl : undefined,
      stateful,
      maxRows,
      timeoutMs,
    })
      .then((res) => {
        setOutcome(res);
        setStatus('done');
        // In stateful, un DB "fresco" dopo che avevamo già eseguito significa
        // che lo stato è andato perso (timeout/reset): avvisiamo lo studente.
        if (stateful && res.freshDb && hasRunRef.current) {
          setRestoredNotice(true);
        }
        hasRunRef.current = true;
      })
      .catch((err: Error) => {
        setOutcome(null);
        setError(err.message);
        setStatus('error');
        // Dopo un timeout il worker è stato terminato: anche i DB stateful
        // ripartiranno dal seed al prossimo run.
        if (err.name === 'SqlTimeoutError') hasRunRef.current = false;
      })
      .finally(() => {
        runningRef.current = false;
      });
  }, [
    code,
    urls,
    instanceId,
    datasetKey,
    datasetUrl,
    stateful,
    maxRows,
    timeoutMs,
  ]);

  const handleResetCode = useCallback(() => {
    editorRef.current?.setCode(code);
    setHasEdits(false);
    setCurrentCode(code);
    setOutcome(null);
    setError(null);
    setRestoredNotice(false);
    setStatus('idle');
  }, [code]);

  const handleResetDb = useCallback(() => {
    resetDb(urls, instanceId)
      .then(() => {
        hasRunRef.current = false;
        setOutcome(null);
        setError(null);
        setRestoredNotice(false);
        setStatus('idle');
        showToast('Database ripristinato');
      })
      .catch(() => showToast('Reset non riuscito'));
  }, [urls, instanceId, showToast]);

  const handleChange = useCallback(
    (next: string) => {
      setCurrentCode(next);
      setHasEdits(next !== code);
    },
    [code],
  );

  const handleExplain = useCallback(() => {
    const template = props.explainPrompt ?? DEFAULT_SQL_EXPLAIN_PROMPT;
    const rawTitle =
      (typeof document !== 'undefined' && document.title) || title || '';
    const contextTitle = rawTitle.split(' | ')[0].trim();
    const text = buildExplainText(template, currentCode, contextTitle);
    copyToClipboard(text)
      .then(() => showToast('Prompt copiato'))
      .catch(() => showToast('Copia non riuscita'));
  }, [props.explainPrompt, currentCode, title, showToast]);

  const ranOnMountRef = useRef(false);
  useEffect(() => {
    if (!runOnMount || ranOnMountRef.current) return undefined;
    ranOnMountRef.current = true;
    // Differito: evita setState sincrono dentro l'effect (cascading render).
    const t = window.setTimeout(handleRun, 0);
    return () => window.clearTimeout(t);
  }, [runOnMount, handleRun]);

  const lineCount = code.split('\n').length;
  const showLineNumbers = lineCount > 1;
  const maxHeight = `${maxLines * 1.55}em`;

  return (
    <div className={clsx(pyStyles.runner, 'notranslate')}>
      <Toolbar
        title={title}
        status={status}
        hasEdits={hasEdits}
        code={currentCode}
        onRun={handleRun}
        onReset={handleResetCode}
        showExplain={!noExplain}
        onExplain={handleExplain}
        showResetDb={stateful}
        onResetDb={handleResetDb}
      />
      <div className={pyStyles.editorWrap} style={{ maxHeight }}>
        <Editor
          ref={editorRef}
          initialCode={code}
          showLineNumbers={showLineNumbers}
          readonly={readonly}
          onChange={handleChange}
          onRun={handleRun}
          language={sqlLanguage}
        />
      </div>
      <Output
        status={status}
        outcome={outcome}
        error={error}
        restoredNotice={restoredNotice}
      />
      {toast && (
        <div className={pyStyles.toast} role="status" aria-live="polite">
          {toast}
        </div>
      )}
    </div>
  );
}

export default function SQLRunner(props: SQLRunnerProps) {
  return (
    <BrowserOnly
      fallback={
        <pre className={pyStyles.fallback}>
          <code>
            {typeof props.code === 'string'
              ? props.code
              : typeof props.children === 'string'
                ? props.children
                : ''}
          </code>
        </pre>
      }
    >
      {() => <SQLRunnerInner {...props} />}
    </BrowserOnly>
  );
}
