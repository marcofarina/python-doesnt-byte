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
import {
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
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

/** Millisecondi di pressione continua per rivelare la soluzione. */
const HOLD_MS = 3000;

interface SolutionProps {
  /** Etichetta principale (prominente). Default: «Soluzione». */
  label?: string;
  /** Riga di servizio (attenuata). Default: «tieni premuto per visualizzare». */
  hint?: string;
  children: ReactNode;
}

/**
 * Soluzione a rivelazione protetta: per evitare lo spoiler da misclick, il
 * corpo si apre solo dopo aver tenuto premuto il pulsante per {@link HOLD_MS}.
 * Feedback: una barra di avanzamento (nell'accento per-tipo della pagina)
 * riempie il pulsante e l'icona passa in cross-fade da faccina (a riposo) a
 * mano-che-preme (in pressione); al rilascio anticipato tutto torna indietro.
 * Una volta rivelata, il pulsante diventa un normale toggle apri/chiudi
 * (niente più rischio spoiler).
 *
 * Il progress è guidato da requestAnimationFrame scritto inline sull'elemento
 * (non da una transition CSS) così resta visibile anche con
 * `prefers-reduced-motion`, dove le transition globali sono azzerate.
 */
export function Solution({
  label = 'Soluzione',
  hint = 'tieni premuto per visualizzare',
  children,
}: SolutionProps): ReactNode {
  const [revealed, setRevealed] = useState(false);
  const [open, setOpen] = useState(false);
  const [holding, setHolding] = useState(false);

  const fillRef = useRef<HTMLSpanElement>(null);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef(0);
  // gesto di pressione in corso (da puntatore) + soppressione del click che
  // ogni gesto di puntatore emette al rilascio: senza, il click finale
  // richiuderebbe la soluzione appena rivelata dall'hold.
  const gestureRef = useRef(false);
  const suppressClickRef = useRef(false);

  const setFill = useCallback((p: number) => {
    if (fillRef.current) fillRef.current.style.transform = `scaleX(${p})`;
  }, []);

  const stopRaf = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const startHold = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>) => {
      // Già rivelata o tasto non primario: lascia che sia il click a gestire.
      if (revealed || e.button !== 0) return;
      e.preventDefault();
      gestureRef.current = true;
      setHolding(true);
      startRef.current = performance.now();
      // durante l'hold la barra segue il RAF fotogramma per fotogramma
      if (fillRef.current) fillRef.current.style.transition = 'none';
      stopRaf();
      const step = (now: number) => {
        const p = Math.min(1, (now - startRef.current) / HOLD_MS);
        setFill(p);
        if (p >= 1) {
          stopRaf();
          setRevealed(true);
          setOpen(true);
          return;
        }
        rafRef.current = requestAnimationFrame(step);
      };
      rafRef.current = requestAnimationFrame(step);
    },
    [revealed, stopRaf, setFill],
  );

  // fine di un gesto di puntatore (rilascio, uscita o annullamento)
  const endGesture = useCallback(() => {
    stopRaf();
    if (gestureRef.current) {
      gestureRef.current = false;
      suppressClickRef.current = true;
    }
    setHolding(false);
    // al rilascio la barra rientra con un breve ease (deterministico, inline)
    if (fillRef.current) {
      fillRef.current.style.transition = 'transform 160ms var(--ease-out)';
    }
    setFill(0);
  }, [stopRaf, setFill]);

  const onClick = useCallback(() => {
    // Sopprimi il click sintetico che segue ogni gesto di puntatore.
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    // Qui ci arriva solo l'attivazione da tastiera (Enter/Space) o il click su
    // soluzione già rivelata: la prima rivela, il secondo fa toggle.
    if (revealed) setOpen((v) => !v);
    else {
      setRevealed(true);
      setOpen(true);
    }
  }, [revealed]);

  useEffect(() => () => stopRaf(), [stopRaf]);

  return (
    <div
      className={styles.solution}
      data-revealed={revealed || undefined}
      data-holding={holding || undefined}
    >
      <button
        type="button"
        className={styles.solutionSummary}
        aria-expanded={open}
        onPointerDown={startHold}
        onPointerUp={endGesture}
        onPointerLeave={endGesture}
        onPointerCancel={endGesture}
        onClick={onClick}
      >
        <span
          ref={fillRef}
          className={styles.solutionFill}
          aria-hidden="true"
        />
        <span className={styles.solutionIconWrap} aria-hidden="true">
          <Icon
            name="face-awesome"
            size={18}
            className={`${styles.solutionIcon} ${styles.solutionIconRest}`}
          />
          <Icon
            name="hand-pointer"
            size={17}
            className={`${styles.solutionIcon} ${styles.solutionIconHold}`}
          />
        </span>
        <span className={styles.solutionLabels}>
          <span className={styles.solutionLabel}>{label}</span>
          {!revealed && <span className={styles.solutionHint}>{hint}</span>}
        </span>
        {revealed && (
          <Icon
            name="arrow-right"
            size={13}
            className={styles.solutionChevron}
            aria-hidden="true"
          />
        )}
      </button>
      {open && <div className={styles.solutionBody}>{children}</div>}
    </div>
  );
}

export default Exercise;
