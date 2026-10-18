/**
 * Tipi del componente <DiagrammaER>. Spec: sezione E1 di
 * pm/piano-2026-10-lezione-entita-attributi.md.
 */
export type Lato = 'sopra' | 'sotto' | 'sinistra' | 'destra';

export type Attributo =
  | string
  | {
      nome: string;
      /** Default: `latoAttributi` del proprietario. */
      lato?: Lato;
      /** Identificatore semplice: cerchio pieno. */
      identificatore?: boolean;
      /** `(0,1)` opzionale; `(1,N)` o `(0,N)` multivalore; `(1,1)` non si scrive. */
      card?: string;
      /** Attributo composto: nomi dei componenti. */
      componenti?: string[];
    };

export interface Entita {
  id: string;
  /** Default: `id`. */
  etichetta?: string;
  col: number;
  riga: number;
  attributi?: Attributo[];
  /** Default: `'sopra'`. */
  latoAttributi?: Lato;
  /** Identificatore composto: nomi di almeno 2 attributi. */
  identificatore?: string[];
}

export interface Partecipazione {
  entita: string;
  /**
   * Cardinalità in notazione (min,max), es. `(1,1)`, `(0,N)` o `(2,2)`.
   * Facoltativa: senza, la linea non ha etichetta (lezioni che vengono prima
   * delle cardinalità).
   */
  card?: string;
}

export interface Associazione {
  id: string;
  etichetta?: string;
  col: number;
  riga: number;
  tra: [Partecipazione, Partecipazione];
  /** Associazione con attributi propri (molti a molti). */
  attributi?: Attributo[];
  /** Default: perpendicolare alle linee. */
  latoAttributi?: Lato;
}

export type Copertura = '(t,e)' | '(t,o)' | '(p,e)' | '(p,o)';

export interface Generalizzazione {
  padre: string;
  figli: string[];
  copertura: Copertura;
}

export interface DiagrammaERProps {
  /** Obbligatorio: <title> dell'SVG. */
  titolo: string;
  /** Consigliata: <desc> dell'SVG. */
  descrizione?: string;
  entita: Entita[];
  associazioni?: Associazione[];
  generalizzazioni?: Generalizzazione[];
  /** Larghezza e altezza della cella della griglia. Default `[210, 170]`. */
  cella?: [number, number];
}

/* ── Output del layout (indipendente da React e dai CSS) ─────────────── */

export type TipoForma =
  | 'entita'
  | 'associazione'
  | 'pallino'
  | 'pallinoPieno'
  | 'ellisse'
  | 'freccia'
  | 'linea';

export interface Forma {
  d: string;
  /** Path di riempimento (rough.js) o di tratto. */
  riempimento: boolean;
  tipo: TipoForma;
}

export type TipoTesto = 'entita' | 'assoc' | 'attr' | 'card' | 'cardAttr';

export interface Testo {
  x: number;
  y: number;
  testo: string;
  size: number;
  tipo: TipoTesto;
  anchor: 'start' | 'middle' | 'end';
}

export interface Disegno {
  forme: Forma[];
  testi: Testo[];
  vb: { x: number; y: number; l: number; a: number };
}
