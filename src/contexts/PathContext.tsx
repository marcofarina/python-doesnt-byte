/**
 * PathContext — persistenza per-volume del percorso scelto dall'utente
 * (es. IT / Liceo / ITS). Salvato in localStorage con chiave
 * `pdb:path:<volumeId>`. Ogni volume sceglie autonomamente il suo set
 * di percorsi disponibili (vedi sidebars/<volume>.ts).
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type VolumeId =
  | 'programmatore'
  | 'artefice'
  | 'archivista'
  | 'apprendista';

const STORAGE_PREFIX = 'pdb:path';
const storageKey = (volume: VolumeId) => `${STORAGE_PREFIX}:${volume}`;

type PathState = Partial<Record<VolumeId, string>>;

type PathContextValue = {
  /** Percorso correntemente attivo per il volume specificato (o null se mai scelto). */
  getPath: (volume: VolumeId) => string | null;
  /** Imposta il percorso per un volume; persiste in localStorage. */
  setPath: (volume: VolumeId, path: string) => void;
  /** Cancella la scelta per un volume (torna al default della sidebar). */
  clearPath: (volume: VolumeId) => void;
};

const PathContext = createContext<PathContextValue | null>(null);

function readInitialState(): PathState {
  if (typeof window === 'undefined') return {};
  const out: PathState = {};
  for (const v of [
    'programmatore',
    'artefice',
    'archivista',
    'apprendista',
  ] as VolumeId[]) {
    try {
      const raw = window.localStorage.getItem(storageKey(v));
      if (raw) out[v] = raw;
    } catch {
      // localStorage disabilitato → silently ignore
    }
  }
  return out;
}

export function PathProvider({children}: {children: ReactNode}) {
  const [state, setState] = useState<PathState>(() => readInitialState());

  // Hydration: il primo render server-side restituisce {}, sincronizziamo al mount.
  useEffect(() => {
    setState(readInitialState());
  }, []);

  // Cross-tab sync: se l'utente cambia la scelta in un'altra tab, aggiorniamo qui.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onStorage = (e: StorageEvent) => {
      if (!e.key?.startsWith(STORAGE_PREFIX + ':')) return;
      const v = e.key.slice(STORAGE_PREFIX.length + 1) as VolumeId;
      setState((prev) => ({...prev, [v]: e.newValue ?? undefined}));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const getPath = useCallback(
    (volume: VolumeId) => state[volume] ?? null,
    [state],
  );

  const setPath = useCallback((volume: VolumeId, path: string) => {
    setState((prev) => ({...prev, [volume]: path}));
    try {
      window.localStorage.setItem(storageKey(volume), path);
    } catch {
      /* ignore */
    }
  }, []);

  const clearPath = useCallback((volume: VolumeId) => {
    setState((prev) => {
      const next = {...prev};
      delete next[volume];
      return next;
    });
    try {
      window.localStorage.removeItem(storageKey(volume));
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({getPath, setPath, clearPath}),
    [getPath, setPath, clearPath],
  );

  return <PathContext.Provider value={value}>{children}</PathContext.Provider>;
}

export function usePathContext(): PathContextValue {
  const ctx = useContext(PathContext);
  if (!ctx) {
    throw new Error('usePathContext deve essere usato dentro <PathProvider>');
  }
  return ctx;
}
