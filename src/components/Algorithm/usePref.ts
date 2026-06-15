import { useEffect, useState } from 'react';

/**
 * Preferenza UI condivisa da tutti i blocchi <Algorithm> della pagina e
 * persistita tra le sessioni (localStorage).
 *
 * Sincronizzazione:
 * - **same-tab** (più blocchi nella stessa pagina): un `CustomEvent` su
 *   `window`, perché l'evento `storage` nativo NON scatta nella tab che ha
 *   scritto, solo nelle altre.
 * - **cross-tab**: l'evento `storage` nativo.
 *
 * SSR-safe: parte dal `fallback` fisso (così il markup server e quello del
 * primo render client coincidono) e legge il valore reale da localStorage in
 * un effetto, dopo l'hydration.
 */
const PREFIX = 'pdb.algo.';
const EVENT = 'pdb-algo-pref';

function readStored<T extends string>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    return (window.localStorage.getItem(PREFIX + key) as T) ?? fallback;
  } catch {
    return fallback;
  }
}

export function useAlgoPref<T extends string>(
  key: string,
  fallback: T,
): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(fallback);

  // Dopo l'hydration leggo il valore reale (sul server era il fallback).
  useEffect(() => {
    setValue(readStored(key, fallback));
  }, [key, fallback]);

  // Allineamento con gli altri blocchi (same-tab) e con le altre tab (storage).
  useEffect(() => {
    const onLocal = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.key === key) setValue(detail.value as T);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === PREFIX + key && e.newValue != null) {
        setValue(e.newValue as T);
      }
    };
    window.addEventListener(EVENT, onLocal);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(EVENT, onLocal);
      window.removeEventListener('storage', onStorage);
    };
  }, [key]);

  const set = (v: T) => {
    setValue(v);
    try {
      window.localStorage.setItem(PREFIX + key, v);
    } catch {
      /* storage non disponibile: resta valido per questa sessione */
    }
    window.dispatchEvent(new CustomEvent(EVENT, { detail: { key, value: v } }));
  };

  return [value, set];
}
