/**
 * Primitive del prototipo G0: componenti SVG puri, senza orologio. Ricevono
 * l'oggetto, il suo stato nell'istante e il tratto, e restituiscono SVG.
 * La libreria vera (G2) ne farà un file per primitiva.
 */
import React from 'react';
import type { Geometria } from './ruvido';
import { ruvido, scoperto } from './ruvido';
import type { Oggetto, Ruolo, Tratto } from './tipi';
import styles from './styles.module.css';

/** Corpi del testo, in unità del viewBox. */
export const CORPO = { piccolo: 15, normale: 17, grande: 21 } as const;
/** Raggi: la scala del sito (`--radius-xs/sm/md/lg`). */
const RAGGIO = { xs: 6, sm: 10, md: 14, lg: 18 } as const;

const r2 = (n: number) => Math.round(n * 100) / 100;

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
  y: number;
  testo: string;
  tratto: Tratto;
  corpo?: number;
  ancora?: 'start' | 'middle' | 'end';
  famiglia?: 'testo' | 'codice';
  /** 0…1: quanti caratteri sono scritti. */
  progresso?: number;
  classe?: string;
}

export function Testo({
  x,
  y,
  testo,
  tratto,
  corpo = CORPO.normale,
  ancora = 'start',
  famiglia = 'testo',
  progresso = 1,
  classe,
}: TestoProps): JSX.Element | null {
  if (progresso <= 0) return null;
  const n = Math.ceil(testo.length * Math.min(1, progresso));
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
      className={`${styles.testo} ${font} ${classe ?? ''}`}
    >
      {/* Il testo intero resta nel DOM (ricerca, screen reader): la parte non
          ancora scritta è solo trasparente. */}
      <tspan>{testo.slice(0, n)}</tspan>
      {n < testo.length && (
        <tspan className={styles.nonScritto}>{testo.slice(n)}</tspan>
      )}
    </text>
  );
}

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

/**
 * Il disegno di un oggetto in coordinate locali. Posizione, opacità e colore
 * del ruolo li mette il player sul gruppo che lo contiene.
 */
