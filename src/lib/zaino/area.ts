/**
 * Dove vivono, su questo dispositivo, tutte le sezioni dello zaino (oggi il
 * quaderno, poi i progressi di PyQuest): `localStorage` di solito,
 * `sessionStorage` nella modalità temporanea («Non è il mio computer», fase Q5
 * del piano pm/piano-2026-11-quaderno.md). Le sezioni non leggono
 * `localStorage` direttamente: chiedono l'area a questo modulo, così la
 * modalità temporanea le sposta tutte insieme.
 *
 * La modalità temporanea è un segno in `sessionStorage` (`pdb:zaino-temporaneo`):
 * vale per la scheda, sopravvive ai ricaricamenti e sparisce con la scheda.
 * Chi tiene dati in memoria (l'archivio del quaderno) si iscrive con
 * `suCambioArea`: `prima` parte con l'area ancora vecchia (per scrivere ciò che
 * è in sospeso), `dopo` con la nuova (per rileggere).
 */
import { useSyncExternalStore } from 'react';

export type Area = 'local' | 'session';

export const CHIAVE_TEMPORANEA = 'pdb:zaino-temporaneo';

const prima = new Set<() => void>();
const dopo = new Set<() => void>();

function sessione(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function areaCorrente(): Area {
  try {
    return sessione()?.getItem(CHIAVE_TEMPORANEA) === '1' ? 'session' : 'local';
  } catch {
    return 'local';
  }
}

/**
 * Accende o spegne la modalità temporanea di questa scheda. false se il
 * browser non lascia usare `sessionStorage`: in quel caso niente modalità
 * temporanea, e il chiamante non deve collegare lo zaino.
 */
export function impostaTemporanea(attiva: boolean): boolean {
  const s = sessione();
  if (!s) return !attiva;
  if ((areaCorrente() === 'session') === attiva) return true;
  try {
    for (const f of prima) f();
    if (attiva) s.setItem(CHIAVE_TEMPORANEA, '1');
    else s.removeItem(CHIAVE_TEMPORANEA);
  } catch {
    return false;
  }
  for (const f of dopo) f();
  return true;
}

/** Avvisa prima e dopo ogni cambio di area; restituisce la funzione per smettere. */
export function suCambioArea(
  avantiDelCambio: () => void,
  dopoIlCambio: () => void,
): () => void {
  prima.add(avantiDelCambio);
  dopo.add(dopoIlCambio);
  return () => {
    prima.delete(avantiDelCambio);
    dopo.delete(dopoIlCambio);
  };
}

function iscriviArea(f: () => void): () => void {
  return suCambioArea(() => undefined, f);
}

export function useArea(): Area {
  return useSyncExternalStore(iscriviArea, areaCorrente, () => 'local');
}

/** Lo storage dell'area, o null se il browser lo nega (dati del sito bloccati). */
export function storageDi(area: Area = areaCorrente()): Storage | null {
  try {
    return area === 'session' ? window.sessionStorage : window.localStorage;
  } catch {
    return null;
  }
}
