/**
 * Contratto dei dati del quaderno (piano pm/piano-2026-11-quaderno.md, sezione
 * «Contratto dei dati»). Questo formato finisce negli zaini cifrati degli
 * studenti, che il server non può leggere né migrare: per cambiarlo, aggiorna
 * il piano e alza `formato`.
 */

export type Colore = 'giallo' | 'verde' | 'azzurro' | 'rosa';

export const COLORI: readonly Colore[] = ['giallo', 'verde', 'azzurro', 'rosa'];

/** Dove sta il testo, sul modello del W3C Web Annotation (TextQuoteSelector). */
export interface Selettore {
  /** Il testo evidenziato, come si legge in pagina (virgolette curve comprese). */
  esatto: string;
  /** Fino a 32 caratteri prima. */
  prima: string;
  /** Fino a 32 caratteri dopo. */
  dopo: string;
  /** Offset nel testo della pagina: solo un indizio. */
  inizio: number;
  /** Id del titolo h2/h3 che precede, se c'è. */
  titolo: string | null;
}

export interface Annotazione {
  /** crypto.randomUUID() o equivalente. */
  id: string;
  /** `${pluginId}/${docId}`, es. `archivista/che-cosa-fa-un-dbms`. */
  pagina: string;
  selettore: Selettore;
  /** null: solo nota. */
  colore: Colore | null;
  /** '' se non c'è. */
  nota: string;
  /** ISO 8601. */
  creata: string;
  /** ISO 8601. */
  modificata: string;
  /** Id casuale del dispositivo, per la parità nell'unione. */
  dispositivo: string;
  /** Lapide: l'annotazione è stata tolta. */
  cancellata?: true;
}

export interface Quaderno {
  formato: 1;
  annotazioni: Annotazione[];
  /** Nomi dati dallo studente; '' = nome del colore. */
  legenda: Record<Colore, string>;
  /** ISO 8601, per l'unione. */
  legendaModificata: string;
}

/** Lunghezza del contesto salvato prima e dopo il testo. */
export const CONTESTO = 32;

/** Lunghezza massima di una nota. */
export const MAX_NOTA = 2000;

/** Lunghezza massima del nome che lo studente dà a un colore (la legenda). */
export const MAX_NOME_COLORE = 40;

export function quadernoVuoto(): Quaderno {
  return {
    formato: 1,
    annotazioni: [],
    legenda: { giallo: '', verde: '', azzurro: '', rosa: '' },
    legendaModificata: new Date(0).toISOString(),
  };
}
