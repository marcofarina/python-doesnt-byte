/** Foglio con l'angolo piegato e il nome del file in alto. */
import React from 'react';
import type { PropsComuni, PropsFile } from '../tipi';
import { CORPO, Forma, Testo, styles } from './comune';

const PIEGA = 18;

export default function File({
  chiave,
  tratto,
  progresso = 1,
  l,
  a,
  nome,
}: PropsFile & PropsComuni): JSX.Element {
  return (
    <g>
      <Forma
        chiave={chiave}
        g={{
          f: 'poligono',
          punti: [
            [0, 0],
            [l - PIEGA, 0],
            [l, PIEGA],
            [l, a],
            [0, a],
          ],
          pieno: true,
        }}
        tratto={tratto}
        progresso={progresso}
        fondo={styles.fondoCarta}
      />
      <Forma
        chiave={`${chiave}/piega`}
        g={{
          f: 'poligono',
          punti: [
            [l - PIEGA, 0],
            [l - PIEGA, PIEGA],
            [l, PIEGA],
          ],
        }}
        tratto={tratto}
        progresso={progresso}
      />
      <Testo
        x={14}
        y={26}
        testo={nome}
        tratto={tratto}
        famiglia="codice"
        corpo={CORPO.piccolo}
        progresso={progresso}
      />
    </g>
  );
}
