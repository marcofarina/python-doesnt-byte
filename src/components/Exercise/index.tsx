/**
 * Componenti per le pagine-esercizio del Volume 4 (Biblioteca dell'Apprendista).
 *
 * Modello IBRIDO: una lezione con soli esercizi rapidi è una pagina singola;
 * se ha anche esercizi dedicati / laboratori diventa una cartella con una pagina
 * per tipo. La provenienza è dichiarata nel FRONTMATTER (assigned_in/theory) e la
 * card <LessonMeta> è DERIVATA + auto-iniettata dallo swizzle DocItem/Content.
 *
 *   <LessonMeta />   card compatta derivata dal global data (badge + provenienza)
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
import { usePluginData } from '@docusaurus/useGlobalData';
import { useDoc, useAllDocsData } from '@docusaurus/plugin-content-docs/client';
import Icon, { type IconName } from '@site/src/components/Icon';
import {
  resolvePermalink,
  volumeLabel,
  type ExerciseGraphData,
  type ExerciseKind,
  type LessonRef,
} from '@site/src/lib/docResolve';

import styles from './styles.module.css';

// ─── LessonMeta ──────────────────────────────────────────────────────────────

/**
 * Card di provenienza dell'esercizio. È DERIVATA: legge il record dal global
 * data del plugin `exercise-graph` (chiave = docId della pagina corrente) e ne
 * risolve i permalink. Non prende props — viene auto-iniettata dallo swizzle
 * DocItem/Content. Render `null` se la pagina non è un esercizio noto.
 *
 * Tipo di pagina-esercizio (badge):
 *   rapidi      → batch di esercizietti «a batteria» (più <Exercise> in pagina)
 *   esercizio   → un esercizio completo, pagina dedicata
 *   laboratorio → laboratorio/progetto, pagina dedicata
 *
 * NB: il «capitolo» della lezione-sorgente non è derivabile a build-time
 * (volumi flat, capitoli solo nelle sidebar) → la crumb è «Volume › Lezione».
 */
const KIND: Record<ExerciseKind, { label: string; icon: IconName }> = {
  rapidi: { label: 'Esercizi rapidi', icon: 'dumbbell' },
  esercizio: { label: 'Esercizio', icon: 'pen' },
  laboratorio: { label: 'Laboratorio', icon: 'flask' },
};

export function LessonMeta(): ReactNode {
  const data = usePluginData('exercise-graph') as ExerciseGraphData | undefined;
  const allData = useAllDocsData();
  const { metadata } = useDoc();
  const record = data?.exercises?.[metadata.id];
  if (!record) return null;

  const k = KIND[record.kind] ?? KIND.rapidi;
  const section = record.n ?? record.lessonId;
  const lessonTo = resolvePermalink(
    allData,
    record.assignedIn.volume,
    record.assignedIn.docId,
  );

  const theory = record.theory
    .map((t: LessonRef) => ({
      to: resolvePermalink(allData, t.volume, t.docId),
      label: t.title,
    }))
    .filter((t): t is { to: string; label: string } => t.to !== null);

  return (
    <aside
      className={styles.card}
      data-kind={record.kind}
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
              <span>{volumeLabel(record.assignedIn.volume)}</span>
              <span className={styles.chevron} aria-hidden="true">
                ›
              </span>
              {lessonTo ? (
                <Link to={lessonTo} className={styles.crumbLeaf}>
                  {record.assignedIn.title}
                </Link>
              ) : (
                <span className={styles.crumbLeaf}>
                  {record.assignedIn.title}
                </span>
              )}
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
