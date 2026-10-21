/**
 * Tipi di <Figura>: spec nelle sezioni G1 e G2 di
 * pm/piano-2026-10-figure-animate.md.
 */

/** Tratto con cui si disegna un oggetto. */
export type Tratto = 'mano' | 'netto';

/**
 * Tratto della figura intera. `ibrido` applica la decisione 1 del piano: a mano
 * gli oggetti di natura `concetto`, netti quelli di natura `dato`.
 */
export type TrattoFigura = Tratto | 'ibrido';

/** Ruoli di colore della tavola di stile (variabili CSS `--fig-<ruolo>`). */
export type Ruolo =
  | 'inchiostro'
  | 'tenue'
  | 'accento'
  | 'dato'
  | 'programma'
  | 'persona'
  | 'errore'
  | 'ok';

/**
 * Stato di un oggetto in un istante: solo numeri, così ogni proprietà si
 * interpola e lo stato è una funzione pura di (passo, fase).
 */
export interface Stato {
  /** 0…1 */
  opacita: number;
  /** Spostamento rispetto alla posizione dichiarata. */
  dx: number;
  dy: number;
  /** 0…1: quanto del tratto è disegnato (Create) o del testo è scritto (Write). */
  progresso: number;
  /** 0…1: accento del passo; torna a 0 all'inizio del passo successivo. */
  enfasi: number;
  /** 0…1: riga barrata. */
  barrato: number;
  /** Valore di un contatore. */
  valore: number;
}

/** Posizione di un oggetto: origine locale della primitiva. */
interface Base {
  id: string;
  /** `concetto` → a mano nel tratto ibrido; `dato` → netto. */
  natura: 'concetto' | 'dato';
  ruolo?: Ruolo;
  x: number;
  y: number;
  /** Stato prima del primo passo. Di default l'oggetto è invisibile. */
  iniziale?: Partial<Stato>;
}

/** Corpo del testo: un nome della scala o un numero di unità del viewBox. */
export type Corpo = 'piccolo' | 'normale' | 'grande' | number;
export type Raggio = 'xs' | 'sm' | 'md' | 'lg';
export type Verso = 'sopra' | 'sotto' | 'sinistra' | 'destra';

export interface PropsRiquadro {
  l: number;
  a: number;
  etichetta?: string;
  /** Fondo tenue nel colore del ruolo. */
  fondo?: boolean;
  raggio?: Raggio;
}

export interface PropsTesto {
  testo: string;
  corpo?: Corpo;
  ancora?: 'start' | 'middle' | 'end';
  /** `codice` usa Monaspace in entrambi i tratti. */
  famiglia?: 'testo' | 'codice';
  /** Larghezza oltre cui il testo va a capo. */
  larghezzaMax?: number;
}

export interface PropsFreccia {
  /** Punto d'arrivo, rispetto alla partenza. */
  dx: number;
  dy: number;
  /** Scarto del punto di controllo dalla corda; positivo a destra del verso. */
  curva?: number;
  etichetta?: string;
  punte?: 'fine' | 'entrambe';
}

export interface PropsFile {
  l: number;
  a: number;
  nome: string;
}

export interface PropsDatabase {
  l: number;
  a: number;
  nome: string;
}

export interface PropsTabella {
  colonne: string[];
  righe: string[][];
  /** Larghezze delle colonne; di default dal testo più lungo. */
  larghezze?: number[];
}

export interface PropsRiga {
  l: number;
  /** Una cella sola (`testo`) o più celle (`celle`, con `larghezze`). */
  testo?: string;
  celle?: string[];
  larghezze?: number[];
  segno?: 'normale' | 'nuova' | 'evidenziata';
}

export interface PropsMemoria {
  l: number;
  a: number;
  variabili: { nome: string; valore: string }[];
}

export interface PropsProgramma {
  l: number;
  righe: string[];
  /** Indice (da 0) della riga in esecuzione. */
  attiva?: number;
  titolo?: string;
}

export interface PropsPersona {
  nome: string;
}

export interface PropsContatore {
  /** Testo dopo il numero, es. «assegnazioni». */
  unita: string;
  corpo?: Corpo;
}

export interface PropsGraffa {
  lunghezza: number;
  /** Da che parte sta la punta della graffa (e l'etichetta). */
  verso: Verso;
  etichetta?: string;
}

export interface PropsEvidenziatore {
  l: number;
  a: number;
}

/** Le primitive di G2 e le loro props. */
export interface PropsPrimitive {
  riquadro: PropsRiquadro;
  testo: PropsTesto;
  freccia: PropsFreccia;
  file: PropsFile;
  database: PropsDatabase;
  tabella: PropsTabella;
  riga: PropsRiga;
  memoria: PropsMemoria;
  programma: PropsProgramma;
  persona: PropsPersona;
  contatore: PropsContatore;
  graffa: PropsGraffa;
  evidenziatore: PropsEvidenziatore;
}

export type TipoPrimitiva = keyof PropsPrimitive;

/** Props che il motore passa a ogni primitiva, oltre alle sue. */
export interface PropsComuni {
  /** Seme di rough.js e chiave della cache: l'id dell'oggetto. */
  chiave: string;
  tratto: Tratto;
  /** 0…1: «si disegna»; di default 1. */
  progresso?: number;
  /** 0…1: riga barrata. */
  barrato?: number;
  /** Valore di un contatore. */
  valore?: number;
}

export type Oggetto = {
  [K in TipoPrimitiva]: Base & { tipo: K } & PropsPrimitive[K];
}[TipoPrimitiva];

/** Curve di velocità: le stesse dei token `--ease-*` di custom.css. */
export type Curva = 'smooth' | 'out' | 'spring' | 'lineare';

interface AnimBase {
  /** ms dall'inizio del passo. */
  ritardo?: number;
  /** ms; se manca, quella del vocabolario. */
  durata?: number;
  curva?: Curva;
}

/** Vocabolario delle animazioni, preso da Manim. */
export type Animazione =
  | (AnimBase & { fai: 'Create' | 'Write' | 'FadeIn' | 'FadeOut'; id: string })
  | (AnimBase & { fai: 'Indicate' | 'Strike'; id: string })
  | (AnimBase & { fai: 'MoveTo'; id: string; dx: number; dy: number })
  | (AnimBase & { fai: 'Count'; id: string; a: number })
  /** Dissolvenza incrociata con spostamento: `da` va dove sta `a`. */
  | (AnimBase & { fai: 'Transform'; da: string; a: string });

export interface Passo {
  didascalia: string;
  animazioni: Animazione[];
  /**
   * Passo che rivela l'esito: l'autoplay si ferma su quello prima e il poster
   * è quello prima.
   */
  rivela?: boolean;
}

export interface Scena {
  id: string;
  titolo: string;
  descrizione: string;
  larghezza: number;
  altezza: number;
  oggetti: Oggetto[];
  passi: Passo[];
}

/** Il modulo di una figura: `src/figure/<id>.ts` lo esporta di default. */
export interface FiguraDef {
  scena: Scena;
  /** Stessi oggetti e passi in altre posizioni, per le figure strette. */
  stretta?: Scena;
}
