/**
 * PyQuest — mini-giochi a griglia con Python (spec step 12).
 *
 * Orchestrazione: editor + Toolbar (riusati da PyRunner) → `runLevel` esegue il
 * codice studente contro il motore trace-based (`static/bry-libs/pyquest.py`),
 * gli eventi si accumulano in un ref, e a fine esecuzione `GamePlayer` anima la
 * trace su `GameScene`.
 *
 * Macchina a stati: `idle → executing (invisibile, ms) → animating → finished`.
 * L'esito è calcolato dalla trace con precedenza **won > failed > error**
 * (emendamento D7): dopo la vittoria la trace può contenere anche `step_limit`
 * e uno stderr — lo studente ha comunque vinto, il traceback resta in console.
 *
 * Risoluzione del livello: `levelData` inline (editor/test) ha la precedenza;
 * altrimenti `world`+`level` fanno lookup nei global data del plugin `pyquest`.
 * Id ignoti = pannello d'errore, mai un livello di ripiego silenzioso.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import { usePluginData } from '@docusaurus/useGlobalData';
import clsx from 'clsx';
import { Editor, type EditorHandle } from '@site/src/theme/PyRunner/Editor';
import { Toolbar } from '@site/src/theme/PyRunner/Toolbar';
import type { RunStatus } from '@site/src/theme/PyRunner/types';
import { ensureBrython, type BrythonConfig } from '@site/src/pyBoot';
import pyStyles from '@site/src/theme/PyRunner/styles.module.css';
import { runLevel, MAX_STEPS_DEFAULT } from './runLevel';
import { useWorldData } from './useWorldData';
import { characterDef } from './characters';
import GamePlayer from './GamePlayer';
import type { GameEvent, LevelDef, LogLine } from './types';
import styles from './PyQuest.module.css';

export interface PyQuestProps {
  /** Id del mondo nei global data del plugin `pyquest`. */
  world?: string;
  /** Id del livello dentro il mondo. */
  level?: string;
  /** Livello passato inline (editor/test): bypassa la lookup su world/level. */
  levelData?: LevelDef;
  /** Personaggio (override): normalmente ereditato dal mondo. */
  character?: string;
  /** Titolo mostrato nella toolbar (override del titolo del livello). */
  title?: string;
}

interface PyRunnerGlobalData {
  libUrl: string;
  brython?: BrythonConfig;
}

type Phase = 'idle' | 'executing' | 'animating' | 'finished';
/** `null` = il codice è terminato senza vittoria, sconfitta né errore. */
type Outcome = 'won' | 'failed' | 'error' | null;

// Contatore di modulo per il suffisso del codeId (D12): due istanze dello stesso
// livello sulla stessa pagina devono restare indipendenti.
let idCounter = 0;

function makeCodeId(seed: string, n: number): string {
  let hash = 5381;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 33) ^ seed.charCodeAt(i);
  }
  // Deve soddisfare la guardia /^pyr_[a-z0-9]+$/ di bryBridge (niente separatori).
  // Hash a larghezza fissa (7 = max cifre base36 di un uint32): senza padding la
  // concatenazione hash+contatore potrebbe collidere tra istanze diverse.
  const h = (hash >>> 0).toString(36).padStart(7, '0');
  return `pyr_${h}${n.toString(36)}`;
}

function ErrorBox({ children }: { children: React.ReactNode }) {
  return <div className={styles.error}>{children}</div>;
}

