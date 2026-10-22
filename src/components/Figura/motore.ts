/**
 * Motore di <Figura>: lo stato di ogni oggetto in funzione di (passo, fase),
 * senza React, senza DOM e senza orologio. È una funzione pura: lo stesso
 * istante dà sempre lo stesso disegno, e su questo stanno il poster nell'HTML
 * della build, le foto di verifica e l'export futuro.
 */
import type { Animazione, Curva, Oggetto, Passo, Scena, Stato } from './tipi';

/**
 * Durate dei token di custom.css (`--dur-fast/normal/slow`). Le animazioni
 * delle figure ne usano multipli di `--dur-slow`: niente durate nuove.
 */
export const DUR = { fast: 150, normal: 200, slow: 280 } as const;

const DURATA_DEFAULT: Record<Animazione['fai'], number> = {
  Create: 3 * DUR.slow,
  Write: 2 * DUR.slow,
  FadeIn: 2 * DUR.slow,
  FadeOut: 2 * DUR.slow,
  MoveTo: 3 * DUR.slow,
  Count: 3 * DUR.slow,
  Indicate: 2 * DUR.slow,
  Strike: 2 * DUR.slow,
  Transform: 3 * DUR.slow,
};

/** Punti di controllo dei token `--ease-*` di custom.css. */
const CURVE: Record<
  Exclude<Curva, 'lineare'>,
  [number, number, number, number]
> = {
  smooth: [0.22, 1, 0.36, 1],
  out: [0.2, 0.8, 0.2, 1],
  spring: [0.34, 1.1, 0.38, 1],
};

/** cubic-bezier(x1, y1, x2, y2) valutata in x, come fa il CSS. */
const bezier = (
  [x1, y1, x2, y2]: [number, number, number, number],
  x: number,
): number => {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const fx = (t: number) => ((ax * t + bx) * t + cx) * t;
  // Newton, poi bisezione se la derivata è troppo piatta.
  let t = x;
  for (let i = 0; i < 8; i++) {
    const err = fx(t) - x;
    const d = (3 * ax * t + 2 * bx) * t + cx;
    if (Math.abs(err) < 1e-6) break;
    if (Math.abs(d) < 1e-6) break;
    t -= err / d;
  }
  if (Math.abs(fx(t) - x) > 1e-4) {
    let lo = 0;
    let hi = 1;
    t = x;
    for (let i = 0; i < 30; i++) {
      if (fx(t) < x) lo = t;
      else hi = t;
      t = (lo + hi) / 2;
    }
  }
  return ((ay * t + by) * t + cy) * t;
};

export const curva = (c: Curva | undefined, u: number): number => {
  const v = Math.max(0, Math.min(1, u));
  if (c === 'lineare') return v;
  return bezier(CURVE[c ?? 'smooth'], v);
};

const durataAnim = (a: Animazione) => a.durata ?? DURATA_DEFAULT[a.fai];

/** Durata dell'animazione di un passo, in ms (senza la pausa di lettura). */
export const durataPasso = (p: Passo): number =>
  Math.max(0, ...p.animazioni.map((a) => (a.ritardo ?? 0) + durataAnim(a)));

const STATO_VUOTO: Stato = {
  opacita: 0,
  dx: 0,
  dy: 0,
  progresso: 0,
  enfasi: 0,
  barrato: 0,
  valore: 0,
};

export type Stati = Record<string, Stato>;

const iniziali = (scena: Scena): Stati => {
  const s: Stati = {};
  for (const o of scena.oggetti) s[o.id] = { ...STATO_VUOTO, ...o.iniziale };
  return s;
};

const lerp = (a: number, b: number, e: number) => a + (b - a) * e;

/** Passo da cui parte la rivelazione, se c'è: indice del passo `rivela`. */
export const indiceRivela = (scena: Scena): number =>
  scena.passi.findIndex((p) => p.rivela);

/** Passo del poster: quello prima della rivelazione, altrimenti l'ultimo. */
export const passoPoster = (scena: Scena): number => {
  const r = indiceRivela(scena);
  return r > 0 ? r - 1 : scena.passi.length - 1;
};

/**
 * Stato di tutti gli oggetti alla `fase` (0…1) del passo `passo` (da 0).
 * I passi precedenti sono applicati per intero.
 */
