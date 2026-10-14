/**
 * DiagrammaER — PROTOTIPO della fase E0 (pm/piano-2026-10-lezione-entita-attributi.md).
 *
 * Diagramma Entità-Associazione in notazione Batini (rettangolo, rombo,
 * lecca-lecca, cardinalità (min,max)) con il tratto di Excalidraw: rough.js
 * per le linee, Excalifont per il testo.
 *
 * - Il tratto viene da `rough.generator()`, che produce le path senza DOM:
 *   il diagramma si genera anche lato server ed è già nell'HTML della build.
 * - Ogni forma ha un seed fisso: stesso disegno a ogni render.
 * - L'autore dispone entità e associazioni su una griglia (`col`, `riga`);
 *   attributi, linee ed etichette delle cardinalità li piazza il componente.
 */
import React from 'react';
import rough from 'roughjs';
import styles from './styles.module.css';

export type Attributo = string | { nome: string; identificatore?: boolean };

export interface Entita {
  id: string;
  etichetta?: string;
  col: number;
  riga: number;
  attributi?: Attributo[];
  /** Lato del rettangolo da cui escono gli attributi. */
  latoAttributi?: 'sopra' | 'sotto';
}

export interface Partecipazione {
  entita: string;
  /** Cardinalità in notazione (min,max), es. "(1,1)" o "(0,N)". */
  card: string;
}

export interface Associazione {
  id: string;
  etichetta?: string;
  col: number;
  riga: number;
  tra: [Partecipazione, Partecipazione];
}

export interface DiagrammaERProps {
  entita: Entita[];
  associazioni?: Associazione[];
  /** Testo alternativo: diventa il <title> dell'SVG. */
  titolo: string;
  descrizione?: string;
  seed?: number;
}

const CELLA_L = 210;
const CELLA_A = 190;
const MARGINE = 24;

const FONT_ENTITA = 21;
const FONT_ASSOC = 17;
const FONT_ATTR = 16;
const FONT_CARD = 16;

const ENTITA_A = 56;
const ROMBO_A = 64;
const STELO = 26;
const PALLINO = 11;

// Excalifont è largo: ~0,58 em per carattere in media. Basta una stima, il
// testo è centrato sul suo punto.
const larghezzaTesto = (testo: string, size: number) =>
  testo.length * size * 0.58;

interface Box {
  x: number;
  y: number;
  l: number;
  a: number;
}

interface Testo {
  x: number;
  y: number;
  testo: string;
  size: number;
  classe: string;
  anchor?: 'start' | 'middle' | 'end';
}

interface Forma {
  d: string;
  riempimento: boolean;
  classe: string;
}

const nomeAttr = (a: Attributo) => (typeof a === 'string' ? a : a.nome);
const isId = (a: Attributo) => typeof a !== 'string' && !!a.identificatore;

