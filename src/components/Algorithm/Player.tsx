import { useEffect, useMemo, useReducer, type CSSProperties } from 'react';
import type { ArrayTrace, AlgorithmMode } from './types';
import { applyArrayStep, initArrayState } from './applyStep';
import ArrayScene from './ArrayScene';
import Controls from './Controls';
import Explanation from './Explanation';
import styles from './styles.module.css';

const TICK_MS = [1400, 800, 450, 220];
const DUR_MS = [400, 300, 220, 140];
const SPEED_LABELS = ['×½', '×1', '×2', '×4'];

interface PlayerProps {
  trace: ArrayTrace;
  mode: AlgorithmMode;
  /** Nome algoritmo per aria-label. */
  label: string;
  showRegenerate: boolean;
  onRegenerate?: () => void;
  /** 0..3, default 1. */
  initialSpeedIdx: number;
}

interface PlayerState {
  stepIndex: number;
  playing: boolean;
  speedIdx: number;
}

export type PlayerAction =
  | { type: 'FWD' }
  | { type: 'BACK' }
  | { type: 'RESET' }
  | { type: 'TOGGLE_PLAY' }
  | { type: 'CYCLE_SPEED' };

export default function Player({
  trace,
  mode,
  label,
  showRegenerate,
  onRegenerate,
  initialSpeedIdx,
}: PlayerProps) {
  const total = trace.steps.length;

  const [state, dispatch] = useReducer(
    (s: PlayerState, action: PlayerAction): PlayerState => {
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
        case 'CYCLE_SPEED':
          // cicla 1→2→3→1; lo 0 (×½) è raggiungibile solo da prop.
          return { ...s, speedIdx: s.speedIdx === 3 ? 1 : s.speedIdx + 1 };
        default:
          return s;
      }
    },
    { stepIndex: 0, playing: false, speedIdx: initialSpeedIdx },
  );

  // Autoplay: avanza dopo TICK_MS; cleanup al cambio di stepIndex/playing/speedIdx.
  useEffect(() => {
    if (!state.playing) return undefined;
    const id = setTimeout(
      () => dispatch({ type: 'FWD' }),
      TICK_MS[state.speedIdx],
    );
    return () => clearTimeout(id);
  }, [state.playing, state.stepIndex, state.speedIdx]);

  // Stato scena: ricalcolo dall'inizio (ok per n piccoli).
  const sceneState = useMemo(
    () =>
      trace.steps
        .slice(0, state.stepIndex)
        .reduce(applyArrayStep, initArrayState(trace)),
    [trace, state.stepIndex],
  );

  const durStyle = {
    '--alg-dur': `${DUR_MS[state.speedIdx]}ms`,
  } as CSSProperties;

  const progress = total > 0 ? (state.stepIndex / total) * 100 : 0;

  return (
    <>
      <div className={styles.body}>
        <div className={styles.sceneWrap} style={durStyle}>
          <ArrayScene state={sceneState} target={trace.target} label={label} />
        </div>
        {mode === 'study' && (
          <Explanation
            phase={sceneState.phase}
            note={sceneState.note}
            outcome={sceneState.outcome}
          />
        )}
      </div>
      <div className={styles.footer}>
        <div
          className={styles.progress}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={state.stepIndex}
        >
          <div
            className={styles.progressFill}
            style={{ width: `${progress}%` }}
          />
        </div>
        <Controls
          mode={mode}
          stepIndex={state.stepIndex}
          total={total}
          playing={state.playing}
          speedLabel={SPEED_LABELS[state.speedIdx]}
          showRegenerate={showRegenerate}
          onRegenerate={onRegenerate}
          dispatch={dispatch}
        />
      </div>
    </>
  );
}
