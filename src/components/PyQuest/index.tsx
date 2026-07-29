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
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar } from '@fortawesome/free-solid-svg-icons';
import { faStar as faStarOutline } from '@fortawesome/free-regular-svg-icons';
import clsx from 'clsx';
import { Editor, type EditorHandle } from '@site/src/theme/PyRunner/Editor';
import { Toolbar } from '@site/src/theme/PyRunner/Toolbar';
import type { RunStatus } from '@site/src/theme/PyRunner/types';
import { copyToClipboard } from '@site/src/theme/PyRunner/clipboard';
import {
  buildExplainText,
  DEFAULT_EXPLAIN_PROMPT,
} from '@site/src/theme/PyRunner/share';
import { ensureBrython, type BrythonConfig } from '@site/src/pyBoot';
import pyStyles from '@site/src/theme/PyRunner/styles.module.css';
import { runLevel, MAX_STEPS_DEFAULT } from './runLevel';
import { useWorldData } from './useWorldData';
import { useProgress, countActions, starsFor } from './useProgress';
import { characterDef } from './characters';
import GamePlayer from './GamePlayer';
import HintPanel from './HintPanel';
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
  /**
   * Notifica una vittoria a fine animazione (la galleria vi aggancia la
   * navigazione al livello successivo). Il progresso è già stato salvato quando
   * scatta. Passa una callback stabile (useCallback) per evitare rifiri.
   */
  onWin?: (result: { steps: number; stars: number; isRecord: boolean }) => void;
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

/** «1 azione» / «N azioni». */
function azioni(n: number): string {
  return n === 1 ? 'azione' : 'azioni';
}

/** Riga di 3 stelle, piene fino a `n` (spec D11). */
function Stars({ n }: { n: number }) {
  return (
    <span
      className={styles.stars}
      aria-label={n === 1 ? '1 stella su 3' : `${n} stelle su 3`}
    >
      {[1, 2, 3].map((i) => (
        <FontAwesomeIcon
          key={i}
          icon={i <= n ? faStar : faStarOutline}
          className={clsx(styles.star, i <= n && styles.starOn)}
        />
      ))}
    </span>
  );
}

