/**
 * GamePlayer — transport della trace PyQuest (riferimento diretto:
 * src/components/Algorithm/Player.tsx, reducer e azioni identici).
 *
 * Riceve la trace completa di eventi (il motore è sincrono: arriva in ms) e
 * deriva la scena al passo corrente con slice + reduce. Differenza voluta da
 * Algorithm: al termine del run parte l'autoplay da passo 0 (lo studente ha
 * premuto Esegui: vuole vedere il film) — il genitore lo segnala incrementando
 * `playKey`.
 *
 * La durata delle transizioni della scena è iniettata come `--pq-dur`
 * (DUR_MS[speedIdx]); la console mostra solo le righe di log con
 * `atStep <= passo corrente` (sincronizzazione print/traceback ↔ animazione).
 */

import {
  useEffect,
  useMemo,
  useReducer,
  useState,
  type CSSProperties,
} from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlay,
  faPause,
  faForwardStep,
  faBackwardStep,
  faRotateLeft,
} from '@fortawesome/free-solid-svg-icons';
import clsx from 'clsx';
import GameScene from './GameScene';
import { applyGameEvent, initScene } from './applyEvent';
import type { GameEvent, LevelDef, LogLine } from './types';
import styles from './GamePlayer.module.css';

const SPEEDS = [0.5, 1, 2, 4];
const TICK_MS = [700, 400, 220, 120];
const DUR_MS = [520, 320, 180, 100];
const DEFAULT_SPEED_IDX = 1;

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

export interface GamePlayerProps {
  level: LevelDef;
  character: string;
  events: GameEvent[];
  logs: LogLine[];
  /** Incrementato dal genitore a ogni run: riparte da passo 0 in autoplay. */
  playKey: number;
  /** Notifica il passo corrente (il genitore vi deriva la fine animazione). */
  onStepChange?: (step: number, total: number) => void;
}

export default function GamePlayer({
  level,
  character,
  events,
  logs,
  playKey,
  onStepChange,
}: GamePlayerProps) {
  const total = events.length;

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
    { stepIndex: 0, playing: false, speedIdx: DEFAULT_SPEED_IDX },
  );

  // Nuovo run: autoplay dal passo 0 (velocità conservata). Il reset avviene IN
  // RENDER (pattern «adjust state during render»), non in un effect: con
  // l'effect, al re-run il cursore stantio del run precedente (già a fine
  // trace) veniva notificato via onStepChange prima del reset e il genitore
  // chiudeva subito l'animazione (pannello esito visibile per tutto il replay).
  const [prevPlayKey, setPrevPlayKey] = useState(playKey);
  if (prevPlayKey !== playKey) {
    setPrevPlayKey(playKey);
    dispatch({ type: 'RESET' });
    dispatch({ type: 'TOGGLE_PLAY' });
  }

  // Autoplay.
  useEffect(() => {
    if (!state.playing) return undefined;
    const id = setTimeout(
      () => dispatch({ type: 'FWD' }),
      TICK_MS[state.speedIdx],
    );
    return () => clearTimeout(id);
  }, [state.playing, state.stepIndex, state.speedIdx]);

  // Trace nuova più corta del cursore (run rieseguito): clamp in render.
  const stepIndex = Math.min(state.stepIndex, total);

  const scene = useMemo(
    () => events.slice(0, stepIndex).reduce(applyGameEvent, initScene(level)),
    [events, stepIndex, level],
  );

  useEffect(() => {
    onStepChange?.(stepIndex, total);
  }, [stepIndex, total, onStepChange]);

  const atStart = stepIndex === 0;
  const atEnd = stepIndex >= total;
  const visibleLogs = logs.filter((l) => l.atStep <= stepIndex);

  const durStyle = {
    '--pq-dur': `${DUR_MS[state.speedIdx]}ms`,
  } as CSSProperties;

  return (
    <div className={styles.player} style={durStyle}>
      <GameScene
        level={level}
        character={character}
        scene={scene}
        fxKey={stepIndex}
      />

      <div className={styles.scrub}>
        <input
          className={styles.scrubInput}
          type="range"
          min={0}
          max={total}
          value={stepIndex}
          disabled={total === 0}
          aria-label="Posizione nella sequenza"
          onChange={(e) =>
            dispatch({ type: 'SEEK', to: Number(e.target.value) })
          }
        />
        <span className={styles.counter}>
          {stepIndex} / {total}
        </span>
      </div>

      <div className={styles.controls}>
        <button
          type="button"
          className={styles.btn}
          onClick={() => dispatch({ type: 'RESET' })}
          disabled={atStart}
          aria-label="Torna all’inizio"
          title="Torna all’inizio"
        >
          <FontAwesomeIcon icon={faRotateLeft} />
        </button>
        <button
          type="button"
          className={styles.btn}
          onClick={() => dispatch({ type: 'BACK' })}
          disabled={atStart}
          aria-label="Passo indietro"
          title="Passo indietro"
        >
          <FontAwesomeIcon icon={faBackwardStep} />
        </button>
        <button
          type="button"
          className={clsx(styles.btn, styles.playBtn)}
          onClick={() => dispatch({ type: 'TOGGLE_PLAY' })}
          disabled={total === 0}
          aria-label={state.playing ? 'Pausa' : 'Riproduci'}
          title={state.playing ? 'Pausa' : 'Riproduci'}
        >
          <FontAwesomeIcon icon={state.playing ? faPause : faPlay} />
        </button>
        <button
          type="button"
          className={styles.btn}
          onClick={() => dispatch({ type: 'FWD' })}
          disabled={atEnd}
          aria-label="Passo avanti"
          title="Passo avanti"
        >
          <FontAwesomeIcon icon={faForwardStep} />
        </button>

        <div className={styles.speed} role="group" aria-label="Velocità">
          {SPEEDS.map((sp, i) => (
            <button
              key={sp}
              type="button"
              className={clsx(
                styles.speedBtn,
                i === state.speedIdx && styles.speedActive,
              )}
              onClick={() => dispatch({ type: 'SET_SPEED', idx: i })}
              aria-pressed={i === state.speedIdx}
            >
              {String(sp).replace('.', ',')}×
            </button>
          ))}
        </div>
      </div>

      {visibleLogs.length > 0 && (
        <pre className={styles.console} aria-live="polite">
          {visibleLogs.map((l, i) => (
            <span
              key={i}
              className={l.kind === 'stderr' ? styles.stderr : undefined}
            >
              {l.text}
            </span>
          ))}
        </pre>
      )}
    </div>
  );
}
