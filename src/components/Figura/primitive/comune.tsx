/**
 * Mattoni comuni delle primitive: misure della tavola di stile, la forma nei
 * due tratti con l'effetto «si disegna» e il testo che si scrive e va a capo.
 * Spec: sezione G2 di pm/piano-2026-10-figure-animate.md.
 */
import React from 'react';
import { larghezzaTesto } from '../misure';
import type { Geometria } from '../ruvido';
import { ruvido, scoperto } from '../ruvido';
import type { Corpo, Raggio, Tratto } from '../tipi';
import styles from '../styles.module.css';

/** Corpi del testo, in unità del viewBox. Nessun testo sotto il piccolo. */
export const CORPO = { piccolo: 15, normale: 17, grande: 21 } as const;
/** Raggi: la scala del sito (`--radius-xs/sm/md/lg`). */
export const RAGGIO: Record<Raggio, number> = { xs: 6, sm: 10, md: 14, lg: 18 };
/** Interlinea del testo a capo, in multipli del corpo. */
export const INTERLINEA = 1.3;

export const corpoIn = (c: Corpo | undefined, base: number = CORPO.normale) =>
  c === undefined ? base : typeof c === 'number' ? c : CORPO[c];

export const r2 = (n: number) => Math.round(n * 100) / 100;

export { styles };
export { larghezzaTesto };

/** Divide un testo in righe non più larghe di `max`, alle parole. */
export function aCapo(
  testo: string,
  max: number,
  corpo: number,
  tratto: Tratto,
  famiglia: 'testo' | 'codice' = 'testo',
): string[] {
  const righe: string[] = [];
  let riga = '';
  for (const parola of testo.split(/\s+/)) {
    const prova = riga ? `${riga} ${parola}` : parola;
    if (riga && larghezzaTesto(prova, corpo, tratto, famiglia) > max) {
      righe.push(riga);
      riga = parola;
    } else riga = prova;
  }
  if (riga) righe.push(riga);
  return righe;
}

/** La stessa geometria come path netta. */
const dNetto = (g: Geometria, raggio = 0): string => {
  switch (g.f) {
    case 'rett': {
      const { x, y, l, a } = g;
      const r = Math.min(raggio, l / 2, a / 2);
      return (
        `M${x + r} ${y}H${x + l - r}A${r} ${r} 0 0 1 ${x + l} ${y + r}` +
        `V${y + a - r}A${r} ${r} 0 0 1 ${x + l - r} ${y + a}H${x + r}` +
        `A${r} ${r} 0 0 1 ${x} ${y + a - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`
      );
    }
    case 'cerchio': {
      const r = g.d / 2;
      return `M${g.x - r} ${g.y}a${r} ${r} 0 1 0 ${g.d} 0a${r} ${r} 0 1 0 ${-g.d} 0Z`;
    }
    case 'ellisse': {
      const rx = g.l / 2;
      const ry = g.a / 2;
      return `M${g.x - rx} ${g.y}a${rx} ${ry} 0 1 0 ${g.l} 0a${rx} ${ry} 0 1 0 ${-g.l} 0Z`;
    }
    case 'linea':
      return `M${g.x0} ${g.y0}L${g.x1} ${g.y1}`;
    case 'poligono':
      return `M${g.punti.map(([x, y]) => `${x} ${y}`).join('L')}Z`;
    case 'path':
      return g.d;
  }
};

interface FormaProps {
  chiave: string;
  g: Geometria;
  tratto: Tratto;
  progresso: number;
  raggio?: number;
  /** Classe del riempimento (fondo), se la forma è piena. */
  fondo?: string;
  classe?: string;
}

/** Una forma nei due tratti, con l'effetto «si disegna». */
export function Forma({
  chiave,
  g,
  tratto,
  progresso,
  raggio,
  fondo,
  classe,
}: FormaProps): JSX.Element | null {
  if (progresso <= 0) return null;
  const pieno = 'pieno' in g && g.pieno;
  if (tratto === 'netto') {
    const d = dNetto(g, raggio);
    return (
      <g className={classe}>
        {pieno && (
          <path d={d} className={fondo} style={{ opacity: progresso }} />
        )}
        <path
          d={d}
          className={styles.tratto}
          pathLength={1}
          strokeDasharray={progresso < 1 ? '1 1' : undefined}
          strokeDashoffset={progresso < 1 ? r2(1 - progresso) : undefined}
        />
      </g>
    );
  }
  const p = ruvido(chiave, g);
  return (
    <g className={classe}>
      {p.fondo && (
        <path d={p.fondo} className={fondo} style={{ opacity: progresso }} />
      )}
      {p.tratti.map((t, i) => {
        const s = scoperto(t, progresso);
        // Sotto il 2% il cappuccio tondo lascerebbe un puntino.
        if (s < 0.02) return null;
        return (
          <path
            key={i}
            d={t.d}
            className={styles.tratto}
            pathLength={1}
            strokeDasharray={s < 1 ? '1 1' : undefined}
            strokeDashoffset={s < 1 ? r2(1 - s) : undefined}
          />
        );
      })}
    </g>
  );
}

interface TestoProps {
  x: number;
  /** Linea di base della prima riga. */
  y: number;
  testo: string;
  tratto: Tratto;
  corpo?: number;
  ancora?: 'start' | 'middle' | 'end';
  famiglia?: 'testo' | 'codice';
  grassetto?: boolean;
  /** Larghezza oltre cui il testo va a capo. */
  larghezzaMax?: number;
  /** 0…1: quanti caratteri sono scritti. */
  progresso?: number;
  classe?: string;
}

/** Testo nei due tratti: si scrive carattere per carattere e va a capo. */
export function Testo({
  x,
  y,
  testo,
  tratto,
  corpo = CORPO.normale,
  ancora = 'start',
  famiglia = 'testo',
  grassetto = false,
  larghezzaMax,
  progresso = 1,
  classe,
}: TestoProps): JSX.Element | null {
  if (progresso <= 0) return null;
  const righe = larghezzaMax
    ? aCapo(testo, larghezzaMax, corpo, tratto, famiglia)
    : [testo];
  const totale = righe.reduce((s, r) => s + r.length, 0);
  const scritti = Math.ceil(totale * Math.min(1, progresso));
  // Caratteri delle righe precedenti, per sapere quanto di ognuna è scritto.
  const prima = righe.map((_, i) =>
    righe.slice(0, i).reduce((s, r) => s + r.length, 0),
  );
  const font =
    famiglia === 'codice'
      ? styles.fontCodice
      : tratto === 'mano'
        ? styles.fontMano
        : styles.fontNetto;
  return (
    <text
      x={x}
      y={y}
      fontSize={corpo}
      textAnchor={ancora}
      fontWeight={grassetto && tratto === 'netto' ? 700 : undefined}
      className={`${styles.testo} ${font} ${classe ?? ''}`}
    >
      {righe.map((r, i) => {
        const n = Math.max(0, Math.min(r.length, scritti - prima[i]));
        const dy = i === 0 ? undefined : r2(corpo * INTERLINEA);
        // Il testo intero resta nel DOM (ricerca, screen reader): la parte non
        // ancora scritta è solo trasparente.
        return (
          <tspan key={i} x={righe.length > 1 ? x : undefined} dy={dy}>
            {r.slice(0, n)}
            {n < r.length && (
              <tspan className={styles.nonScritto}>{r.slice(n)}</tspan>
            )}
          </tspan>
        );
      })}
    </text>
  );
}
