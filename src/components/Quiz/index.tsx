import {
  Children,
  isValidElement,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styles from './styles.module.css';

type QuizRole = 'question' | 'option' | 'feedback';

interface MarkerComponent {
  (props: { children?: ReactNode }): ReactElement | null;
  __quizRole: QuizRole;
  displayName?: string;
}

function makeMarker(role: QuizRole): MarkerComponent {
  const C = (({ children }: { children?: ReactNode }) => <>{children}</>) as MarkerComponent;
  C.__quizRole = role;
  return C;
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

export default function Quiz({ children }: { children?: ReactNode }) {
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

  function handlePick(i: number) {
    if (solved) return;
    if (picked.includes(i)) return;
    setPicked((p) => [...p, i]);
  }

  function reset() {
    setPicked([]);
  }

  return (
    <div className={styles.quiz}>
      <div className={styles.kicker}>Verifica</div>
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
                <span className={styles.marker} aria-hidden="true">
                  {state === 'correct' || state === 'reveal' ? (
                    <FontAwesomeIcon icon={['fas', 'check']} />
                  ) : state === 'wrong' ? (
                    <FontAwesomeIcon icon={['fas', 'xmark']} />
                  ) : (
                    letter
                  )}
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
      {picked.length > 0 && (
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
