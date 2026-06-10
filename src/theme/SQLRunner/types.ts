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
}
