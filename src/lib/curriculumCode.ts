/**
 * Codec dei codici-percorso (spec: pm/design-percorsi-personalizzati.md).
 *
 * Un codice è una funzione pura della selezione di lezioni: byte binari
 * (versione, epoca, modo, N, payload, CRC-8) resi in Crockford Base32 con
 * prefisso `PDB1-` e gruppi di 4. L'encoder produce il payload sia come
 * bitmask sia come RLE (coppie varint salto/run) ed emette il più corto;
 * il decoder accetta entrambi i modi, è case-insensitive, ignora trattini
 * e spazi e mappa i caratteri ambigui (O→0, I/L→1).
 *
 * Nessuna dipendenza: usabile da client, plugin Node e script.
 */

export const CODE_VERSION = 1;
export const CODE_PREFIX = 'PDB1';

export const MODE_BITMASK = 0x00;
export const MODE_RLE = 0x01;

/** Motivi di rifiuto, per messaggi d'errore mirati nella UI. */
export type CurriculumCodeErrorReason =
  | 'empty' // stringa vuota dopo la normalizzazione
  | 'charset' // caratteri fuori dall'alfabeto Base32 Crockford
  | 'truncated' // troppo corto per contenere header + CRC
  | 'crc' // checksum errato (typo o codice monco)
  | 'version' // versione formato sconosciuta (sito più vecchio del codice)
  | 'mode' // modo di codifica sconosciuto
  | 'payload' // payload incoerente con N (bit oltre N, run fuori range)
  | 'epoch'; // epoca assente dal manifest (lanciato dal CurriculumContext)

export class CurriculumCodeError extends Error {
  readonly reason: CurriculumCodeErrorReason;

  constructor(reason: CurriculumCodeErrorReason, message: string) {
    super(message);
    this.name = 'CurriculumCodeError';
    this.reason = reason;
  }
}

export interface DecodedCurriculum {
  version: number;
  /** Epoca del manifest contro cui il codice è stato creato (1 = a.s. 2026/27). */
  epoch: number;
  /** Lunghezza del manifest d'epoca al momento della creazione (snapshot). */
  n: number;
  /** Indici di bit inclusi (posizioni nel manifest d'epoca). */
  indices: ReadonlySet<number>;
}

// ── Base32 Crockford ────────────────────────────────────────────────────────

const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

const CHAR_VALUE: Record<string, number> = {};
for (let i = 0; i < ALPHABET.length; i++) CHAR_VALUE[ALPHABET[i]] = i;
// Mappature di cortesia per i caratteri esclusi dall'alfabeto.
CHAR_VALUE['O'] = 0;
CHAR_VALUE['I'] = 1;
CHAR_VALUE['L'] = 1;

function base32Encode(bytes: Uint8Array): string {
  let out = '';
  let acc = 0;
  let bits = 0;
  for (const byte of bytes) {
    acc = (acc << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += ALPHABET[(acc >> (bits - 5)) & 0x1f];
      bits -= 5;
    }
  }
  if (bits > 0) out += ALPHABET[(acc << (5 - bits)) & 0x1f];
  return out;
}

