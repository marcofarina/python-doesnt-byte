/**
 * Tratto a mano per <Figura>: rough.js con `rough.generator()` e seme fisso,
 * come DiagrammaER. Ogni forma si genera una volta sola (cache per chiave) e
 * poi si sposta con `transform`: il tremolio non cambia da un fotogramma
 * all'altro.
 *
 * Per l'effetto «si disegna» la path di rough.js si spezza nei suoi sottotratti
 * (uno per `move`): ognuno riceve `pathLength=1` e si scopre in ordine, in
 * proporzione alla propria lunghezza. Una path unica con `stroke-dashoffset`
 * non funziona: il tratteggio riparte a ogni sottotratto (vedi la tavola di
 * stile in docs/figure-test.mdx).
 */
import rough from 'roughjs';
import type { Options } from 'roughjs/bin/core';

export interface Sottotratto {
  d: string;
  /** Inizio e fine sulla lunghezza totale, normalizzati 0…1. */
  da: number;
  a: number;
}

export interface Pezzi {
  tratti: Sottotratto[];
  /** Path del riempimento, se la forma è piena. */
  fondo?: string;
  /** La path intera, per il confronto con il tratteggio ingenuo. */
  intera: string;
}

/** FNV-1a a 32 bit, ridotto all'intervallo dei seed di rough.js. */
export const seedDa = (chiave: string): number => {
  let h = 0x811c9dc5;
  for (let i = 0; i < chiave.length; i++) {
    h ^= chiave.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return (h % 2147483646) + 1;
};

const gen = rough.generator();
const cache = new Map<string, Pezzi>();

type Op = { op: 'move' | 'bcurveTo' | 'lineTo'; data: number[] };

const opz = (chiave: string, extra: Options = {}): Options => ({
  seed: seedDa(chiave),
  roughness: 1.1,
  bowing: 1,
  strokeWidth: 1.7,
  stroke: 'currentColor',
  ...extra,
});

/** Forme supportate dal prototipo. */
export type Geometria =
  | { f: 'rett'; x: number; y: number; l: number; a: number; pieno?: boolean }
  | { f: 'cerchio'; x: number; y: number; d: number; pieno?: boolean }
  | { f: 'linea'; x0: number; y0: number; x1: number; y1: number }
  | { f: 'poligono'; punti: [number, number][]; pieno?: boolean }
  | { f: 'path'; d: string; pieno?: boolean };

const disegna = (chiave: string, g: Geometria) => {
  const riempi: Options = { fill: 'x', fillStyle: 'solid' };
  switch (g.f) {
    case 'rett':
      return gen.rectangle(
        g.x,
        g.y,
        g.l,
        g.a,
        opz(chiave, g.pieno ? riempi : {}),
      );
    case 'cerchio':
      return gen.circle(g.x, g.y, g.d, opz(chiave, g.pieno ? riempi : {}));
    case 'linea':
      return gen.line(g.x0, g.y0, g.x1, g.y1, opz(chiave));
    case 'poligono':
      return gen.polygon(g.punti, opz(chiave, g.pieno ? riempi : {}));
    case 'path':
      return gen.path(g.d, opz(chiave, g.pieno ? riempi : {}));
  }
};

const f2 = (n: number) => Math.round(n * 100) / 100;

/** Forma a mano, divisa in sottotratti misurati. */
export function ruvido(chiave: string, g: Geometria): Pezzi {
  const k = `${chiave}|${JSON.stringify(g)}`;
  const c = cache.get(k);
  if (c) return c;

  const dr = disegna(chiave, g);
  const grezzi: { d: string; l: number }[] = [];
  let fondo: string | undefined;
  for (const set of dr.sets) {
    const ops = set.ops as Op[];
    if (set.type === 'fillPath') {
      fondo = gen.opsToPath(set);
      continue;
    }
    if (set.type !== 'path') continue;
    let d = '';
    let l = 0;
    let px = 0;
    let py = 0;
    for (const o of ops) {
      const [x, y] = o.data.slice(-2);
      if (o.op === 'move') {
        if (d) grezzi.push({ d, l });
        d = `M${f2(x)} ${f2(y)}`;
        l = 0;
      } else if (o.op === 'bcurveTo') {
        const [a, b, c2, e] = o.data;
        d += `C${o.data.map(f2).join(' ')}`;
        // Media fra corda e poligono di controllo: basta per dosare i tempi.
        const corda = Math.hypot(x - px, y - py);
        const poli =
          Math.hypot(a - px, b - py) +
          Math.hypot(c2 - a, e - b) +
          Math.hypot(x - c2, y - e);
        l += (corda + poli) / 2;
      } else {
        d += `L${f2(x)} ${f2(y)}`;
        l += Math.hypot(x - px, y - py);
      }
      px = x;
      py = y;
    }
    if (d) grezzi.push({ d, l });
  }

  // rough.js traccia ogni linea due volte, in due sottotratti consecutivi:
  // i due passaggi si scoprono insieme, come una mano che ripassa.
  const coppie: { d: string; l: number }[][] = [];
  for (let i = 0; i < grezzi.length; i += 2)
    coppie.push(grezzi.slice(i, i + 2));
  const totale = coppie.reduce((s, c2) => s + c2[0].l, 0) || 1;
  const tratti: Sottotratto[] = [];
  let acc = 0;
  for (const coppia of coppie) {
    const da = acc / totale;
    acc += coppia[0].l;
    for (const t of coppia) tratti.push({ d: t.d, da, a: acc / totale });
  }

  const pezzi: Pezzi = {
    tratti,
    fondo,
    intera: grezzi.map((t) => t.d).join(''),
  };
  cache.set(k, pezzi);
  return pezzi;
}

/** Quanto di un sottotratto è scoperto, dato il progresso della forma. */
export const scoperto = (t: Sottotratto, progresso: number): number =>
  t.a <= t.da
    ? progresso >= t.a
      ? 1
      : 0
    : Math.max(0, Math.min(1, (progresso - t.da) / (t.a - t.da)));
