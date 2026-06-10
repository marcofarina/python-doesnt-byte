import clsx from 'clsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faDatabase } from '@fortawesome/free-solid-svg-icons';
import pyStyles from '../PyRunner/styles.module.css';
import styles from './styles.module.css';
import { ResultTable } from './ResultTable';
import type { RunStatus, SqlRunOutcome } from './types';

export interface SqlOutputProps {
  status: RunStatus;
  outcome: SqlRunOutcome | null;
  error: string | null;
  /** Notice "database ripristinato" (stateful dopo un terminate). */
  restoredNotice: boolean;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

export function Output({
  status,
  outcome,
  error,
  restoredNotice,
}: SqlOutputProps) {
  const statusLabel = (() => {
    switch (status) {
      case 'idle':
        return 'In attesa';
      case 'running':
        return 'In esecuzione…';
      case 'done':
        return outcome
          ? `Completato in ${formatDuration(outcome.durationMs)}`
          : 'Completato';
      case 'error':
        return 'Errore';
    }
  })();

  const hasContent = status !== 'idle';
  const hasResults = (outcome?.results.length ?? 0) > 0;
  const showRowsModified =
    status === 'done' && outcome != null && outcome.rowsModified > 0;

  return (
    <div className={clsx(pyStyles.output, !hasContent && pyStyles.outputEmpty)}>
      <div className={pyStyles.outputHeader}>
        <span
          className={clsx(pyStyles.statusDot, pyStyles[`statusDot_${status}`])}
        />
        <span className={pyStyles.statusLabel}>{statusLabel}</span>
      </div>
      <div className={clsx(pyStyles.outputBody, styles.sqlOutputBody)}>
        {status === 'idle' && (
          <span className={pyStyles.outputPlaceholder}>
            Premi{' '}
            <span className={pyStyles.placeholderChip}>
              <FontAwesomeIcon icon={faPlay} />
              Esegui
            </span>{' '}
            per interrogare il database.
          </span>
        )}
        {restoredNotice && (
          <div className={styles.restoredNotice}>
            <FontAwesomeIcon icon={faDatabase} />
            Il database è stato ripristinato allo stato iniziale.
          </div>
        )}
        {error != null && <pre className={styles.sqlError}>{error}</pre>}
        {hasResults &&
          outcome!.results.map((result, i) => (
            <ResultTable key={i} result={result} />
          ))}
        {showRowsModified && (
          <div className={styles.rowsModified}>
            {outcome!.rowsModified === 1
              ? '1 riga modificata.'
              : `${outcome!.rowsModified} righe modificate.`}
          </div>
        )}
        {status === 'done' && !hasResults && !showRowsModified && (
          <span className={pyStyles.outputPlaceholder}>
            Nessun risultato da mostrare.
          </span>
        )}
      </div>
    </div>
  );
}