function base32Decode(text: string): Uint8Array {
  const out: number[] = [];
  let acc = 0;
  let bits = 0;
  for (const ch of text) {
    const value = CHAR_VALUE[ch];
    if (value === undefined) {
      throw new CurriculumCodeError(
        'charset',
        `Carattere non valido nel codice: «${ch}».`,
      );
    }
    acc = (acc << 5) | value;
    bits += 5;
    if (bits >= 8) {
      out.push((acc >> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  // I bit residui (< 8) sono padding dell'ultimo carattere: si scartano.
  return Uint8Array.from(out);
}

// ── CRC-8 (poly 0x07, init 0x00) ────────────────────────────────────────────

function crc8(bytes: Uint8Array, length: number): number {
  let crc = 0;
  for (let i = 0; i < length; i++) {
    crc ^= bytes[i];
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x80 ? ((crc << 1) ^ 0x07) & 0xff : (crc << 1) & 0xff;
    }
  }
  return crc;
}

// ── Varint LEB128 (unsigned) ────────────────────────────────────────────────

function pushVarint(out: number[], value: number): void {
  let v = value;
  while (v >= 0x80) {
    out.push((v & 0x7f) | 0x80);
    v >>>= 7;
  }
  out.push(v);
}

function readVarint(bytes: Uint8Array, offset: number): [number, number] {
  let value = 0;
  let shift = 0;
  let pos = offset;
  for (;;) {
    if (pos >= bytes.length) {
      throw new CurriculumCodeError('payload', 'Payload RLE troncato.');
    }
    const byte = bytes[pos++];
    value |= (byte & 0x7f) << shift;
    if ((byte & 0x80) === 0) return [value, pos];
    shift += 7;
    if (shift > 28) {
      throw new CurriculumCodeError('payload', 'Varint fuori range.');
    }
  }
}

// ── Payload: bitmask e RLE ──────────────────────────────────────────────────

function encodeBitmask(n: number, indices: ReadonlySet<number>): number[] {
  const bytes = new Array<number>(Math.ceil(n / 8)).fill(0);
  for (const i of indices) {
    bytes[i >> 3] |= 1 << (7 - (i & 7));
  }
  return bytes;
}

function decodeBitmask(payload: Uint8Array, n: number): Set<number> {
  const indices = new Set<number>();
  if (payload.length !== Math.ceil(n / 8)) {
    throw new CurriculumCodeError(
      'payload',
      `Bitmask di ${payload.length} byte incoerente con N=${n}.`,
    );
  }
  for (let i = 0; i < n; i++) {
    if (payload[i >> 3] & (1 << (7 - (i & 7)))) indices.add(i);
  }
  return indices;
}

/**
 * RLE: coppie varint (salto, run) — `salto` bit a 0 dalla posizione corrente,
 * poi `run` (≥ 1) bit a 1. Le posizioni dopo l'ultima coppia sono a 0.
 */
function encodeRle(indices: ReadonlySet<number>): number[] {
  const sorted = [...indices].sort((a, b) => a - b);
  const out: number[] = [];
  let cursor = 0;
  let i = 0;
  while (i < sorted.length) {
    const start = sorted[i];
    let end = i;
    while (end + 1 < sorted.length && sorted[end + 1] === sorted[end] + 1) {
      end++;
    }
    pushVarint(out, start - cursor);
    pushVarint(out, end - i + 1);
    cursor = sorted[end] + 1;
    i = end + 1;
  }
  return out;
}

function decodeRle(payload: Uint8Array, n: number): Set<number> {
  const indices = new Set<number>();
  let cursor = 0;
  let pos = 0;
  while (pos < payload.length) {
    const [gap, afterGap] = readVarint(payload, pos);
    const [run, afterRun] = readVarint(payload, afterGap);
    pos = afterRun;
    if (run < 1 || cursor + gap + run > n) {
      throw new CurriculumCodeError(
        'payload',
        `Run RLE fuori range (cursor=${cursor}, gap=${gap}, run=${run}, N=${n}).`,
      );
    }
    cursor += gap;
    for (let k = 0; k < run; k++) indices.add(cursor++);
  }
  return indices;
}

// ── API pubblica ────────────────────────────────────────────────────────────

/**
 * Codifica una selezione in codice testuale canonico (`PDB1-XXXX-…`).
 *
 * @param epoch epoca del manifest (1–255)
 * @param n lunghezza del manifest d'epoca (numero di bit, 0–65535)
 * @param indices posizioni incluse (0 ≤ i < n)
 */
export function encodeCurriculum(
  epoch: number,
  n: number,
  indices: ReadonlySet<number>,
): string {
  if (!Number.isInteger(epoch) || epoch < 1 || epoch > 255) {
    throw new RangeError(`Epoca fuori range (1–255): ${epoch}`);
  }
  if (!Number.isInteger(n) || n < 0 || n > 0xffff) {
    throw new RangeError(`N fuori range (0–65535): ${n}`);
  }
  for (const i of indices) {
    if (!Number.isInteger(i) || i < 0 || i >= n) {
      throw new RangeError(`Indice fuori dal manifest (N=${n}): ${i}`);
    }
  }

  const bitmask = encodeBitmask(n, indices);
  const rle = encodeRle(indices);
  const [mode, payload] =
    rle.length < bitmask.length ? [MODE_RLE, rle] : [MODE_BITMASK, bitmask];

  const bytes = new Uint8Array(5 + payload.length + 1);
  bytes[0] = CODE_VERSION;
  bytes[1] = epoch;
  bytes[2] = mode;
  bytes[3] = (n >> 8) & 0xff;
  bytes[4] = n & 0xff;
  bytes.set(payload, 5);
  bytes[bytes.length - 1] = crc8(bytes, bytes.length - 1);

  const text = base32Encode(bytes);
  const groups = text.match(/.{1,4}/g) ?? [];
  return [CODE_PREFIX, ...groups].join('-');
}

/**
 * Decodifica un codice testuale. Tollera minuscole, spazi, trattini, i
 * caratteri ambigui O/I/L e il prefisso mancante. Lancia
 * `CurriculumCodeError` (con `reason`) su ogni input non valido.
 */
export function decodeCurriculum(raw: string): DecodedCurriculum {
  // La mappatura di cortesia precede lo strip del prefisso, così anche un
  // «PDBI-…» scritto a mano viene riconosciuto come «PDB1-…».
  let text = raw
    .replace(/[\s-]+/g, '')
    .toUpperCase()
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1');
  if (text.startsWith(CODE_PREFIX)) text = text.slice(CODE_PREFIX.length);
  if (text.length === 0) {
    throw new CurriculumCodeError('empty', 'Codice vuoto.');
  }

  const bytes = base32Decode(text);
  // Header (5 byte) + CRC (1 byte): sotto questa soglia il codice è monco.
  if (bytes.length < 6) {
    throw new CurriculumCodeError('truncated', 'Codice troppo corto.');
  }
  if (crc8(bytes, bytes.length - 1) !== bytes[bytes.length - 1]) {
    throw new CurriculumCodeError(
      'crc',
      'Checksum errato: controlla di aver copiato il codice per intero.',
    );
  }
  if (bytes[0] !== CODE_VERSION) {
    throw new CurriculumCodeError(
      'version',
      `Versione formato sconosciuta (${bytes[0]}): il codice è stato creato ` +
        'con una versione più recente del sito.',
    );
  }

  const epoch = bytes[1];
  const mode = bytes[2];
  const n = (bytes[3] << 8) | bytes[4];
  const payload = bytes.subarray(5, bytes.length - 1);

  let indices: Set<number>;
  if (mode === MODE_BITMASK) {
    indices = decodeBitmask(payload, n);
  } else if (mode === MODE_RLE) {
    indices = decodeRle(payload, n);
  } else {
    throw new CurriculumCodeError(
      'mode',
      `Modo di codifica sconosciuto (${mode}).`,
    );
  }

  return { version: bytes[0], epoch, n, indices };
}

/**
 * Forma canonica di un codice comunque scritto (minuscole, senza trattini,
 * modo non ottimale…): decodifica e ricodifica. Il determinismo della forma
 * canonica permette il confronto stringa con i codici dei preset.
 */
export function normalizeCurriculumCode(raw: string): string {
  const { epoch, n, indices } = decodeCurriculum(raw);
  return encodeCurriculum(epoch, n, indices);
}
