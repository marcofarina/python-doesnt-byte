/**
 * useMemoria — un valore ricordato in sessionStorage o localStorage, letto con
 * useSyncExternalStore.
 *
 * Sul server e durante l'hydration vale `null` (getServerSnapshot), poi React
 * rilegge il valore vero senza errori di hydration e senza setState in un
 * effect. I componenti che usano la stessa chiave restano allineati tramite un
 * evento su `window`.
 *
 * Lo storage può mancare o lanciare (navigazione privata, dati del sito
 * bloccati): ogni accesso è in try/catch e una copia in memoria tiene il valore
 * almeno finché la pagina resta aperta.
 */
import { useCallback, useSyncExternalStore } from 'react';

type Area = 'session' | 'local';

const EVENTO = 'pdb-memoria';
const copia = new Map<string, string | null>();

function storage(area: Area): Storage {
  return area === 'session' ? window.sessionStorage : window.localStorage;
}

function leggi(area: Area, chiave: string): string | null {
  const k = `${area}:${chiave}`;
  if (!copia.has(k)) {
    let valore: string | null = null;
    try {
      valore = storage(area).getItem(chiave);
    } catch {
      /* storage non disponibile */
    }
    copia.set(k, valore);
  }
  return copia.get(k) ?? null;
}

function iscriviti(avvisa: () => void): () => void {
  window.addEventListener(EVENTO, avvisa);
  return () => window.removeEventListener(EVENTO, avvisa);
}

export function useMemoria(
  area: Area,
  chiave: string,
): [string | null, (valore: string) => void] {
  const valore = useSyncExternalStore(
    iscriviti,
    () => leggi(area, chiave),
    () => null,
  );
  const imposta = useCallback(
    (nuovo: string) => {
      copia.set(`${area}:${chiave}`, nuovo);
      try {
        storage(area).setItem(chiave, nuovo);
      } catch {
        /* resta la copia in memoria */
      }
      window.dispatchEvent(new Event(EVENTO));
    },
    [area, chiave],
  );
  return [valore, imposta];
}
