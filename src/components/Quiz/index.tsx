import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './styles.module.css';

type QuizRole = 'question' | 'option' | 'feedback';

interface MarkerComponent {
  (props: { children?: ReactNode }): ReactElement | null;
  __quizRole: QuizRole;
  displayName?: string;
}

function makeMarker(role: QuizRole): MarkerComponent {
  const C = (({ children }: { children?: ReactNode }) => (
    <>{children}</>
  )) as MarkerComponent;
  C.__quizRole = role;
  return C;
}

/** Contenuto del kicker "Mettiti alla prova" con l'icona del quiz. */
function QuizKicker() {
  const icon = useBaseUrl('/img/icons/quiz.png');
  return (
    <>
      <img src={icon} alt="" aria-hidden="true" className={styles.kickerIcon} />
      Mettiti alla prova
    </>
  );
}

export const QuizQuestion = makeMarker('question');
QuizQuestion.displayName = 'QuizQuestion';

export const QuizFeedback = makeMarker('feedback');
QuizFeedback.displayName = 'QuizFeedback';

interface QuizOptionProps {
  correct?: boolean;
  children?: ReactNode;
}

export function QuizOption(_props: QuizOptionProps): ReactElement | null {
  return null;
}
QuizOption.displayName = 'QuizOption';
(QuizOption as unknown as { __quizRole: QuizRole }).__quizRole = 'option';

function getRole(node: ReactNode): QuizRole | undefined {
  if (!isValidElement(node)) return undefined;
  const type = node.type as { __quizRole?: QuizRole } | undefined;
  return type?.__quizRole;
}

interface ParsedOption {
  correct: boolean;
  answer: ReactNode[];
  feedback: ReactNode | null;
}

function parseOption(node: ReactElement): ParsedOption {
  const props = node.props as QuizOptionProps;
  const answer: ReactNode[] = [];
  let feedback: ReactNode | null = null;
  Children.forEach(props.children, (child) => {
    if (getRole(child) === 'feedback') {
      feedback = (child as ReactElement).props.children;
    } else {
      answer.push(child);
    }
  });
  return { correct: !!props.correct, answer, feedback };
}

interface QuizProps {
  children?: ReactNode;
  /** Reso all'interno di un <QuizDeck>: niente cornice, kicker e footer propri. */
  bare?: boolean;
  /** Notifica al deck quando la domanda è risolta, col numero di tentativi. */
  onSolved?: (attempts: number) => void;
}

