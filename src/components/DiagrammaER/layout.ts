/**
 * Disposizione e disegno di <DiagrammaER>: dalle props alle forme e ai testi,
 * senza React e senza DOM. Il tratto viene da `rough.generator()`, quindi il
 * diagramma si genera anche lato server. Spec: sezione E1 di
 * pm/piano-2026-10-lezione-entita-attributi.md.
 */
import rough from 'roughjs';
import larghezze from './larghezze-excalifont.json';
import type {
  Attributo,
  Associazione,
  Disegno,
  DiagrammaERProps,
  Entita,
  Forma,
  Lato,
  Testo,
  TipoForma,
  TipoTesto,
} from './types';

const GLIFI = larghezze.glifi as Record<string, number>;

const FONT_ENTITA = 21;
const FONT_ASSOC = 17;
const FONT_ATTR = 16;
const FONT_CARD = 16;
const FONT_CARD_ATTR = 14;

const ENTITA_A = 56;
const ROMBO_A = 64;
const STELO = 26;
const PALLINO = 11;
const ELLISSE_A = 30;
const MARGINE_VB = 12;

const RE_CARD = /^\((0|1), ?(1|n|N)\)$/;
const COPERTURE = ['(t,e)', '(t,o)', '(p,e)', '(p,o)'];
const LATI: Lato[] = ['sopra', 'sotto', 'sinistra', 'destra'];

/** Larghezza di un testo: somma degli avanzamenti dei glifi di Excalifont. */
export const larghezzaTesto = (testo: string, size: number): number => {
  let em = 0;
  for (const c of testo) em += GLIFI[c] ?? 0.6;
  return em * size;
};

