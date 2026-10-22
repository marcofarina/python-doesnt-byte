/**
 * Tabella di dati: intestazione in grassetto e righe alte 28. Le celle sono
 * in Monaspace, l'intestazione nel carattere del tratto.
 */
import React from 'react';
import type { PropsComuni, PropsTabella } from '../tipi';
import { CORPO, Forma, RAGGIO, Testo, larghezzaTesto, styles } from './comune';

const INTESTAZIONE = 32;
const RIGA = 28;
const MARGINE = 10;

/** Larghezze delle colonne: date, o dal testo più lungo di ognuna. */
export const larghezzeColonne = (
  { colonne, righe, larghezze }: PropsTabella,
  tratto: PropsComuni['tratto'],
): number[] =>
  larghezze ??
  colonne.map((c, j) =>
    Math.ceil(
      Math.max(
        larghezzaTesto(c, CORPO.piccolo, tratto, 'testo', true),
        ...righe.map((r) =>
          larghezzaTesto(r[j] ?? '', CORPO.piccolo, tratto, 'codice'),
        ),
      ) +
        2 * MARGINE,
    ),
  );

export default function Tabella(
  props: PropsTabella & PropsComuni,
): JSX.Element {
  const { chiave, tratto, progresso = 1, colonne, righe } = props;
  const col = larghezzeColonne(props, tratto);
  const l = col.reduce((s, c) => s + c, 0);
  const a = INTESTAZIONE + RIGA * righe.length;
  const xs = col.reduce<number[]>((acc, c, j) => [...acc, acc[j] + c], [0]);
  return (
    <g>
      <Forma
        chiave={chiave}
        g={{ f: 'rett', x: 0, y: 0, l, a, pieno: true }}
        tratto={tratto}
        progresso={progresso}
        raggio={RAGGIO.xs}
        fondo={styles.fondoCarta}
      />
      <Forma
        chiave={`${chiave}/intestazione`}
        g={{ f: 'linea', x0: 0, y0: INTESTAZIONE, x1: l, y1: INTESTAZIONE }}
        tratto={tratto}
        progresso={progresso}
      />
      {xs.slice(1, -1).map((x, j) => (
        <Forma
          key={j}
          chiave={`${chiave}/colonna${j}`}
          g={{ f: 'linea', x0: x, y0: 0, x1: x, y1: a }}
          tratto={tratto}
          progresso={progresso}
        />
      ))}
      {colonne.map((c, j) => (
        <Testo
          key={c}
          x={xs[j] + MARGINE}
          y={22}
          testo={c}
          tratto={tratto}
          corpo={CORPO.piccolo}
          grassetto
          progresso={progresso}
        />
      ))}
      {righe.map((r, i) =>
        r.map((v, j) => (
          <Testo
            key={`${i}-${j}`}
            x={xs[j] + MARGINE}
            y={INTESTAZIONE + RIGA * i + 19}
            testo={v}
            tratto={tratto}
            famiglia="codice"
            corpo={CORPO.piccolo}
            progresso={progresso}
          />
        )),
      )}
    </g>
  );
}
