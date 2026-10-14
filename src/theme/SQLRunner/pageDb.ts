/**
 * Store di pagina del pannello «Database» (piano
 * pm/piano-2026-10-pannello-database.md).
 *
 * Ogni SQLRunner ha il proprio DB: il pannello mostra le tabelle come le ha
 * lasciate l'ultimo blocco eseguito dallo studente. Il runner pubblica qui la
 * foto che riceve dal worker; il pannello la legge con usePageDb().
 *
 * Lo store è di modulo, come il worker, e sopravvive alla navigazione SPA:
 * ogni foto porta il pathname della pagina che l'ha prodotta, e usePageDb()
 * ignora quelle di un'altra pagina.
 */
import { useSyncExternalStore } from 'react';
import { useLocation } from '@docusaurus/router';
import type { DbSnapshot } from './types';

export interface PageDbEntry {
  pathname: string;
  /** Dataset del blocco (`dataset=`), null per un DB partito vuoto. */
  datasetKey: string | null;
  /** `title=` del blocco, oppure «blocco N». */
  blockLabel: string;
  /** id DOM del runner, per scorrere fino al blocco. */
  blockElementId: string;
  snapshot: DbSnapshot;
  /** Il run è finito con un errore: le istruzioni prima dell'errore restano. */
  failed: boolean;
  /** Cresce a ogni pubblicazione. */
  seq: number;
}

let entry: PageDbEntry | null = null;
let seq = 0;
let activeCount = 0;
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function publishPageDb(next: Omit<PageDbEntry, 'seq'>): void {
  seq += 1;
  entry = { ...next, seq };
  for (const listener of listeners) listener();
}

/**
 * Dimentica l'ultima foto. Lo chiama il pannello quando entra in una pagina:
 * tornando su una lezione, il pannello riparte dallo «Stato iniziale» anche se
 * la foto in memoria era di quella stessa pagina.
 */
export function clearPageDb(): void {
  if (entry === null) return;
  entry = null;
  for (const listener of listeners) listener();
}

/** L'ultima foto di questa pagina, oppure null se nessun blocco ha pubblicato. */
export function usePageDb(): PageDbEntry | null {
  const { pathname } = useLocation();
  const current = useSyncExternalStore(
    subscribe,
    () => entry,
    () => null,
  );
  return current !== null && current.pathname === pathname ? current : null;
}

/**
 * Il pannello si registra al mount (true) e si toglie all'unmount (false). È un
 * contatore e non un booleano: cambiando pagina il pannello nuovo può montarsi
 * prima che il vecchio si smonti.
 */
export function setPageDbActive(active: boolean): void {
  activeCount = Math.max(0, activeCount + (active ? 1 : -1));
}

/** Il runner chiede la foto al worker solo se in pagina c'è un pannello. */
export function isPageDbActive(): boolean {
  return activeCount > 0;
}