export function statoAl(scena: Scena, passo: number, fase: number): Stati {
  const oggetti = new Map<string, Oggetto>(scena.oggetti.map((o) => [o.id, o]));
  let stati = iniziali(scena);
  const ultimo = Math.max(0, Math.min(passo, scena.passi.length - 1));

  for (let p = 0; p <= ultimo; p++) {
    const def = scena.passi[p];
    const durata = durataPasso(def);
    const f = p < ultimo ? 1 : Math.max(0, Math.min(1, fase));
    const t = f * durata;
    const prima = stati;
    const dopo: Stati = {};
    // L'accento del passo precedente si spegne all'inizio di questo.
    const spegni = curva('smooth', t / (2 * DUR.slow));
    for (const id of Object.keys(prima)) {
      dopo[id] = { ...prima[id], enfasi: lerp(prima[id].enfasi, 0, spegni) };
    }
    // Valore di partenza di ogni proprietà: dopo le animazioni già elencate.
    const partenza: Stati = {};
    for (const id of Object.keys(prima)) partenza[id] = { ...dopo[id] };
    const ordinate = [...def.animazioni].sort(
      (a, b) => (a.ritardo ?? 0) - (b.ritardo ?? 0),
    );

    const imposta = (
      id: string,
      prop: keyof Stato,
      fine: number,
      e: number,
      inizio?: number,
    ) => {
      const da = inizio ?? partenza[id][prop];
      dopo[id][prop] = lerp(da, fine, e);
      partenza[id][prop] = fine;
    };

    for (const a of ordinate) {
      const u = (t - (a.ritardo ?? 0)) / durataAnim(a);
      const e = curva(a.curva, u);
      const avviata = u > 0;
      switch (a.fai) {
        case 'Create':
        case 'Write':
          if (avviata) dopo[a.id].opacita = 1;
          partenza[a.id].opacita = 1;
          imposta(a.id, 'progresso', 1, curva(a.curva ?? 'lineare', u), 0);
          break;
        case 'FadeIn':
          if (avviata) dopo[a.id].progresso = 1;
          partenza[a.id].progresso = 1;
          imposta(a.id, 'opacita', 1, e);
          break;
        case 'FadeOut':
          imposta(a.id, 'opacita', 0, e);
          break;
        case 'MoveTo':
          imposta(a.id, 'dx', a.dx, e);
          imposta(a.id, 'dy', a.dy, e);
          break;
        case 'Count':
          imposta(a.id, 'valore', a.a, e);
          break;
        case 'Indicate':
          imposta(a.id, 'enfasi', 1, e);
          break;
        case 'Strike':
          imposta(a.id, 'barrato', 1, e);
          break;
        case 'Transform': {
          const da = oggetti.get(a.da)!;
          const verso = oggetti.get(a.a)!;
          imposta(a.da, 'opacita', 0, e);
          imposta(a.da, 'dx', verso.x - da.x, e);
          imposta(a.da, 'dy', verso.y - da.y, e);
          if (avviata) dopo[a.a].progresso = 1;
          partenza[a.a].progresso = 1;
          imposta(a.a, 'opacita', 1, e);
          imposta(a.a, 'dx', 0, e, da.x - verso.x);
          imposta(a.a, 'dy', 0, e, da.y - verso.y);
          break;
        }
      }
    }
    stati = dopo;
  }
  return stati;
}

/**
 * Validazione della scena: ferma la build con `[Figura] <id>: …`, come fa
 * `[DiagrammaER]`.
 */
export function valida(scena: Scena): void {
  const err = (m: string) => new Error(`[Figura] ${scena.id}: ${m}`);
  if (!scena.titolo) throw err('manca il titolo');
  if (scena.passi.length === 0) throw err('nessun passo');
  const ids = new Set<string>();
  for (const o of scena.oggetti) {
    if (ids.has(o.id)) throw err(`id duplicato «${o.id}»`);
    ids.add(o.id);
  }
  scena.passi.forEach((p, i) => {
    if (!p.didascalia.trim()) throw err(`passo ${i + 1} senza didascalia`);
    for (const a of p.animazioni) {
      const rif = a.fai === 'Transform' ? [a.da, a.a] : [a.id];
      for (const r of rif)
        if (!ids.has(r))
          throw err(`passo ${i + 1}: oggetto «${r}» inesistente`);
    }
  });
}
