/**
 * Progressione di PyQuest (spec D10): completamenti e record per livello,
 * persistiti in localStorage sotto un'unica chiave versionata.
 *
 * - Chiave `pdb:pyquest:progress` (convenzione `pdb:` = stato di dominio).
 * - Lo **sblocco non è salvato**: un livello è giocabile se è il primo o se il
 *   precedente nell'array del mondo è `done` (`isUnlocked`). Inserire un livello
 *   in mezzo ri-blocca solo ciò che segue; rimuoverne uno lascia chiavi orfane
 *   innocue.
 * - Parse difensivo: JSON corrotto o `version` ignota → reset silenzioso.
 * - Sincronizzazione same-tab via `CustomEvent` (l'evento `storage` non scatta
 *   nella tab che scrive) + `storage` cross-tab (pattern `Algorithm/usePref`).
 */

import { useCallback, useEffect, useState } from 'react';
import type { GameEvent, WorldDef } from './types';

const KEY = 'pdb:pyquest:progress';
const EVENT = 'pdb-pyquest-progress';
const VERSION = 1;

export interface LevelProgress {
  done: boolean;
  bestSteps: number;
}

interface ProgressShape {
  version: number;
  worlds: Record<string, { levels: Record<string, LevelProgress> }>;
}

const EMPTY: ProgressShape = { version: VERSION, worlds: {} };

function readProgress(): ProgressShape {
  if (typeof window === 'undefined') return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw);
    if (
      !parsed ||
      parsed.version !== VERSION ||
      typeof parsed.worlds !== 'object'
    ) {
      return EMPTY; // corrotto o versione ignota → reset
    }
    return parsed as ProgressShape;
  } catch {
    return EMPTY;
  }
}

function writeProgress(next: ProgressShape) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage non disponibile: la sessione resta valida in memoria */
  }
  window.dispatchEvent(new CustomEvent(EVENT));
}

export interface UseProgress {
  /** Progresso salvato di un livello (undefined se mai completato). */
  getLevel(worldId: string, levelId: string): LevelProgress | undefined;
  /** Registra una vittoria: marca `done` e minimizza `bestSteps`. */
  recordWin(worldId: string, levelId: string, steps: number): void;
  /** Sblocco calcolato: primo livello o precedente `done` (spec D10). */
  isUnlocked(world: WorldDef, levelId: string): boolean;
}

export function useProgress(): UseProgress {
  const [progress, setProgress] = useState<ProgressShape>(EMPTY);

  // Dopo l'hydration leggo il valore reale (sul server era EMPTY). È una lettura
  // di sincronizzazione con un sistema esterno (localStorage), non uno stato
  // derivato: il set al mount è voluto e SSR-safe (parte da EMPTY, poi allinea).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProgress(readProgress());
  }, []);

  // Allineamento con gli altri blocchi (same-tab) e con le altre tab (storage).
  useEffect(() => {
    const onLocal = () => setProgress(readProgress());
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setProgress(readProgress());
    };
    window.addEventListener(EVENT, onLocal);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(EVENT, onLocal);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const getLevel = useCallback(
    (worldId: string, levelId: string): LevelProgress | undefined =>
      progress.worlds[worldId]?.levels[levelId],
    [progress],
  );

  const recordWin = useCallback(
    (worldId: string, levelId: string, steps: number) => {
      // Rileggo dallo storage prima di scrivere: evita di sovrascrivere
      // aggiornamenti fatti da un altro blocco tra un render e l'altro.
      const current = readProgress();
      const world = current.worlds[worldId] ?? { levels: {} };
      const prev = world.levels[levelId];
      const bestSteps = prev ? Math.min(prev.bestSteps, steps) : steps;
      const next: ProgressShape = {
        ...current,
        worlds: {
          ...current.worlds,
          [worldId]: {
            ...world,
            levels: {
              ...world.levels,
              [levelId]: { done: true, bestSteps },
            },
          },
        },
      };
      writeProgress(next);
      setProgress(next); // aggiorna subito questo blocco; l'evento fa gli altri
    },
    [],
  );

  const isUnlocked = useCallback(
    (world: WorldDef, levelId: string): boolean => {
      const idx = world.levels.findIndex((l) => l.id === levelId);
      if (idx <= 0) return true; // primo livello (o id ignoto): sempre aperto
      const prevId = world.levels[idx - 1].id;
      return Boolean(progress.worlds[world.id]?.levels[prevId]?.done);
    },
    [progress],
  );

  return { getLevel, recordWin, isUnlocked };
}

// --- Calcolo azioni e stelle --------------------------------------------------

/**
 * Eventi che contano come «azione» dello studente (spec step 16): gli eventi
 * derivati dal mondo (`enemy_*`, `hero_hit`, `defeat`, `win`, `death`,
 * `step_limit`) non contano.
 */
const ACTION_TYPES: ReadonlyArray<GameEvent['t']> = [
  'move',
  'turn',
  'bump',
  'attack',
  'collect',
];

/** Numero di azioni fino al `win` incluso (o su tutta la trace se non c'è). */
export function countActions(events: GameEvent[]): number {
  const winIdx = events.findIndex((e) => e.t === 'win');
  const upto = winIdx >= 0 ? events.slice(0, winIdx) : events;
  return upto.reduce((n, e) => n + (ACTION_TYPES.includes(e.t) ? 1 : 0), 0);
}

/** Stelle da `par` (spec D11): ≤ par → 3; ≤ ⌈par·1,5⌉ → 2; completato → 1. */
export function starsFor(steps: number, par: number): 1 | 2 | 3 {
  if (steps <= par) return 3;
  if (steps <= Math.ceil(par * 1.5)) return 2;
  return 1;
}
