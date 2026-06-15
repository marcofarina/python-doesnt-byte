import { createElement, type ReactNode } from 'react';
import styles from './styles.module.css';

const KEYWORDS = new Set([
  'def',
  'for',
  'while',
  'if',
  'in',
  'range',
  'len',
  'return',
  'and',
  'or',
  'not',
]);

const PUNCT = '(),=[]+-<>';

/** Evidenziazione Python minimale: numeri, keyword/funzioni, punteggiatura.
 *  I colori vivono in CSS (classi tematizzate light/dark). */
export function highlightPy(line: string): ReactNode[] {
  const out: ReactNode[] = [];
  let rest = line;
  let k = 0;

  while (rest.length) {
    const numMatch = rest.match(/^\d+/);
    if (numMatch) {
      out.push(
        createElement(
          'span',
          { key: k++, className: styles.tNum },
          numMatch[0],
        ),
      );
      rest = rest.slice(numMatch[0].length);
      continue;
    }
    const wordMatch = rest.match(/^[a-zA-Z_]\w*/);
    if (wordMatch) {
      const w = wordMatch[0];
      out.push(
        createElement(
          'span',
          { key: k++, className: KEYWORDS.has(w) ? styles.tKw : styles.tDef },
          w,
        ),
      );
      rest = rest.slice(w.length);
      continue;
    }
    const ch = rest[0];
    out.push(
      createElement(
        'span',
        {
          key: k++,
          className: PUNCT.includes(ch) ? styles.tPunct : styles.tDef,
        },
        ch,
      ),
    );
    rest = rest.slice(1);
  }

  return out;
}
