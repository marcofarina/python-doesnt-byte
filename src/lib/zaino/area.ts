/**
 * Dove vivono, su questo dispositivo, tutte le sezioni dello zaino (oggi il
 * quaderno, poi i progressi di PyQuest): `localStorage` di solito,
 * `sessionStorage` nella modalità temporanea («Non è il mio computer», fase Q5
 * del piano pm/piano-2026-11-quaderno.md). Le sezioni non leggono
 * `localStorage` direttamente: chiedono l'area a questo modulo, così la
 * modalità temporanea le sposta tutte insieme.
 *
 * Fino a Q5 l'area è sempre `local`.
 */

export type Area = 'local' | 'session';

export function areaCorrente(): Area {
  return 'local';
}

export function useArea(): Area {
  return areaCorrente();
}

/** Lo storage dell'area, o null se il browser lo nega (dati del sito bloccati). */
export function storageDi(area: Area = areaCorrente()): Storage | null {
  try {
    return area === 'session' ? window.sessionStorage : window.localStorage;
  } catch {
    return null;
  }
}
