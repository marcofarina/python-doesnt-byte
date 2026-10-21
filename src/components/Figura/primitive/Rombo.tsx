/**
 * Rombo di un'associazione, come nei diagrammi E/R: inscritto nel rettangolo
 * (0, 0, l, a), con il nome al centro.
 */
import React from 'react';
import type { PropsComuni, PropsRombo } from '../tipi';
import { CORPO, Forma, Testo, styles } from './comune';

export default function Rombo({
  chiave,
  tratto,
  progresso = 1,
  l,
  a,
  nome,
  fondo,
}: PropsRombo & PropsComuni): JSX.Element {
  return (
    <g>
      <Forma
        chiave={chiave}
        g={{
          f: 'poligono',
          punti: [
            [l / 2, 0],
            [l, a / 2],
            [l / 2, a],
            [0, a / 2],
          ],
          pieno: fondo,
        }}
        tratto={tratto}
        progresso={progresso}
        fondo={styles.fondo}
      />
      <Testo
        x={l / 2}
        y={a / 2 + 6}
        testo={nome}
        tratto={tratto}
        corpo={CORPO.normale}
        ancora="middle"
        progresso={progresso}
      />
    </g>
  );
}
