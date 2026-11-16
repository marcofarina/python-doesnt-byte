/**
 * Banco di prova del quaderno (piano pm/piano-2026-11-quaderno.md, fase Q0):
 * ancoraggio, archivio locale e unione, contro la sandbox docs/quaderno-test.
 *
 * - L'unione (`src/lib/quaderno/unisci.ts`) si prova in Node, caricata con jiti.
 * - Ancoraggio e archivio si provano nel browser attraverso `window.__quaderno`
 *   (`src/lib/quaderno/sonda.ts`), sulla sandbox e sulla sua `?variante=2`, che
 *   simula una riscrittura della lezione.
 *
 * Lavora contro `npm start` sulla porta 3000. Il browser è il Chrome installato
 * (`channel: 'chrome'`); per usarne un altro, QUADERNO_CHROME=/percorso/chrome.
 * Per un dev server su un'altra porta, QUADERNO_SERVER=http://localhost:3001.
 * Esce con codice 1 se un caso fallisce, 2 se manca il server o il browser.
 *
 * Uso: npm run quaderno:prova
 */
import assert from 'node:assert/strict';
import path from 'node:path';
import jitiFactory from 'jiti';
import { chromium } from 'playwright-core';

const RADICE = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  '..',
);
const SERVER = process.env.QUADERNO_SERVER ?? 'http://localhost:3000';
const PAGINA = '/docs/quaderno-test/';

const esiti = [];
async function caso(nome, fn) {
  try {
    await fn();
    esiti.push({ nome, ok: true });
  } catch (e) {
    esiti.push({ nome, ok: false, errore: e.message.split('\n')[0] });
  }
}

/* ------------------------------------------------------------------ unione */

function annotazione(id, cambi = {}) {
  return {
    id,
    pagina: 'default/quaderno-test',
    selettore: { esatto: id, prima: '', dopo: '', inizio: 0, titolo: null },
    colore: 'giallo',
    nota: '',
    creata: '2026-11-01T10:00:00.000Z',
    modificata: '2026-11-01T10:00:00.000Z',
    dispositivo: 'aaaa',
    ...cambi,
  };
}

function quaderno(annotazioni, legenda = {}, legendaModificata) {
  return {
    formato: 1,
    annotazioni,
    legenda: { giallo: '', verde: '', azzurro: '', rosa: '', ...legenda },
    legendaModificata: legendaModificata ?? '1970-01-01T00:00:00.000Z',
  };
}

const lapide = (id, modificata, dispositivo = 'aaaa') =>
  annotazione(id, {
    selettore: { esatto: '', prima: '', dopo: '', inizio: 0, titolo: null },
    colore: null,
    modificata,
    dispositivo,
    cancellata: true,
  });