/** FNV-1a a 32 bit, ridotto all'intervallo dei seed di rough.js (1…2³¹-1). */
const seedDa = (chiave: string): number => {
  let h = 0x811c9dc5;
  for (let i = 0; i < chiave.length; i++) {
    h ^= chiave.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return (h % 2147483646) + 1;
};

interface AttrNorm {
  nome: string;
  lato?: Lato;
  identificatore: boolean;
  card?: string;
  componenti?: string[];
}

const norm = (a: Attributo): AttrNorm =>
  typeof a === 'string'
    ? { nome: a, identificatore: false }
    : {
        nome: a.nome,
        lato: a.lato,
        identificatore: !!a.identificatore,
        card: a.card,
        componenti: a.componenti,
      };

/** Distanza fra il nome di un attributo e la sua cardinalità. */
const SPAZIO_CARD = 14;

/** Larghezza dell'etichetta di un attributo semplice: nome e, se c'è, `card`. */
const larghezzaEtichetta = (a: AttrNorm): number =>
  larghezzaTesto(a.nome, FONT_ATTR) +
  (a.card ? SPAZIO_CARD + larghezzaTesto(a.card, FONT_CARD_ATTR) : 0);

/** Lunghezza occupata da un attributo lungo il lato su cui sta. */
const passoAttributo = (a: AttrNorm, oriz: boolean): number => {
  const comp = a.componenti ?? [];
  if (comp.length === 0) {
    return oriz ? Math.max(56, larghezzaEtichetta(a) + 16) : 34;
  }
  if (oriz) {
    const ellisse = larghezzaTesto(a.nome, FONT_ATTR) + 28;
    const fila = comp.reduce(
      (s, c) => s + Math.max(56, larghezzaTesto(c, FONT_ATTR) + 16),
      0,
    );
    return Math.max(ellisse + 12, fila);
  }
  return Math.max(ELLISSE_A + 14, comp.length * 34);
};

/** Distanza del punto (px, py) dal segmento (x0,y0)-(x1,y1). */
const distanzaSegmento = (
  px: number,
  py: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): number => {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const l2 = dx * dx + dy * dy;
  const t =
    l2 === 0
      ? 0
      : Math.max(0, Math.min(1, ((px - x0) * dx + (py - y0) * dy) / l2));
  return Math.hypot(px - (x0 + t * dx), py - (y0 + t * dy));
};

const DIR: Record<Lato, [number, number]> = {
  sopra: [0, -1],
  sotto: [0, 1],
  sinistra: [-1, 0],
  destra: [1, 0],
};
const orizzontale = (l: Lato) => l === 'sopra' || l === 'sotto';

/** Forma da cui escono gli attributi: rettangolo, rombo o ellisse. */
interface Proprietario {
  cx: number;
  cy: number;
  hw: number;
  hh: number;
  kind: 'rect' | 'rombo' | 'ellisse';
}

/** Coordinata del bordo estremo sul lato (y per sopra/sotto, x per i lati). */
const estremo = (p: Proprietario, l: Lato): number => {
  const [dx, dy] = DIR[l];
  return dx === 0 ? p.cy + dy * p.hh : p.cx + dx * p.hw;
};

/** Punto d'attacco di uno stelo sul lato; `t` in [-1,1] lungo il lato. */
const attacco = (p: Proprietario, l: Lato, t: number): [number, number] => {
  const [dx, dy] = DIR[l];
  const oriz = orizzontale(l);
  const metaLungo = oriz ? p.hw : p.hh;
  const metaPerp = oriz ? p.hh : p.hw;
  let s: number;
  let perp: number;
  if (p.kind === 'rect') {
    s = t * (metaLungo - (oriz ? 18 : 12));
    perp = metaPerp;
  } else if (p.kind === 'rombo') {
    s = t * metaLungo * 0.55;
    perp = metaPerp * (1 - 0.55 * Math.abs(t));
  } else {
    s = t * metaLungo * 0.55;
    perp = metaPerp * Math.sqrt(1 - (0.55 * t) ** 2);
  }
  return oriz ? [p.cx + s, p.cy + dy * perp] : [p.cx + dx * perp, p.cy + s];
};

export function calcola(props: DiagrammaERProps): Disegno {
  const { titolo, entita, associazioni = [], generalizzazioni = [] } = props;
  const [cellaL, cellaA] = props.cella ?? [210, 170];
  const err = (motivo: string) =>
    new Error(`[DiagrammaER] ${titolo}: ${motivo}`);

  const gen = rough.generator();
  const forme: Forma[] = [];
  const testi: Testo[] = [];
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const copri = (x0: number, y0: number, x1 = x0, y1 = y0) => {
    minX = Math.min(minX, x0, x1);
    maxX = Math.max(maxX, x0, x1);
    minY = Math.min(minY, y0, y1);
    maxY = Math.max(maxY, y0, y1);
  };

  const opz = (chiave: string, extra: Record<string, unknown> = {}) => ({
    seed: seedDa(chiave),
    roughness: 1.1,
    bowing: 1,
    strokeWidth: 1.7,
    stroke: 'currentColor',
    ...extra,
  });
  const riempi = { fill: 'x', fillStyle: 'solid' };

  const aggiungi = (drawable: ReturnType<typeof gen.line>, tipo: TipoForma) => {
    for (const p of gen.toPaths(drawable)) {
      forme.push({
        d: p.d,
        riempimento: !!p.fill && p.fill !== 'none',
        tipo,
      });
    }
  };
  const linea = (
    chiave: string,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
  ) => {
    aggiungi(gen.line(x0, y0, x1, y1, opz(chiave)), 'linea');
    copri(x0, y0, x1, y1);
  };
  const pallino = (chiave: string, x: number, y: number, pieno: boolean) => {
    aggiungi(
      gen.circle(x, y, PALLINO, opz(chiave, { ...riempi, roughness: 0.6 })),
      pieno ? 'pallinoPieno' : 'pallino',
    );
    copri(x - PALLINO / 2, y - PALLINO / 2, x + PALLINO / 2, y + PALLINO / 2);
  };
  const testo = (
    x: number,
    y: number,
    t: string,
    size: number,
    tipo: TipoTesto,
    anchor: Testo['anchor'] = 'middle',
  ) => {
    testi.push({ x, y, testo: t, size, tipo, anchor });
    const w = larghezzaTesto(t, size);
    const x0 = anchor === 'start' ? x : anchor === 'end' ? x - w : x - w / 2;
    copri(x0, y - size, x0 + w, y + size * 0.3);
  };

  /* ── Validazione di base ─────────────────────────────────────────────── */
  const cardOk = (c: string) => RE_CARD.test(c);
  const ids = new Set<string>();
  const celle = new Map<string, string>();
  for (const el of [...entita, ...associazioni]) {
    if (ids.has(el.id)) throw err(`id duplicato «${el.id}»`);
    ids.add(el.id);
    const k = `${el.col},${el.riga}`;
    const altro = celle.get(k);
    if (altro) {
      throw err(`«${el.id}» e «${altro}» stanno nella stessa cella (${k})`);
    }
    celle.set(k, el.id);
  }
  const entitaPerId = new Map(entita.map((e) => [e.id, e]));
  for (const r of associazioni) {
    for (const p of r.tra) {
      if (!entitaPerId.has(p.entita)) {
        throw err(
          `l'associazione «${r.id}» partecipa con l'entità «${p.entita}», che non esiste`,
        );
      }
      if (!cardOk(p.card)) {
        throw err(
          `cardinalità non valida «${p.card}» in «${r.id}» (attesa, per esempio, «(1,N)»)`,
        );
      }
    }
  }
  for (const g of generalizzazioni) {
    for (const id of [g.padre, ...g.figli]) {
      if (!entitaPerId.has(id)) {
        throw err(
          `la generalizzazione nomina l'entità «${id}», che non esiste`,
        );
      }
    }
    if (g.figli.length === 0) {
      throw err(`la generalizzazione di «${g.padre}» non ha figli`);
    }
    if (!COPERTURE.includes(g.copertura)) {
      throw err(
        `copertura non valida «${g.copertura}» (ammesse: ${COPERTURE.join(' ')})`,
      );
    }
  }
  const controllaAttr = (proprietario: string, attributi: Attributo[]) => {
    const nomi = new Set<string>();
    for (const a of attributi.map(norm)) {
      if (nomi.has(a.nome)) {
        throw err(`attributo duplicato «${a.nome}» in «${proprietario}»`);
      }
      nomi.add(a.nome);
      if (a.card !== undefined && !cardOk(a.card)) {
        throw err(
          `cardinalità non valida «${a.card}» sull'attributo «${a.nome}» di «${proprietario}»`,
        );
      }
    }
  };
  for (const e of entita) controllaAttr(e.id, e.attributi ?? []);
  for (const r of associazioni) controllaAttr(r.id, r.attributi ?? []);

  /* ── Geometria di entità e associazioni ──────────────────────────────── */
  const centro = (col: number, riga: number): [number, number] => [
    col * cellaL + cellaL / 2,
    riga * cellaA + cellaA / 2,
  ];
  const propEntita = new Map<string, Proprietario>();
  for (const e of entita) {
    const [cx, cy] = centro(e.col, e.riga);
    // Con tre o più attributi sopra o sotto il rettangolo si allarga fino alla
    // fila delle etichette, con un tetto: oltre il tetto il ventaglio resta.
    let fila = 0;
    for (const lato of ['sopra', 'sotto'] as Lato[]) {
      const sul = (e.attributi ?? [])
        .map(norm)
        .filter((a) => (a.lato ?? e.latoAttributi ?? 'sopra') === lato);
      if (sul.length >= 3) {
        fila = Math.max(
          fila,
          sul.reduce((somma, a) => somma + passoAttributo(a, true), 0),
        );
      }
    }
    const l = Math.max(
      130,
      larghezzaTesto(e.etichetta ?? e.id, FONT_ENTITA) + 44,
      Math.min(fila, 240),
    );
    propEntita.set(e.id, { cx, cy, hw: l / 2, hh: ENTITA_A / 2, kind: 'rect' });
  }
  const propAssoc = new Map<string, Proprietario>();
  for (const r of associazioni) {
    const [cx, cy] = centro(r.col, r.riga);
    const l = Math.max(
      110,
      larghezzaTesto(r.etichetta ?? r.id, FONT_ASSOC) + 56,
    );
    propAssoc.set(r.id, { cx, cy, hw: l / 2, hh: ROMBO_A / 2, kind: 'rombo' });
  }

  /** Lati da cui parte una linea, per entità e per associazione. */
  const usati = new Map<string, Set<Lato>>();
  const marca = (id: string, l: Lato) => {
    if (!usati.has(id)) usati.set(id, new Set());
    usati.get(id)!.add(l);
  };
  interface Collegamento {
    r: Associazione;
    entita: string;
    card: string;
    latoEntita: Lato;
    latoRombo: Lato;
  }
  const collegamenti: Collegamento[] = [];
  for (const r of associazioni) {
    const rombo = propAssoc.get(r.id)!;
    for (const p of r.tra) {
      const ent = propEntita.get(p.entita)!;
      const dx = ent.cx - rombo.cx;
      const dy = ent.cy - rombo.cy;
      let latoEntita: Lato;
      let latoRombo: Lato;
      if (Math.abs(dx) >= Math.abs(dy)) {
        latoEntita = dx < 0 ? 'destra' : 'sinistra';
        latoRombo = dx < 0 ? 'sinistra' : 'destra';
      } else {
        latoEntita = dy < 0 ? 'sotto' : 'sopra';
        latoRombo = dy < 0 ? 'sopra' : 'sotto';
      }
      marca(p.entita, latoEntita);
      marca(r.id, latoRombo);
      collegamenti.push({
        r,
        entita: p.entita,
        card: p.card,
        latoEntita,
        latoRombo,
      });
    }
  }
  for (const g of generalizzazioni) {
    marca(g.padre, 'sotto');
    for (const f of g.figli) marca(f, 'sopra');
  }

  /* ── Attributi ───────────────────────────────────────────────────────── */
  interface Elemento {
    a: AttrNorm;
    /** Lunghezza occupata lungo il lato. */
    passo: number;
  }

  /**
   * Piazza una fila di lecca-lecca sul lato `lato` del proprietario `p`.
   * Restituisce, per ogni attributo, il punto medio dello stelo (serve
   * all'identificatore composto).
   */
  const piazzaLato = (
    chiaveBase: string,
    p: Proprietario,
    lato: Lato,
    attributi: AttrNorm[],
    identificatore: string[] = [],
  ) => {
    const oriz = orizzontale(lato);
    const [dx, dy] = DIR[lato];
    const dir = oriz ? dy : dx;
    const base = estremo(p, lato);
    const elementi: Elemento[] = attributi.map((a) => ({
      a,
      passo: passoAttributo(a, oriz),
    }));
    const totale = elementi.reduce((s, e) => s + e.passo, 0);
    let pos = (oriz ? p.cx : p.cy) - totale / 2;
    const n = elementi.length;
    const meta: Array<{ lungo: number; trasv: number }> = [];
    // Steli ed etichette della fila: servono a tenere lontano il cerchio
    // dell'identificatore composto.
    const steli: Array<[number, number, number, number]> = [];
    const rettangoli: Array<[number, number, number, number]> = [];
    const etichetta = (
      x: number,
      y: number,
      t: string,
      size: number,
      tipo: TipoTesto,
      anchor: Testo['anchor'],
    ) => {
      testo(x, y, t, size, tipo, anchor);
      const w = larghezzaTesto(t, size);
      const x0 = anchor === 'start' ? x : anchor === 'end' ? x - w : x - w / 2;
      rettangoli.push([x0, y - size, x0 + w, y + size * 0.3]);
    };

    elementi.forEach(({ a, passo }, i) => {
      const u = pos + passo / 2;
      pos += passo;
      const t = n === 1 ? 0 : (2 * (i + 0.5)) / n - 1;
      const [ax, ay] = attacco(p, lato, t);
      const chiave = `${chiaveBase}/${a.nome}`;
      const composto = (a.componenti?.length ?? 0) > 0;
      const stelo = composto ? STELO : STELO + PALLINO / 2;
      // centro del terminale (cerchio o ellisse) e fine dello stelo
      const trasv = base + dir * (composto ? STELO + ELLISSE_A / 2 : stelo);
      const fineStelo = composto
        ? base + dir * STELO
        : trasv - (dir * PALLINO) / 2;
      meta.push({
        lungo: (oriz ? ax : ay) / 2 + u / 2,
        trasv: (oriz ? ay : ax) / 2 + fineStelo / 2,
      });

      if (oriz) {
        linea(`${chiave}/stelo`, ax, ay, u, fineStelo);
        steli.push([ax, ay, u, fineStelo]);
      } else {
        linea(`${chiave}/stelo`, ax, ay, fineStelo, u);
        steli.push([ax, ay, fineStelo, u]);
      }

      if (!composto) {
        const cx = oriz ? u : trasv;
        const cy = oriz ? trasv : u;
        pallino(`${chiave}/cerchio`, cx, cy, a.identificatore);
        const wNome = larghezzaTesto(a.nome, FONT_ATTR);
        const wCard = a.card ? larghezzaTesto(a.card, FONT_CARD_ATTR) : 0;
        const wTot = larghezzaEtichetta(a);
        if (oriz) {
          // nome e cardinalità sulla stessa linea di base, centrati sul cerchio
          const y =
            lato === 'sopra'
              ? cy - PALLINO / 2 - 6
              : cy + PALLINO / 2 + FONT_ATTR - 2;
          const x0 = cx - wTot / 2;
          etichetta(x0, y, a.nome, FONT_ATTR, 'attr', 'start');
          if (a.card) {
            etichetta(
              x0 + wNome + SPAZIO_CARD,
              y,
              a.card,
              FONT_CARD_ATTR,
              'cardAttr',
              'start',
            );
          }
        } else if (lato === 'sinistra') {
          const x1 = cx - PALLINO / 2 - 6;
          if (a.card) {
            etichetta(x1, cy + 5, a.card, FONT_CARD_ATTR, 'cardAttr', 'end');
          }
          etichetta(
            x1 - (a.card ? wCard + SPAZIO_CARD : 0),
            cy + 5,
            a.nome,
            FONT_ATTR,
            'attr',
            'end',
          );
        } else {
          const x0 = cx + PALLINO / 2 + 6;
          etichetta(x0, cy + 5, a.nome, FONT_ATTR, 'attr', 'start');
          if (a.card) {
            etichetta(
              x0 + wNome + SPAZIO_CARD,
              cy + 5,
              a.card,
              FONT_CARD_ATTR,
              'cardAttr',
              'start',
            );
          }
        }
        steli.push([cx, cy, cx, cy]);
      } else {
        const lEll = larghezzaTesto(a.nome, FONT_ATTR) + 28;
        const cx = oriz ? u : trasv;
        const cy = oriz ? trasv : u;
        const w = lEll;
        aggiungi(
          gen.ellipse(cx, cy, w, ELLISSE_A, opz(`${chiave}/ellisse`, riempi)),
          'ellisse',
        );
        copri(cx - w / 2, cy - ELLISSE_A / 2, cx + w / 2, cy + ELLISSE_A / 2);
        testo(cx, cy + 5, a.nome, FONT_ATTR, 'attr');
        const ell: Proprietario = {
          cx,
          cy,
          hw: w / 2,
          hh: ELLISSE_A / 2,
          kind: 'ellisse',
        };
        piazzaLato(
          `${chiave}/componenti`,
          ell,
          lato,
          (a.componenti ?? []).map((c) => ({ nome: c, identificatore: false })),
        );
      }

      if (a.card && composto) {
        // attributo composto: la cardinalità sta accanto all'ellisse
        const cx = oriz ? u : trasv;
        const cy = oriz ? trasv : u;
        const w = larghezzaTesto(a.nome, FONT_ATTR) + 28;
        etichetta(
          cx + w / 2 + SPAZIO_CARD,
          cy + 5,
          a.card,
          FONT_CARD_ATTR,
          'cardAttr',
          'start',
        );
      }
    });

    if (identificatore.length >= 2) {
      const indici = identificatore.map((nome) =>
        attributi.findIndex((a) => a.nome === nome),
      );
      const primo = Math.min(...indici);
      const ultimo = Math.max(...indici);
      const a = meta[primo];
      const b = meta[ultimo];
      const chiave = `${chiaveBase}/identificatore`;
      // Il segmento attraversa gli steli a metà lunghezza e prosegue di due
      // diametri oltre l'ultimo (o oltre il primo, se l'identificatore è in
      // testa alla fila); il cerchio resta ad almeno un diametro da ogni
      // stelo ed etichetta, altrimenti il segmento va avanti verso l'esterno.
      const versoSinistra = primo === 0 && ultimo < attributi.length - 1;
      const verso = versoSinistra ? -1 : 1;
      const radice = versoSinistra ? a : b;
      const libero = (lungo: number) => {
        const x = oriz ? lungo : radice.trasv;
        const y = oriz ? radice.trasv : lungo;
        const minimo = PALLINO + PALLINO / 2;
        for (const [x0, y0, x1, y1] of steli) {
          if (distanzaSegmento(x, y, x0, y0, x1, y1) < minimo) return false;
        }
        for (const [x0, y0, x1, y1] of rettangoli) {
          const dx = Math.max(x0 - x, 0, x - x1);
          const dy = Math.max(y0 - y, 0, y - y1);
          if (Math.hypot(dx, dy) < minimo) return false;
        }
        return true;
      };
      let fine = radice.lungo + verso * 2 * PALLINO;
      for (let k = 0; k < 120 && !libero(fine); k++) fine += verso * 4;
      const da = versoSinistra ? fine : a.lungo;
      const aa = versoSinistra ? b.lungo : fine;
      if (oriz) {
        linea(chiave, da, a.trasv, aa, b.trasv);
        pallino(`${chiave}/cerchio`, fine, radice.trasv, true);
      } else {
        linea(chiave, a.trasv, da, b.trasv, aa);
        pallino(`${chiave}/cerchio`, radice.trasv, fine, true);
      }
    }
  };

  /** Raggruppa gli attributi per lato e valida l'identificatore composto. */
  const attributiPerLato = (
    id: string,
    attributi: Attributo[],
    latoDefault: Lato,
    identificatore: string[] | undefined,
  ) => {
    const gruppi = new Map<Lato, AttrNorm[]>();
    for (const a of attributi.map(norm)) {
      const l = a.lato ?? latoDefault;
      if (!LATI.includes(l)) throw err(`lato non valido «${l}» in «${id}»`);
      if (usati.get(id)?.has(l)) {
        throw err(
          `«${id}» ha attributi sul lato «${l}», da cui parte già una linea`,
        );
      }
      if (!gruppi.has(l)) gruppi.set(l, []);
      gruppi.get(l)!.push(a);
    }
    if (identificatore !== undefined) {
      if (identificatore.length < 2) {
        throw err(
          `l'identificatore composto di «${id}» ha meno di due attributi`,
        );
      }
      const dove = identificatore.map((nome) => {
        for (const [l, lista] of gruppi) {
          const i = lista.findIndex((a) => a.nome === nome);
          if (i >= 0) return { l, i };
        }
        throw err(
          `l'identificatore composto di «${id}» nomina «${nome}», che non è un suo attributo`,
        );
      });
      if (dove.some((d) => d.l !== dove[0].l)) {
        throw err(
          `gli attributi dell'identificatore composto di «${id}» stanno su lati diversi`,
        );
      }
      const indici = dove.map((d) => d.i).sort((x, y) => x - y);
      if (indici.some((v, k) => v !== indici[0] + k)) {
        throw err(
          `gli attributi dell'identificatore composto di «${id}» non sono contigui`,
        );
      }
    }
    return gruppi;
  };

  /* ── Disegno delle entità ────────────────────────────────────────────── */
  for (const e of entita as Entita[]) {
    const p = propEntita.get(e.id)!;
    aggiungi(
      gen.rectangle(
        p.cx - p.hw,
        p.cy - p.hh,
        2 * p.hw,
        2 * p.hh,
        opz(`${e.id}/rettangolo`, riempi),
      ),
      'entita',
    );
    copri(p.cx - p.hw, p.cy - p.hh, p.cx + p.hw, p.cy + p.hh);
    testo(
      p.cx,
      p.cy + FONT_ENTITA * 0.35,
      e.etichetta ?? e.id,
      FONT_ENTITA,
      'entita',
    );

    const gruppi = attributiPerLato(
      e.id,
      e.attributi ?? [],
      e.latoAttributi ?? 'sopra',
      e.identificatore,
    );
    for (const l of LATI) {
      const lista = gruppi.get(l);
      if (!lista) continue;
      const compone =
        e.identificatore && lista.some((a) => a.nome === e.identificatore![0])
          ? e.identificatore
          : [];
      piazzaLato(e.id, p, l, lista, compone);
    }
  }

  /* ── Disegno delle associazioni ──────────────────────────────────────── */
  for (const r of associazioni) {
    const p = propAssoc.get(r.id)!;
    const { cx, cy, hw, hh } = p;
    aggiungi(
      gen.polygon(
        [
          [cx, cy - hh],
          [cx + hw, cy],
          [cx, cy + hh],
          [cx - hw, cy],
        ],
        opz(`${r.id}/rombo`, riempi),
      ),
      'associazione',
    );
    copri(cx - hw, cy - hh, cx + hw, cy + hh);
    testo(cx, cy + FONT_ASSOC * 0.35, r.etichetta ?? r.id, FONT_ASSOC, 'assoc');

    if ((r.attributi ?? []).length > 0) {
      const liberi = usati.get(r.id) ?? new Set<Lato>();
      const predefinito: Lato =
        r.latoAttributi ??
        (['sopra', 'destra', 'sotto', 'sinistra'] as Lato[]).find(
          (l) => !liberi.has(l),
        ) ??
        'sopra';
      const gruppi = attributiPerLato(
        r.id,
        r.attributi ?? [],
        predefinito,
        undefined,
      );
      for (const l of LATI) {
        const lista = gruppi.get(l);
        if (lista) piazzaLato(r.id, p, l, lista);
      }
    }
  }

  /* ── Linee fra entità e associazioni, con le cardinalità ─────────────── */
  for (const c of collegamenti) {
    const ent = propEntita.get(c.entita)!;
    const rombo = propAssoc.get(c.r.id)!;
    const da = attacco({ ...ent, kind: 'rect' }, c.latoEntita, 0);
    const [vx, vy] = DIR[c.latoRombo];
    const a: [number, number] = [
      rombo.cx + vx * rombo.hw,
      rombo.cy + vy * rombo.hh,
    ];
    const chiave = `${c.r.id}/${c.entita}`;
    if (orizzontale(c.latoEntita)) {
      const sotto = c.latoEntita === 'sotto';
      testo(
        da[0] + 12,
        da[1] + (sotto ? FONT_CARD + 6 : -10),
        c.card,
        FONT_CARD,
        'card',
        'start',
      );
    } else {
      const aDestra = c.latoEntita === 'destra';
      testo(
        da[0] + (aDestra ? 10 : -10),
        da[1] - 10,
        c.card,
        FONT_CARD,
        'card',
        aDestra ? 'start' : 'end',
      );
    }
    linea(chiave, da[0], da[1], a[0], a[1]);
  }

  /* ── Generalizzazioni ────────────────────────────────────────────────── */
  for (const g of generalizzazioni) {
    const padre = propEntita.get(g.padre)!;
    const figli = g.figli.map((f) => propEntita.get(f)!);
    const topFigli = Math.min(...figli.map((f) => f.cy - f.hh));
    const yBarra = topFigli - 30;
    const x0 = Math.min(...figli.map((f) => f.cx)) - 10;
    const x1 = Math.max(...figli.map((f) => f.cx)) + 10;
    const chiave = `gen/${g.padre}`;
    aggiungi(
      gen.line(
        x0,
        yBarra,
        x1,
        yBarra,
        opz(`${chiave}/barra`, { strokeWidth: 2.4 }),
      ),
      'linea',
    );
    copri(x0, yBarra, x1, yBarra);
    g.figli.forEach((f, i) => {
      const fig = figli[i];
      linea(`${chiave}/${f}`, fig.cx, yBarra, fig.cx, fig.cy - fig.hh);
    });
    const xBarra = Math.min(Math.max(padre.cx, x0), x1);
    const base = padre.cy + padre.hh;
    const punta: [number, number] = [padre.cx, base];
    const dxF = padre.cx - xBarra;
    const dyF = base - yBarra; // negativo: il padre sta sopra la barra
    const lun = Math.hypot(dxF, dyF) || 1;
    const ux = dxF / lun;
    const uy = dyF / lun;
    const basePunta: [number, number] = [
      punta[0] - ux * 14,
      punta[1] - uy * 14,
    ];
    linea(`${chiave}/freccia`, xBarra, yBarra, basePunta[0], basePunta[1]);
    const nx = -uy * 6;
    const ny = ux * 6;
    aggiungi(
      gen.polygon(
        [
          punta,
          [basePunta[0] + nx, basePunta[1] + ny],
          [basePunta[0] - nx, basePunta[1] - ny],
        ],
        opz(`${chiave}/punta`, { ...riempi, roughness: 0.4 }),
      ),
      'freccia',
    );
    testo(
      (xBarra + basePunta[0]) / 2 + 12,
      (yBarra + basePunta[1]) / 2 + 5,
      g.copertura,
      FONT_CARD,
      'card',
      'start',
    );
  }

  const l = maxX - minX + 2 * MARGINE_VB;
  const a = maxY - minY + 2 * MARGINE_VB;
  return {
    forme,
    testi,
    vb: { x: minX - MARGINE_VB, y: minY - MARGINE_VB, l, a },
  };
}
