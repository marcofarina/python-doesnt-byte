/**
 * Prove del codice dello zaino (`src/lib/zaino/cifra.ts` e `parole.ts`):
 * elenco delle parole, generazione, normalizzazione dei due formati e
 * compatibilità con i codici di 20 caratteri. Girano in Node, caricate con
 * jiti; non servono né il sito né il servizio.
 *
 * Uso: npm run zaino:test
 */
import assert from 'node:assert/strict';
import path from 'node:path';
import { test } from 'node:test';
import jitiFactory from 'jiti';

const RADICE = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  '..',
);
const jiti = jitiFactory(import.meta.url, { interopDefault: true });
const { PAROLE } = jiti(path.join(RADICE, 'src/lib/zaino/parole.ts'));
const { nuovoCodice, normalizzaCodice, formattaCodice, derivaChiavi, decifra } =
  jiti(path.join(RADICE, 'src/lib/zaino/cifra.ts'));

// Vettore calcolato il 2026-11-19 con il codice di 20 caratteri (lo stesso
// del test di SQL Academy): se cambia, gli zaini di prima non si aprono più.
const VECCHIO = '0123456789ABCDEFGHJK';
const ID_VECCHIO = 'JueDRI9JZAq00A_djI_EyyXxZxwuhl3lwAWMhPvDeZM';
const BLOB_VECCHIO =
  'kkc4GBc5ZhI4sF166ppbFtV1tQ5fnH5yEoak0/nxJwfSPLixECZYOjybuDU99gUL1PNmJ9CcBcC/QUK8QA3dnzx/FI1zR55XDDyDDIcCtV8wksW7B1gtxRp82sTyG/lOacwQtMZfjWiJ6dsL9mtVnVSPlxqiL+PWHNbqUpywM4jyfcWf29X4d5PHnbfq';

test('elenco: 2048 parole diverse, a–z, 4–9 lettere, prime quattro uniche', () => {
  assert.equal(PAROLE.length, 2048);
  assert.equal(new Set(PAROLE).size, 2048);
  for (const p of PAROLE) assert.match(p, /^[a-z]{4,9}$/);
  assert.equal(new Set(PAROLE.map((p) => p.slice(0, 4))).size, 2048);
});

test('nuovoCodice: quattro parole dell’elenco, già nella forma canonica', () => {
  const visti = new Set();
  for (let i = 0; i < 2000; i += 1) {
    const c = nuovoCodice();
    const parti = c.split('-');
    assert.equal(parti.length, 4);
    for (const p of parti) assert.ok(PAROLE.includes(p), p);
    assert.equal(normalizzaCodice(c), c);
    visti.add(c);
  }
  // 2000 codici da 2^44: un doppione vorrebbe dire che il caso non funziona.
  assert.equal(visti.size, 2000);
});

test('nuovoCodice: le parole escono tutte, senza preferenze evidenti', () => {
  const conta = new Map();
  const N = 50_000; // 200.000 parole, in media circa 98 per parola
  for (let i = 0; i < N; i += 1)
    for (const p of nuovoCodice().split('-'))
      conta.set(p, (conta.get(p) ?? 0) + 1);
  assert.equal(conta.size, 2048);
  // Con media 98 una parola sotto 40 o sopra 170 è praticamente impossibile.
  for (const [p, n] of conta) assert.ok(n > 40 && n < 170, `${p}: ${n}`);
});

test('normalizzaCodice: parole con maiuscole, accenti, spazi e separatori', () => {
  const c = 'volpe-faro-miele-trono';
  for (const scritto of [
    c,
    'volpe faro miele trono',
    '  Volpe   FARO miele trono ',
    'vòlpe-fàro-mièle-tronò',
    'volpe_faro.miele/trono',
    'volpe, faro, miele, trono',
    'volpefaromieletrono',
    'VolpeFaro Miele-Trono',
  ])
    assert.equal(normalizzaCodice(scritto), c, scritto);
});

test('normalizzaCodice: bastano le prime quattro lettere di ogni parola', () => {
  const c = 'volpe-faro-miele-trono';
  assert.equal(normalizzaCodice('volp faro miel tron'), c);
  assert.equal(normalizzaCodice('VOLP-FARO-MIEL-TRON'), c);
  // Dopo la quarta lettera un errore di battitura non conta.
  assert.equal(normalizzaCodice('volpa faroo mielle tronno'), c);
  assert.equal(normalizzaCodice('volpe faro miele tronoooo'), c);
});

test('normalizzaCodice: quello che non è un codice dà null', () => {
  for (const scritto of [
    '',
    'volpe faro miele', // tre parole
    'volpe faro miele trono volpe', // cinque
    'volpe faro miele xyzw', // parola che non c’è
    'vol faro miele trono', // meno di quattro lettere
    'volpfaromieltron', // attaccate, ma non intere
    'troppo corto',
  ])
    assert.equal(normalizzaCodice(scritto), null, scritto);
});

test('normalizzaCodice: i codici di 20 caratteri funzionano come prima', () => {
  assert.equal(normalizzaCodice('0123-4567 89ab cdef ghjk'), VECCHIO);
  assert.equal(normalizzaCodice(VECCHIO), VECCHIO);
  assert.equal(
    normalizzaCodice('o1234567890123456789'),
    '01234567890123456789',
  );
  assert.equal(
    normalizzaCodice('i1L1-0000-0000-0000-0000'),
    '11110000000000000000',
  );
  assert.equal(normalizzaCodice('0123-4567-89AB-CDEF-GHJ'), null);
  assert.equal(normalizzaCodice('0123-4567-89AB-CDEF-GHJU'), null);
});

test('formattaCodice: parole come sono, codici di prima a gruppi di quattro', () => {
  assert.equal(
    formattaCodice('volpe-faro-miele-trono'),
    'volpe-faro-miele-trono',
  );
  assert.equal(formattaCodice(VECCHIO), '0123-4567-89AB-CDEF-GHJK');
});

test('derivaChiavi: il codice di prima dà lo stesso id e apre lo stesso blob', async () => {
  const { id, chiave } = await derivaChiavi(VECCHIO);
  assert.equal(id, ID_VECCHIO);
  const blob = Uint8Array.from(atob(BLOB_VECCHIO), (c) => c.charCodeAt(0));
  const contenuto = await decifra(blob.buffer, chiave);
  assert.equal(contenuto.formato, 1);
  assert.ok(contenuto.sezioni.quaderno);
});

test('derivaChiavi: modi diversi di scrivere le stesse parole, stesso zaino', async () => {
  const a = await derivaChiavi(normalizzaCodice('volpe-faro-miele-trono'));
  const b = await derivaChiavi(normalizzaCodice('VOLP FARO MIEL TRON'));
  const c = await derivaChiavi(normalizzaCodice('volpe-faro-miele-tronco'));
  assert.equal(a.id, b.id);
  assert.match(a.id, /^[A-Za-z0-9_-]{43}$/);
  assert.notEqual(a.id, (await derivaChiavi('faro-volpe-miele-trono')).id);
  // «tronco» non è nell’elenco: le prime quattro lettere dicono «trono».
  assert.equal(c.id, a.id);
});
