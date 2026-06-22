/**
 * ExerciseLink — card-link da usare nelle lezioni (volumi 1–3) per elencare gli
 * esercizi assegnati, che vivono nel Volume 4 (Biblioteca dell'Apprendista).
 *
 * Il riferimento è SEMPRE un identificatore on-site: `to` è il path del sito
 * (senza baseUrl, lo aggiunge Docusaurus), es.
 *   /apprendista/programmatore/le-basi/le-variabili/calcola-la-media
 * Mai riferimenti interni esterni al sito (niente paideia_id o simili).
 */
import React, { type ReactNode } from 'react';
import Link from '@docusaurus/Link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import styles from './styles.module.css';

type Difficulty = 'facile' | 'medio' | 'difficile';

interface ExerciseLinkProps {
  /** Path on-site dell'esercizio (senza baseUrl). Es. `/apprendista/...`. */
  to: string;
  /** Difficoltà, opzionale: mostra un chip colorato. */
  difficulty?: Difficulty;
  /** Tempo stimato, opzionale. Es. `20 min`. */
  time?: string;
  /** Titolo dell'esercizio. */
  children: ReactNode;
}

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  facile: 'Facile',
  medio: 'Medio',
  difficile: 'Difficile',
};

export default function ExerciseLink({
  to,
  difficulty,
  time,
  children,
}: ExerciseLinkProps): ReactNode {
  return (
    <Link to={to} className={styles.card}>
      <FontAwesomeIcon
        icon={['fas', 'dumbbell']}
        className={styles.icon}
        aria-hidden="true"
      />
      <span className={styles.body}>
        <span className={styles.title}>{children}</span>
        {(difficulty || time) && (
          <span className={styles.meta}>
            {difficulty && (
              <span className={styles.chip} data-difficulty={difficulty}>
                {DIFFICULTY_LABEL[difficulty]}
              </span>
            )}
            {time && (
              <span className={styles.time}>
                <FontAwesomeIcon icon={['fas', 'clock']} aria-hidden="true" />{' '}
                {time}
              </span>
            )}
          </span>
        )}
      </span>
      <FontAwesomeIcon
        icon={['fas', 'arrow-right']}
        className={styles.arrow}
        aria-hidden="true"
      />
    </Link>
  );
}
