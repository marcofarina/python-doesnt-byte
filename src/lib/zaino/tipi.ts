/**
 * Busta dello zaino (piano pm/piano-2026-11-quaderno.md, «Contratto dei dati»,
 * fissata in Q4). Il contenuto cifrato di uno zaino è un `ContenutoZaino`
 * compresso: il server non lo legge e non lo può migrare. Per cambiare la
 * busta, aggiorna il piano e alza `formato`.
 */

/** Una sezione dello zaino: il quaderno, poi (Q7) i progressi di PyQuest. */
export interface Sezione<T = unknown> {
  /** Formato dei dati della sezione. */
  formato: number;
  /** ISO 8601: fra due versioni di una sezione sconosciuta vince la più recente. */
  modificata: string;
  dati: T;
}

export interface ContenutoZaino {
  formato: 1;
  /** Per nome: 'quaderno', da Q7 'pyquest'. */
  sezioni: Record<string, Sezione>;
}

/** Come una parte del sito vive nello zaino. */
export interface TipoSezione<T> {
  nome: string;
  /** Il formato più alto che questo client sa leggere e scrivere. */
  formato: number;
  vuota(): T;
  /** I dati di questo dispositivo, dallo storage dell'area corrente. */
  leggi(): T;
  /** Riceve il risultato dell'unione con lo zaino: lo porta in locale. */
  scrivi(dati: T): void;
  /** Pura, commutativa, idempotente. */
  unisci(a: T, b: T): T;
  /** Avvisa a ogni modifica locale (per il salvataggio nello zaino). */
  iscriviti(avvisa: () => void): () => void;
  /** Dati arrivati dallo zaino: null se non hanno la forma attesa. */
  valida(dati: unknown): T | null;
  /** Toglie i dati da questo dispositivo («Esci dallo zaino», Q5). */
  svuota(): void;
  /** Facoltativa: pulizia che dipende dall'ora (lapidi vecchie). */
  pota?(dati: T, adesso: number): T;
}

export function contenutoVuoto(): ContenutoZaino {
  return { formato: 1, sezioni: {} };
}
