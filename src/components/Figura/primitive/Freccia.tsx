/**
 * Freccia dritta o curva dall'origine a (dx, dy). Il corpo si disegna nei
 * primi 85% del progresso, le punte e l'etichetta nell'ultimo 15%.
 */
import React from 'react';
import type { PropsComuni, PropsFreccia } from '../tipi';
import { CORPO, Forma, Testo, r2 } from './comune';

/** Lunghezza della punta e apertura (rad) rispetto alla direzione. */
const PUNTA = 11;
const APERTURA = 0.45;

export default function Freccia({
  chiave,
  tratto,
  progresso = 1,
  dx,
  dy,
  curva = 0,
  etichetta,
  punte = 'fine',
}: PropsFreccia & PropsComuni): JSX.Element {
  const lung = Math.hypot(dx, dy) || 1;
  // Punto di controllo: a metà corda, scostato in perpendicolare.
  const cx = dx / 2 + (-dy / lung) * curva;
  const cy = dy / 2 + (dx / lung) * curva;
  const punta = (px: number, py: number, ang: number) => {
    const ala = (s: number): string =>
      `${r2(px - PUNTA * Math.cos(ang + s * APERTURA))} ${r2(py - PUNTA * Math.sin(ang + s * APERTURA))}`;
    return `M${ala(1)}L${r2(px)} ${r2(py)}L${ala(-1)}`;
  };
  const corpoP = Math.min(1, progresso / 0.85);
  const punteP = Math.max(0, (progresso - 0.85) / 0.15);

  // Etichetta: a metà curva, dalla parte della normale che sale.
  let nx = -dy / lung;
  let ny = dx / lung;
  if (ny > 0 || (ny === 0 && nx > 0)) {
    nx = -nx;
    ny = -ny;
  }
  const verticale = Math.abs(nx) >= 0.3;
  const etX = cx / 2 + dx / 4 + nx * 10;
  const etY = cy / 2 + dy / 4 + ny * 10 + (verticale ? 4 : -2);

  return (
    <g>
      <Forma
        chiave={chiave}
        g={{ f: 'path', d: `M0 0Q${r2(cx)} ${r2(cy)} ${dx} ${dy}` }}
        tratto={tratto}
        progresso={corpoP}
      />
      <Forma
        chiave={`${chiave}/punta`}
        g={{ f: 'path', d: punta(dx, dy, Math.atan2(dy - cy, dx - cx)) }}
        tratto={tratto}
        progresso={punteP}
      />
      {punte === 'entrambe' && (
        <Forma
          chiave={`${chiave}/coda`}
          g={{ f: 'path', d: punta(0, 0, Math.atan2(-cy, -cx)) }}
          tratto={tratto}
          progresso={punteP}
        />
      )}
      {etichetta && (
        <Testo
          x={r2(etX)}
          y={r2(etY)}
          testo={etichetta}
          tratto={tratto}
          corpo={CORPO.piccolo}
          ancora={!verticale ? 'middle' : nx > 0 ? 'start' : 'end'}
          progresso={punteP}
        />
      )}
    </g>
  );
}
