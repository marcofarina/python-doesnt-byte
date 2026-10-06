/**
 * Esercizio verificato: un runner il cui codice viene controllato a ogni
 * esecuzione, con suggerimenti progressivi, un commento per chi risolve e
 * una soluzione da consultare.
 *
 *   <Challenge>
 *
 *   ```py live
 *   codice di partenza dello studente
 *   ### POST
 *   assert contiene("Piton"), "messaggio mirato per lo studente"
 *   ```
 *
 *   <Hint>primo suggerimento</Hint>
 *   <Hint>secondo suggerimento</Hint>
 *   <Solved>commento che legge solo chi ha risolto</Solved>
 *   <Answer>codice della soluzione e spiegazione</Answer>
 *
 *   </Challenge>
 *
 * Il runner capisce di essere un esercizio da ChallengeContext: il suo
 * `### POST` diventa la verifica (helper in static/bry-libs/verifica.py) e
 * l'esito arriva qui con `pdb:runner-done` (contratto in runnerSignal.ts).
 * L'ordine dei figli nel sorgente non conta: <Hint>, <Solved> e <Answer> si
 * dispongono sempre sotto il runner, nella barra dell'esercizio.
 *
 * Suggerimenti, commento e soluzione non sono nel DOM finché non si sbloccano:
 * niente testo in chiaro nell'HTML statico, nella ricerca del sito o con
 * Cmd+F. In stampa compare tutto (evento `beforeprint`).
 */
import {
  Children,
  Fragment,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { flushSync } from 'react-dom';
import clsx from 'clsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBullseye,
  faCircleCheck,
  faCircleExclamation,
  faKey,
  faLightbulb,
  faLock,
  faTriangleExclamation,
  type IconDefinition,
} from '@fortawesome/free-solid-svg-icons';
import {
  ChallengeContext,
  RUNNER_DONE_EVENT,
  type RunnerDoneDetail,
} from '@site/src/theme/PyRunner/runnerSignal';
import styles from './styles.module.css';

// ─── Parti dell'esercizio ────────────────────────────────────────────────────

type PartRole = 'hint' | 'solved' | 'answer';

interface PartProps {
  children: ReactNode;
}

/**
 * Le parti non si rendono da sole: <Challenge> ne legge i figli e li mette al
 * loro posto. Usate fuori da un <Challenge> mostrano un avviso per l'autore,
 * mai il contenuto (che è una risposta).
 */
function makePart(role: PartRole, name: string) {
  function Part(_props: PartProps): ReactNode {
    return (
      <div className={styles.misplaced} role="note">
        {`<${name}> va dentro un <Challenge>: così da solo non si vede.`}
      </div>
    );
  }
  Part.displayName = name;
  // Si riconoscono dal ruolo, non dall'identità della funzione: regge anche
  // all'hot reload, che ricrea i componenti.
  return Object.assign(Part, { challengePart: role });
}

/** Un suggerimento: si sblocca dopo un tentativo non riuscito, uno alla volta. */
export const Hint = makePart('hint', 'Hint');
/** Commento per chi risolve: si apre da solo al primo esito «risolto». */
export const Solved = makePart('solved', 'Solved');
/** Soluzione (codice e spiegazione): consultabile dopo la prima esecuzione. */
export const Answer = makePart('answer', 'Answer');

function roleOf(child: ReactNode): PartRole | null {
  if (!isValidElement(child) || typeof child.type === 'string') return null;
  return (child.type as { challengePart?: PartRole }).challengePart ?? null;
}

/**
 * I figli di <Challenge>, con le parti portate in superficie: se l'autore
 * scrive due <Hint> su righe consecutive, MDX li avvolge in un paragrafo.
 */
function flattenParts(children: ReactNode): ReactNode[] {
  const out: ReactNode[] = [];
  // toArray, non forEach: dà una key a ogni figlio, che poi si rende in lista.
  Children.toArray(children).forEach((child) => {
    if (isValidElement(child) && roleOf(child) === null) {
      const inner = Children.toArray(
        (child.props as { children?: ReactNode }).children,
      ).filter((c) => !(typeof c === 'string' && c.trim() === ''));
      if (inner.length > 0 && inner.every((c) => roleOf(c) !== null)) {
        out.push(...inner);
        return;
      }
    }
    out.push(child);
  });
  return out;
}

/** Il contenuto di più <Solved> (o <Answer>) uno dopo l'altro. */
function keyed(parts: ReactNode[]): ReactNode {
  return parts.map((part, i) => (
    // L'ordine delle parti è fisso: l'indice è una key stabile.
    // eslint-disable-next-line react/no-array-index-key
    <Fragment key={i}>{part}</Fragment>
  ));
}