export default function DiagrammaER({
  entita,
  associazioni = [],
  titolo,
  descrizione,
  seed = 7,
}: DiagrammaERProps): JSX.Element {
  const gen = rough.generator();
  let n = 0;
  const opzioni = (extra: Record<string, unknown> = {}) => ({
    seed: seed + 97 * n++,
    roughness: 1.1,
    bowing: 1,
    strokeWidth: 1.7,
    stroke: 'currentColor',
    ...extra,
  });

  const forme: Forma[] = [];
  const testi: Testo[] = [];
  const aggiungi = (drawable: ReturnType<typeof gen.line>, classe: string) => {
    for (const p of gen.toPaths(drawable)) {
      const riempimento = !!p.fill && p.fill !== 'none';
      forme.push({ d: p.d, riempimento, classe });
    }
  };

  const centro = (col: number, riga: number) => ({
    cx: MARGINE + col * CELLA_L + CELLA_L / 2,
    cy: MARGINE + riga * CELLA_A + CELLA_A / 2,
  });

  // ── Entità ────────────────────────────────────────────────────────────
  const boxEntita = new Map<string, Box>();
  for (const e of entita) {
    const etichetta = e.etichetta ?? e.id;
    const attributi = e.attributi ?? [];
    const { cx, cy } = centro(e.col, e.riga);
    const l = Math.max(130, larghezzaTesto(etichetta, FONT_ENTITA) + 44);
    const box = { x: cx - l / 2, y: cy - ENTITA_A / 2, l, a: ENTITA_A };
    boxEntita.set(e.id, box);

    aggiungi(
      gen.rectangle(
        box.x,
        box.y,
        box.l,
        box.a,
        opzioni({ fill: 'x', fillStyle: 'solid' }),
      ),
      styles.entita,
    );
    testi.push({
      x: cx,
      y: cy + FONT_ENTITA * 0.35,
      testo: etichetta,
      size: FONT_ENTITA,
      classe: styles.testoEntita,
    });

    if (attributi.length === 0) continue;
    const sopra = (e.latoAttributi ?? 'sopra') === 'sopra';
    const bordoY = sopra ? box.y : box.y + box.a;
    const verso = sopra ? -1 : 1;
    // Le etichette affiancate decidono la larghezza della fila di pallini;
    // gli steli partono dal bordo, distribuiti dentro il rettangolo.
    const passi = attributi.map((a) =>
      Math.max(56, larghezzaTesto(nomeAttr(a), FONT_ATTR) + 16),
    );
    const fila = passi.reduce((s, p) => s + p, 0);
    let x = cx - fila / 2;
    attributi.forEach((a, i) => {
      const px = x + passi[i] / 2;
      x += passi[i];
      const attacco =
        box.x + 18 + ((box.l - 36) * (i + 0.5)) / attributi.length;
      const py = bordoY + verso * (STELO + PALLINO / 2);
      aggiungi(
        gen.line(attacco, bordoY, px, py - (verso * PALLINO) / 2, opzioni()),
        styles.linea,
      );
      aggiungi(
        gen.circle(
          px,
          py,
          PALLINO,
          opzioni({ fill: 'x', fillStyle: 'solid', roughness: 0.6 }),
        ),
        isId(a) ? styles.pallinoPieno : styles.pallino,
      );
      testi.push({
        x: px,
        y: sopra ? py - PALLINO - 4 : py + PALLINO + FONT_ATTR,
        testo: nomeAttr(a),
        size: FONT_ATTR,
        classe: styles.testoAttr,
      });
    });
  }

  // ── Associazioni ──────────────────────────────────────────────────────
  for (const r of associazioni) {
    const etichetta = r.etichetta ?? r.id;
    const { cx, cy } = centro(r.col, r.riga);
    const l = Math.max(110, larghezzaTesto(etichetta, FONT_ASSOC) + 56);
    const vertici: Record<string, [number, number]> = {
      sx: [cx - l / 2, cy],
      dx: [cx + l / 2, cy],
      su: [cx, cy - ROMBO_A / 2],
      giu: [cx, cy + ROMBO_A / 2],
    };
    aggiungi(
      gen.polygon(
        [vertici.su, vertici.dx, vertici.giu, vertici.sx],
        opzioni({ fill: 'x', fillStyle: 'solid' }),
      ),
      styles.associazione,
    );
    testi.push({
      x: cx,
      y: cy + FONT_ASSOC * 0.35,
      testo: etichetta,
      size: FONT_ASSOC,
      classe: styles.testoAssoc,
    });

    for (const p of r.tra) {
      const box = boxEntita.get(p.entita);
      if (!box) continue;
      const ex = box.x + box.l / 2;
      const ey = box.y + box.a / 2;
      const orizzontale = Math.abs(ex - cx) >= Math.abs(ey - cy);
      let da: [number, number];
      let a: [number, number];
      if (orizzontale) {
        const aDestra = ex < cx;
        da = [aDestra ? box.x + box.l : box.x, ey];
        a = aDestra ? vertici.sx : vertici.dx;
        testi.push({
          x: da[0] + (aDestra ? 10 : -10),
          y: da[1] - 10,
          testo: p.card,
          size: FONT_CARD,
          classe: styles.testoCard,
          anchor: aDestra ? 'start' : 'end',
        });
      } else {
        const sotto = ey < cy;
        da = [ex, sotto ? box.y + box.a : box.y];
        a = sotto ? vertici.su : vertici.giu;
        testi.push({
          x: da[0] + 12,
          y: da[1] + (sotto ? FONT_CARD + 6 : -10),
          testo: p.card,
          size: FONT_CARD,
          classe: styles.testoCard,
          anchor: 'start',
        });
      }
      aggiungi(gen.line(da[0], da[1], a[0], a[1], opzioni()), styles.linea);
    }
  }

  // ── viewBox dai contenuti ─────────────────────────────────────────────
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const t of testi) {
    const w = larghezzaTesto(t.testo, t.size);
    const x0 =
      t.anchor === 'start' ? t.x : t.anchor === 'end' ? t.x - w : t.x - w / 2;
    minX = Math.min(minX, x0);
    maxX = Math.max(maxX, x0 + w);
    minY = Math.min(minY, t.y - t.size);
    maxY = Math.max(maxY, t.y + t.size * 0.3);
  }
  for (const b of boxEntita.values()) {
    minX = Math.min(minX, b.x);
    maxX = Math.max(maxX, b.x + b.l);
    minY = Math.min(minY, b.y);
    maxY = Math.max(maxY, b.y + b.a);
  }
  const pad = 12;
  const vb = {
    x: minX - pad,
    y: minY - pad,
    l: maxX - minX + 2 * pad,
    a: maxY - minY + 2 * pad,
  };

  const idTitolo = `er-${titolo.replace(/\W+/g, '-').toLowerCase()}`;
  return (
    <figure className={styles.figura}>
      <svg
        className={styles.diagramma}
        viewBox={`${vb.x} ${vb.y} ${vb.l} ${vb.a}`}
        style={{ maxWidth: `${Math.round(vb.l)}px` }}
        role="img"
        aria-labelledby={idTitolo}
      >
        <title id={idTitolo}>{titolo}</title>
        {descrizione && <desc>{descrizione}</desc>}
        {forme.map((f, i) => (
          <path
            key={i}
            d={f.d}
            className={`${f.classe} ${f.riempimento ? styles.fill : styles.tratto}`}
          />
        ))}
        {testi.map((t, i) => (
          <text
            key={i}
            x={t.x}
            y={t.y}
            fontSize={t.size}
            textAnchor={t.anchor ?? 'middle'}
            className={`${styles.testo} ${t.classe}`}
          >
            {t.testo}
          </text>
        ))}
      </svg>
    </figure>
  );
}
