/**
 * Archivio locale del quaderno: un JSON sotto la chiave `pdb:quaderno` nello
 * storage dell'area corrente (`src/lib/zaino/area.ts`), letto con
 * useSyncExternalStore sul modello di `src/lib/memoria.ts`.
 *
 * - Lo stato vive in memoria; le scritture sullo storage partono 300 ms dopo
 *   l'ultima modifica, e subito quando la pagina si nasconde.
 * - Prima di scrivere si unisce a quello che c'è sul disco (`unisci`): se
 *   un'altra scheda ha scritto nel frattempo, non si perde niente. L'evento
 *   `storage` porta le modifiche delle altre schede.
 * - Ogni accesso allo storage è in try/catch: senza storage il quaderno resta
 *   in memoria finché la pagina è aperta.
 * - Un quaderno di `formato` più alto (sito più nuovo in un'altra scheda) non si
 *   sovrascrive mai.
 */
import { useMemo, useSyncExternalStore } from 'react';

import { storageDi } from '../zaino/area';
import {
  COLORI,
  MAX_NOTA,
  quadernoVuoto,
  type Annotazione,
  type Colore,
  type Quaderno,
  type Selettore,
} from './tipi';
import { potaLapidi, unisci } from './unisci';

export const CHIAVE = 'pdb:quaderno';
export const CHIAVE_DISPOSITIVO = 'pdb:dispositivo';
const RITARDO_SCRITTURA = 300;

const VUOTO_SERVER = quadernoVuoto();

let stato: Quaderno | null = null;
let bloccato = false;
let timer: ReturnType<typeof setTimeout> | null = null;
let idDispositivo: string | null = null;
let persistenzaChiesta = false;
const ascoltatori = new Set<() => void>();

/** UUID v4; `crypto.randomUUID` manca fuori dai contesti sicuri (http in LAN). */
export function nuovoId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

function eAnnotazione(x: unknown): x is Annotazione {
  const a = x as Annotazione;
  return (
    typeof a === 'object' &&
    a !== null &&
    typeof a.id === 'string' &&
    typeof a.pagina === 'string' &&
    typeof a.selettore === 'object' &&
    a.selettore !== null &&
    typeof a.selettore.esatto === 'string' &&
    typeof a.modificata === 'string'
  );
}

/** Da JSON a quaderno; null se non c'è o non si legge. */
export function daJson(testo: string | null): Quaderno | null {
  if (!testo) return null;
  let grezzo: Partial<Quaderno> & { formato?: number };
  try {
    grezzo = JSON.parse(testo);
  } catch {
    return null;
  }
  if (typeof grezzo !== 'object' || grezzo === null) return null;
  if (typeof grezzo.formato === 'number' && grezzo.formato > 1) {
    bloccato = true;
    return null;
  }
  if (grezzo.formato !== 1 || !Array.isArray(grezzo.annotazioni)) return null;
  const vuoto = quadernoVuoto();
  const legenda = { ...vuoto.legenda };
  for (const c of COLORI)
    if (typeof grezzo.legenda?.[c] === 'string') legenda[c] = grezzo.legenda[c];
  return {
    formato: 1,
    annotazioni: grezzo.annotazioni.filter(eAnnotazione),
    legenda,
    legendaModificata:
      typeof grezzo.legendaModificata === 'string'
        ? grezzo.legendaModificata
        : vuoto.legendaModificata,
  };
}

function leggiDisco(): Quaderno | null {
  try {
    return daJson(storageDi()?.getItem(CHIAVE) ?? null);
  } catch {
    return null;
  }
}

function avvisa(): void {
  for (const f of ascoltatori) f();
}

function scriviOra(): void {
  if (timer) clearTimeout(timer);
  timer = null;
  if (!stato || bloccato) return;
  const disco = leggiDisco();
  if (bloccato) return;
  const unito = potaLapidi(disco ? unisci(disco, stato) : stato, Date.now());
  const testo = JSON.stringify(unito);
  if (testo !== JSON.stringify(stato)) {
    stato = unito;
    avvisa();
  }
  try {
    storageDi()?.setItem(CHIAVE, testo);
  } catch {
    /* storage pieno o negato: resta la copia in memoria */
  }
}

function programmaScrittura(): void {
  if (timer) clearTimeout(timer);
  timer = setTimeout(scriviOra, RITARDO_SCRITTURA);
}

