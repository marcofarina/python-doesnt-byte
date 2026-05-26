import { useEffect, useRef } from 'react';
import clsx from 'clsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay } from '@fortawesome/free-solid-svg-icons';
import styles from './styles.module.css';
import type { LogEntry, RunStatus } from './types';

export interface OutputProps {
  logs: LogEntry[];
  status: RunStatus;
  durationMs?: number | null;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

export function Output({ logs, status, durationMs }: OutputProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs.length]);

  const statusLabel = (() => {
    switch (status) {
      case 'idle':
        return 'In attesa';
      case 'running':
        return 'In esecuzione…';
      case 'done':
        return durationMs != null
          ? `Completato in ${formatDuration(durationMs)}`
          : 'Completato';
      case 'error':
        return 'Errore';
    }
  })();

  const hasContent = logs.length > 0 || status !== 'idle';

  return (
    <div className={clsx(styles.output, !hasContent && styles.outputEmpty)}>
      <div className={styles.outputHeader}>
        <span
          className={clsx(styles.statusDot, styles[`statusDot_${status}`])}
        />
        <span className={styles.statusLabel}>{statusLabel}</span>
      </div>
      <div ref={scrollRef} className={styles.outputBody}>
        {logs.length === 0 && status === 'idle' && (
          <span className={styles.outputPlaceholder}>
            Premi{' '}
            <span className={styles.placeholderChip}>
              <FontAwesomeIcon icon={faPlay} />
              Esegui
            </span>{' '}
            per vedere il risultato.
          </span>
        )}
        {logs.map((log, i) => (
          <span
            key={i}
            className={clsx(
              styles.outputLine,
              log.kind === 'stderr' && styles.outputLineErr,
            )}
          >
            {log.text}
          </span>
        ))}
      </div>
    </div>
  );
}
