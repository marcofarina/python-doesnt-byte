import { useEffect, useMemo, useReducer, type CSSProperties } from 'react';
import type { ArrayTrace, GeneratorDef } from './types';
import { applyArrayStep, initArrayState } from './applyStep';
import ArrayScene from './ArrayScene';
import CodePanel from './CodePanel';
import Icon, { type IconName } from './Icon';
import styles from './styles.module.css';

const SPEEDS = [0.5, 1, 2, 4];
const TICK_MS = [1100, 600, 300, 150];
const DUR_MS = [520, 420, 300, 180];

interface PlayerProps {
  trace: ArrayTrace;
  gen: GeneratorDef;
  showExplain: boolean;
  colorMode: 'gradient' | 'rainbow';
  /** Pannello pseudocodice visibile (già combinato con il toggle). */
  showCode: boolean;
  /** Modalità avanzata (segue il toggle codice): mostra shuffle, esegui e il
   *  selettore di velocità. Spenta: resta solo l'avanzamento passo-passo. */
  advanced: boolean;
  showStats: boolean;
  onShuffle: () => void;
  initialSpeedIdx: number;
}

interface PlayerState {
  stepIndex: number;
  playing: boolean;
  speedIdx: number;
}

type Action =
  | { type: 'FWD' }
  | { type: 'BACK' }
  | { type: 'RESET' }
  | { type: 'TOGGLE_PLAY' }
  | { type: 'STOP' }
  | { type: 'SEEK'; to: number }
  | { type: 'SET_SPEED'; idx: number };

