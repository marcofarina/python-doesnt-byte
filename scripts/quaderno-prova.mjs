/**
 * Banco di prova del quaderno (piano pm/piano-2026-11-quaderno.md, fasi Q0–Q3):
 * ancoraggio, archivio locale, unione, evidenziatore in pagina e pannello Note,
 * contro la sandbox docs/quaderno-test.
 *
 * - L'unione (`src/lib/quaderno/unisci.ts`) si prova in Node, caricata con jiti.
 * - Ancoraggio e archivio si provano nel browser attraverso `window.__quaderno`
 *   (`src/lib/quaderno/sonda.ts`), sulla sandbox e sulla sua `?variante=2`, che
 *   simula una riscrittura della lezione.
 * - L'evidenziatore si prova come lo usa lo studente: selezione, clic sulla
 *   barra e sul testo evidenziato, `CSS.highlights` per vedere che cosa è
 *   disegnato.
 * - Il pannello Note si prova a 1440 px, dove le schede stanno accanto al
 *   testo: nota scritta dalla barra, allineamento, schede che non si
 *   sovrappongono, clic sul testo con nota, orfane dopo una riscrittura.
 *
 * - La pagina `/quaderno` (fase Q3) si prova come la usa lo studente: voci per
 *   volume e lezione, filtro, legenda, scarica → cancella → importa, link
 *   «Vai al testo» (`?annotazione=<id>`), orfane e pagine tolte. Il file del
 *   quaderno (`src/lib/quaderno/file.ts`) si prova anche in Node, con jiti.
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

/* ----------------------------------------------------------- evidenziatore */

/** Seleziona una frase che sta in un solo nodo di testo della lezione. */
async function seleziona(page, frase, dentro = '.theme-doc-markdown') {
  const ok = await page.evaluate(
    ([f, sel]) => {
      const radice = document.querySelector(sel);
      const w = document.createTreeWalker(radice, NodeFilter.SHOW_TEXT);
      for (let n = w.nextNode(); n; n = w.nextNode()) {
        const i = n.data.indexOf(f);
        if (i < 0) continue;
        window.getSelection().setBaseAndExtent(n, i, n, i + f.length);
        return true;
      }
      return false;
    },
    [frase, dentro],
  );
  assert.ok(ok, `«${frase}» non trovata in ${dentro}`);
}

const misura = (page, nome) =>
  page.evaluate((n) => CSS.highlights.get(n)?.size ?? 0, nome);

const BARRA = '[data-quaderno-barra]';
const MENU = '[data-quaderno-menu]';

