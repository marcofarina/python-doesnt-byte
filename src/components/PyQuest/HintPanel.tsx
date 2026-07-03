/**
 * HintPanel — suggerimenti progressivi di un livello PyQuest (spec step 15).
 *
 * Rivela gli hint uno alla volta (concettuale → direzionale → quasi-soluzione).
 * Lo stato è **in memoria** (non persistito): riaprendo la pagina si riparte da
 * zero suggerimenti, così lo studente prova prima con la testa.
 */

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLightbulb } from '@fortawesome/free-solid-svg-icons';
import styles from './PyQuest.module.css';

export interface HintPanelProps {
  hints: string[];
}

export default function HintPanel({ hints }: HintPanelProps) {
  const [revealed, setRevealed] = useState(0);
  if (hints.length === 0) return null;

  const allRevealed = revealed >= hints.length;

  return (
    <div className={styles.hints}>
      {revealed > 0 && (
        <ol className={styles.hintList}>
          {hints.slice(0, revealed).map((hint, i) => (
            <li key={i}>{hint}</li>
          ))}
        </ol>
      )}
      {!allRevealed && (
        <button
          type="button"
          className={styles.hintBtn}
          onClick={() => setRevealed((r) => r + 1)}
        >
          <FontAwesomeIcon icon={faLightbulb} />
          <span>
            {revealed === 0 ? 'Suggerimento' : 'Un altro aiuto'} ({revealed + 1}
            /{hints.length})
          </span>
        </button>
      )}
    </div>
  );
}