// ─── Stato visibile ──────────────────────────────────────────────────────────

type Tone = 'idle' | 'pending' | 'error' | 'success';

const GENERIC_NOT_YET = 'Il risultato non è quello che l’esercizio chiede.';

function describe(
  last: RunnerDoneDetail | null,
  solved: boolean,
): { tone: Tone; icon: IconDefinition; text: string } {
  if (solved) {
    if (!last || last.esito === 'risolto') {
      return { tone: 'success', icon: faCircleCheck, text: 'Risolto!' };
    }
    // Resta risolto anche se lo studente rompe il codice dopo: lo ha già
    // dimostrato. Ma l'ultima esecuzione gliela diciamo com'è.
    let why = 'non passa il controllo.';
    if (last.esito === 'errore') why = 'si è fermata con un errore.';
    else if (last.messaggio) why = `non passa il controllo. ${last.messaggio}`;
    return {
      tone: 'success',
      icon: faCircleCheck,
      text: `Risolto. L’ultima esecuzione però ${why}`,
    };
  }
  if (!last) {
    return {
      tone: 'idle',
      icon: faBullseye,
      text: 'Esercizio: quando esegui il codice, viene controllato.',
    };
  }
  if (last.esito === 'errore') {
    return {
      tone: 'error',
      icon: faTriangleExclamation,
      text: 'Il codice si è fermato con un errore: leggi il messaggio nell’output.',
    };
  }
  return {
    tone: 'pending',
    icon: faCircleExclamation,
    text: `Non ancora. ${last.messaggio ?? GENERIC_NOT_YET}`,
  };
}

// ─── Challenge ───────────────────────────────────────────────────────────────

interface ChallengeProps {
  children: ReactNode;
}

