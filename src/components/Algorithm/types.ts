export interface ArrayItem {
  /** Identità stabile = indice nella sequenza iniziale. Determina il colore
   *  e permette le transizioni CSS quando l'elemento cambia slot. */
  id: number;
  value: number;
}

/** Riferimento a uno dei due lati di un confronto. */
export type CompareRef =
  | { kind: 'item'; i: number } // elemento nello slot i
  | { kind: 'extracted' } // l'elemento estratto (insertion sort)
  | { kind: 'target' }; // il valore cercato (ricerche)

export interface ArraySceneState {
  /** Slot della fila; null = slot vuoto (dopo extract/shiftRight). */
  items: (ArrayItem | null)[];
  /** Elemento fuori riga (insertion sort): disegnato sotto lo slot overIndex. */
  extracted: { item: ArrayItem; overIndex: number } | null;
  /** Badge etichettati sotto gli slot (min, L, R, P, mid…). Upsert per name. */
  pointers: { name: string; i: number }[];
  /** Graffa sotto la fila, da lo a hi inclusi. */
  range: { lo: number; hi: number; label?: string } | null;
  /** Coppia in confronto: bilancia centrata tra i due riferimenti. */
  comparing: { a: CompareRef; b: CompareRef } | null;
  /** Indici di slot marcati come definitivi (barra grigia). Additivo. */
  sorted: number[];
  /** Indici di slot attenuati (es. già scartati nella ricerca lineare). */
  faded: number[];
  /** Esito ricerca: null finché non noto. */
  outcome: { found: true; i: number } | { found: false } | null;
  /** Testo di fase (study): persiste finché un nuovo 'phase' lo sostituisce. */
  phase: string;
  /** Nota puntuale dello step corrente (study). */
  note: string;
}

export type ArrayStep = (
  | { op: 'compare'; i: number; j: number }
  | { op: 'compareTarget'; i: number }
  | { op: 'compareExtracted'; i: number }
  | { op: 'swap'; i: number; j: number }
  | { op: 'extract'; i: number }
  | { op: 'shiftRight'; from: number }
  | { op: 'insertAt'; i: number }
  | { op: 'pointer'; name: string; i: number | null }
  | { op: 'range'; lo: number; hi: number; label?: string }
  | { op: 'clearRange' }
  | { op: 'markSorted'; indices: number[] }
  | { op: 'fade'; indices: number[] }
  | { op: 'outcome'; found: boolean; i?: number }
  | { op: 'phase'; text: string }
  | { op: 'note' } // cambia solo la nota corrente
) & {
  /** Spiegazione puntuale mostrata in study. */
  note?: string;
  /** Riservato alla fase 2 (showCode): non emesso dai generatori fase 1. */
  line?: number;
};

export interface ArrayTrace {
  initial: number[];
  target?: number;
  steps: ArrayStep[];
}

export interface GeneratorInput {
  data: number[];
  target?: number;
}

export interface GeneratorDef {
  id: string;
  /** Nome mostrato nell'header della card, es. «Bubble sort». */
  label: string;
  kind: 'sort' | 'search';
  /** Dati usati in study quando il blocco non passa `data`. */
  defaultData: number[];
  /** Per kind 'search' senza target esplicito: sceglie il target.
   *  rnd ∈ [0,1) dal PRNG seeded (determinismo SSR). */
  pickTarget?: (data: number[], rnd: () => number) => number;
  /** Trasforma i dati prima di generare (binary-search: ordina). */
  prepare?: (data: number[]) => number[];
  generate: (input: GeneratorInput) => ArrayTrace;
}

export type AlgorithmMode = 'study' | 'lab';
