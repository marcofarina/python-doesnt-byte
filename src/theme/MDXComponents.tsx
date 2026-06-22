// Import the original mapper
import MDXComponents from '@theme-original/MDXComponents';
// La FontAwesome library (fab, fas) è registrata una sola volta in
// src/theme/Root.tsx, che avvolge anche le pagine MDX.
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import InlineCode from '@site/src/components/InlineCode';
import Epigraph from '@site/src/components/Epigraph';
import Tooltip from '@site/src/components/Tooltip';
import Quiz, {
  QuizDeck,
  QuizQuestion,
  QuizOption,
  QuizFeedback,
} from '@site/src/components/Quiz';
import PyRunner from '@site/src/theme/PyRunner';
import SQLRunner from '@site/src/theme/SQLRunner';
import Algorithm from '@site/src/components/Algorithm';
import ExerciseLink from '@site/src/components/ExerciseLink';
import Exercise, { LessonMeta, Solution } from '@site/src/components/Exercise';

export default {
  ...MDXComponents,
  FAIcon: FontAwesomeIcon,
  InlineCode,
  Epigraph,
  Tooltip,
  Quiz,
  QuizDeck,
  QuizQuestion,
  QuizOption,
  QuizFeedback,
  PyRunner,
  SQLRunner,
  Algorithm,
  ExerciseLink,
  Exercise,
  LessonMeta,
  Solution,
};
