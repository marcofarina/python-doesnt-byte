/**
 * Codice dello zaino e cifratura (piano pm/piano-2026-11-quaderno.md, tabella
 * dei default, «Codice dello zaino» e «Cifratura»).
 *
 * - Il codice: 20 caratteri base32 Crockford (100 bit casuali), mostrati a
 *   gruppi di quattro. È l'unica chiave: chi lo perde perde lo zaino.
 * - Dal codice, con HKDF-SHA-256, due valori indipendenti: l'`id` che vede il
 *   server (32 byte, base64url) e la chiave AES-GCM-256, che non lascia mai il
 *   browser.
 * - Il blob: IV casuale di 12 byte ‖ AES-GCM(gzip(JSON del contenuto)).
 *
 * Serve un contesto sicuro (`crypto.subtle`): https o localhost.
 */
import type { ContenutoZaino } from './tipi';

const ALFABETO = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const LUNGHEZZA = 20;
const SALE = 'python-doesnt-byte/zaino/1';
const LUNGHEZZA_IV = 12;

const testo = (s: string) => new TextEncoder().encode(s);

/** Il browser ha quello che serve allo zaino? */
export function zainoSupportato(): boolean {
  return (
    typeof window !== 'undefined' &&
    !!globalThis.crypto?.subtle &&
    typeof CompressionStream === 'function' &&
    typeof DecompressionStream === 'function'
  );
}

/** Un codice nuovo, 20 caratteri senza trattini. */
export function nuovoCodice(): string {
  // 256 è multiplo di 32: `byte & 31` è uniforme.
  const b = crypto.getRandomValues(new Uint8Array(LUNGHEZZA));
  return [...b].map((x) => ALFABETO[x & 31]).join('');
}

/**
 * Da quello che scrive lo studente al codice: maiuscole, senza spazi né
 * trattini, I e L lette come 1, O come 0 (regole di Crockford). null se non è
 * un codice.
 */
export function normalizzaCodice(scritto: string): string | null {
  const c = scritto
    .toUpperCase()
    .replace(/[\s-]/g, '')
    .replace(/[IL]/g, '1')
    .replace(/O/g, '0');
  if (c.length !== LUNGHEZZA) return null;
  for (const x of c) if (!ALFABETO.includes(x)) return null;
  return c;
}

/** `XXXX-XXXX-XXXX-XXXX-XXXX`. */
export function formattaCodice(codice: string): string {
  return codice.match(/.{1,4}/g)?.join('-') ?? codice;
}

function base64url(b: ArrayBuffer): string {
  let s = '';
  for (const x of new Uint8Array(b)) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export interface Chiavi {
  /** 43 caratteri base64url: l'unica cosa che il server sa dello zaino. */
  id: string;
  chiave: CryptoKey;
}

export async function derivaChiavi(codice: string): Promise<Chiavi> {
  const materiale = await crypto.subtle.importKey(
    'raw',
    testo(codice),
    'HKDF',
    false,
    ['deriveBits', 'deriveKey'],
  );
  const hkdf = (info: string): HkdfParams => ({
    name: 'HKDF',
    hash: 'SHA-256',
    salt: testo(SALE),
    info: testo(info),
  });
  const id = await crypto.subtle.deriveBits(hkdf('id'), materiale, 256);
  const chiave = await crypto.subtle.deriveKey(
    hkdf('chiave'),
    materiale,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
  return { id: base64url(id), chiave };
}

async function attraversa(
  dati: Uint8Array,
  trasforma: CompressionStream | DecompressionStream,
): Promise<Uint8Array> {
  const flusso = new Blob([dati]).stream().pipeThrough(trasforma);
  return new Uint8Array(await new Response(flusso).arrayBuffer());
}

export async function cifra(
  contenuto: ContenutoZaino,
  chiave: CryptoKey,
): Promise<Uint8Array> {
  const compresso = await attraversa(
    testo(JSON.stringify(contenuto)),
    new CompressionStream('gzip'),
  );
  const iv = crypto.getRandomValues(new Uint8Array(LUNGHEZZA_IV));
  const cifrato = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    chiave,
    compresso,
  );
  const blob = new Uint8Array(LUNGHEZZA_IV + cifrato.byteLength);
  blob.set(iv, 0);
  blob.set(new Uint8Array(cifrato), LUNGHEZZA_IV);
  return blob;
}

/** Il contenuto grezzo (da validare); lancia se il blob non è di questa chiave. */
export async function decifra(
  blob: ArrayBuffer,
  chiave: CryptoKey,
): Promise<unknown> {
  const b = new Uint8Array(blob);
  const chiaro = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: b.slice(0, LUNGHEZZA_IV) },
    chiave,
    b.slice(LUNGHEZZA_IV),
  );
  const json = await attraversa(
    new Uint8Array(chiaro),
    new DecompressionStream('gzip'),
  );
  return JSON.parse(new TextDecoder().decode(json));
}