export default function Quiz({ children, bare = false, onSolved }: QuizProps) {
  const [picked, setPicked] = useState<number[]>([]);

  let question: ReactNode = null;
  const options: ParsedOption[] = [];

  Children.forEach(children, (child) => {
    const role = getRole(child);
    if (role === 'question') {
      question = (child as ReactElement).props.children;
    } else if (role === 'option') {
      options.push(parseOption(child as ReactElement));
    }
  });

  const solvedIndex = picked.find((i) => options[i]?.correct);
  const solved = solvedIndex !== undefined;

  // Notifica il deck (se presente) alla transizione "risolto", una sola volta.
  const notifiedRef = useRef(false);
  useEffect(() => {
    if (solved && !notifiedRef.current) {
      notifiedRef.current = true;
      onSolved?.(picked.length);
    } else if (!solved) {
      notifiedRef.current = false;
    }
  }, [solved, picked.length, onSolved]);

  function handlePick(i: number) {
    if (solved) return;
    if (picked.includes(i)) return;
    setPicked((p) => [...p, i]);
  }

  function reset() {
    setPicked([]);
  }

  return (
    <div className={bare ? styles.quizBare : styles.quiz}>
      {!bare && (
        <div className={styles.kicker}>
          <QuizKicker />
        </div>
      )}
      <div className={styles.question}>{question}</div>
      <ul className={styles.options}>
        {options.map((opt, i) => {
          const isPicked = picked.includes(i);
          const isCorrectPick = isPicked && opt.correct;
          const isWrongPick = isPicked && !opt.correct;
          const reveal = solved && !isPicked && opt.correct;
          const state = isCorrectPick
            ? 'correct'
            : isWrongPick
              ? 'wrong'
              : reveal
                ? 'reveal'
                : 'idle';
          const letter = String.fromCharCode(65 + i);
          return (
            <li key={i} className={styles.optionRow}>
              <button
                type="button"
                onClick={() => handlePick(i)}
                disabled={solved || isPicked}
                className={`${styles.option} ${state !== 'idle' ? styles[state] : ''}`}
                aria-pressed={isPicked}
              >
                <span className={styles.markerWrap} aria-hidden="true">
                  <span className={styles.marker}>
                    {state === 'correct' || state === 'reveal' ? (
                      <FontAwesomeIcon icon={['fas', 'check']} />
                    ) : state === 'wrong' ? (
                      <FontAwesomeIcon icon={['fas', 'xmark']} />
                    ) : (
                      letter
                    )}
                  </span>
                </span>
                <span className={styles.answer}>{opt.answer}</span>
              </button>
              {isPicked && opt.feedback && (
                <div
                  className={`${styles.feedback} ${
                    opt.correct ? styles.feedbackCorrect : styles.feedbackWrong
                  }`}
                >
                  {opt.feedback}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {!bare && picked.length > 0 && (
        <div className={styles.footer}>
          <span className={styles.status}>
            {solved
              ? 'Risposta corretta.'
              : `Tentativi: ${picked.length}. Riprova.`}
          </span>
          <button type="button" onClick={reset} className={styles.reset}>
            <FontAwesomeIcon
              icon={['fas', 'arrow-rotate-left']}
              className={styles.resetIcon}
            />
            Ricomincia
          </button>
        </div>
      )}
    </div>
  );
}
(Quiz as unknown as { __isQuiz: boolean }).__isQuiz = true;

/* ─────────────────────────── QuizDeck ─────────────────────────── */

function isQuizElement(node: ReactNode): node is ReactElement<QuizProps> {
  if (!isValidElement(node)) return false;
  const type = node.type as { __isQuiz?: boolean } | undefined;
  return type?.__isQuiz === true;
}

export function QuizDeck({ children }: { children?: ReactNode }) {
  const quizzes = Children.toArray(children).filter(isQuizElement);
  const total = quizzes.length;

  const [current, setCurrent] = useState(0);
  const [solved, setSolved] = useState<boolean[]>(() =>
    Array(total).fill(false),
  );
  const [attempts, setAttempts] = useState<number[]>(() =>
    Array(total).fill(0),
  );
  const [resetNonce, setResetNonce] = useState(0);
  // Indice la cui soluzione è in attesa di far avanzare il deck (null = nessuno).
  const [pendingAdvance, setPendingAdvance] = useState<number | null>(null);

  // Avanzamento automatico: dopo una breve pausa per leggere il feedback,
  // passa alla domanda successiva — ma solo se siamo ancora su quella risolta.
  useEffect(() => {
    if (pendingAdvance === null) return undefined;
    const idx = pendingAdvance;
    const t = setTimeout(() => {
      setCurrent((c) => (c === idx ? c + 1 : c));
      setPendingAdvance(null);
    }, 5000);
    return () => clearTimeout(t);
  }, [pendingAdvance]);

  if (total === 0) return null;

  const solvedCount = solved.filter(Boolean).length;
  const allSolved = solvedCount === total;
  const onSummary = current >= total;

  function handleSolved(index: number, att: number) {
    setSolved((prev) => {
      if (prev[index]) return prev;
      const next = [...prev];
      next[index] = true;
      return next;
    });
    setAttempts((prev) => {
      const next = [...prev];
      next[index] = att;
      return next;
    });
    setPendingAdvance(index);
  }

  function goPrev() {
    setPendingAdvance(null);
    setCurrent((c) => Math.max(0, c - 1));
  }

  function goNext() {
    setPendingAdvance(null);
    setCurrent((c) => (c < total && solved[c] ? c + 1 : c));
  }

  function restart() {
    setPendingAdvance(null);
    setSolved(Array(total).fill(false));
    setAttempts(Array(total).fill(0));
    setCurrent(0);
    setResetNonce((n) => n + 1);
  }

  const canGoPrev = current > 0;
  const canGoNext = !onSummary && current < total && solved[current];
  const percent = Math.round((solvedCount / total) * 100);
  const firstTry = attempts.filter((a) => a === 1).length;

  return (
    <div className={styles.deck}>
      <div className={styles.deckHeader}>
        <div className={styles.deckMeta}>
          <span className={styles.kicker}>
            <QuizKicker />
          </span>
          <span className={styles.counter}>
            {onSummary
              ? `${total} / ${total}`
              : `Domanda ${current + 1} / ${total}`}
          </span>
        </div>
        <div
          className={styles.progress}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={solvedCount}
          aria-label="Avanzamento del quiz"
        >
          <div
            className={styles.progressBar}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <div className={styles.stage}>
        {quizzes.map((quiz, i) => (
          <div
            key={`${resetNonce}-${i}`}
            className={styles.pane}
            hidden={onSummary || i !== current}
          >
            {cloneElement(quiz, {
              bare: true,
              onSolved: (att: number) => handleSolved(i, att),
            })}
          </div>
        ))}

        {onSummary && (
          <div className={styles.summary}>
            <span className={styles.summaryIcon} aria-hidden="true">
              <FontAwesomeIcon icon={['fas', 'trophy']} />
            </span>
            <div className={styles.summaryTitle}>Quiz completato!</div>
            <div className={styles.summaryScore}>
              {firstTry} / {total} risolte al primo tentativo
            </div>
          </div>
        )}
      </div>

      <div className={styles.deckFooter}>
        <button
          type="button"
          className={styles.navBtn}
          onClick={goPrev}
          disabled={!canGoPrev}
        >
          <span className={styles.navBtnLabel}>
            <FontAwesomeIcon icon={['fas', 'arrow-left']} />
            <span>Indietro</span>
          </span>
        </button>

        {onSummary || allSolved ? (
          <button type="button" className={styles.restart} onClick={restart}>
            <FontAwesomeIcon
              icon={['fas', 'arrow-rotate-left']}
              className={styles.resetIcon}
            />
            Ricomincia
          </button>
        ) : (
          <span className={styles.hint}>
            {solved[current] ? 'Risolta' : 'Scegli la risposta corretta'}
          </span>
        )}

        <button
          type="button"
          className={`${styles.navBtn}${pendingAdvance === current ? ` ${styles.navBtnFill}` : ''}`}
          onClick={goNext}
          disabled={!canGoNext}
        >
          {pendingAdvance === current && (
            <span className={styles.fillBar} aria-hidden="true" />
          )}
          <span className={styles.navBtnLabel}>
            <span>Avanti</span>
            <FontAwesomeIcon icon={['fas', 'arrow-right']} />
          </span>
        </button>
      </div>
    </div>
  );
}
QuizDeck.displayName = 'QuizDeck';
