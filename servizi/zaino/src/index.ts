/**
 * Servizio dello zaino di Python Doesn't Byte (piano
 * pm/piano-2026-11-quaderno.md, fase Q4, «Protocollo dello zaino»).
 *
 * Una casella per zaino: `id` (43 caratteri base64url, derivato dal codice
 * dello studente), un blob cifrato che il servizio non sa leggere, una
 * versione che cresce a ogni scrittura (è l'ETag) e la data dell'ultima
 * scrittura. Il servizio non decifra e non unisce niente: unisce il client.
 *
 *   GET    /v1/zaino/:id   200 blob + ETag · 404
 *   PUT    /v1/zaino/:id   If-None-Match: * (crea) o If-Match: "<n>"
 *                          200 + ETag · 412 · 428 · 413 · 429
 *   DELETE /v1/zaino/:id   If-Match: "<n>" · 204 · 412 · 428
 *
 * Protezioni: 256 KB per zaino, limite di frequenza per IP (binding
 * `LIMITE`), CORS solo per il sito del libro, per `npm start` e per `npm run dev`
 * di SQL Academy (che usa lo stesso zaino, sezione `sql-academy`), zaini fermi da
 * 18 mesi cancellati dal Cron Trigger giornaliero. Il Worker non scrive log.
 */

export interface Env {
  DB: D1Database;
  LIMITE?: RateLimit;
}

/** Dimensione massima di un blob: 256 KB. */
const MAX_BLOB = 256 * 1024;
/** IV (12 byte) più il tag di AES-GCM (16 byte): un blob più corto non è cifrato da noi. */
const MIN_BLOB = 12 + 16;
/** Uno zaino fermo da 18 mesi si cancella. */
const DURATA_MS = 548 * 24 * 60 * 60 * 1000;

const ORIGINI = new Set([
  'https://python.rainbowbits.cloud',
  'http://localhost:3000',
  // SQL Academy in sviluppo (`npm run dev`); l'origine pubblicata si aggiunge
  // quando il portale avrà il suo dominio.
  'http://localhost:5173',
]);

const PERCORSO = /^\/v1\/zaino\/([A-Za-z0-9_-]{43})$/;
const PREFISSO = '/v1/zaino/';

function intestazioniCors(origine: string | null): Headers {
  const h = new Headers();
  if (origine && ORIGINI.has(origine)) {
    h.set('Access-Control-Allow-Origin', origine);
    h.set('Access-Control-Expose-Headers', 'ETag');
  }
  h.set('Vary', 'Origin');
  return h;
}

function risposta(
  stato: number,
  origine: string | null,
  corpo: BodyInit | null = null,
  extra: Record<string, string> = {},
): Response {
  const h = intestazioniCors(origine);
  h.set('Cache-Control', 'no-store');
  for (const [k, v] of Object.entries(extra)) h.set(k, v);
  if (typeof corpo === 'string')
    h.set('Content-Type', 'text/plain; charset=utf-8');
  return new Response(corpo, { status: stato, headers: h });
}

const etag = (versione: number): string => `"${versione}"`;

/** La versione di `If-Match: "<n>"`; null se manca o non si legge. */
function versioneRichiesta(h: string | null): number | null {
  const m = h?.trim().match(/^(?:W\/)?"(\d{1,15})"$/);
  return m ? Number(m[1]) : null;
}

async function leggiCorpo(richiesta: Request): Promise<ArrayBuffer | 'troppo'> {
  const dichiarata = Number(richiesta.headers.get('Content-Length') ?? NaN);
  if (dichiarata > MAX_BLOB) return 'troppo';
  if (!richiesta.body) return new ArrayBuffer(0);
  // Content-Length può mancare (chunked): si legge a pezzi e ci si ferma oltre il limite.
  const lettore = richiesta.body.getReader();
  const pezzi: Uint8Array[] = [];
  let totale = 0;
  for (;;) {
    const { done, value } = await lettore.read();
    if (done) break;
    totale += value.byteLength;
    if (totale > MAX_BLOB) {
      await lettore.cancel();
      return 'troppo';
    }
    pezzi.push(value);
  }
  const tutto = new Uint8Array(totale);
  let i = 0;
  for (const p of pezzi) {
    tutto.set(p, i);
    i += p.byteLength;
  }
  return tutto.buffer;
}

