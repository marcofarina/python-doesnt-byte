/**
 * Prova del servizio dello zaino (piano pm/piano-2026-11-quaderno.md, fase
 * Q4): protocollo, limiti e CORS, contro un servizio vivo.
 *
 * Uso: node servizi/zaino/prova.mjs http://localhost:8787
 *      node servizi/zaino/prova.mjs https://zaino.rainbowbits.cloud
 *
 * Crea uno zaino con un id casuale e lo cancella alla fine. Esce con 1 se un
 * caso fallisce, 2 se il servizio non risponde.
 */
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';

const BASE = (process.argv[2] ?? 'http://localhost:8787').replace(/\/$/, '');
const LIBRO = 'https://python.rainbowbits.cloud';

const esiti = [];
async function caso(nome, fn) {
  try {
    await fn();
    esiti.push({ nome, ok: true });
  } catch (e) {
    esiti.push({ nome, ok: false, errore: e.message.split('\n')[0] });
  }
}

const id = randomBytes(32).toString('base64url');
const url = (x = id) => `${BASE}/v1/zaino/${x}`;
const blob = (n) => randomBytes(n);

async function main() {
  try {
    await fetch(url('x'));
  } catch (e) {
    console.error(`Il servizio ${BASE} non risponde (${e.message}).`);
    process.exit(2);
  }

  let versione = null;

  await caso('GET di uno zaino che non esiste → 404', async () => {
    const r = await fetch(url());
    assert.equal(r.status, 404);
  });

  await caso('PUT senza precondizione → 428', async () => {
    const r = await fetch(url(), { method: 'PUT', body: blob(100) });
    assert.equal(r.status, 428);
  });

  const primo = blob(1000);
  await caso('creazione con If-None-Match: * → 200 e ETag "1"', async () => {
    const r = await fetch(url(), {
      method: 'PUT',
      headers: { 'If-None-Match': '*' },
      body: primo,
    });
    assert.equal(r.status, 200);
    versione = r.headers.get('ETag');
    assert.equal(versione, '"1"');
  });

  await caso('seconda creazione dello stesso id → 412', async () => {
    const r = await fetch(url(), {
      method: 'PUT',
      headers: { 'If-None-Match': '*' },
      body: blob(100),
    });
    assert.equal(r.status, 412);
  });

  await caso('lettura → stesso blob ed ETag', async () => {
    const r = await fetch(url());
    assert.equal(r.status, 200);
    assert.equal(r.headers.get('ETag'), versione);
    assert.equal(r.headers.get('Content-Type'), 'application/octet-stream');
    assert.deepEqual(Buffer.from(await r.arrayBuffer()), primo);
  });

  await caso('aggiornamento con If-Match giusto → ETag "2"', async () => {
    const r = await fetch(url(), {
      method: 'PUT',
      headers: { 'If-Match': versione },
      body: blob(2000),
    });
    assert.equal(r.status, 200);
    assert.equal(r.headers.get('ETag'), '"2"');
  });

  await caso('If-Match vecchio → 412', async () => {
    const r = await fetch(url(), {
      method: 'PUT',
      headers: { 'If-Match': versione },
      body: blob(100),
    });
    assert.equal(r.status, 412);
    versione = '"2"';
  });

  await caso('300 KB → 413', async () => {
    const r = await fetch(url(), {
      method: 'PUT',
      headers: { 'If-Match': versione },
      body: blob(300 * 1024),
    });
    assert.equal(r.status, 413);
  });

  await caso('blob troppo corto per essere cifrato → 400', async () => {
    const r = await fetch(url(), {
      method: 'PUT',
      headers: { 'If-Match': versione },
      body: blob(10),
    });
    assert.equal(r.status, 400);
  });

  await caso('id malformato → 400', async () => {
    for (const x of ['corto', `${id}x`, `${id.slice(0, 42)}+`]) {
      const r = await fetch(url(x));
      assert.equal(r.status, 400, x);
    }
  });

  await caso('preflight dal dominio del libro → ammesso', async () => {
    const r = await fetch(url(), {
      method: 'OPTIONS',
      headers: {
        Origin: LIBRO,
        'Access-Control-Request-Method': 'PUT',
        'Access-Control-Request-Headers': 'if-match',
      },
    });
    assert.equal(r.status, 204);
    assert.equal(r.headers.get('Access-Control-Allow-Origin'), LIBRO);
    assert.match(r.headers.get('Access-Control-Allow-Methods'), /PUT/);
    assert.match(r.headers.get('Access-Control-Allow-Headers'), /If-Match/i);
    assert.equal(r.headers.get('Access-Control-Max-Age'), '7200');
  });

  await caso('GET dal dominio del libro → ETag leggibile', async () => {
    const r = await fetch(url(), { headers: { Origin: LIBRO } });
    assert.equal(r.status, 200);
    assert.equal(r.headers.get('Access-Control-Allow-Origin'), LIBRO);
    assert.match(r.headers.get('Access-Control-Expose-Headers'), /ETag/);
  });

  await caso('preflight e GET da https://example.com → rifiutati', async () => {
    const p = await fetch(url(), {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://example.com',
        'Access-Control-Request-Method': 'PUT',
      },
    });
    assert.equal(p.headers.get('Access-Control-Allow-Origin'), null);
    assert.notEqual(p.status, 204);
    const g = await fetch(url(), {
      headers: { Origin: 'https://example.com' },
    });
    assert.equal(g.status, 403);
    assert.equal(g.headers.get('Access-Control-Allow-Origin'), null);
  });

  await caso(
    'DELETE senza If-Match → 428, con If-Match vecchio → 412',
    async () => {
      const a = await fetch(url(), { method: 'DELETE' });
      assert.equal(a.status, 428);
      const b = await fetch(url(), {
        method: 'DELETE',
        headers: { 'If-Match': '"1"' },
      });
      assert.equal(b.status, 412);
    },
  );

  await caso('DELETE con If-Match giusto → 204, poi 404', async () => {
    const r = await fetch(url(), {
      method: 'DELETE',
      headers: { 'If-Match': versione },
    });
    assert.equal(r.status, 204);
    assert.equal((await fetch(url())).status, 404);
  });

  for (const e of esiti)
    console.log(
      `  ${e.ok ? '✓' : '✗'} ${e.nome}${e.ok ? '' : `\n      ${e.errore}`}`,
    );
  const falliti = esiti.filter((e) => !e.ok).length;
  console.log(
    falliti
      ? `${falliti} casi falliti su ${esiti.length}.`
      : `Tutti i ${esiti.length} casi superati (${BASE}).`,
  );
  process.exit(falliti ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
