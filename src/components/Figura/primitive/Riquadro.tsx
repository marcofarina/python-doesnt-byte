/** Contenitore generico, con etichetta in alto a sinistra. */
import React from 'react';
import type { PropsComuni, PropsRiquadro } from '../tipi';
import { CORPO, Forma, RAGGIO, Testo, styles } from './comune';

export default function Riquadro({
  chiave,
  tratto,
  progresso = 1,
  l,
  a,
  etichetta,
  fondo,
  raggio = 'md',
}: PropsRiquadro & PropsComuni): JSX.Element {
  return (
    <g>
      <Forma
        chiave={chiave}
        g={{ f: 'rett', x: 0, y: 0, l, a, pieno: fondo }}
        tratto={tratto}
        progresso={progresso}
        raggio={RAGGIO[raggio]}
        fondo={styles.fondo}
      />
      {etichetta && (
        <Testo
          x={14}
          y={26}
          testo={etichetta}
          tratto={tratto}
          corpo={CORPO.normale}
          progresso={progresso}
        />
      )}
    </g>
  );
}
