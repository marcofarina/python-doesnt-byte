import { useCallback, useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlay,
  faRotateLeft,
  faStop,
  faExpand,
  faWandMagicSparkles,
} from '@fortawesome/free-solid-svg-icons';
import clsx from 'clsx';
import IconCopy from '@theme/Icon/Copy';
import IconSuccess from '@theme/Icon/Success';
import styles from './styles.module.css';
import type { RunStatus } from './types';

async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const { default: copy } = await import('copy-text-to-clipboard');
  copy(text);
}

function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const handleClick = useCallback(() => {
    copyToClipboard(code).then(() => {
      setCopied(true);
      timer.current = window.setTimeout(() => setCopied(false), 1000);
    });
  }, [code]);
  return (
    <button
      type="button"
      className={clsx(
        styles.iconBtn,
        styles.copyBtn,
        copied && styles.copyBtnCopied,
      )}
      onClick={handleClick}
      aria-label={copied ? 'Codice copiato' : 'Copia il codice'}
      title="Copia il codice"
    >
      <span className={styles.copyBtnIcons} aria-hidden="true">
        <IconCopy className={styles.copyBtnIcon} />
        <IconSuccess className={styles.copyBtnSuccess} />
      </span>
    </button>
  );
}

export interface ToolbarProps {
  title?: string;
  status: RunStatus;
  hasEdits: boolean;
  code: string;
  onRun: () => void;
  onReset: () => void;
  showFullscreen?: boolean;
  onFullscreen?: () => void;
  showExplain?: boolean;
  onExplain?: () => void;
}

export function Toolbar({
  title,
  status,
  hasEdits,
  code,
  onRun,
  onReset,
  showFullscreen,
  onFullscreen,
  showExplain,
  onExplain,
}: ToolbarProps) {
  const isRunning = status === 'running';
  return (
    <div className={styles.toolbar}>
      <div className={styles.toolbarLeft}>
        <div className={styles.trafficLights} aria-hidden="true">
          <span className={clsx(styles.tlDot, styles.tlClose)} />
          <span className={clsx(styles.tlDot, styles.tlMin)} />
          <span className={clsx(styles.tlDot, styles.tlMax)} />
        </div>
        {title && <span className={styles.toolbarTitle}>{title}</span>}
      </div>
      <div className={styles.toolbarRight}>
        {showExplain && onExplain && (
          <button
            type="button"
            className={clsx(styles.iconBtn, styles.iconBtnExplain)}
            onClick={onExplain}
            aria-label="Spiegamelo facile (copia prompt)"
            title="Copia un prompt per chiedere a un’IA di spiegarti questo codice"
          >
            <FontAwesomeIcon icon={faWandMagicSparkles} />
          </button>
        )}
        {showFullscreen && onFullscreen && (
          <button
            type="button"
            className={clsx(styles.iconBtn, styles.iconBtnFs)}
            onClick={onFullscreen}
            aria-label="Apri a tutto schermo"
            title="Apri questo codice nel playground a tutto schermo"
          >
            <FontAwesomeIcon icon={faExpand} />
          </button>
        )}
        <CopyCodeButton code={code} />
        <button
          type="button"
          className={clsx(styles.iconBtn, styles.iconBtnReset)}
          onClick={onReset}
          disabled={!hasEdits || isRunning}
          aria-label="Ripristina codice originale"
          title="Ripristina codice originale"
        >
          <FontAwesomeIcon icon={faRotateLeft} />
        </button>
        <button
          type="button"
          className={clsx(styles.iconBtn, styles.iconBtnRun)}
          onClick={onRun}
          aria-label={isRunning ? 'Esecuzione in corso' : 'Esegui'}
          title={isRunning ? 'Esecuzione in corso' : 'Esegui (⌘/Ctrl+Invio)'}
        >
          <FontAwesomeIcon icon={isRunning ? faStop : faPlay} />
          <span className={styles.iconBtnLabel}>
            {isRunning ? 'In corso' : 'Esegui'}
          </span>
        </button>
      </div>
    </div>
  );
}
