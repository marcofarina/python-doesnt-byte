export type { RunStatus } from '../PyRunner/types';

/** Valore di cella già serializzato dal worker (i BLOB diventano stringhe). */
export type SqlCell = number | string | null;

export interface SqlResultSet {
  columns: string[];
  rows: SqlCell[][];
  /** true se il worker ha tagliato le righe oltre maxRows / cap byte. */
  truncated: boolean;
  /** Righe totali prodotte dalla query (anche quelle non incluse). */
  totalRows: number;
}

export interface SqlRunOutcome {
  results: SqlResultSet[];
  /** Righe toccate da INSERT/UPDATE/DELETE nello script. */
  rowsModified: number;
  /** true se il DB è stato (ri)aperto dal seed per questo run. */
  freshDb: boolean;
  durationMs: number;
  /** Esito della verifica, solo se la richiesta aveva `check`. */
  verdict?: { esito: 'risolto' | 'non-risolto'; messaggio: string | null };
  /** La verifica non ha potuto girare per un errore dell'autore (console). */
  authorError?: string;
  /** Foto delle tabelle dopo il run, solo se la richiesta aveva `snapshot`. */
  snapshot?: DbSnapshot;
}

// ─── Foto del DB per il pannello «Database» ────────────────────────────────
// Contratto fra worker e pannello: pm/piano-2026-10-pannello-database.md.
// La costruisce buildSnapshot in static/sql-runner/worker.js.

export interface SnapshotRow {
  /** null nelle tabelle WITHOUT ROWID (niente confronto). */
  rowid: number | null;
  values: SqlCell[];
  /** Rispetto alle tabelle di prima del run; assente se la riga non cambia. */
  change?: 'added' | 'modified';
  /** Indici di colonna cambiati, solo con `change: 'modified'`. */
  changedCells?: number[];
}

export interface SnapshotTable {
  name: string;
  columns: string[];
  /** In ordine di rowid: le prime 100 righe più tutte quelle cambiate. */
  rows: SnapshotRow[];
  totalRows: number;
  /** Righe che c'erano prima del run (al massimo 100). */
  removed: SnapshotRow[];
  /** Quante righe sono state tolte in tutto. */
  removedTotal: number;
  /** `created`: la tabella non c'era prima del run. */
  status: 'unchanged' | 'changed' | 'created';
  /** Niente confronto: tabella senza rowid oppure oltre 2.000 righe. */
  diffSkipped: boolean;
}

export interface DbSnapshot {
  /** Nell'ordine di creazione, senza le tabelle interne sqlite_*. */
  tables: SnapshotTable[];
  droppedTables: string[];
  /** Righe nuove + modificate + tolte: il numero sul pulsante del pannello. */
  changedRows: number;
}