async function proveUnione() {
  const jiti = jitiFactory(import.meta.url, { interopDefault: true });
  const { unisci } = jiti(path.join(RADICE, 'src/lib/quaderno/unisci.ts'));

  // Due dispositivi con modifiche in conflitto, a parità di ora, lapidi e
  // annotazioni che stanno da una parte sola.
  const a = quaderno(
    [
      annotazione('a1', { creata: '2026-11-01T09:00:00.000Z' }),
      annotazione('c1', {
        nota: 'vecchia',
        modificata: '2026-11-02T10:00:00.000Z',
      }),
      annotazione('c2', {
        colore: 'verde',
        dispositivo: 'aaaa',
        modificata: '2026-11-03T10:00:00.000Z',
      }),
      annotazione('c3', { modificata: '2026-11-04T10:00:00.000Z' }),
      lapide('c4', '2026-11-05T10:00:00.000Z'),
    ],
    { giallo: 'da ricordare' },
    '2026-11-02T00:00:00.000Z',
  );
  const b = quaderno(
    [
      annotazione('b1', {
        creata: '2026-11-01T11:00:00.000Z',
        dispositivo: 'bbbb',
      }),
      annotazione('c1', {
        nota: 'nuova',
        modificata: '2026-11-03T10:00:00.000Z',
        dispositivo: 'bbbb',
      }),
      annotazione('c2', {
        colore: 'rosa',
        dispositivo: 'bbbb',
        modificata: '2026-11-03T10:00:00.000Z',
      }),
      lapide('c3', '2026-11-05T10:00:00.000Z', 'bbbb'),
      annotazione('c4', {
        modificata: '2026-11-04T10:00:00.000Z',
        dispositivo: 'bbbb',
      }),
    ],
    { verde: 'domande' },
    '2026-11-03T00:00:00.000Z',
  );

  await caso('unione: unisci(a, b) uguale a unisci(b, a)', () => {
    assert.deepEqual(unisci(a, b), unisci(b, a));
  });
  await caso('unione: unisci(a, a) uguale ad a', () => {
    assert.deepEqual(unisci(a, a), a);
    const ab = unisci(a, b);
    assert.deepEqual(unisci(ab, ab), ab);
    assert.deepEqual(unisci(ab, b), ab);
  });
  await caso(
    'unione: vince la modifica più recente, a parità il dispositivo maggiore',
    () => {
      const per = new Map(unisci(a, b).annotazioni.map((x) => [x.id, x]));
      assert.equal(per.get('c1').nota, 'nuova');
      assert.equal(per.get('c2').colore, 'rosa');
      assert.ok(per.has('a1') && per.has('b1'));
      assert.equal(unisci(a, b).legenda.verde, 'domande');
    },
  );
  await caso(
    'unione: una lapide più recente vince su una modifica più vecchia',
    () => {
      const per = new Map(unisci(a, b).annotazioni.map((x) => [x.id, x]));
      assert.equal(per.get('c3').cancellata, true);
      assert.equal(per.get('c4').cancellata, true);
      // E il contrario: una modifica dopo la lapide la batte.
      const tardi = quaderno([
        annotazione('c3', { modificata: '2026-11-06T10:00:00.000Z' }),
      ]);
      const r = unisci(unisci(a, b), tardi).annotazioni.find(
        (x) => x.id === 'c3',
      );
      assert.equal(r.cancellata, undefined);
    },
  );
}

/* ---------------------------------------------------------------- browser */

/** Tutte le posizioni di una frase nel testo, con gli spazi elastici. */
function trova(testo, frase) {
  const re = new RegExp(
    frase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\s+'),
    'g',
  );
  return [...testo.matchAll(re)].map((m) => ({
    inizio: m.index,
    fine: m.index + m[0].length,
  }));
}

function una(testo, frase) {
  const r = trova(testo, frase);
  assert.equal(r.length, 1, `«${frase}» compare ${r.length} volte`);
  return r[0];
}

async function apri(page, variante = 1) {
  const q = variante === 2 ? '?variante=2' : '';
  await page.goto(`${SERVER}${PAGINA}${q}`, { waitUntil: 'networkidle' });
  await page.waitForFunction(
    (v) =>
      window.__quaderno && document.querySelector(`[data-variante="${v}"]`),
    variante,
  );
}

const sonda = (page, fn, arg) => page.evaluate(fn, arg);

