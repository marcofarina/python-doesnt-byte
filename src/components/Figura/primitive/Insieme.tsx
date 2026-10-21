/**
 * Insieme: un'ellisse inscritta nel rettangolo (0, 0, l, a), con il nome
 * fuori dal bordo, sopra o sotto, centrato: il tratto a mano sporge dal
 * rettangolo, e il nome sta abbastanza lontano da non toccarlo. Le occorrenze dentro sono oggetti
 * a parte (`testo`), così si muovono da sole.
 */
import React from 'react';
import type { PropsComuni, PropsInsieme } from '../tipi';
import { CORPO, Forma, Testo, styles } from './comune';

export default function Insieme({
  chiave,
  tratto,
  progresso = 1,
  l,
  a,
  etichetta,
  latoEtichetta = 'sopra',
  fondo,
}: PropsInsieme & PropsComuni): JSX.Element {
  return (
    <g>
      <Forma
        chiave={chiave}
        g={{ f: 'ellisse', x: l / 2, y: a / 2, l, a, pieno: fondo }}
        tratto={tratto}
        progresso={progresso}
        fondo={styles.fondo}
      />
      {etichetta && (
        <Testo
          x={l / 2}
          y={latoEtichetta === 'sopra' ? -16 : a + 26}
          testo={etichetta}
          tratto={tratto}
          corpo={CORPO.normale}
          ancora="middle"
          progresso={progresso}
        />
      )}
    </g>
  );
}