async function proveEvidenziatore(browser) {
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  const page = await ctx.newPage();
  const erroriPagina = [];
  page.on('pageerror', (e) => erroriPagina.push(e.message));
  await apri(page);
  await sonda(page, () => window.__quaderno.svuota());
  await apri(page);
  const frase = 'I più consultati sono quelli delle montagne.';

  await caso(
    'barra: selezione nella prosa → giallo → un highlight',
    async () => {
      await seleziona(page, frase);
      await page.waitForSelector(BARRA, { timeout: 2000 });
      assert.equal(
        await page.locator(`${BARRA} [data-azione="togli"]`).count(),
        0,
      );
      await page.click(`${BARRA} [data-colore="giallo"]`);
      await page.waitForFunction(
        () => CSS.highlights.get('pdb-giallo')?.size === 1,
        null,
        { timeout: 2000 },
      );
      await page.waitForSelector(BARRA, { state: 'detached', timeout: 2000 });
      const [a] = await sonda(
        page,
        () => window.__quaderno.quaderno().annotazioni,
      );
      assert.equal(a.selettore.esatto, frase);
      assert.equal(a.colore, 'giallo');
    },
  );

  await caso(
    'barra: ricaricata la pagina, l’highlight c’è ancora',
    async () => {
      await page.waitForTimeout(400);
      await apri(page);
      await page.waitForFunction(
        () => CSS.highlights.get('pdb-giallo')?.size === 1,
        null,
        { timeout: 3000 },
      );
    },
  );

  await caso(
    'barra: la stessa frase riselezionata → «Togli» e cambio di colore senza doppioni',
    async () => {
      await seleziona(page, frase);
      await page.waitForSelector(BARRA, { timeout: 2000 });
      assert.equal(
        await page.getAttribute(
          `${BARRA} [data-colore="giallo"]`,
          'aria-pressed',
        ),
        'true',
      );
      assert.equal(
        await page.locator(`${BARRA} [data-azione="togli"]`).count(),
        1,
      );
      await page.click(`${BARRA} [data-colore="verde"]`);
      await page.waitForFunction(
        () =>
          CSS.highlights.get('pdb-verde')?.size === 1 &&
          CSS.highlights.get('pdb-giallo')?.size === 0,
        null,
        { timeout: 2000 },
      );
      const vive = await sonda(page, () =>
        window.__quaderno.quaderno().annotazioni.filter((x) => !x.cancellata),
      );
      assert.equal(vive.length, 1);
    },
  );

  await caso('barra: Esc la chiude, Tab ci entra', async () => {
    await seleziona(page, 'Il dizionario di latino');
    await page.waitForSelector(BARRA, { timeout: 2000 });
    await page.keyboard.press('Tab');
    assert.ok(
      await page.evaluate(() =>
        document.activeElement?.closest('[data-quaderno-barra]'),
      ),
      'il fuoco non è nella barra',
    );
    await page.keyboard.press('ArrowRight');
    assert.equal(
      await page.evaluate(() => document.activeElement?.dataset.colore),
      'verde',
    );
    await page.keyboard.press('Escape');
    await page.waitForSelector(BARRA, { state: 'detached', timeout: 1000 });
    await page.evaluate(() => window.getSelection().removeAllRanges());
  });

  await caso(
    'barra: selezione dentro il PyRunner → nessuna barra',
    async () => {
      await page.waitForSelector('[data-runner] .cm-line');
      await seleziona(page, 'print', '[data-runner]');
      await page.waitForTimeout(800);
      assert.equal(await page.locator(BARRA).count(), 0);
      await page.evaluate(() => window.getSelection().removeAllRanges());
    },
  );

  await caso(
    'menu: clic sull’evidenziazione → menu → «Togli» → 0',
    async () => {
      const p = await page.evaluate(() => {
        const [r] = CSS.highlights.get('pdb-verde');
        const q = r.getClientRects()[0];
        return { x: q.left + q.width / 2, y: q.top + q.height / 2 };
      });
      await page.mouse.click(p.x, p.y);
      await page.waitForSelector(MENU, { timeout: 2000 });
      assert.equal(
        await page.getAttribute(
          `${MENU} [data-colore="verde"]`,
          'aria-pressed',
        ),
        'true',
      );
      await page.click(`${MENU} [data-azione="togli"]`);
      await page.waitForFunction(
        () => CSS.highlights.get('pdb-verde')?.size === 0,
        null,
        { timeout: 2000 },
      );
      await page.waitForSelector(MENU, { state: 'detached', timeout: 1000 });
    },
  );

  await caso('evidenziatore: nessun errore in pagina', () => {
    assert.deepEqual(erroriPagina, []);
  });
  await sonda(page, () => window.__quaderno.svuota());
  await ctx.close();

  // Un browser senza la Custom Highlight API.
  const vecchio = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  await vecchio.addInitScript(() => {
    Object.defineProperty(CSS, 'highlights', {
      value: undefined,
      configurable: true,
    });
  });
  const p2 = await vecchio.newPage();
  const errori2 = [];
  p2.on('pageerror', (e) => errori2.push(e.message));
  p2.on('console', (m) => m.type() === 'error' && errori2.push(m.text()));
  await caso(
    'senza CSS.highlights: niente barra, niente errori in console',
    async () => {
      await apri(p2);
      assert.equal(await p2.evaluate(() => CSS.highlights), undefined);
      await seleziona(p2, frase);
      await p2.waitForTimeout(800);
      assert.equal(await p2.locator(BARRA).count(), 0);
      assert.deepEqual(errori2, []);
    },
  );
  await vecchio.close();
}