async function proveBrowser(browser) {
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  const page = await ctx.newPage();
  const erroriPagina = [];
  page.on('pageerror', (e) => erroriPagina.push(e.message));

  await apri(page);
  await sonda(page, () => window.__quaderno.svuota());
  let testo = await sonda(page, () => window.__quaderno.testo());
  const ann = {};

  await caso('pagina: chiave `default/quaderno-test`', async () => {
    assert.equal(
      await sonda(page, () => window.__quaderno.pagina()),
      'default/quaderno-test',
    );
  });

  await caso(
    'testo: virgolette curve e codice della prosa dentro, runner e spoiler coperto fuori',
    () => {
      una(testo, 'la chiama “il mio regno”');
      una(testo, 'basta len(scaffale), e il valore None indica');
      assert.ok(
        !testo.includes('print(len(scaffale))'),
        'il codice del runner è nel testo',
      );
      assert.ok(
        !testo.includes('quarantadue'),
        'lo spoiler coperto è nel testo',
      );
    },
  );

  await caso(
    'citazione unica → ritrovata identica, anche dopo il ricaricamento',
    async () => {
      const { inizio, fine } = una(
        testo,
        'Madama Pince la chiama “il mio regno”',
      );
      ann.unica = await sonda(
        page,
        ([i, f]) => window.__quaderno.aggiungi(i, f, 'giallo'),
        [inizio, fine],
      );
      assert.equal(ann.unica.selettore.esatto, testo.slice(inizio, fine));
      assert.equal(ann.unica.selettore.titolo, 'una-citazione-unica');
      await page.waitForTimeout(400);
      await apri(page);
      const salvata = await sonda(
        page,
        () => window.__quaderno.quaderno().annotazioni,
      );
      assert.deepEqual(
        salvata.map((x) => x.id),
        [ann.unica.id],
      );
      assert.deepEqual(
        await sonda(
          page,
          (s) => window.__quaderno.ancora(s),
          ann.unica.selettore,
        ),
        { inizio, fine },
      );
    },
  );

  await caso(
    'frase ripetuta → ritrovata quella giusta grazie al contesto',
    async () => {
      const posti = trova(
        testo,
        'Ogni volume ha il suo posto e nessuno lo sposta.',
      );
      assert.equal(posti.length, 3);
      ann.ripetuta = await sonda(
        page,
        ([i, f]) => window.__quaderno.aggiungi(i, f, 'verde'),
        [posti[1].inizio, posti[1].fine],
      );
      const s = ann.ripetuta.selettore;
      assert.equal(s.titolo, 'secondo-scaffale');
      assert.deepEqual(
        await sonda(page, (x) => window.__quaderno.ancora(x), s),
        posti[1],
      );
      // Senza indizi di posizione né titolo decide il solo contesto.
      assert.deepEqual(
        await sonda(page, (x) => window.__quaderno.ancora(x), {
          ...s,
          inizio: 0,
          titolo: null,
        }),
        posti[1],
      );
    },
  );

  await caso(
    'selezione che attraversa un runner → il testo del runner non entra',
    async () => {
      const a = await sonda(page, () => {
        const radice = document.querySelector('.theme-doc-markdown');
        const w = document.createTreeWalker(radice, NodeFilter.SHOW_TEXT);
        let da = null;
        let a = null;
        for (let n = w.nextNode(); n; n = w.nextNode()) {
          if (n.data.includes('Prima del programma')) da = n;
          if (n.data.includes('Dopo il programma')) a = n;
        }
        window.getSelection().setBaseAndExtent(da, 0, a, a.data.length);
        return window.__quaderno.aggiungiSelezione('azzurro');
      });
      assert.ok(a, 'nessuna annotazione dalla selezione');
      assert.match(a.selettore.esatto, /^Prima del programma/);
      assert.match(a.selettore.esatto, /anche lei\.$/);
      assert.ok(
        !/print|scaffale =/.test(a.selettore.esatto),
        `il runner è entrato: ${a.selettore.esatto}`,
      );
    },
  );

  // Riscrittura: si annota sulla variante 1, si ritrova sulla 2.
  await caso(
    'riscrittura: una parola cambiata → ritrovata con la ricerca approssimata',
    async () => {
      const w = una(
        testo,
        'Il bibliotecario segna ogni prestito su un registro di carta.',
      );
      ann.parola = await sonda(
        page,
        ([i, f]) => window.__quaderno.aggiungi(i, f, 'rosa'),
        [w.inizio, w.fine],
      );
      await page.waitForTimeout(400);
      await apri(page, 2);
      const testo2 = await sonda(page, () => window.__quaderno.testo());
      const atteso = una(
        testo2,
        'Il bibliotecario segna ogni prestito su un registro di cartone.',
      );
      const r = await sonda(
        page,
        (s) => window.__quaderno.ancora(s),
        ann.parola.selettore,
      );
      assert.ok(r, 'orfana');
      assert.equal(r.inizio, atteso.inizio);
      // Parola intera e punto finale: la ricerca approssimata si aggancia ai
      // bordi delle parole.
      assert.equal(r.fine, atteso.fine);
      // La citazione unica, prima del paragrafo riscritto, resta identica.
      const u = await sonda(
        page,
        (s) => window.__quaderno.ancora(s),
        ann.unica.selettore,
      );
      assert.equal(testo2.slice(u.inizio, u.fine), ann.unica.selettore.esatto);
    },
  );

  await caso('riscrittura: frase tolta → orfana', async () => {
    await apri(page);
    const t = una(
      testo,
      'Quando il registro si riempie, ne apre uno nuovo e ripone il vecchio in cantina.',
    );
    ann.tolta = await sonda(
      page,
      ([i, f]) => window.__quaderno.aggiungi(i, f, null),
      [t.inizio, t.fine],
    );
    await page.waitForTimeout(400);
    await apri(page, 2);
    assert.equal(
      await sonda(
        page,
        (s) => window.__quaderno.ancora(s),
        ann.tolta.selettore,
      ),
      null,
    );
    // L'orfana non sparisce dall'archivio.
    const ids = await sonda(page, () =>
      window.__quaderno.quaderno().annotazioni.map((x) => x.id),
    );
    assert.ok(ids.includes(ann.tolta.id));
  });

  await caso(
    "archivio: un'altra scheda vede le annotazioni nuove (evento storage)",
    async () => {
      await apri(page);
      const altra = await ctx.newPage();
      await apri(altra);
      const { inizio, fine } = una(
        testo,
        'Di notte resta accesa solo la lampada',
      );
      const a = await sonda(
        page,
        ([i, f]) => window.__quaderno.aggiungi(i, f, 'giallo'),
        [inizio, fine],
      );
      await altra.waitForFunction(
        (id) =>
          window.__quaderno.quaderno().annotazioni.some((x) => x.id === id),
        a.id,
        { timeout: 3000 },
      );
      await altra.close();
    },
  );

  await caso('archivio: svuota toglie il quaderno dal browser', async () => {
    await sonda(page, () => window.__quaderno.svuota());
    assert.equal(
      await sonda(page, () => window.__quaderno.quaderno().annotazioni.length),
      0,
    );
    assert.equal(
      await sonda(page, () => localStorage.getItem('pdb:quaderno')),
      null,
    );
  });

  await caso('nessun errore in pagina', () => {
    assert.deepEqual(erroriPagina, []);
  });
  await ctx.close();
}

async function main() {
  await proveUnione();
  try {
    const r = await fetch(`${SERVER}${PAGINA}`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
  } catch (e) {
    console.error(
      `Il server ${SERVER} non risponde su ${PAGINA} (${e.message}): avvia \`npm start\` e riprova.`,
    );
    process.exit(2);
  }
  const browser = await chromium.launch(
    process.env.QUADERNO_CHROME
      ? { executablePath: process.env.QUADERNO_CHROME }
      : { channel: 'chrome' },
  );
  try {
    await proveBrowser(browser);
  } finally {
    await browser.close();
  }

  for (const e of esiti)
    console.log(
      `  ${e.ok ? '✓' : '✗'} ${e.nome}${e.ok ? '' : `\n      ${e.errore}`}`,
    );
  const falliti = esiti.filter((e) => !e.ok).length;
  console.log(
    falliti
      ? `${falliti} casi falliti su ${esiti.length}.`
      : `Tutti i ${esiti.length} casi superati.`,
  );
  process.exit(falliti ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
