/**
 * Blocco della memoria di un programma: una variabile per riga, il nome a
 * sinistra e il valore in una cella a destra.
 */
import React from 'react';
import type { PropsComuni, PropsMemoria } from '../tipi';
import { CORPO, Forma, RAGGIO, Testo, styles } from './comune';

const PASSO = 36;
const CELLA = 26;

export default function Memoria({
  chiave,
  tratto,
  progresso = 1,
  l,
  a,
  variabili,
}: PropsMemoria & PropsComuni): JSX.Element {
  const xCella = Math.round(l * 0.42);
  return (
    <g>
      <Forma
        chiave={chiave}
        g={{ f: 'rett', x: 0, y: 0, l, a, pieno: true }}
        tratto={tratto}
        progresso={progresso}
        raggio={RAGGIO.md}
        fondo={styles.fondo}
      />
      {variabili.map((v, i) => {
        const y = 16 + i * PASSO;
        return (
          <g key={v.nome}>
            <Testo
              x={14}
              y={y + 18}
              testo={v.nome}
              tratto={tratto}
              famiglia="codice"
              corpo={CORPO.piccolo}
              progresso={progresso}
            />
            <Forma
              chiave={`${chiave}/${v.nome}`}
              g={{
                f: 'rett',
                x: xCella,
                y,
                l: l - xCella - 14,
                a: CELLA,
                pieno: true,
              }}
              tratto={tratto}
              progresso={progresso}
              raggio={RAGGIO.xs}
              fondo={styles.fondoCarta}
            />
            <Testo
              x={xCella + 10}
              y={y + 18}
              testo={v.valore}
              tratto={tratto}
              famiglia="codice"
              corpo={CORPO.piccolo}
              progresso={progresso}
            />
          </g>
        );
      })}
    </g>
  );
}