async function leggi(env: Env, id: string, o: string | null) {
  const riga = await env.DB.prepare(
    'SELECT blob, versione FROM zaini WHERE id = ?',
  )
    .bind(id)
    .first<{ blob: ArrayBuffer | number[]; versione: number }>();
  if (!riga) return risposta(404, o, 'zaino inesistente');
  const blob =
    riga.blob instanceof ArrayBuffer ? riga.blob : new Uint8Array(riga.blob);
  return risposta(200, o, blob, {
    'Content-Type': 'application/octet-stream',
    ETag: etag(riga.versione),
  });
}

async function scrivi(env: Env, id: string, r: Request, o: string | null) {
  const crea = r.headers.get('If-None-Match')?.trim() === '*';
  const atteso = versioneRichiesta(r.headers.get('If-Match'));
  if (!crea && atteso === null)
    return risposta(428, o, 'serve If-Match o If-None-Match: *');
  const corpo = await leggiCorpo(r);
  if (corpo === 'troppo') return risposta(413, o, 'zaino pieno');
  if (corpo.byteLength < MIN_BLOB) return risposta(400, o, 'blob non valido');
  const adesso = Date.now();
  const riga = crea
    ? await env.DB.prepare(
        'INSERT INTO zaini (id, blob, versione, aggiornato) VALUES (?, ?, 1, ?) ' +
          'ON CONFLICT (id) DO NOTHING RETURNING versione',
      )
        .bind(id, corpo, adesso)
        .first<{ versione: number }>()
    : await env.DB.prepare(
        'UPDATE zaini SET blob = ?, versione = versione + 1, aggiornato = ? ' +
          'WHERE id = ? AND versione = ? RETURNING versione',
      )
        .bind(corpo, adesso, id, atteso)
        .first<{ versione: number }>();
  if (!riga) return risposta(412, o, 'versione cambiata');
  return risposta(200, o, null, { ETag: etag(riga.versione) });
}

async function cancella(env: Env, id: string, r: Request, o: string | null) {
  const atteso = versioneRichiesta(r.headers.get('If-Match'));
  if (atteso === null) return risposta(428, o, 'serve If-Match');
  const esito = await env.DB.prepare(
    'DELETE FROM zaini WHERE id = ? AND versione = ?',
  )
    .bind(id, atteso)
    .run();
  return esito.meta.changes > 0
    ? risposta(204, o)
    : risposta(412, o, 'versione cambiata');
}

export default {
  async fetch(richiesta: Request, env: Env): Promise<Response> {
    const url = new URL(richiesta.url);
    const origine = richiesta.headers.get('Origin');
    // Una pagina di un altro sito non deve poter usare il servizio. Le
    // richieste senza Origin (script, curl) passano: non sono un browser.
    if (origine && !ORIGINI.has(origine))
      return risposta(403, null, 'origine non ammessa');

    if (!url.pathname.startsWith(PREFISSO))
      return risposta(404, origine, 'non trovato');

    if (richiesta.method === 'OPTIONS') {
      const h = intestazioniCors(origine);
      if (origine) {
        h.set('Access-Control-Allow-Methods', 'GET, PUT, DELETE');
        h.set(
          'Access-Control-Allow-Headers',
          'Content-Type, If-Match, If-None-Match',
        );
        h.set('Access-Control-Max-Age', '7200');
      }
      return new Response(null, { status: 204, headers: h });
    }

    const m = url.pathname.match(PERCORSO);
    if (!m) return risposta(400, origine, 'id non valido');
    const id = m[1];

    if (env.LIMITE) {
      const ip = richiesta.headers.get('CF-Connecting-IP') ?? 'sconosciuto';
      const { success } = await env.LIMITE.limit({ key: ip });
      if (!success)
        return risposta(429, origine, 'troppe richieste', {
          'Retry-After': '60',
        });
    }

    switch (richiesta.method) {
      case 'GET':
        return leggi(env, id, origine);
      case 'PUT':
        return scrivi(env, id, richiesta, origine);
      case 'DELETE':
        return cancella(env, id, richiesta, origine);
      default:
        return risposta(405, origine, 'metodo non ammesso', {
          Allow: 'GET, PUT, DELETE, OPTIONS',
        });
    }
  },

  /** Cron Trigger giornaliero: via gli zaini fermi da 18 mesi. */
  async scheduled(_evento: ScheduledController, env: Env): Promise<void> {
    await env.DB.prepare('DELETE FROM zaini WHERE aggiornato < ?')
      .bind(Date.now() - DURATA_MS)
      .run();
  },
} satisfies ExportedHandler<Env>;
