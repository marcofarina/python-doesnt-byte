/**
 * Il file del quaderno (piano pm/piano-2026-11-quaderno.md, fase Q3): un
 * Markdown che si legge e si studia, con in coda i dati per reimportarlo.
 *
 *   # Il mio quaderno — …
 *   ## Manuale dell’Archivista
 *   ### Titolo della lezione
 *   > citazione
 *   **Giallo** (da ricordare) · 16 novembre 2026
 *   **Nota:** testo
 *   …
 *   <!-- pdb-quaderno 1 <JSON in base64url> -->
 *
 * Il commento in coda contiene tutto il quaderno, lapidi comprese, così
 * l'importazione (`importa` in archivio.ts, che usa `unisci`) è fedele. La parte
 * in Markdown serve solo a chi legge: l'importazione non la guarda.
 */
import { daJson } from './archivio';
import { COLORI, type Annotazione, type Colore, type Quaderno } from './tipi';

/** Una lezione dell'elenco, nell'ordine della TOC. */
export interface LezioneElenco {
  /** `${pluginId}/${docId}`, come `Annotazione.pagina`. */
  chiave: string;
  titolo: string;
  /** Etichetta del volume. */
  volume: string;
}

export const TITOLO_NON_TROVATA = 'Pagina spostata o tolta';

const NOMI: Record<Colore, string> = {
  giallo: 'Giallo',
  verde: 'Verde',
  azzurro: 'Azzurro',
  rosa: 'Rosa',
};

const MARCATORE = /<!--\s*pdb-quaderno\s+(\d+)\s+([A-Za-z0-9_-]*)\s*-->/g;

/* ─────────────── base64url ─────────────── */

function inBase64Url(testo: string): string {
  const byte = new TextEncoder().encode(testo);
  let binario = '';
  for (let i = 0; i < byte.length; i += 0x8000)
    binario += String.fromCharCode(...byte.subarray(i, i + 0x8000));
  return btoa(binario)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function daBase64Url(codice: string): string {
  const b64 = codice.replace(/-/g, '+').replace(/_/g, '/');
  const binario = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  const byte = Uint8Array.from(binario, (c) => c.charCodeAt(0));
  return new TextDecoder('utf-8', { fatal: true }).decode(byte);
}

/* ─────────────── Scrittura ─────────────── */

/** Nell'ordine del testo (l'offset è un indizio), a parità di creazione. */
export function ordinaPerTesto(lista: Annotazione[]): Annotazione[] {
  return [...lista].sort(
    (a, b) =>
      a.selettore.inizio - b.selettore.inizio ||
      (a.creata < b.creata ? -1 : a.creata > b.creata ? 1 : 0),
  );
}

export function dataLunga(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('it-IT', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
}

/** `quaderno-python-doesnt-byte-AAAA-MM-GG.md`, con la data locale. */
export function nomeFile(data: Date): string {
  const due = (n: number) => String(n).padStart(2, '0');
  return `quaderno-python-doesnt-byte-${data.getFullYear()}-${due(data.getMonth() + 1)}-${due(data.getDate())}.md`;
}

function citazione(testo: string): string {
  return testo
    .trim()
    .split(/\n+/)
    .map((riga) => `> ${riga.replace(/\s+/g, ' ').trim()}`)
    .join('\n');
}

function voce(a: Annotazione, legenda: Quaderno['legenda']): string {
  const righe = [citazione(a.selettore.esatto), ''];
  const colore = a.colore
    ? `**${NOMI[a.colore]}**${legenda[a.colore] ? ` (${legenda[a.colore]})` : ''}`
    : 'Solo nota';
  const data = dataLunga(a.creata);
  righe.push(data ? `${colore} · ${data}` : colore);
  if (a.nota) {
    righe.push('', `**Nota:** ${a.nota.trim().split('\n').join('  \n')}`);
  }
  return righe.join('\n');
}

/**
 * Il file del quaderno. Le annotazioni vive sono raggruppate per volume e
 * lezione nell'ordine di `lezioni`; quelle di pagine che non sono nell'elenco
 * vanno in fondo, sotto «Pagina spostata o tolta».
 */
export function scrivi(
  q: Quaderno,
  lezioni: LezioneElenco[],
  data: Date,
): string {
  const vive = q.annotazioni.filter((a) => !a.cancellata);
  const perPagina = new Map<string, Annotazione[]>();
  for (const a of vive) {
    const lista = perPagina.get(a.pagina) ?? [];
    lista.push(a);
    perPagina.set(a.pagina, lista);
  }
  const righe = [
    '# Il mio quaderno — Python Doesn’t Byte',
    '',
    `Scaricato il ${dataLunga(data.toISOString())}. ${
      vive.length === 1 ? '1 annotazione.' : `${vive.length} annotazioni.`
    }`,
  ];
  const nomi = COLORI.filter((c) => q.legenda[c]);
  if (nomi.length) {
    righe.push(
      '',
      `Legenda dei colori: ${nomi.map((c) => `${NOMI[c].toLowerCase()} = ${q.legenda[c]}`).join('; ')}.`,
    );
  }

  let volume: string | null = null;
  const note = (a: Annotazione[]) =>
    ordinaPerTesto(a).map((x) => voce(x, q.legenda));
  for (const l of lezioni) {
    const lista = perPagina.get(l.chiave);
    if (!lista) continue;
    if (l.volume !== volume) {
      volume = l.volume;
      righe.push('', `## ${l.volume}`);
    }
    righe.push('', `### ${l.titolo}`);
    for (const v of note(lista)) righe.push('', v);
    perPagina.delete(l.chiave);
  }
  if (perPagina.size) {
    righe.push('', `## ${TITOLO_NON_TROVATA}`);
    for (const [chiave, lista] of perPagina) {
      righe.push('', `### ${chiave}`);
      for (const v of note(lista)) righe.push('', v);
    }
  }

  righe.push(
    '',
    '---',
    '',
    'L’ultima riga contiene i dati per reimportare il quaderno nel sito: non modificarla.',
    '',
    `<!-- pdb-quaderno 1 ${inBase64Url(JSON.stringify(q))} -->`,
    '',
  );
  return righe.join('\n');
}

/* ─────────────── Lettura ─────────────── */

export type Lettura =
  | { ok: true; quaderno: Quaderno }
  /**
   * `nuovo`: il file l'ha scritto una versione più recente del sito;
   * `illeggibile`: non è un file del quaderno, o i dati in coda sono rovinati.
   */
  | { ok: false; motivo: 'nuovo' | 'illeggibile' };

/** Legge il commento in coda; non guarda la parte in Markdown. */
export function leggi(testo: string): Lettura {
  const trovati = [...testo.matchAll(MARCATORE)];
  const ultimo = trovati[trovati.length - 1];
  if (!ultimo) return { ok: false, motivo: 'illeggibile' };
  if (Number(ultimo[1]) > 1) return { ok: false, motivo: 'nuovo' };
  let json: string;
  try {
    json = daBase64Url(ultimo[2]);
  } catch {
    return { ok: false, motivo: 'illeggibile' };
  }
  try {
    const grezzo = JSON.parse(json) as { formato?: unknown };
    if (typeof grezzo?.formato === 'number' && grezzo.formato > 1)
      return { ok: false, motivo: 'nuovo' };
  } catch {
    return { ok: false, motivo: 'illeggibile' };
  }
  const quaderno = daJson(json);
  return quaderno
    ? { ok: true, quaderno }
    : { ok: false, motivo: 'illeggibile' };
}