/* ------------------------------------------------------------------- note */

const NOTE = '[data-note]';

/** Il posto (offset) di una frase unica nel testo della pagina. */
async function posto(page, frase) {
  const testo = await sonda(page, () => window.__quaderno.testo());
  return una(testo, frase);
}

/** Bordo alto della prima riga del testo di un'annotazione, nel viewport. */
const altoTesto = (page, selettore) =>
  page.evaluate((s) => {
    const q = window.__quaderno;
    const o = q.ancora(s);
    const radice = document.querySelector('.theme-doc-markdown');
    const w = document.createTreeWalker(radice, NodeFilter.SHOW_TEXT);
    // Stesso offset del testo evidenziabile: si cerca il nodo dalla frase.
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      const i = n.data.indexOf(s.esatto);
      if (i < 0) continue;
      const r = document.createRange();
      r.setStart(n, i);
      r.setEnd(n, i + s.esatto.length);
      return o ? r.getClientRects()[0].top : null;
    }
    return null;
  }, selettore);

const altoScheda = (page, id) =>
  page.evaluate(
    (x) =>
      document
        .querySelector(`[data-note] [data-nota-id="${x}"]`)
        ?.getBoundingClientRect().top ?? null,
    id,
  );

async function proveNote(browser) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  // Il pannello Note aperto, come se lo studente l'avesse aperto prima.
  await ctx.addInitScript(() => {
    if (!sessionStorage.getItem('pdb.colonna.aperta'))
      sessionStorage.setItem('pdb.colonna.aperta', 'note');
  });
  const page = await ctx.newPage();
  const erroriPagina = [];
  page.on('pageerror', (e) => erroriPagina.push(e.message));
  await apri(page);
  await sonda(page, () => window.__quaderno.svuota());
  await apri(page);
  const testoNota = 'Da chiedere a Madama Pince.';

  await caso(
    'note: «Nota» nella barra → scheda in modifica → salvata nel pannello e nel quaderno',
    async () => {
      await page.waitForSelector(NOTE, { timeout: 3000 });
      await seleziona(page, 'Il dizionario di latino');
      await page.waitForSelector(BARRA, { timeout: 2000 });
      await page.click(`${BARRA} [data-azione="nota"]`);
      await page.waitForFunction(
        () =>
          document.activeElement?.tagName === 'TEXTAREA' &&
          document.activeElement.closest('[data-note]'),
        null,
        { timeout: 2000 },
      );
      // La bozza non è ancora nel quaderno.
      assert.equal(
        await sonda(
          page,
          () => window.__quaderno.quaderno().annotazioni.length,
        ),
        0,
      );
      await page.keyboard.type(testoNota);
      await page.click(`${NOTE} [data-azione="salva"]`);
      const [a] = await sonda(
        page,
        () => window.__quaderno.quaderno().annotazioni,
      );
      assert.equal(a.nota, testoNota);
      assert.equal(a.colore, null);
      assert.equal(a.selettore.esatto, 'Il dizionario di latino');
      const scheda = page.locator(`${NOTE} [data-nota-id="${a.id}"]`);
      assert.match(await scheda.innerText(), /Madama Pince/);
      await page.waitForFunction(
        () => CSS.highlights.get('pdb-con-nota')?.size === 1,
        null,
        { timeout: 2000 },
      );
    },
  );

  await caso(
    'note: a 1440 px la scheda sta entro 8 px dall’altezza del suo testo',
    async () => {
      const [a] = await sonda(
        page,
        () => window.__quaderno.quaderno().annotazioni,
      );
      await page.waitForTimeout(400);
      const t = await altoTesto(page, a.selettore);
      const s = await altoScheda(page, a.id);
      assert.ok(t !== null && s !== null, 'testo o scheda mancanti');
      assert.ok(Math.abs(t - s) <= 8, `scarto di ${Math.round(t - s)} px`);
    },
  );

  await caso(
    'note: due note sulla stessa riga → schede che non si sovrappongono',
    async () => {
      const x = await posto(page, 'Sul primo scaffale stanno gli atlanti');
      const y = await posto(page, 'rilegati in pelle verde');
      const a1 = await sonda(
        page,
        ([i, f]) => window.__quaderno.aggiungi(i, f, 'giallo', 'Prima nota.'),
        [x.inizio, x.fine],
      );
      const a2 = await sonda(
        page,
        ([i, f]) => window.__quaderno.aggiungi(i, f, 'rosa', 'Seconda nota.'),
        [y.inizio, y.fine],
      );
      await page.waitForTimeout(600);
      const t1 = await altoTesto(page, a1.selettore);
      const t2 = await altoTesto(page, a2.selettore);
      assert.ok(
        Math.abs(t1 - t2) < 2,
        'le due frasi non sono sulla stessa riga',
      );
      const r = await page.evaluate(
        (ids) =>
          ids.map((id) => {
            const q = document
              .querySelector(`[data-note] [data-nota-id="${id}"]`)
              .getBoundingClientRect();
            return { top: q.top, bottom: q.bottom };
          }),
        [a1.id, a2.id],
      );
      assert.ok(
        r[0].bottom <= r[1].top || r[1].bottom <= r[0].top,
        `schede sovrapposte: ${JSON.stringify(r)}`,
      );
    },
  );

  await caso(
    'note: clic sul testo con nota → pannello aperto sulla sua scheda',
    async () => {
      // Pannello chiuso dal suo pulsante.
      await page.click('[data-colonna] button[aria-expanded="true"]');
      await page.waitForSelector(NOTE, { state: 'detached', timeout: 2000 });
      const [a] = await sonda(page, () =>
        window.__quaderno
          .quaderno()
          .annotazioni.filter((x) => x.nota === 'Seconda nota.'),
      );
      const p = await page.evaluate(() => {
        const r = [...CSS.highlights.get('pdb-rosa')][0];
        const q = r.getClientRects()[0];
        return { x: q.left + q.width / 2, y: q.top + q.height / 2 };
      });
      await page.mouse.click(p.x, p.y);
      await page.waitForSelector(NOTE, { timeout: 2000 });
      await page.waitForFunction(
        (id) =>
          document.activeElement?.closest('[data-nota-id]')?.dataset.notaId ===
          id,
        a.id,
        { timeout: 2000 },
      );
      assert.equal(await page.locator(MENU).count(), 0);
    },
  );

  await caso(
    'note: riscrittura → la nota sulla frase tolta finisce in «Non ritrovo il punto»',
    async () => {
      const t = await posto(
        page,
        'Quando il registro si riempie, ne apre uno nuovo e ripone il vecchio in cantina.',
      );
      const a = await sonda(
        page,
        ([i, f]) => window.__quaderno.aggiungi(i, f, null, 'Nota orfana.'),
        [t.inizio, t.fine],
      );
      await page.waitForTimeout(400);
      await apri(page, 2);
      await page.waitForSelector(
        `[data-note-orfane] [data-nota-id="${a.id}"]`,
        { timeout: 3000 },
      );
      // Le altre restano accanto al loro testo.
      assert.equal(
        await page.locator(`[data-note-orfane] [data-nota-id]`).count(),
        1,
      );
    },
  );

  await caso('note: nessun errore in pagina', () => {
    assert.deepEqual(erroriPagina, []);
  });
  await sonda(page, () => window.__quaderno.svuota());
  await ctx.close();
}