function suStorage(e: StorageEvent): void {
  if (e.key !== CHIAVE || e.storageArea !== storageDi() || !stato) return;
  if (e.newValue === null) {
    // Un'altra scheda ha svuotato il quaderno.
    if (timer) clearTimeout(timer);
    timer = null;
    stato = quadernoVuoto();
  } else {
    const altro = daJson(e.newValue);
    if (!altro) return;
    stato = unisci(stato, altro);
  }
  avvisa();
}

function carica(): Quaderno {
  if (!stato) {
    stato = leggiDisco() ?? quadernoVuoto();
    window.addEventListener('storage', suStorage);
    window.addEventListener('pagehide', () => timer && scriviOra());
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && timer) scriviOra();
    });
  }
  return stato;
}

function cambia(nuovo: Quaderno): void {
  stato = nuovo;
  avvisa();
  programmaScrittura();
}

function dispositivo(): string {
  if (idDispositivo) return idDispositivo;
  let id: string | null = null;
  try {
    id = storageDi()?.getItem(CHIAVE_DISPOSITIVO) ?? null;
  } catch {
    /* storage non disponibile */
  }
  if (!id) {
    id = nuovoId();
    try {
      storageDi()?.setItem(CHIAVE_DISPOSITIVO, id);
    } catch {
      /* resta in memoria */
    }
  }
  idDispositivo = id;
  return id;
}

/** Ora ISO, mai prima di `dopo`: l'ultima modifica deve vincere l'unione. */
function adesso(dopo?: string): string {
  const prima = dopo ? Date.parse(dopo) : NaN;
  const t = Date.now();
  return new Date(
    Number.isNaN(prima) || t > prima ? t : prima + 1,
  ).toISOString();
}

function iscriviti(f: () => void): () => void {
  ascoltatori.add(f);
  return () => ascoltatori.delete(f);
}

/** Il quaderno di questo browser, fuori da React (per gli script). */
export function leggiQuaderno(): Quaderno {
  return carica();
}

export function useQuaderno(): Quaderno {
  return useSyncExternalStore(iscriviti, carica, () => VUOTO_SERVER);
}

/** Le annotazioni vive di una pagina, nell'ordine dell'archivio. */
export function useAnnotazioniPagina(pagina: string): Annotazione[] {
  const q = useQuaderno();
  return useMemo(
    () => q.annotazioni.filter((a) => a.pagina === pagina && !a.cancellata),
    [q, pagina],
  );
}

export function aggiungi(
  pagina: string,
  selettore: Selettore,
  colore: Colore | null,
  nota = '',
): Annotazione {
  const q = carica();
  const ora = adesso();
  const a: Annotazione = {
    id: nuovoId(),
    pagina,
    selettore,
    colore,
    nota: nota.slice(0, MAX_NOTA),
    creata: ora,
    modificata: ora,
    dispositivo: dispositivo(),
  };
  cambia({ ...q, annotazioni: [...q.annotazioni, a] });
  if (!persistenzaChiesta) {
    persistenzaChiesta = true;
    navigator.storage?.persist?.().catch(() => undefined);
  }
  return a;
}

export function modifica(
  id: string,
  cambi: Partial<Pick<Annotazione, 'colore' | 'nota' | 'selettore'>>,
): void {
  const q = carica();
  cambia({
    ...q,
    annotazioni: q.annotazioni.map((a) =>
      a.id !== id || a.cancellata
        ? a
        : {
            ...a,
            ...cambi,
            nota: (cambi.nota ?? a.nota).slice(0, MAX_NOTA),
            modificata: adesso(a.modificata),
            dispositivo: dispositivo(),
          },
    ),
  });
}

/** Toglie un'annotazione lasciando una lapide senza testo né nota. */
export function togli(id: string): void {
  const q = carica();
  cambia({
    ...q,
    annotazioni: q.annotazioni.map((a) =>
      a.id !== id || a.cancellata
        ? a
        : {
            id: a.id,
            pagina: a.pagina,
            selettore: {
              esatto: '',
              prima: '',
              dopo: '',
              inizio: 0,
              titolo: null,
            },
            colore: null,
            nota: '',
            creata: a.creata,
            modificata: adesso(a.modificata),
            dispositivo: dispositivo(),
            cancellata: true,
          },
    ),
  });
}

/**
 * Cancella il quaderno da questo browser, senza lapidi: è «Cancella le note da
 * questo browser», non una cancellazione da propagare.
 */
export function svuota(): void {
  if (timer) clearTimeout(timer);
  timer = null;
  stato = quadernoVuoto();
  try {
    storageDi()?.removeItem(CHIAVE);
  } catch {
    /* storage non disponibile */
  }
  avvisa();
}
