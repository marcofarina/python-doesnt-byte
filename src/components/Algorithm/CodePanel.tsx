import { useCallback, useEffect, useRef, useState } from 'react';
import { highlightPy } from './highlightPy';
import Icon from './Icon';
import styles from './styles.module.css';

interface CodePanelProps {
  code: string[];
  activeLine: number | null;
  comparisons: number;
  swaps: number;
  showStats: boolean;
  /** I sort mostrano Confronti+Scambi; le ricerche solo Confronti. */
  withSwaps: boolean;
}

/** Copia negli appunti con fallback per i contesti senza Clipboard API. */
async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const { default: copy } = await import('copy-text-to-clipboard');
  if (!copy(text)) throw new Error('copia non riuscita');
}

export default function CodePanel({
  code,
  activeLine,
  comparisons,
  swaps,
  showStats,
  withSwaps,
}: CodePanelProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const onCopy = useCallback(() => {
    copyToClipboard(code.join('\n'))
      .then(() => {
        setCopied(true);
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setCopied(false), 1000);
      })
      .catch(() => {
        /* copia non riuscita: nessun feedback positivo */
      });
  }, [code]);

  return (
    <div className={styles.codeGrid} data-stats={showStats ? 'on' : 'off'}>
      <div className={styles.codeCol}>
        <div className={styles.codeHead}>
          <span className={styles.codeLabel}>Pseudocodice · Python</span>
          <button
            type="button"
            className={`${styles.copyBtn} ${copied ? styles.copyBtnDone : ''}`}
            onClick={onCopy}
            aria-label={copied ? 'Codice copiato' : 'Copia il codice'}
            title={copied ? 'Copiato' : 'Copia il codice'}
          >
            <span className={styles.copyBtnIcons} aria-hidden="true">
              <Icon name="copy" className={styles.copyBtnIcon} />
              <Icon name="check" className={styles.copyBtnCheck} />
            </span>
          </button>
        </div>
        <div className={styles.code}>
          {code.map((line, li) => {
            const on = activeLine === li;
            return (
              <div
                key={li}
                className={`${styles.codeLine} ${on ? styles.codeLineOn : ''}`}
              >
                <span className={styles.codeNum}>{li + 1}</span>
                <span className={styles.codeText}>{highlightPy(line)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {showStats && (
        <div className={styles.stats}>
          <div className={styles.stat}>
            <div className={styles.statLabel}>Confronti</div>
            <div className={styles.statValue}>{comparisons}</div>
          </div>
          {withSwaps && (
            <div className={styles.stat}>
              <div className={styles.statLabel}>Scambi</div>
              <div className={styles.statValue}>{swaps}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
