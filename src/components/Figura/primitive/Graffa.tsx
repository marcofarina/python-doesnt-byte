/**
 * Graffa che raggruppa: lunga `lunghezza` lungo l'asse, con la punta verso
 * `verso` e l'etichetta oltre la punta. L'origine è all'inizio della graffa.
 */
import React from 'react';
import type { PropsComuni, PropsGraffa } from '../tipi';
import { CORPO, Forma, Testo } from './comune';

const PROFONDITA = 14;

export default function Graffa({
  chiave,
  tratto,
  progresso = 1,
  lunghezza: L,
  verso,
  etichetta,
}: PropsGraffa & PropsComuni): JSX.Element {
  const m = L / 2;
  const p = PROFONDITA;
  const q = p / 2;
  // Graffa orizzontale con la punta in basso; le altre sono sue rotazioni.
  const d =
    `M0 0Q0 ${q} ${q} ${q}H${m - q}Q${m} ${q} ${m} ${p}` +
    `Q${m} ${q} ${m + q} ${q}H${L - q}Q${L} ${q} ${L} 0`;
  const ruota = {
    sotto: '',
    sopra: 'scale(1 -1)',
    destra: 'rotate(90) scale(1 -1)',
    sinistra: 'rotate(90)',
  }[verso];
  const et = {
    sotto: { x: m, y: p + 20, ancora: 'middle' as const },
    sopra: { x: m, y: -p - 8, ancora: 'middle' as const },
    destra: { x: p + 8, y: m + 5, ancora: 'start' as const },
    sinistra: { x: -p - 8, y: m + 5, ancora: 'end' as const },
  }[verso];
  return (
    <g>
      <g transform={ruota || undefined}>
        <Forma
          chiave={chiave}
          g={{ f: 'path', d }}
          tratto={tratto}
          progresso={progresso}
        />
      </g>
      {etichetta && (
        <Testo
          x={et.x}
          y={et.y}
          testo={etichetta}
          tratto={tratto}
          corpo={CORPO.piccolo}
          ancora={et.ancora}
          progresso={progresso}
        />
      )}
    </g>
  );
}