function PyQuestInner(props: PyQuestProps) {
  const pyrunner = usePluginData('pyrunner') as PyRunnerGlobalData | undefined;
  const worlds = useWorldData();
  const { getLevel, recordWin } = useProgress();
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

  // Progresso salvato: solo per livelli identificati da world+level (non per i
  // livelli inline dell'editor, che non hanno un id persistibile).
  const savedProgress =
    props.world && props.level ? getLevel(props.world, props.level) : undefined;

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
  // Nuovo record di QUESTO run: deciso da recordWin PRIMA di scrivere il best
  // (dopo la scrittura un pareggio sarebbe indistinguibile da un record).
  const [isRecord, setIsRecord] = useState(false);

  const editorRef = useRef<EditorHandle | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const eventsRef = useRef<GameEvent[]>([]);
  const logsRef = useRef<LogLine[]>([]);
  // Il livello era già completato all'avvio del run? Serve a non far comparire
  // la striscia «Completato» durante l'animazione della prima vittoria (recordWin
  // scatta a inizio animazione: la striscia rivelerebbe l'esito in anticipo).
  const wasDoneBeforeRunRef = useRef(false);

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

  // Cambio di livello a runtime (anteprima live dell'editor livelli): la trace
  // del run precedente non descrive più il livello — annulla l'eventuale run e
  // torna a idle. Per i livelli da world data l'identità è stabile: non scatta.
  const levelRef = useRef(level);
  useEffect(() => {
    if (levelRef.current === level) return;
    levelRef.current = level;
    cleanupRef.current?.();
    cleanupRef.current = null;
    eventsRef.current = [];
    logsRef.current = [];
    setPhase('idle');
    setOutcome(null);
    setIsRecord(false);
    setEvents([]);
    setLogs([]);
  }, [level]);

  // Anche starterCode può cambiare a runtime (form dell'editor livelli):
  // l'Editor monta initialCode una sola volta, quindi va allineato a mano —
  // ma solo finché non ci sono modifiche manuali da preservare.
  useEffect(() => {
    if (!hasEdits) {
      editorRef.current?.setCode(starterCode);
      setCurrentCode(starterCode);
    }
  }, [starterCode, hasEdits]);

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
    // Vittoria: salva completamento e record (solo per livelli identificabili).
    if (hasWin && props.world && props.level) {
      setIsRecord(recordWin(props.world, props.level, countActions(trace)));
    }
    setEvents([...trace]);
    setLogs([...logsRef.current]);
    setPhase('animating');
    setPlayKey((k) => k + 1);
  }, [recordWin, props.world, props.level]);

  const handleExplain = useCallback(() => {
    if (!level) return;
    const code = editorRef.current?.getCode() ?? starterCode;
    const contextTitle = `Livello PyQuest «${level.title}»`;
    const text = buildExplainText(DEFAULT_EXPLAIN_PROMPT, code, contextTitle);
    copyToClipboard(text).catch(() => {
      /* clipboard non disponibile: nessun feedback, il codice resta nell'editor */
    });
  }, [level, starterCode]);

  const handleRun = useCallback(() => {
    if (!level) return;
    const code = editorRef.current?.getCode() ?? starterCode;
    wasDoneBeforeRunRef.current = savedProgress?.done === true;
    setPhase('executing');
    setOutcome(null);
    setIsRecord(false);
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
  }, [level, starterCode, codeId, libUrl, brython, finishRun, savedProgress]);

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

  // Vittoria conclusa: segnala al genitore (la galleria sblocca il «prossimo»).
  const { onWin } = props;
  useEffect(() => {
    if (phase !== 'finished' || outcome !== 'won' || !level || !onWin) return;
    const steps = countActions(events);
    onWin({ steps, stars: starsFor(steps, level.par), isRecord });
  }, [phase, outcome, level, events, isRecord, onWin]);

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
  // Il traceback completo è già nella console del player: il pannello ne mostra
  // solo l'ultima riga — tipo di errore e messaggio, cioè la parte che dice allo
  // studente cosa correggere.
  const errorSummary =
    stderrText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .pop() ?? '';

  // Azioni e stelle di QUESTA esecuzione (il pannello vittoria le mostra);
  // `savedProgress` porta invece il record persistito, visibile anche a freddo.
  const runSteps = countActions(events);
  const runStars = starsFor(runSteps, level.par);
  // La striscia «Completato» non deve anticipare l'esito durante l'animazione
  // della vittoria che l'ha appena sbloccata (recordWin scrive a inizio replay).
  const showCompleted =
    savedProgress?.done === true &&
    (phase === 'idle' || phase === 'finished' || wasDoneBeforeRunRef.current);

  return (
    <div ref={rootRef} data-pagefind-ignore className={styles.root}>
      <div className={styles.layout}>
        <div className={styles.stage}>
          {/* Record persistito: visibile anche a freddo (verifica reload). */}
          {showCompleted && savedProgress && (
            <div className={styles.completed}>
              <Stars n={starsFor(savedProgress.bestSteps, level.par)} />
              <span>
                Completato · record {savedProgress.bestSteps}{' '}
                {azioni(savedProgress.bestSteps)}
              </span>
            </div>
          )}

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
              <div className={styles.winHead}>
                <Stars n={runStars} />
                <span className={styles.winSteps}>
                  {runSteps} {azioni(runSteps)} · par {level.par}
                  {isRecord && (
                    <b className={styles.record}> · nuovo record!</b>
                  )}
                </span>
              </div>
              <p className={styles.winFlavor}>
                <strong>{char.name}:</strong> {char.flavor.win}
              </p>
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
              <pre className={styles.traceback}>{errorSummary}</pre>
              <p className={styles.panelHint}>
                Il traceback completo, con la riga esatta, è qui sopra nella
                console.
              </p>
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
            showExplain
            onExplain={handleExplain}
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
          {/* key: al cambio livello (anteprima live dell'editor) i suggerimenti
              rivelati ripartono da zero. */}
          <HintPanel key={level.id} hints={level.hints} />
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
