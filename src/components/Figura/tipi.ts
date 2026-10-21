/**
 * Tipi di <Figura> — prototipo della fase G0 di
 * pm/piano-2026-10-figure-animate.md. I nomi sono provvisori finché Marco non
 * approva la grammatica e G0 non scrive la spec di G1 e G2.
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

export interface OggRiquadro extends Base {
  tipo: 'riquadro';
  l: number;
  a: number;
  etichetta?: string;
  /** Fondo colorato del ruolo, tenue. */
  fondo?: boolean;
}

export interface OggTesto extends Base {
  tipo: 'testo';
  testo: string;
  corpo?: number;
  ancora?: 'start' | 'middle' | 'end';
  /** `codice` usa Monaspace in entrambi i tratti. */
  famiglia?: 'testo' | 'codice';
}

export interface OggFile extends Base {
  tipo: 'file';
  l: number;
  a: number;
  nome: string;
}

export interface OggRiga extends Base {
  tipo: 'riga';
  l: number;
  testo: string;
}

export interface OggPersona extends Base {
  tipo: 'persona';
  nome: string;
}

export interface OggFreccia extends Base {
  tipo: 'freccia';
  /** Punto d'arrivo, assoluto. */
  x2: number;
  y2: number;
  /** Curvatura: scarto del punto di controllo dalla corda, in px. */
  curva?: number;
  etichetta?: string;
}

export interface OggContatore extends Base {
  tipo: 'contatore';
  /** Testo dopo il numero, es. «assegnazioni». */
  unita: string;
  corpo?: number;
}

export type Oggetto =
  | OggRiquadro
  | OggTesto
  | OggFile
  | OggRiga
  | OggPersona
  | OggFreccia
  | OggContatore;

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