export default function Challenge({ children }: ChallengeProps): ReactNode {
  const hints: ReactNode[] = [];
  const solvedParts: ReactNode[] = [];
  const answerParts: ReactNode[] = [];
  const rest: ReactNode[] = [];
  flattenParts(children).forEach((child) => {
    const role = roleOf(child);
    const content = role
      ? (child as { props: PartProps }).props.children
      : null;
    if (role === 'hint') hints.push(content);
    else if (role === 'solved') solvedParts.push(content);
    else if (role === 'answer') answerParts.push(content);
    else rest.push(child);
  });

  const [attempts, setAttempts] = useState(0);
  const [failures, setFailures] = useState(0);
  const [solved, setSolved] = useState(false);
  const [last, setLast] = useState<RunnerDoneDetail | null>(null);
  const [hintsOpen, setHintsOpen] = useState(0);
  const [answerOpen, setAnswerOpen] = useState(false);
  const [printing, setPrinting] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const hintListRef = useRef<HTMLOListElement | null>(null);
  const focusHintRef = useRef(false);
  const answerId = useId();

  // L'evento del runner risale fin qui. Un runner dentro <Answer> o <Solved>
  // non è un esercizio (esito null) e non conta.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    let solvedOnce = false;
    const onDone = (event: Event) => {
      const detail = (event as CustomEvent<RunnerDoneDetail | null>).detail;
      if (!detail?.esito) return;
      setAttempts((n) => n + 1);
      setLast(detail);
      if (detail.esito === 'risolto') {
        solvedOnce = true;
        setSolved(true);
      } else if (!solvedOnce) {
        setFailures((n) => n + 1);
      }
    };
    root.addEventListener(RUNNER_DONE_EVENT, onDone);
    return () => root.removeEventListener(RUNNER_DONE_EVENT, onDone);
  }, []);

  // Su carta non si esegue niente: in stampa si vede tutto. flushSync perché
  // il browser impagina subito dopo `beforeprint`.
  useEffect(() => {
    const before = () => flushSync(() => setPrinting(true));
    const after = () => setPrinting(false);
    window.addEventListener('beforeprint', before);
    window.addEventListener('afterprint', after);
    return () => {
      window.removeEventListener('beforeprint', before);
      window.removeEventListener('afterprint', after);
    };
  }, []);

  // Il pulsante del suggerimento può sparire o disattivarsi dopo il clic: il
  // fuoco va sul suggerimento appena aperto, che così viene anche letto.
  useEffect(() => {
    if (!focusHintRef.current) return;
    focusHintRef.current = false;
    const items = hintListRef.current?.children;
    (items?.[items.length - 1] as HTMLElement | undefined)?.focus();
  }, [hintsOpen]);

  const unlocked = Math.min(failures, hints.length);
  const openHint = useCallback(() => {
    focusHintRef.current = true;
    setHintsOpen((n) => Math.min(n + 1, unlocked));
  }, [unlocked]);

  const ctx = useMemo(() => ({ solved }), [solved]);
  const status = describe(last, solved);
  const shownHints = printing ? hints.length : hintsOpen;
  const showHintButton =
    hints.length > 0 && !solved && hintsOpen < hints.length;
  const canOpenHint = hintsOpen < unlocked;
  const hasAnswer = answerParts.length > 0;
  const showSolved = solvedParts.length > 0 && (solved || printing);
  const showAnswer = hasAnswer && (answerOpen || printing);
  // Per lo screen reader: un tentativo fallito ha appena sbloccato qualcosa.
  const hintNews =
    !solved && canOpenHint ? ' C’è un suggerimento da aprire.' : '';

  return (
    <ChallengeContext.Provider value={ctx}>
      <div
        ref={rootRef}
        className={styles.challenge}
        data-challenge=""
        data-esito={last?.esito ?? 'nuovo'}
        data-solved={solved || undefined}
      >
        {rest}
        <div className={styles.bar}>
          <p
            className={clsx(styles.status, styles[`tone_${status.tone}`])}
            role="status"
            aria-live="polite"
          >
            <FontAwesomeIcon
              icon={status.icon}
              className={styles.statusIcon}
              aria-hidden="true"
            />
            <span>
              {status.text}
              {hintNews && <span className={styles.srOnly}>{hintNews}</span>}
            </span>
          </p>
          {(showHintButton || (hasAnswer && attempts > 0)) && (
            <div className={styles.actions}>
              {showHintButton && (
                <button
                  type="button"
                  className={clsx(styles.action, canOpenHint && styles.fresh)}
                  onClick={openHint}
                  disabled={!canOpenHint}
                  title={
                    canOpenHint
                      ? undefined
                      : 'Si sblocca con un tentativo non riuscito'
                  }
                >
                  <FontAwesomeIcon
                    icon={canOpenHint ? faLightbulb : faLock}
                    aria-hidden="true"
                  />
                  {`Suggerimento ${hintsOpen + 1}/${hints.length}`}
                  {!canOpenHint && (
                    <span className={styles.srOnly}>
                      , si sblocca con un tentativo non riuscito
                    </span>
                  )}
                </button>
              )}
              {hasAnswer && attempts > 0 && (
                <button
                  type="button"
                  className={styles.action}
                  onClick={() => setAnswerOpen((open) => !open)}
                  aria-expanded={answerOpen}
                  aria-controls={answerOpen ? answerId : undefined}
                >
                  <FontAwesomeIcon icon={faKey} aria-hidden="true" />
                  {answerOpen ? 'Nascondi soluzione' : 'Mostra soluzione'}
                </button>
              )}
            </div>
          )}
        </div>
        {/* Dentro le parti i runner sono normali: niente verifica. */}
        <ChallengeContext.Provider value={null}>
          {shownHints > 0 && (
            <ol ref={hintListRef} className={styles.hints}>
              {hints.slice(0, shownHints).map((hint, i) => (
                // eslint-disable-next-line react/no-array-index-key
                <li
                  key={i}
                  tabIndex={-1}
                  className={clsx(styles.panel, styles.hint)}
                >
                  <span className={styles.panelLabel}>
                    <FontAwesomeIcon icon={faLightbulb} aria-hidden="true" />
                    {`Suggerimento ${i + 1}`}
                  </span>
                  <div className={styles.panelBody}>{hint}</div>
                </li>
              ))}
            </ol>
          )}
          {showSolved && (
            <section
              className={clsx(styles.panel, styles.success)}
              aria-label="Commento all’esercizio risolto"
            >
              <span className={styles.panelLabel}>
                <FontAwesomeIcon icon={faCircleCheck} aria-hidden="true" />
                Risolto
              </span>
              <div className={styles.panelBody}>{keyed(solvedParts)}</div>
            </section>
          )}
          {showAnswer && (
            <section
              id={answerId}
              className={clsx(styles.panel, styles.answer)}
              aria-label="Soluzione"
            >
              <span className={styles.panelLabel}>
                <FontAwesomeIcon icon={faKey} aria-hidden="true" />
                Soluzione
              </span>
              <div className={styles.panelBody}>{keyed(answerParts)}</div>
            </section>
          )}
        </ChallengeContext.Provider>
      </div>
    </ChallengeContext.Provider>
  );
}