function ContenutoPuro({ o, s, tratto }: ContenutoProps): JSX.Element | null {
  const fondo = styles.fondo;

  switch (o.tipo) {
    case 'riquadro':
      return (
        <g>
          <Forma
            chiave={o.id}
            g={{ f: 'rett', x: 0, y: 0, l: o.l, a: o.a, pieno: o.fondo }}
            tratto={tratto}
            progresso={s.progresso}
            raggio={RAGGIO.md}
            fondo={fondo}
          />
          {o.etichetta && (
            <Testo
              x={14}
              y={26}
              testo={o.etichetta}
              tratto={tratto}
              corpo={CORPO.normale}
              progresso={s.progresso}
            />
          )}
        </g>
      );
    case 'testo':
      return (
        <g>
          <Testo
            x={0}
            y={0}
            testo={o.testo}
            tratto={tratto}
            corpo={o.corpo}
            ancora={o.ancora}
            famiglia={o.famiglia}
            progresso={s.progresso}
          />
        </g>
      );
    case 'file': {
      const piega = 18;
      return (
        <g>
          <Forma
            chiave={o.id}
            g={{
              f: 'poligono',
              punti: [
                [0, 0],
                [o.l - piega, 0],
                [o.l, piega],
                [o.l, o.a],
                [0, o.a],
              ],
              pieno: true,
            }}
            tratto={tratto}
            progresso={s.progresso}
            fondo={styles.fondoCarta}
          />
          <Forma
            chiave={`${o.id}/piega`}
            g={{
              f: 'poligono',
              punti: [
                [o.l - piega, 0],
                [o.l - piega, piega],
                [o.l, piega],
              ],
            }}
            tratto={tratto}
            progresso={s.progresso}
          />
          <Testo
            x={14}
            y={26}
            testo={o.nome}
            tratto={tratto}
            famiglia="codice"
            corpo={CORPO.piccolo}
            progresso={s.progresso}
          />
        </g>
      );
    }
    case 'riga': {
      const a = 28;
      return (
        <g>
          <Forma
            chiave={o.id}
            g={{ f: 'rett', x: 0, y: 0, l: o.l, a, pieno: true }}
            tratto={tratto}
            progresso={s.progresso}
            raggio={RAGGIO.xs}
            fondo={fondo}
          />
          <Testo
            x={10}
            y={19}
            testo={o.testo}
            tratto={tratto}
            famiglia="codice"
            corpo={CORPO.piccolo}
            progresso={s.progresso}
          />
          {s.barrato > 0 && (
            <g style={{ color: 'var(--fig-errore)' }}>
              <Forma
                chiave={`${o.id}/barra`}
                g={{ f: 'linea', x0: -4, y0: a / 2, x1: o.l + 4, y1: a / 2 }}
                tratto={tratto}
                progresso={s.barrato}
                classe={styles.spesso}
              />
            </g>
          )}
        </g>
      );
    }
    case 'persona':
      return (
        <g>
          <Forma
            chiave={`${o.id}/testa`}
            g={{ f: 'cerchio', x: 0, y: -34, d: 26, pieno: true }}
            tratto={tratto}
            progresso={s.progresso}
            fondo={fondo}
          />
          <Forma
            chiave={`${o.id}/busto`}
            g={{
              f: 'path',
              d: 'M-24 6C-24 -12 -12 -18 0 -18C12 -18 24 -12 24 6Z',
              pieno: true,
            }}
            tratto={tratto}
            progresso={s.progresso}
            fondo={fondo}
          />
          <Testo
            x={34}
            y={-12}
            testo={o.nome}
            tratto={tratto}
            corpo={CORPO.grande}
            progresso={s.progresso}
          />
        </g>
      );
    case 'freccia': {
      const lx = o.x2 - o.x;
      const ly = o.y2 - o.y;
      const lung = Math.hypot(lx, ly) || 1;
      // Punto di controllo: a metà corda, scostato in perpendicolare.
      const c = o.curva ?? 0;
      const cx = lx / 2 + (-ly / lung) * c;
      const cy = ly / 2 + (lx / lung) * c;
      // Direzione d'arrivo: dal punto di controllo alla punta.
      const ang = Math.atan2(ly - cy, lx - cx);
      const p = 11;
      const ala = (s2: number) =>
        [
          lx - p * Math.cos(ang + s2 * 0.45),
          ly - p * Math.sin(ang + s2 * 0.45),
        ] as [number, number];
      // Etichetta: a metà curva, scostata dalla parte della normale che sale.
      let nx = -ly / lung;
      let ny = lx / lung;
      if (ny > 0 || (ny === 0 && nx > 0)) {
        nx = -nx;
        ny = -ny;
      }
      const etX = cx / 2 + lx / 4 + nx * 10;
      const etY = cy / 2 + ly / 4 + ny * 10 + (Math.abs(nx) < 0.3 ? -2 : 4);
      const corpoP = Math.min(1, s.progresso / 0.85);
      const punta = Math.max(0, (s.progresso - 0.85) / 0.15);
      return (
        <g>
          <Forma
            chiave={o.id}
            g={{ f: 'path', d: `M0 0Q${r2(cx)} ${r2(cy)} ${lx} ${ly}` }}
            tratto={tratto}
            progresso={corpoP}
          />
          <Forma
            chiave={`${o.id}/punta`}
            g={{
              f: 'path',
              d: `M${ala(1).map(r2).join(' ')}L${lx} ${ly}L${ala(-1).map(r2).join(' ')}`,
            }}
            tratto={tratto}
            progresso={punta}
          />
          {o.etichetta && (
            <Testo
              x={r2(etX)}
              y={r2(etY)}
              testo={o.etichetta}
              tratto={tratto}
              corpo={CORPO.piccolo}
              ancora={Math.abs(nx) < 0.3 ? 'middle' : nx > 0 ? 'start' : 'end'}
              progresso={punta}
            />
          )}
        </g>
      );
    }
    case 'contatore':
      return (
        <g>
          <Testo
            x={0}
            y={0}
            testo={`${Math.round(s.valore)} ${o.unita}`}
            tratto={tratto}
            corpo={o.corpo ?? CORPO.grande}
            ancora="middle"
            progresso={s.progresso}
            classe={styles.cifre}
          />
        </g>
      );
  }
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
