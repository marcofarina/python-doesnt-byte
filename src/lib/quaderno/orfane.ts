/**
 * Annotazioni che, l'ultima volta che la lezione è stata aperta, non hanno
 * ritrovato il loro testo (piano pm/piano-2026-11-quaderno.md, fase Q3).
 *
 * Solo la lezione, con l'Evidenziatore, sa se un'annotazione è orfana: per
 * mostrarlo anche in `/quaderno`, l'Evidenziatore ne lascia qui l'elenco. Non
 * fa parte del quaderno né dello zaino: è una copia locale e può essere
 * superata (la pagina dice «all'ultima apertura»). Vive nello storage
 * dell'area corrente, come il quaderno.
 */
import { useSyncExternalStore } from 'react';

import { storageDi } from '../zaino/area';

export const CHIAVE_ORFANE = 'pdb:quaderno-orfane';
const EVENTO = 'pdb-quaderno-orfane';

const VUOTO: ReadonlySet<string> = new Set();

type PerPagina = Record<string, string[]>;

function leggiGrezzo(): string | null {
  try {
    return storageDi()?.getItem(CHIAVE_ORFANE) ?? null;
  } catch {
    return null;
  }
}

function analizza(grezzo: string | null): PerPagina {
  if (!grezzo) return {};
  try {
    const x = JSON.parse(grezzo) as unknown;
    return typeof x === 'object' && x !== null && !Array.isArray(x)
      ? (x as PerPagina)
      : {};
  } catch {
    return {};
  }
}

/** Fissa le orfane di una pagina; scrive solo se qualcosa è cambiato. */
export function segnaOrfane(pagina: string, ids: string[]): void {
  const tutte = analizza(leggiGrezzo());
  const prima = (tutte[pagina] ?? []).join(' ');
  const ordinate = [...ids].sort();
  if (prima === ordinate.join(' ')) return;
  if (ordinate.length) tutte[pagina] = ordinate;
  else delete tutte[pagina];
  try {
    const testo = Object.keys(tutte).length ? JSON.stringify(tutte) : null;
    if (testo) storageDi()?.setItem(CHIAVE_ORFANE, testo);
    else storageDi()?.removeItem(CHIAVE_ORFANE);
  } catch {
    /* storage pieno o negato: nessuna orfana nel quaderno */
  }
  window.dispatchEvent(new Event(EVENTO));
}

/** Toglie l'elenco (con «Cancella le note da questo browser»). */
export function cancellaOrfane(): void {
  try {
    storageDi()?.removeItem(CHIAVE_ORFANE);
  } catch {
    /* storage non disponibile */
  }
  window.dispatchEvent(new Event(EVENTO));
}

let cacheGrezzo: string | null | undefined;
let cacheInsieme: ReadonlySet<string> = VUOTO;

function istantanea(): ReadonlySet<string> {
  const grezzo = leggiGrezzo();
  if (grezzo !== cacheGrezzo) {
    cacheGrezzo = grezzo;
    cacheInsieme = new Set(Object.values(analizza(grezzo)).flat());
  }
  return cacheInsieme;
}

function iscriviti(avvisa: () => void): () => void {
  const suStorage = (e: StorageEvent) => {
    if (e.key === CHIAVE_ORFANE) avvisa();
  };
  window.addEventListener(EVENTO, avvisa);
  window.addEventListener('storage', suStorage);
  return () => {
    window.removeEventListener(EVENTO, avvisa);
    window.removeEventListener('storage', suStorage);
  };
}

/** Gli id delle annotazioni orfane, di tutte le pagine. */
export function useOrfane(): ReadonlySet<string> {
  return useSyncExternalStore(iscriviti, istantanea, () => VUOTO);
}
