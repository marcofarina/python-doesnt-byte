import { type Dispatch } from 'react';
import Icon, { type IconName } from './Icon';
import type { AlgorithmMode } from './types';
import type { PlayerAction } from './Player';
import styles from './styles.module.css';

interface ControlsProps {
  mode: AlgorithmMode;
  stepIndex: number;
  total: number;
  playing: boolean;
  speedLabel: string;
  showRegenerate: boolean;
  onRegenerate?: () => void;
  dispatch: Dispatch<PlayerAction>;
}

interface BtnProps {
  icon: IconName;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
  /** Solo icona (label come aria-label, non visibile). */
  iconOnly?: boolean;
}

function Btn({ icon, label, onClick, disabled, primary, iconOnly }: BtnProps) {
  return (
    <button
      type="button"
      className={`${styles.btn} ${primary ? styles.btnPrimary : ''} ${
        iconOnly ? styles.btnIcon : ''
      }`}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
    >
      <Icon name={icon} className={styles.btnGlyph} />
      {!iconOnly && <span>{label}</span>}
    </button>
  );
}

export default function Controls({
  mode,
  stepIndex,
  total,
  playing,
  speedLabel,
  showRegenerate,
  onRegenerate,
  dispatch,
}: ControlsProps) {
  const atStart = stepIndex === 0;
  const atEnd = stepIndex >= total;

  return (
    <div className={styles.controls}>
      <div className={styles.controlsLeft}>
        <Btn
          icon="rotate-left"
          label="Reset"
          onClick={() => dispatch({ type: 'RESET' })}
          disabled={atStart}
          iconOnly
        />
        {mode === 'study' && (
          <Btn
            icon="backward-step"
            label="Indietro"
            onClick={() => dispatch({ type: 'BACK' })}
            disabled={atStart}
            iconOnly
          />
        )}

        {mode === 'lab' && showRegenerate && onRegenerate && (
          <Btn icon="shuffle" label="Rigenera" onClick={onRegenerate} />
        )}

        {mode === 'lab' && (
          <button
            type="button"
            className={styles.speedChip}
            onClick={() => dispatch({ type: 'CYCLE_SPEED' })}
            aria-label="Velocità di riproduzione"
          >
            {speedLabel}
          </button>
        )}

        <Btn
          icon="forward-step"
          label="Avanti"
          onClick={() => dispatch({ type: 'FWD' })}
          disabled={atEnd}
          primary={mode === 'study'}
        />

        {mode === 'lab' && (
          <Btn
            icon={playing ? 'pause' : 'forward-fast'}
            label={playing ? 'Pausa' : 'Auto'}
            onClick={() => dispatch({ type: 'TOGGLE_PLAY' })}
            primary
          />
        )}
      </div>

      <div className={styles.stepIndicator}>
        passo {stepIndex} di {total}
      </div>
    </div>
  );
}