/* ------------------------------------------------------- file del quaderno */

async function proveFile() {
  const jiti = jitiFactory(import.meta.url, { interopDefault: true });
  const { scrivi, leggi, nomeFile } = jiti(
    path.join(RADICE, 'src/lib/quaderno/file.ts'),
  );
  const lezioni = [
    {
      chiave: 'programmatore/variabili',
      titolo: 'Le variabili',
      volume: 'Manuale del Programmatore',
    },
    {
      chiave: 'archivista/che-cosa-fa-un-dbms',
      titolo: 'Che cosa fa un DBMS',
      volume: 'Manuale dell’Archivista',
    },
  ];
  const q = quaderno(
    [
      annotazione('f1', {
        pagina: 'archivista/che-cosa-fa-un-dbms',
        selettore: {
          esatto: 'Una “citazione” con l’apice, è così — città 😀',
          prima: '',
          dopo: '',
          inizio: 40,
          titolo: null,
        },
        nota: 'Prima riga.\nSeconda riga, con <!-- e --> dentro.',
      }),
      annotazione('f2', {
        pagina: 'programmatore/variabili',
        colore: null,
        nota: 'Solo nota',
      }),
      annotazione('f3', { pagina: 'volume/tolto' }),
      lapide('f4', '2026-11-05T10:00:00.000Z'),
    ],
    { giallo: 'da ricordare' },
    '2026-11-02T00:00:00.000Z',
  );
  const testo = scrivi(q, lezioni, new Date(2026, 10, 16));

  await caso('file: nome con la data locale', () => {
    assert.equal(
      nomeFile(new Date(2026, 10, 6)),
      'quaderno-python-doesnt-byte-2026-11-06.md',
    );
  });
  await caso('file: lezioni nell’ordine dell’elenco, citazioni e note', () => {
    const volume1 = testo.indexOf('## Manuale del Programmatore');
    const volume2 = testo.indexOf('## Manuale dell’Archivista');
    const tolte = testo.indexOf('## Pagina spostata o tolta');
    assert.ok(volume1 >= 0 && volume1 < volume2 && volume2 < tolte);
    assert.ok(testo.includes('### Che cosa fa un DBMS'));
    assert.ok(
      testo.includes('> Una “citazione” con l’apice, è così — città 😀'),
    );
    assert.ok(testo.includes('**Giallo** (da ricordare)'));
    assert.ok(testo.includes('**Nota:** Prima riga.  \nSeconda riga'));
    assert.ok(testo.includes('Solo nota'));
    assert.ok(testo.includes('### volume/tolto'));
  });
  await caso('file: l’ultima riga si legge e dà lo stesso quaderno', () => {
    const r = leggi(testo);
    assert.equal(r.ok, true);
    // Lapidi comprese: l'importazione è fedele.
    assert.deepEqual(r.quaderno, q);
  });
  await caso('file: formato più nuovo e file rovinati', () => {
    assert.equal(
      leggi(testo.replace(/pdb-quaderno 1 /, 'pdb-quaderno 2 ')).motivo,
      'nuovo',
    );
    assert.equal(leggi('# Un altro file\n').motivo, 'illeggibile');
    assert.equal(leggi('<!-- pdb-quaderno 1 AAAA!! -->').motivo, 'illeggibile');
    assert.equal(
      leggi(testo.replace(/(pdb-quaderno 1 )\S{20}/, '$1AAAAAAAAAAAAAAAAAAAA'))
        .ok,
      false,
    );
  });
}

