/**
 * CurriculumContext — percorso attivo per tutto il libro (codice `PDB1-…`).
 *
 * Il codice canonico vive in localStorage (`pdb:curriculum`); la decodifica
 * avviene contro il manifest a epoche pubblicato dal plugin `curriculum`
 * (usePluginData) e produce il set delle chiavi «<volume>/<docId>» incluse.
 *
 * SSR-safe per costruzione: il primo render (server e hydration) ha sempre
 * `code = null` → `included = null` → libro intero; il valore reale arriva
 * nell'effect al mount (two-pass hydration, stesso pattern di PathContext).
 *
 * Un componente interno legge `?percorso=CODE` dall'URL: se valido lo attiva
 * e lo persiste, poi pulisce l'URL con history.replaceState.
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
import { useLocation } from '@docusaurus/router';
import { usePluginData } from '@docusaurus/useGlobalData';
import { normalizeCurriculumCode } from '@site/src/lib/curriculumCode';
import { keysFromCode } from '@site/src/lib/curriculumSelection';

const STORAGE_KEY = 'pdb:curriculum';

/** Parametro URL per attivare un percorso via link condiviso. */
export const CURRICULUM_QUERY_PARAM = 'percorso';

// ── Tipi del global data del plugin curriculum ──────────────────────────────

export interface CurriculumManifest {
  version: number;
  currentEpoch: number;
  epochs: Record<string, string[]>;
}

export interface CurriculumTreeDoc {
  type: 'doc';
  key: string;
  title: string;
}

export interface CurriculumTreeCategory {
  type: 'category';
  label: string;
  items: CurriculumTreeItem[];
}

export type CurriculumTreeItem = CurriculumTreeDoc | CurriculumTreeCategory;

export interface CurriculumVolume {
  id: string;
  label: string;
  tree: CurriculumTreeItem[];
}

export interface CurriculumPreset {
  id: string;
  label: string;
  short: string;
  keys: string[];
}

export interface CurriculumPluginData {
  volumes: CurriculumVolume[];
  manifest: CurriculumManifest;
  presets: CurriculumPreset[];
  alwaysVisible: string[];
}

export function useCurriculumPluginData(): CurriculumPluginData {
  return usePluginData('curriculum') as CurriculumPluginData;
}

// ── Context ─────────────────────────────────────────────────────────────────

type CurriculumContextValue = {
  /** Codice canonico attivo, o null (nessun percorso: libro intero). */
  code: string | null;
  /**
   * Chiavi «<volume>/<docId>» incluse dal codice attivo, o null se non c'è
   * codice (o il codice salvato non è più decodificabile → libro intero).
   */
  included: ReadonlySet<string> | null;
  /** Visibilità di una lezione: sempre true senza percorso attivo. */
  isIncluded: (key: string) => boolean;
  /**
   * Valida, canonicalizza, attiva e persiste un codice. Lancia
   * `CurriculumCodeError` (reason: crc/charset/version/epoch/…) se invalido.
   */
  setCode: (raw: string) => void;
  /** Rimuove il percorso attivo (torna al libro intero). */
  clear: () => void;
};

const CurriculumContext = createContext<CurriculumContextValue | null>(null);

export function CurriculumProvider({ children }: { children: ReactNode }) {
  const { manifest, alwaysVisible } = useCurriculumPluginData();
  const [code, setCodeState] = useState<string | null>(null);

  // Two-pass hydration: il setState sincrono al mount è voluto (pattern
  // canonico per sincronizzare stato client-only dopo l'hydration SSR).
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCodeState(window.localStorage.getItem(STORAGE_KEY));
    } catch {
      // localStorage disabilitato → silently ignore
    }
  }, []);

  // Cross-tab sync: attivazione/rimozione in un'altra tab si riflette qui.
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      setCodeState(e.newValue);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const included = useMemo(() => {
    if (!code) return null;
    try {
      return keysFromCode(code, manifest);
    } catch {
      // Codice salvato corrotto, epoca ignota o formato futuro: degrada a
      // libro intero.
      return null;
    }
  }, [code, manifest]);

  const alwaysVisibleSet = useMemo(
    () => new Set(alwaysVisible),
    [alwaysVisible],
  );

  const isIncluded = useCallback(
    (key: string) => {
      if (!included) return true;
      return alwaysVisibleSet.has(key) || included.has(key);
    },
    [included, alwaysVisibleSet],
  );

  const setCode = useCallback(
    (raw: string) => {
      const canonical = normalizeCurriculumCode(raw);
      keysFromCode(canonical, manifest); // valida, epoca compresa (throw)
      setCodeState(canonical);
      try {
        window.localStorage.setItem(STORAGE_KEY, canonical);
      } catch {
        /* ignore */
      }
    },
    [manifest],
  );

  const clear = useCallback(() => {
    setCodeState(null);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({ code, included, isIncluded, setCode, clear }),
    [code, included, isIncluded, setCode, clear],
  );

  return (
    <CurriculumContext.Provider value={value}>
      <CurriculumQueryParamSync />
      {children}
    </CurriculumContext.Provider>
  );
}

/**
 * Attiva il percorso passato via `?percorso=CODE` (link condiviso dal
 * docente) e pulisce l'URL. Vive dentro il provider, su ogni pagina.
 */
function CurriculumQueryParamSync() {
  const location = useLocation();
  const { setCode } = useCurriculum();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const raw = params.get(CURRICULUM_QUERY_PARAM);
    if (raw === null) return;
    try {
      setCode(raw);
    } catch (e) {
      console.warn('[curriculum] Codice in ?percorso= non valido:', e);
    }
    params.delete(CURRICULUM_QUERY_PARAM);
    const query = params.toString();
    window.history.replaceState(
      null,
      '',
      `${location.pathname}${query ? `?${query}` : ''}${location.hash}`,
    );
  }, [location, setCode]);

  return null;
}

export function useCurriculum(): CurriculumContextValue {
  const ctx = useContext(CurriculumContext);
  if (!ctx) {
    throw new Error(
      'useCurriculum deve essere usato dentro <CurriculumProvider>',
    );
  }
  return ctx;
}
