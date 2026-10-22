/**
 * Riga di dati alta 28: una cella (`testo`) o più celle (`celle`). Il segno
 * `nuova` la colora come `ok`, `evidenziata` come `accento`; `barrato` la
 * attraversa con una barra in colore `errore`.
 */
import React from 'react';
import type { PropsComuni, PropsRiga } from '../tipi';
import { CORPO, Forma, RAGGIO, Testo, styles } from './comune';

export const ALTEZZA_RIGA = 28;

const COLORE_SEGNO = {
  normale: undefined,
  nuova: 'var(--fig-ok)',
  evidenziata: 'var(--fig-accento)',
} as const;

export default function Riga({
  chiave,
  tratto,
  progresso = 1,
  barrato = 0,
  l,
  testo,
  celle,
  larghezze,
  segno = 'normale',
}: PropsRiga & PropsComuni): JSX.Element {
  const a = ALTEZZA_RIGA;
  const valori = celle ?? [testo ?? ''];
  const col = larghezze ?? valori.map(() => l / valori.length);
  const xs = col.reduce<number[]>((acc, c, j) => [...acc, acc[j] + c], [0]);
  const colore = COLORE_SEGNO[segno];
  return (
    <g style={colore ? { color: colore } : undefined}>
      <Forma
        chiave={chiave}
        g={{ f: 'rett', x: 0, y: 0, l, a, pieno: true }}
        tratto={tratto}
        progresso={progresso}
        raggio={RAGGIO.xs}
        fondo={styles.fondo}
      />
      {xs.slice(1, -1).map((x, j) => (
        <Forma
          key={j}
          chiave={`${chiave}/cella${j}`}
          g={{ f: 'linea', x0: x, y0: 0, x1: x, y1: a }}
          tratto={tratto}
          progresso={progresso}
        />
      ))}
      {valori.map((v, j) => (
        <Testo
          key={j}
          x={xs[j] + 10}
          y={19}
          testo={v}
          tratto={tratto}
          famiglia="codice"
          corpo={CORPO.piccolo}
          progresso={progresso}
        />
      ))}
      {barrato > 0 && (
        <g style={{ color: 'var(--fig-errore)' }}>
          <Forma
            chiave={`${chiave}/barra`}
            g={{ f: 'linea', x0: -4, y0: a / 2, x1: l + 4, y1: a / 2 }}
            tratto={tratto}
            progresso={barrato}
            classe={styles.spesso}
          />
        </g>
      )}
    </g>
  );
}