export default function Player({
  trace,
  gen,
  showExplain,
  colorMode,
  showCode,
  advanced,
  showStats,
  onShuffle,
  initialSpeedIdx,
}: PlayerProps) {
  const total = trace.steps.length;

  const [state, dispatch] = useReducer(
    (s: PlayerState, action: Action): PlayerState => {
      switch (action.type) {
        case 'FWD': {
          const ni = Math.min(s.stepIndex + 1, total);
          return {
            ...s,
            stepIndex: ni,
            playing: ni >= total ? false : s.playing,
          };
        }
        case 'BACK':
          return {
            ...s,
            stepIndex: Math.max(s.stepIndex - 1, 0),
            playing: false,
          };
        case 'RESET':
          return { ...s, stepIndex: 0, playing: false };
        case 'TOGGLE_PLAY':
          if (s.stepIndex >= total)
            return { ...s, stepIndex: 0, playing: true };
          return { ...s, playing: !s.playing };
        case 'STOP':
          return { ...s, playing: false };
        case 'SEEK':
          return { ...s, stepIndex: action.to, playing: false };
        case 'SET_SPEED':
          return { ...s, speedIdx: action.idx };
        default:
          return s;
      }
    },
    { stepIndex: 0, playing: false, speedIdx: initialSpeedIdx },
  );

  // Nuova trace (Mescola / cambio dati): torno all'inizio, tengo la velocità.
  useEffect(() => {
    dispatch({ type: 'RESET' });
  }, [trace]);

  // Uscendo dalla modalità avanzata (es. passaggio a Studio) fermo l'autoplay:
  // senza il pulsante Esegui non sarebbe più interrompibile.
  useEffect(() => {
    if (!advanced) dispatch({ type: 'STOP' });
  }, [advanced]);

  // Autoplay.
  useEffect(() => {
    if (!state.playing) return undefined;
    const id = setTimeout(
      () => dispatch({ type: 'FWD' }),
      TICK_MS[state.speedIdx],
    );
    return () => clearTimeout(id);
  }, [state.playing, state.stepIndex, state.speedIdx]);

  const scene = useMemo(
    () =>
      trace.steps
        .slice(0, state.stepIndex)
        .reduce(applyArrayStep, initArrayState(trace)),
    [trace, state.stepIndex],
  );

  const isSort = gen.kind === 'sort';

  // Una sola scansione dell'intera trace per:
  // - la corsia sotto le barre (altezza fissa → niente salti quando badge e
  //   graffe compaiono o spariscono; minima per chi non usa nulla);
  // - la legenda, che elenca SOLO gli stati realmente usati dall'algoritmo
  //   (es. niente «Chiave» nel bubble sort).
  const { laneH, legend } = useMemo(() => {
    let badge = false;
    let range = false;
    let extract = false;
    let hasCompare = false;
    let hasSwap = false;
    let hasSorted = false;
    for (const s of trace.steps) {
      switch (s.op) {
        case 'pointer':
          if (s.i !== null) badge = true;
          break;
        case 'range':
          range = true;
          break;
        case 'extract':
          extract = true;
          break;
        case 'compare':
        case 'compareTarget':
        case 'compareExtracted':
          hasCompare = true;
          break;
        case 'swap':
        case 'shiftRight':
          hasSwap = true;
          break;
        case 'markSorted':
        case 'outcome':
          hasSorted = true;
          break;
      }
    }
    // Minimo: spazio per il «glow» (ombra dell'anello) sotto le barre, così
    // non viene tagliato dove la corsia sarebbe altrimenti cortissima.
    let h = 30;
    if (extract) h = Math.max(h, 72);
    if (badge) h = Math.max(h, 58);
    if (range) h = Math.max(h, 98);

    const lg: [string, string][] = [];
    if (hasCompare) lg.push(['compare', 'Confronto']);
    if (hasSwap) lg.push(['swap', 'Scambio']);
    if (extract) lg.push(['key', 'Chiave']);
    if (hasSorted) lg.push(['sorted', isSort ? 'Ordinato' : 'Trovato']);
    return { laneH: h, legend: lg };
  }, [trace, isSort]);

  const atStart = state.stepIndex === 0;
  const atEnd = state.stepIndex >= total;
  const progress = total > 0 ? (state.stepIndex / total) * 100 : 0;

  const status = atEnd
    ? { cls: styles.dotDone, label: 'completato' }
    : state.playing
      ? { cls: styles.dotPlay, label: 'in esecuzione' }
      : atStart
        ? { cls: styles.dotIdle, label: 'pronto' }
        : { cls: styles.dotPause, label: 'in pausa' };

  const primary = scene.note || scene.phase;
  const secondary = scene.note && scene.phase !== scene.note ? scene.phase : '';

  const durStyle = {
    '--alg-dur': `${DUR_MS[state.speedIdx]}ms`,
  } as CSSProperties;

  return (
    <>
      <div className={styles.body} style={durStyle}>
        <div className={styles.sceneWrap}>
          <ArrayScene
            state={scene}
            target={trace.target}
            label={gen.label}
            colorMode={colorMode}
            laneH={laneH}
            showLabels={showCode}
          />
        </div>

        {showExplain && (
          <div className={styles.explanation} aria-live="polite">
            <p className={styles.phase}>
              <span className={styles.stepChip}>
                {String(state.stepIndex).padStart(2, '0')}
              </span>
              {primary}
            </p>
            {secondary && <p className={styles.note}>{secondary}</p>}
          </div>
        )}

        <div className={styles.legend}>
          {legend.map(([k, lbl]) => (
            <span key={k} className={styles.legendItem}>
              <span
                className={styles.legendSwatch}
                style={{ background: `var(--alg-st-${k})` }}
              />
              {lbl}
            </span>
          ))}
        </div>
      </div>

      {showCode && gen.code && (
        <CodePanel
          code={gen.code}
          activeLine={scene.line}
          comparisons={scene.comparisons}
          swaps={scene.swaps}
          showStats={showStats}
          withSwaps={isSort}
        />
      )}

      <div className={styles.footer}>
        <div className={styles.statusRow}>
          <span className={styles.status}>
            <span className={`${styles.statusDot} ${status.cls}`} />
            {status.label}
          </span>
          <span className={styles.stepCount}>
            passo {state.stepIndex} / {total}
          </span>
        </div>

        <div className={styles.scrub}>
          <div className={styles.scrubTrack}>
            <div
              className={styles.scrubFill}
              style={{ width: `${progress}%` }}
            />
          </div>
          <input
            className={styles.scrubInput}
            type="range"
            min={0}
            max={total}
            value={state.stepIndex}
            aria-label="Posizione nella sequenza"
            onChange={(e) =>
              dispatch({ type: 'SEEK', to: Number(e.target.value) })
            }
          />
        </div>

        <div className={styles.transport}>
          {advanced && (
            <IconBtn icon="shuffle" label="Mescola" onClick={onShuffle} />
          )}
          <IconBtn
            icon="rotate-left"
            label="Ricomincia"
            onClick={() => dispatch({ type: 'RESET' })}
            disabled={atStart}
          />
          <IconBtn
            icon="backward-step"
            label="Indietro"
            onClick={() => dispatch({ type: 'BACK' })}
            disabled={atStart}
          />
          {advanced && (
            <button
              type="button"
              className={`${styles.btn} ${styles.btnPrimary} ${styles.btnWide}`}
              onClick={() => dispatch({ type: 'TOGGLE_PLAY' })}
            >
              <Icon
                name={state.playing ? 'pause' : 'play'}
                className={styles.btnGlyph}
              />
              <span>
                {state.playing ? 'Pausa' : atEnd ? 'Riavvia' : 'Esegui'}
              </span>
            </button>
          )}
          {advanced ? (
            <IconBtn
              icon="forward-step"
              label="Avanti"
              onClick={() => dispatch({ type: 'FWD' })}
              disabled={atEnd}
            />
          ) : (
            // Studio: senza «Esegui», l'avanzamento passo-passo è l'azione
            // principale → bottone esteso e colorato come la primaria.
            <button
              type="button"
              className={`${styles.btn} ${styles.btnPrimary} ${styles.btnWide}`}
              onClick={() => dispatch({ type: 'FWD' })}
              disabled={atEnd}
            >
              <Icon name="forward-step" className={styles.btnGlyph} />
              <span>Step</span>
            </button>
          )}

          {advanced && (
            <>
              <span className={styles.spacer} />

              <div
                className={styles.speeds}
                style={{ '--spd-idx': state.speedIdx } as CSSProperties}
              >
                <span className={styles.speedThumb} aria-hidden="true" />
                {SPEEDS.map((sp, i) => (
                  <button
                    key={sp}
                    type="button"
                    className={`${styles.speedPill} ${
                      i === state.speedIdx ? styles.speedPillOn : ''
                    }`}
                    onClick={() => dispatch({ type: 'SET_SPEED', idx: i })}
                    aria-pressed={i === state.speedIdx}
                  >
                    {sp}×
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

interface IconBtnProps {
  icon: IconName;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

function IconBtn({ icon, label, onClick, disabled }: IconBtnProps) {
  return (
    <button
      type="button"
      className={`${styles.btn} ${styles.btnIcon}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      <Icon name={icon} className={styles.btnGlyph} />
    </button>
  );
}
