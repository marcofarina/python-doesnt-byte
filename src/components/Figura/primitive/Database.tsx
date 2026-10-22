/** Cilindro del database, con il nome al centro. */
import React from 'react';
import type { PropsComuni, PropsDatabase } from '../tipi';
import { CORPO, Forma, Testo, styles } from './comune';

/** Semiasse verticale delle ellissi. */
const RY = 12;

export default function Database({
  chiave,
  tratto,
  progresso = 1,
  l,
  a,
  nome,
}: PropsDatabase & PropsComuni): JSX.Element {
  const rx = l / 2;
  return (
    <g>
      <Forma
        chiave={chiave}
        g={{
          f: 'path',
          d: `M0 ${RY}V${a - RY}A${rx} ${RY} 0 0 0 ${l} ${a - RY}V${RY}`,
          pieno: true,
        }}
        tratto={tratto}
        progresso={progresso}
        fondo={styles.fondo}
      />
      <Forma
        chiave={`${chiave}/coperchio`}
        g={{ f: 'ellisse', x: rx, y: RY, l, a: 2 * RY, pieno: true }}
        tratto={tratto}
        progresso={progresso}
        fondo={styles.fondo}
      />
      <Testo
        x={rx}
        y={(a + RY) / 2 + 6}
        testo={nome}
        tratto={tratto}
        famiglia="codice"
        corpo={CORPO.piccolo}
        ancora="middle"
        progresso={progresso}
      />
    </g>
  );
}
