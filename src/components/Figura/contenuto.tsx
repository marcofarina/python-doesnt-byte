/**
 * Dall'oggetto della scena alla sua primitiva. Il player avvolge il risultato
 * in un gruppo che porta posizione, opacità e colore del ruolo.
 */
import React from 'react';
import { PRIMITIVE } from './primitive';
import type { Oggetto, PropsComuni, Ruolo, Tratto } from './tipi';

/** Colore del ruolo, mescolato all'accento secondo l'enfasi. */
export const coloreRuolo = (ruolo: Ruolo, enfasi: number): string =>
  enfasi > 0.001
    ? `color-mix(in srgb, var(--fig-accento) ${Math.round(enfasi * 100)}%, var(--fig-${ruolo}))`
    : `var(--fig-${ruolo})`;

/** Le parti dello stato che cambiano il disegno di una primitiva. */
export interface Interno {
  progresso: number;
  barrato: number;
  valore: number;
}

interface ContenutoProps {
  o: Oggetto;
  s: Interno;
  tratto: Tratto;
}

const SCENA = ['id', 'tipo', 'natura', 'ruolo', 'x', 'y', 'iniziale'] as const;

function ContenutoPuro({ o, s, tratto }: ContenutoProps): JSX.Element | null {
  // Le chiavi di posizione e di scena non sono props della primitiva.
  const props: Record<string, unknown> = { ...o };
  for (const k of SCENA) delete props[k];
  const C = PRIMITIVE[o.tipo] as (p: PropsComuni) => JSX.Element | null;
  return <C {...props} chiave={o.id} tratto={tratto} {...s} />;
}

export const Contenuto = React.memo(
  ContenutoPuro,
  (a, b) =>
    a.o === b.o &&
    a.tratto === b.tratto &&
    a.s.progresso === b.s.progresso &&
    a.s.barrato === b.s.barrato &&
    a.s.valore === b.s.valore,
);