/* --------------------------------------------------------- pagina quaderno */

const VOCI = '[data-quaderno-voce]';

async function proveQuaderno(browser) {
  await proveFile();

  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    acceptDownloads: true,
  });
  const page = await ctx.newPage();
  const erroriPagina = [];
  page.on('pageerror', (e) => erroriPagina.push(e.message));

  const sel = (esatto, inizio) => ({
    esatto,
    prima: '',
    dopo: '',
    inizio,
    titolo: null,
  });
  const base = quaderno(
    [
      annotazione('a1', {
        pagina: 'archivista/che-cosa-fa-un-dbms',
        selettore: sel('seconda citazione', 200),
        colore: 'verde',
        nota: 'una chiave',
        creata: '2026-11-02T10:00:00.000Z',
        modificata: '2026-11-02T10:00:00.000Z',
      }),
      annotazione('a2', {
        pagina: 'programmatore/variabili',
        selettore: sel('citazione nel primo volume', 10),
      }),
      annotazione('a3', {
        pagina: 'archivista/che-cosa-fa-un-dbms',
        selettore: sel('prima citazione', 50),
        colore: null,
        nota: 'solo nota',
        creata: '2026-11-03T10:00:00.000Z',
        modificata: '2026-11-03T10:00:00.000Z',
      }),
      annotazione('a4', {
        pagina: 'artefice/inesistente',
        selettore: sel('pagina tolta', 0),
      }),
      annotazione('a5', {
        pagina: 'archivista/che-cosa-fa-un-dbms',
        selettore: sel('punto perso', 90),
        creata: '2026-11-04T10:00:00.000Z',
        modificata: '2026-11-04T10:00:00.000Z',
      }),
    ],
    { giallo: 'da ricordare' },
    '2026-11-02T00:00:00.000Z',
  );

  async function inietta(q = base) {
    await page.goto(`${SERVER}/quaderno/`, { waitUntil: 'networkidle' });
    await page.evaluate(
      ([json, orfane]) => {
        localStorage.setItem('pdb:quaderno', json);
        localStorage.setItem('pdb:quaderno-orfane', orfane);
      },
      [
        JSON.stringify(q),
        JSON.stringify({ 'archivista/che-cosa-fa-un-dbms': ['a5'] }),
      ],
    );
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForSelector('h1');
  }
  const testi = (s) => page.locator(s).allInnerTexts();
  const letto = () =>
    page.evaluate(() => JSON.parse(localStorage.getItem('pdb:quaderno')));
  const perId = (q) => ({
    ...q,
    annotazioni: [...q.annotazioni].sort((x, y) => (x.id < y.id ? -1 : 1)),
  });

  await caso('quaderno: icona nella navbar verso /quaderno/', async () => {
    await page.goto(`${SERVER}/`, { waitUntil: 'networkidle' });
    const href = await page
      .locator('a[aria-label="Il tuo quaderno"]')
      .getAttribute('href');
    assert.ok(href.endsWith('/quaderno/'), href);
  });

  await caso('quaderno: pagina noindex', async () => {
    await inietta();
    assert.equal(
      await page.locator('meta[name="robots"]').getAttribute('content'),
      'noindex, nofollow',
    );
  });

  await caso(
    'quaderno: voci per volume e lezione nell’ordine della TOC, orfane e pagine tolte a parte',
    async () => {
      const h2 = await testi('main h2');
      assert.deepEqual(
        h2.filter((t) => !/^Legenda/.test(t)),
        [
          'Manuale del Programmatore',
          'Manuale dell’Archivista',
          'Non ritrovo il punto',
          'Pagina spostata o tolta',
        ],
      );
      // Dentro la lezione, nell'ordine del testo: a3 (offset 50) prima di a1 (200).
      const ids = await page
        .locator(`main > section ${VOCI}`)
        .evaluateAll((el) => el.map((x) => x.dataset.quadernoVoce));
      assert.deepEqual(ids, ['a2', 'a3', 'a1', 'a5', 'a4']);
      assert.equal(
        await page.locator(`[data-quaderno-orfane] ${VOCI}`).count(),
        1,
      );
      assert.equal(
        await page.locator(`[data-quaderno-tolte] ${VOCI}`).count(),
        1,
      );
    },
  );

  await caso(
    'quaderno: ogni voce porta alla lezione con ?annotazione=',
    async () => {
      const href = await page
        .locator('[data-quaderno-voce="a1"] a')
        .getAttribute('href');
      assert.match(href, /che-cosa-fa-un-dbms\/?\?annotazione=a1$/);
      // La pagina tolta non ha una lezione a cui andare.
      assert.equal(
        await page.locator('[data-quaderno-voce="a4"] a').count(),
        0,
      );
    },
  );

  await caso('quaderno: il filtro per colore e il conteggio', async () => {
    await page.click('[data-filtro="verde"]');
    assert.equal(await page.locator(VOCI).count(), 1);
    assert.match(await page.locator('[data-filtro="verde"]').innerText(), /1/);
    await page.click('[data-filtro="verde"]');
    assert.equal(await page.locator(VOCI).count(), 5);
  });

  await caso(
    'quaderno: la legenda si scrive e resta nel quaderno',
    async () => {
      await page.fill('[data-legenda="verde"]', 'domande');
      await page.waitForTimeout(600);
      assert.equal((await letto()).legenda.verde, 'domande');
      assert.match(
        await page.locator('[data-filtro="verde"]').innerText(),
        /Verde · domande/,
      );
      assert.match(
        await page.locator('[data-filtro="giallo"]').innerText(),
        /Giallo · da ricordare/,
      );
    },
  );

  await caso(
    'quaderno: l’avviso dice che le note sono solo in questo browser',
    async () => {
      const t = await page.locator('[data-quaderno-avviso]').innerText();
      assert.match(t, /5 annotazioni salvate solo in questo browser/);
      assert.match(t, /Se questo computer non è tuo, cancella le note/);
    },
  );

  let file = '';
  let prima;
  await caso(
    'quaderno: scarica → cancella → importa → stesso quaderno',
    async () => {
      await inietta();
      prima = perId(await letto());
      const [scaricato] = await Promise.all([
        page.waitForEvent('download'),
        page.click('[data-azione="scarica"]'),
      ]);
      assert.match(
        scaricato.suggestedFilename(),
        /^quaderno-python-doesnt-byte-\d{4}-\d{2}-\d{2}\.md$/,
      );
      const { readFile } = await import('node:fs/promises');
      file = await readFile(await scaricato.path(), 'utf8');
      assert.match(file, /^# Il mio quaderno/);
      assert.ok(file.includes('### Che cosa fa un DBMS'));

      // Cancella con conferma: il primo clic non cancella.
      await page.click('[data-azione="cancella"]');
      assert.equal((await letto()).annotazioni.length, 5);
      await page.click('[data-azione="conferma-cancella"]');
      assert.equal(
        await page.evaluate(() => localStorage.getItem('pdb:quaderno')),
        null,
      );
      assert.equal(await page.locator(VOCI).count(), 0);

      await page.setInputFiles('[data-importa-file]', {
        name: 'quaderno.md',
        mimeType: 'text/markdown',
        buffer: Buffer.from(file),
      });
      await page.waitForFunction(() =>
        /arrivate/.test(
          document.querySelector('[data-quaderno-messaggio]').textContent,
        ),
      );
      await page.waitForTimeout(600);
      assert.deepEqual(perId(await letto()), prima);
      assert.equal(await page.locator(VOCI).count(), 5);
    },
  );

  await caso('quaderno: importare due volte non fa doppioni', async () => {
    await page.setInputFiles('[data-importa-file]', {
      name: 'quaderno.md',
      mimeType: 'text/markdown',
      buffer: Buffer.from(file),
    });
    await page.waitForFunction(() =>
      /Nessuna annotazione nuova/.test(
        document.querySelector('[data-quaderno-messaggio]').textContent,
      ),
    );
    const msg = await page.locator('[data-quaderno-messaggio]').innerText();
    assert.match(msg, /5 erano già nel quaderno/);
    await page.waitForTimeout(600);
    assert.equal((await letto()).annotazioni.length, 5);
    assert.deepEqual(perId(await letto()), prima);
  });

  await caso('quaderno: un file rovinato non cambia il quaderno', async () => {
    await page.setInputFiles('[data-importa-file]', {
      name: 'rotto.md',
      mimeType: 'text/markdown',
      buffer: Buffer.from(
        file.replace(/(pdb-quaderno 1 )\S{30}/, '$1AAAAAAAA'),
      ),
    });
    await page.waitForFunction(() =>
      /non sembra un file del quaderno/.test(
        document.querySelector('[data-quaderno-messaggio]').textContent,
      ),
    );
    await page.waitForTimeout(600);
    assert.deepEqual(perId(await letto()), prima);
  });

  await caso(
    'quaderno: un file più vecchio non riporta indietro una modifica',
    async () => {
      // Il file è del 2026-11-04; qui l'annotazione a1 è stata modificata dopo.
      await inietta({
        ...base,
        annotazioni: base.annotazioni.map((a) =>
          a.id === 'a1'
            ? {
                ...a,
                nota: 'più recente',
                modificata: '2026-11-20T10:00:00.000Z',
              }
            : a,
        ),
      });
      await page.setInputFiles('[data-importa-file]', {
        name: 'quaderno.md',
        mimeType: 'text/markdown',
        buffer: Buffer.from(file),
      });
      await page.waitForFunction(() =>
        /già nel quaderno/.test(
          document.querySelector('[data-quaderno-messaggio]').textContent,
        ),
      );
      await page.waitForTimeout(600);
      const a1 = (await letto()).annotazioni.find((a) => a.id === 'a1');
      assert.equal(a1.nota, 'più recente');
    },
  );

  // Dalla pagina alla lezione: sulla sandbox, con un'annotazione in fondo.
  await caso(
    '?annotazione=<id>: da /quaderno la lezione scorre al punto e apre la scheda',
    async () => {
      const ctx2 = await browser.newContext({
        viewport: { width: 1440, height: 900 },
      });
      const p = await ctx2.newPage();
      const errori = [];
      p.on('pageerror', (e) => errori.push(e.message));
      await apri(p);
      await sonda(p, () => window.__quaderno.svuota());
      const testo = await sonda(p, () => window.__quaderno.testo());
      const o = una(testo, 'L’ultima riga della pagina chiude la sandbox.');
      const a = await sonda(
        p,
        ([i, f]) => window.__quaderno.aggiungi(i, f, 'giallo', 'in fondo'),
        [o.inizio, o.fine],
      );
      await p.waitForTimeout(600);
      await p.goto(`${SERVER}/quaderno/`, { waitUntil: 'networkidle' });
      await p.click(`[data-quaderno-voce="${a.id}"] a`);
      await p.waitForFunction(() => window.__quaderno, null, { timeout: 5000 });
      assert.match(p.url(), new RegExp(`\\?annotazione=${a.id}$`));
      await p.waitForFunction(() => window.scrollY > 300, null, {
        timeout: 5000,
      });
      await p.waitForSelector(`[data-note] [data-nota-id="${a.id}"]`, {
        timeout: 3000,
      });
      await p.waitForTimeout(800);
      const alto = await altoTesto(p, a.selettore);
      assert.ok(alto !== null && alto > 60 && alto < 850, `alto = ${alto}`);

      // Lo stesso con l'indirizzo scritto a mano (caricamento completo).
      await p.goto(`${SERVER}${PAGINA}?annotazione=${a.id}`, {
        waitUntil: 'networkidle',
      });
      await p.waitForFunction(() => window.scrollY > 300, null, {
        timeout: 5000,
      });
      await p.waitForSelector(`[data-note] [data-nota-id="${a.id}"]`, {
        timeout: 3000,
      });
      // Un id che non esiste non fa niente né rompe la pagina.
      await p.goto(`${SERVER}${PAGINA}?annotazione=non-esiste`, {
        waitUntil: 'networkidle',
      });
      await p.waitForTimeout(500);
      assert.deepEqual(errori, []);
      await sonda(p, () => window.__quaderno.svuota());
      await ctx2.close();
    },
  );

  await caso('quaderno: nessun errore in pagina', () => {
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
    await proveEvidenziatore(browser);
    await proveNote(browser);
    await proveQuaderno(browser);
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