function PyQuestInner(props: PyQuestProps) {
  const pyrunner = usePluginData('pyrunner') as PyRunnerGlobalData | undefined;
  const worlds = useWorldData();
  const libUrl = pyrunner?.libUrl ?? '';
  const brython = pyrunner?.brython;

  // Risoluzione livello + personaggio (prima degli hook condizionali: i render
  // d'errore stanno in fondo, dopo tutti gli hook).
  const world = props.world ? worlds[props.world] : undefined;
  const level: LevelDef | undefined =
    props.levelData ??
    (world && props.level
      ? world.levels.find((l) => l.id === props.level)
      : undefined);
  const character = props.character ?? world?.character ?? 'byte';
  const char = characterDef(character);
  const starterCode = level?.starterCode ?? '';

  const seed =
    props.world && props.level
      ? `${props.world}/${props.level}`
      : JSON.stringify(level ?? props);
  const instanceN = useRef<number>(-1);
  if (instanceN.current < 0) instanceN.current = idCounter++;
  const codeId = makeCodeId(seed, instanceN.current);

  const [phase, setPhase] = useState<Phase>('idle');
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [playKey, setPlayKey] = useState(0);
  const [hasEdits, setHasEdits] = useState(false);
  const [currentCode, setCurrentCode] = useState(starterCode);

  const editorRef = useRef<EditorHandle | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const eventsRef = useRef<GameEvent[]>([]);
  const logsRef = useRef<LogLine[]>([]);

  // Precarica Brython quando il componente entra nel viewport (pattern PyRunner).
  useEffect(() => {
    const el = rootRef.current;
    const preload = () => {
      ensureBrython(libUrl, brython).catch(() => {
        /* l'errore riemerge al primo run via onError */
      });
    };
    if (!el || typeof IntersectionObserver === 'undefined') {
      preload();
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          preload();
        }
      },
      { rootMargin: '200px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [libUrl, brython]);

  useEffect(() => () => cleanupRef.current?.(), []);

  const finishRun = useCallback(() => {
    const trace = eventsRef.current;
    const hasWin = trace.some((e) => e.t === 'win');
    const hasDeath = trace.some((e) => e.t === 'death');
    const hasLimit = trace.some((e) => e.t === 'step_limit');
    const hasStderr = logsRef.current.some((l) => l.kind === 'stderr');
    // Precedenza esplicita (emendamento D7): won > failed > error.
    setOutcome(
      hasWin
        ? 'won'
        : hasDeath || hasLimit
          ? 'failed'
          : hasStderr
            ? 'error'
            : null,
    );
    setEvents([...trace]);
    setLogs([...logsRef.current]);
    setPhase('animating');
    setPlayKey((k) => k + 1);
  }, []);

  const handleRun = useCallback(() => {
    if (!level) return;
    const code = editorRef.current?.getCode() ?? starterCode;
    setPhase('executing');
    setOutcome(null);
    setEvents([]);
    setLogs([]);
    eventsRef.current = [];
    logsRef.current = [];
    cleanupRef.current?.();
    cleanupRef.current = runLevel({
      code,
      level,
      codeId,
      libUrl,
      brython,
      onStart: () => {
        eventsRef.current = [];
        logsRef.current = [];
      },
      onEvent: (ev) => {
        eventsRef.current.push(ev);
      },
      onLog: (kind, text) => {
        logsRef.current.push({ kind, text, atStep: eventsRef.current.length });
      },
      onDone: finishRun,
      onError: (err) => {
        logsRef.current.push({
          kind: 'stderr',
          text: `[PyQuest] ${err.message}\n`,
          atStep: eventsRef.current.length,
        });
        finishRun();
      },
    });
  }, [level, starterCode, codeId, libUrl, brython, finishRun]);

  const handleReset = useCallback(() => {
    editorRef.current?.setCode(starterCode);
    setCurrentCode(starterCode);
    setHasEdits(false);
  }, [starterCode]);

  const handleChange = useCallback(
    (next: string) => {
      setCurrentCode(next);
      setHasEdits(next !== starterCode);
    },
    [starterCode],
  );

  // Fine animazione: il player è arrivato in fondo alla trace.
  const handleStepChange = useCallback((step: number, total: number) => {
    if (step >= total) {
      setPhase((p) => (p === 'animating' ? 'finished' : p));
    }
  }, []);

  if (!libUrl) {
    return (
      <ErrorBox>
        PyQuest: plugin <code>pyrunner</code> non registrato — libUrl mancante.
      </ErrorBox>
    );
  }
  if (!level) {
    if (props.world && !world) {
      return (
        <ErrorBox>
          PyQuest: mondo <code>{props.world}</code> non trovato nei dati del
          plugin.
        </ErrorBox>
      );
    }
    if (world && props.level) {
      return (
        <ErrorBox>
          PyQuest: livello <code>{props.level}</code> non trovato nel mondo{' '}
          <code>{props.world}</code>.
        </ErrorBox>
      );
    }
    return (
      <ErrorBox>
        PyQuest: specifica <code>world</code> + <code>level</code> oppure{' '}
        <code>levelData</code>.
      </ErrorBox>
    );
  }

  const toolbarStatus: RunStatus =
    phase === 'executing'
      ? 'running'
      : phase === 'idle'
        ? 'idle'
        : outcome === 'error'
          ? 'error'
          : 'done';

  const maxSteps = level.maxSteps ?? MAX_STEPS_DEFAULT;
  const hasDeath = events.some((e) => e.t === 'death');
  const bumpCount = events.filter((e) => e.t === 'bump').length;
  const stderrText = logs
    .filter((l) => l.kind === 'stderr')
    .map((l) => l.text)
    .join('');

  return (
    <div ref={rootRef} data-pagefind-ignore className={styles.root}>
      <div className={styles.layout}>
        <div className={styles.stage}>
          <GamePlayer
            level={level}
            character={character}
            events={events}
            logs={logs}
            playKey={playKey}
            onStepChange={handleStepChange}
          />

          {/* Pannelli di esito con il flavor text del personaggio (D13). */}
          {phase === 'finished' && outcome === 'won' && (
            <div className={clsx(styles.panel, styles.panelWin)}>
              <strong>{char.name}:</strong> {char.flavor.win}
            </div>
          )}
          {phase === 'finished' && outcome === 'failed' && (
            <div className={clsx(styles.panel, styles.panelFail)}>
              <strong>{char.name}:</strong>{' '}
              {hasDeath ? char.flavor.death : char.flavor.stepLimit(maxSteps)}
            </div>
          )}
          {phase === 'finished' && outcome === 'error' && (
            <div className={clsx(styles.panel, styles.panelError)}>
              <p className={styles.panelTitle}>C’è un errore nel codice</p>
              <pre className={styles.traceback}>{stderrText}</pre>
            </div>
          )}
          {phase === 'finished' && outcome === null && bumpCount >= 2 && (
            <div className={clsx(styles.panel, styles.panelNeutral)}>
              <strong>{char.name}:</strong> {char.flavor.bump}
            </div>
          )}
        </div>

        <div className={clsx(pyStyles.runner, 'notranslate', styles.editorCol)}>
          <Toolbar
            title={props.title ?? level.title}
            status={toolbarStatus}
            hasEdits={hasEdits}
            code={currentCode}
            onRun={handleRun}
            onReset={handleReset}
          />
          <div className={pyStyles.editorWrap}>
            <Editor
              ref={editorRef}
              initialCode={starterCode}
              showLineNumbers
              onChange={handleChange}
              onRun={handleRun}
              ariaLabel="Editor di codice Python del livello"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PyQuest(props: PyQuestProps) {
  return (
    <BrowserOnly fallback={<div className={styles.root}>PyQuest…</div>}>
      {() => <PyQuestInner {...props} />}
    </BrowserOnly>
  );
}
