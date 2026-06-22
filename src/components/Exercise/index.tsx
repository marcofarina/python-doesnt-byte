/**
 * Componenti per le pagine-esercizio del Volume 4 (Biblioteca dell'Apprendista).
 *
 * Modello IBRIDO: una lezione con soli esercizi rapidi è una pagina singola;
 * se ha anche esercizi dedicati / laboratori diventa una cartella con una pagina
 * per tipo. Ogni pagina dichiara la sua provenienza con <LessonMeta>.
 *
 *   <LessonMeta kind="…" ... />   card compatta (badge tipo + provenienza + teoria)
 *   <Exercise n="10.2" title="…">…</Exercise>   un esercizietto (nelle pagine batch)
 *   <Solution>```py live readonly … ```</Solution>   soluzione (PyRunner non editabile)
 *
 * Numerazione: id interno volume.capitolo.lezione.esercizio (es. 1.3.10.2).
 * A video l'esercizio mostra la forma corta lezione.esercizio (es. 10.2).
 * Tutti i riferimenti sono identificatori on-site (path/permalink), mai esterni.
 */
import { type ReactNode } from 'react';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import Icon, { type IconName } from '@site/src/components/Icon';

import styles from './styles.module.css';

// ─── LessonMeta ──────────────────────────────────────────────────────────────

interface TheoryRef {
  /** path on-site della lezione */
  to: string;
  label: string;
}

/**
 * Tipo di pagina-esercizio:
 *   rapidi      → batch di esercizietti «a batteria» (più <Exercise> in pagina)
 *   esercizio   → un esercizio completo, pagina dedicata
 *   laboratorio → laboratorio/progetto, pagina dedicata
 */
type ExerciseKind = 'rapidi' | 'esercizio' | 'laboratorio';

const KIND: Record<ExerciseKind, { label: string; icon: IconName }> = {
  rapidi: { label: 'Esercizi rapidi', icon: 'dumbbell' },
  esercizio: { label: 'Esercizio', icon: 'pen' },
  laboratorio: { label: 'Laboratorio', icon: 'flask' },
};

interface LessonMetaProps {
  /** Tipo di pagina: mostra un badge con icona. */
  kind?: ExerciseKind;
  /**
   * Numero dell'esercizio (forma corta lezione.esercizio, es. «11.3»), per le
   * pagine a esercizio singolo / laboratorio. Sui batch si usa <Exercise n="…">.
   */
  n?: string;
  /** Path on-site della lezione che assegna gli esercizi. */
  lessonTo: string;
  /** Nome della lezione (link alla teoria). */
  lessonLabel: string;
  /** Volume di provenienza, es. «Manuale del Programmatore». */
  volume: string;
  /** Capitolo di provenienza, es. «Le basi». */
  chapter: string;
  /** Id interno della lezione, es. «1.3.10». Mostrato come badge discreto. */
  lessonId?: string;
  /** Lezioni che danno teoria supplementare. */
  theory?: TheoryRef[];
}

export function LessonMeta({
  kind = 'rapidi',
  n,
  lessonTo,
  lessonLabel,
  volume,
  chapter,
  lessonId,
  theory = [],
}: LessonMetaProps): ReactNode {
  const k = KIND[kind];
  const section = n ?? lessonId;
  return (
    <aside
      className={styles.card}
      data-kind={kind}
      aria-label="Provenienza dell'esercizio"
    >
      <div className={styles.inner}>
        {/* ancora: icona grande a tutta altezza + tipo/numero impilati */}
        <div className={styles.anchor}>
          <span className={styles.iconTile}>
            <Icon name={k.icon} size={28} />
          </span>
          <div className={styles.anchorText}>
            <span className={styles.typeLabel}>{k.label}</span>
            {section && <span className={styles.section}>{section}</span>}
          </div>
        </div>

        {/* meta: assegnato in / teoria */}
        <div className={styles.meta}>
          <div className={styles.row}>
            <span className={styles.label}>
              <Icon name="thumbtack" size={13} color="var(--c-accent-dim)" />
              Assegnato in
            </span>
            <span className={styles.crumbs}>
              <span>{volume}</span>
              <span className={styles.chevron} aria-hidden="true">
                ›
              </span>
              <span>{chapter}</span>
              <span className={styles.chevron} aria-hidden="true">
                ›
              </span>
              <Link to={lessonTo} className={styles.crumbLeaf}>
                {lessonLabel}
              </Link>
            </span>
          </div>

          {theory.length > 0 && (
            <>
              <div className={styles.divider} />
              <div className={styles.row}>
                <span className={styles.label}>
                  <Icon
                    name="book-open"
                    size={13}
                    color="var(--c-accent-dim)"
                  />
                  Teoria
                </span>
                <span className={styles.theory}>
                  {theory.map((t) => (
                    <Link key={t.to} to={t.to} className={styles.theoryLink}>
                      {t.label}
                    </Link>
                  ))}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}

// ─── Exercise ────────────────────────────────────────────────────────────────

interface ExerciseProps {
  /** Numero a video, forma corta lezione.esercizio, es. «10.2». */
  n: string;
  /** Titolo dell'esercizio, es. «Calcola la media». */
  title: string;
  children: ReactNode;
}

export function Exercise({ n, title, children }: ExerciseProps): ReactNode {
  const id = `esercizio-${n.replace(/\./g, '-')}`;
  return (
    <section className={styles.exercise}>
      <Heading as="h2" id={id} className={styles.exHeading}>
        <span className={styles.exNum}>{n}</span>
        <span className={styles.exTitle}>{title}</span>
      </Heading>
      {children}
    </section>
  );
}

// ─── Solution ────────────────────────────────────────────────────────────────

interface SolutionProps {
  /** Etichetta del disclosure. Default: «Mostra la soluzione». */
  label?: string;
  children: ReactNode;
}

export function Solution({
  label = 'Mostra la soluzione',
  children,
}: SolutionProps): ReactNode {
  return (
    <details className={styles.solution}>
      <summary className={styles.solutionSummary}>
        <Icon name="check" size={16} className={styles.solutionIcon} />
        <span>{label}</span>
      </summary>
      <div className={styles.solutionBody}>{children}</div>
    </details>
  );
}

export default Exercise;
