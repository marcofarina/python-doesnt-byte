#!/usr/bin/env node
/**
 * Presentazioni delle lezioni: sviluppo, build, PDF e controlli.
 *
 *   node scripts/slides.mjs dev archivista/le-chiavi   anteprima dal vivo
 *   node scripts/slides.mjs build [lezione…]           presentazioni in static/slides/
 *   node scripts/slides.mjs pdf [lezione…]             PDF da distribuire a mano
 *   node scripts/slides.mjs check [lezione…]           controlla i mazzi
 *   node scripts/slides.mjs verifica [lezione…]        cerca slide che strabordano
 *   node scripts/slides.mjs provino [lezione…]         tutte le slide in un'immagine
 *
 * Un mazzo è slides/decks/<volume>/<slug>.md e appartiene alla lezione
 * volumes/<volume>/<slug>.mdx. Esce in static/slides/<volume>/<slug>/:
 * index.html, la presentazione servita dal sito a /slides/<volume>/<slug>/
 * (con `pdf`, anche <slug>.pdf). static/slides/ non è nel repository:
 * la crea la CI prima di `npm run build` (vedi .github/workflows/).
 *
 * Senza lezioni indicate, i comandi lavorano su tutti i mazzi. I file che
 * iniziano con `_` (bozze, prove, il modello) sono esclusi.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { basename, dirname, extname, join, normalize, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseSync } from '@slidev/parser';

/** Ultima modifica di un file per git: commit, o «adesso» se ha modifiche non salvate. */
function ultimaModifica(file) {
  const rel = relative(RADICE, file);
  const sporco = spawnSync('git', ['status', '--porcelain', '--', rel], { cwd: RADICE, encoding: 'utf8' }).stdout.trim();
  if (sporco) return Infinity;
  const t = spawnSync('git', ['log', '-1', '--format=%ct', '--', rel], { cwd: RADICE, encoding: 'utf8' }).stdout.trim();
  return t ? Number(t) : 0;
}

const SLIDES = fileURLToPath(new URL('..', import.meta.url));
const RADICE = join(SLIDES, '..');
const MAZZI = join(SLIDES, 'decks');
const USCITA = join(RADICE, 'static', 'slides');
const SLIDEV = join(SLIDES, 'node_modules', '.bin', 'slidev');

const VOLUMI = ['programmatore', 'artefice', 'archivista', 'apprendista'];
const LAYOUT = new Set(
  readdirSync(join(SLIDES, 'theme', 'layouts')).map((f) => f.replace(/\.vue$/, '')),
);

/** Tutti i mazzi, come `volume/slug`. */
function tuttiIMazzi() {
  const elenco = [];
  for (const volume of readdirSync(MAZZI, { withFileTypes: true })) {
    if (!volume.isDirectory() || volume.name.startsWith('_')) continue;
    for (const file of readdirSync(join(MAZZI, volume.name))) {
      if (file.endsWith('.md') && !file.startsWith('_'))
        elenco.push(`${volume.name}/${file.replace(/\.md$/, '')}`);
    }
  }
  return elenco.sort();
}

function scegli(argomenti) {
  const richiesti = argomenti.filter((a) => !a.startsWith('--'));
  if (!richiesti.length) return tuttiIMazzi();
  for (const r of richiesti) {
    if (!existsSync(fileMazzo(r))) {
      console.error(`✗ Nessun mazzo per «${r}» (cercato ${relative(RADICE, fileMazzo(r))}).`);
      process.exit(1);
    }
  }
  return richiesti;
}

const fileMazzo = (lezione) => join(MAZZI, `${lezione}.md`);

function esegui(argomenti, opzioni = {}) {
  const esito = spawnSync(SLIDEV, argomenti, { stdio: 'inherit', cwd: SLIDES, ...opzioni });
  if (esito.status !== 0) {
    console.error(`✗ slidev ${argomenti.join(' ')} è uscito con ${esito.status}.`);
    process.exit(esito.status ?? 1);
  }
}

// ─── Controlli ──────────────────────────────────────────────────────────────

/** Errori di un mazzo: [] se va bene. */
function controlla(lezione) {
  const errori = [];
  const file = fileMazzo(lezione);
  const [volume, slug] = lezione.split('/');
  const sorgente = readFileSync(file, 'utf8');
  let mazzo;
  try {
    mazzo = parseSync(sorgente, file);
  } catch (e) {
    return [`non si legge: ${e.message}`];
  }
  const slide = mazzo.slides;
  const testa = slide[0]?.frontmatter ?? {};

  if (testa.theme !== '../../theme') errori.push('frontmatter iniziale: `theme: ../../theme`');
  if (!testa.title) errori.push('frontmatter iniziale: manca `title` (il titolo della lezione)');
  if (testa.volume !== volume)
    errori.push(`frontmatter iniziale: \`volume: ${volume}\` (la cartella del mazzo)`);
  if (testa.lezione !== lezione)
    errori.push(`frontmatter iniziale: \`lezione: ${lezione}\` (cartella/nome del file)`);
  if (!VOLUMI.includes(volume)) errori.push(`volume sconosciuto: ${volume}`);
  const fileLezione = join(RADICE, 'volumes', volume, `${slug}.mdx`);
  if (!existsSync(fileLezione)) errori.push(`la lezione volumes/${volume}/${slug}.mdx non esiste`);
  // La lezione è cambiata dopo il suo mazzo: le slide vanno aggiornate (e il
  // mazzo modificato insieme alla lezione, nello stesso commit).
  else if (ultimaModifica(fileLezione) > ultimaModifica(file))
    errori.push(`la lezione volumes/${volume}/${slug}.mdx è cambiata dopo il mazzo: aggiorna le slide`);
  if (testa.layout && !['copertina', 'cover'].includes(testa.layout))
    errori.push('la prima slide è la copertina: niente `layout` diverso');
  const ultima = slide[slide.length - 1]?.frontmatter?.layout;
  if (ultima !== 'fine') errori.push("l'ultima slide ha `layout: fine`");

  slide.forEach((s, i) => {
    const n = i + 1;
    const layout = s.frontmatter?.layout ?? (i === 0 ? 'copertina' : 'default');
    const testo = s.content ?? '';
    if (!LAYOUT.has(layout)) errori.push(`slide ${n}: layout «${layout}» non esiste nel tema`);
    // Un testo con «: » senza virgolette, nello YAML, diventa un oggetto.
    for (const [chiave, valore] of Object.entries(s.frontmatter ?? {}))
      if (valore && typeof valore === 'object' && !Array.isArray(valore))
        errori.push(`slide ${n}: \`${chiave}:\` contiene «: » e va tra virgolette ('…')`);
    const richiede = {
      obiettivi: ['::prerequisiti::', '::imparerai::'],
      'due-colonne': ['::sinistra::', '::destra::'],
      domanda: ['::risposta::'],
      figura: ['::figura::'],
    }[layout];
    for (const slot of richiede ?? [])
      if (!testo.includes(slot)) errori.push(`slide ${n} (${layout}): manca lo slot ${slot}`);
    if (layout === 'quiz') {
      const corrette = (testo.match(/<Opzione[^>]*\bcorretta\b/g) ?? []).length;
      if (corrette !== 1)
        errori.push(`slide ${n} (quiz): serve una sola <Opzione corretta>, trovate ${corrette}`);
      if (!/^#\s/m.test(testo)) errori.push(`slide ${n} (quiz): la domanda va nel titolo (# …)`);
    }
    // Nel markdown `__x__` diventa grassetto: `# __str__` uscirebbe «str».
    for (const riga of testo.split('\n')) {
      const fuoriCodice = riga.replace(/`[^`]*`/g, '');
      if (/^\s*(#|[-*]\s|\d+\.\s)/.test(riga) && /__\w+__|\b__\w/.test(fuoriCodice))
        errori.push(`slide ${n}: «${riga.trim()}»: metti tra backtick i nomi con __ (es. \`__init__\`)`);
    }
    if (layout === 'figura' && s.frontmatter?.didascalia && testo.includes('<Figura'))
      errori.push(`slide ${n}: <Figura> ha già le sue didascalie, togli \`didascalia:\``);
    for (const [, id] of testo.matchAll(/<Figura\s+id="([^"]+)"/g))
      if (!existsSync(join(RADICE, 'src', 'figure', `${id}.ts`)))
        errori.push(`slide ${n}: la figura «${id}» non esiste in src/figure/`);
    for (const [, ds] of testo.matchAll(/<SqlRun[^>]*\bdataset="([^"]+)"/g))
      if (!existsSync(join(RADICE, 'static', 'sql-datasets', `${ds}.sql`)))
        errori.push(`slide ${n}: il dataset «${ds}» non esiste in static/sql-datasets/`);
    for (const [, blocco] of testo.matchAll(/```[a-z]*[^\n]*\n([\s\S]*?)```/g)) {
      const righe = blocco.split('\n').length - 1;
      if (righe > 16)
        errori.push(`slide ${n}: blocco di codice di ${righe} righe (massimo 16: dividilo o evidenzia per passi)`);
    }
  });
  return errori;
}

function controllaTutti(lezioni) {
  let falliti = 0;
  for (const lezione of lezioni) {
    const errori = controlla(lezione);
    if (errori.length) {
      falliti++;
      console.error(`✗ ${lezione}`);
      for (const e of errori) console.error(`    ${e}`);
    } else {
      console.log(`✓ ${lezione}`);
    }
  }
  if (falliti) {
    console.error(`\n${falliti} mazzi da correggere.`);
    process.exit(1);
  }
}

// ─── Build ──────────────────────────────────────────────────────────────────

function costruisci(lezione) {
  const out = join(USCITA, lezione);
  rmSync(out, { recursive: true, force: true });
  mkdirSync(dirname(out), { recursive: true });
  console.log(`\n▸ ${lezione}: presentazione`);
  esegui(['build', fileMazzo(lezione), '--base', `/slides/${lezione}/`, '--out', out]);
}

function esporta(lezione) {
  const out = join(USCITA, lezione);
  mkdirSync(out, { recursive: true });
  const pdf = join(out, `${basename(lezione)}.pdf`);
  console.log(`\n▸ ${lezione}: PDF`);
  // Le figure si fermano da sole sul passo finale (theme/components/Figura.vue):
  // l'attesa serve ai font e al primo disegno di Brython/rough.js.
  esegui(['export', fileMazzo(lezione), '--output', pdf, '--wait', '2000', '--timeout', '120000']);
}

// ─── Verifica visiva ─────────────────────────────────────────────────────────

const TIPI = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.wasm': 'application/wasm',
  '.sql': 'text/plain',
  '.pdf': 'application/pdf',
};

/** static/ servita alla radice, come il sito pubblicato. */
function serviStatic() {
  const base = join(RADICE, 'static');
  const server = createServer((req, res) => {
    let percorso = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (percorso.includes('..')) return res.writeHead(400).end();
    let file = join(base, percorso);
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
    if (!existsSync(file)) return res.writeHead(404).end();
    res.writeHead(200, { 'Content-Type': TIPI[extname(file)] ?? 'application/octet-stream' });
    res.end(readFileSync(file));
  });
  return new Promise((ok) => server.listen(0, '127.0.0.1', () => ok(server)));
}

/**
 * Apre ogni presentazione costruita e misura ogni slide: contenuto più alto
 * del corpo (straborda sul piede), codice più largo del suo riquadro, testo o
 * codice in linea che esce di lato da un callout, da una colonna o dalla
 * slide, figure tagliate ai bordi. Esegue anche ogni <PyRun> e <SqlRun> e
 * segnala quelli che finiscono in errore senza averlo dichiarato. La copertina è esclusa: il suo numero grande esce
 * dal bordo apposta.
 */
async function verifica(lezioni) {
  const { chromium } = await import('playwright-chromium');
  const server = await serviStatic();
  const porta = server.address().port;
  const browser = await chromium.launch();
  const pagina = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  let problemi = 0;
  for (const lezione of lezioni) {
    if (!existsSync(join(USCITA, lezione, 'index.html'))) {
      console.error(`✗ ${lezione}: non costruita (npm run slides:build -- ${lezione})`);
      problemi++;
      continue;
    }
    await pagina.goto(`http://127.0.0.1:${porta}/slides/${lezione}/#/1`);
    // Il numero di slide lo pubblica il tema (custom-nav-controls.vue): il
    // sorgente non basta a contarle, perché le slide «risultato» le aggiunge
    // il preparser. Poi si aspetta che Slidev le abbia montate tutte.
    await pagina.waitForFunction(() => Number(document.documentElement.dataset.pdbTotale) > 0, null, {
      timeout: 30000,
    });
    const totale = Number(await pagina.evaluate(() => document.documentElement.dataset.pdbTotale));
    await pagina.waitForFunction(
      (n) => document.querySelectorAll('.slidev-page').length >= n,
      totale,
      { timeout: 30000 },
    );
    await pagina.evaluate(() => document.fonts.ready);
    await pagina.waitForTimeout(1500);
    // Si scorre la presentazione come in classe, una slide alla volta: ogni
    // slide ha il tempo di disegnarsi (mermaid, figure che si scalano al loro
    // spazio) prima di essere misurata. Gli elementi v-click nascosti
    // occupano già il loro spazio, quindi la misura vale anche a clic fatti.
    const esiti = [];
    for (let n = 1; n <= totale; n++) {
      await pagina.evaluate((k) => {
        location.hash = `#/${k}`;
      }, n);
      await pagina.waitForSelector(`.slidev-page-${n}`, { state: 'visible' });
      await pagina.waitForTimeout(450);
      const esito = await pagina.evaluate((n) => {
        const p = document.querySelector(`.slidev-page-${n}`);
        const corpo = p?.querySelector('.pdb-corpo');
        if (!corpo) return null;
        const alto = corpo.scrollHeight - corpo.clientHeight;
        const largo = [...p.querySelectorAll('pre')].some((x) => x.scrollWidth > x.clientWidth + 2);
        // Testo, codice in linea o tabelle che escono di lato da un riquadro
        // (callout, colonna) o dalla slide: si confronta il bordo destro di
        // ogni elemento con quello del suo contenitore.
        const destra = corpo.getBoundingClientRect().right;
        const laterale = [...corpo.querySelectorAll('p, li, td, th, code, h1, h2, h3, table, .pdb-callout, .pdb-risposta, .pdb-opzione')]
          .filter((el) => !el.closest('pre'))
          .some((el) => {
            const r = el.getBoundingClientRect();
            const contenitore = el.parentElement?.closest('.pdb-callout, .pdb-risposta, .pdb-colonna, .pdb-opzione, .pdb-corpo');
            const limite = contenitore ? contenitore.getBoundingClientRect().right : destra;
            return r.width > 0 && r.right > Math.min(limite, destra) + 2;
          });
        // Figure tagliate: il disegno (anche in uno shadow DOM, come i
        // mermaid) deve stare dentro lo spazio della figura.
        const svgDentro = (r) =>
          r.querySelector('svg') ??
          [...r.querySelectorAll('*')].map((e) => e.shadowRoot && svgDentro(e.shadowRoot)).find(Boolean) ??
          null;
        const tagliata = [...corpo.querySelectorAll('.pdb-figura')].some((f) => {
          const svg = svgDentro(f);
          if (!svg) return false;
          const a = svg.getBoundingClientRect();
          const b = f.getBoundingClientRect();
          return a.width > 0 && (a.left < b.left - 2 || a.right > b.right + 2 || a.top < b.top - 2 || a.bottom > b.bottom + 2);
        });
        // Figure rimpicciolite troppo per leggerle da un proiettore.
        const minuscola = [...corpo.querySelectorAll('.pdb-figura__adatta')].some((f) => {
          const m = /scale\(([\d.]+)\)/.exec(f.style.transform);
          return m && Number(m[1]) < 0.6;
        });
        return alto > 2 || largo || laterale || tagliata || minuscola
          ? { slide: n, alto, largo, laterale, tagliata, minuscola }
          : null;
      }, n);
      if (esito) esiti.push(esito);

      // Ogni blocco eseguibile della slide si esegue davvero, come in classe:
      // deve finire senza errori (o in errore, se dichiarato `errore`), e il
      // suo risultato, aperto, deve stare tutto nella slide. I blocchi
      // `risultato` partono da soli: si aspetta che finiscano.
      const blocchi = await pagina.locator(`.slidev-page-${n} .pdb-run`).count();
      for (let i = 0; i < blocchi; i++) {
        const blocco = pagina.locator(`.slidev-page-${n} .pdb-run`).nth(i);
        const soloRisultato = await blocco.evaluate((el) => el.classList.contains('pdb-run--risultato'));
        // Con `seguito`, «Esegui» porta alla slide dopo: il blocco si
        // controlla lì, nella sua slide «risultato».
        if ((await blocco.getAttribute('data-seguito')) !== null) continue;
        if (!soloRisultato) await blocco.locator('.pdb-run__esegui').click();
        const stato = await blocco
          .locator('xpath=self::*[@data-stato="fatto" or @data-stato="errore"]')
          .waitFor({ timeout: 20000 })
          .then(() => blocco.getAttribute('data-stato'))
          .catch(() => 'bloccato');
        await pagina.waitForTimeout(250);
        const atteso = (await blocco.getAttribute('data-errore-atteso')) !== null;
        const testo = (
          await blocco
            .locator('.pdb-run__stderr, .pdb-run__uscita')
            .first()
            .innerText()
            .catch(() => '')
        ).trim();
        const nome = `blocco ${i + 1}`;
        if (stato === 'bloccato') {
          esiti.push({ slide: n, esecuzione: `${nome}: non ha finito in 20 secondi` });
        } else if ((stato === 'errore') !== atteso) {
          esiti.push({
            slide: n,
            esecuzione: atteso
              ? `${nome}: doveva andare in errore (è dichiarato \`errore\`) e invece no`
              : `${nome}: va in errore — ${testo.split('\n').slice(-2).join(' ').slice(0, 160)}`,
          });
        }
        // Il risultato aperto deve leggersi tutto, senza scorrere.
        const eccesso = await blocco
          .locator('.pdb-run__esiti')
          .evaluate((el) => el.scrollHeight - el.clientHeight)
          .catch(() => 0);
        // E il resto della slide, con il risultato aperto, resta al suo
        // posto: niente spinto oltre il piede.
        const spinta = await pagina
          .locator(`.slidev-page-${n} .pdb-corpo`)
          .evaluate((el) => el.scrollHeight - el.clientHeight)
          .catch(() => 0);
        if (spinta > 2 && eccesso <= 2) {
          esiti.push({
            slide: n,
            esecuzione: `${nome}: con il risultato aperto la slide straborda di ${spinta}px: aggiungi \`seguito\` al blocco`,
          });
        }
        if (eccesso > 2) {
          esiti.push({
            slide: n,
            esecuzione: soloRisultato
              ? `${nome}: il risultato non sta nemmeno nella sua slide (mancano ${eccesso}px): riduci le righe (LIMIT) o le tabelle mostrate`
              : `${nome}: il risultato aperto non sta nella slide (mancano ${eccesso}px): aggiungi \`seguito\` al blocco, e il risultato avrà una slide sua`,
          });
        }
        if (!soloRisultato) await blocco.locator('.pdb-run__azzera').click().catch(() => {});
      }
    }
    if (!totale) esiti.push({ slide: 0, esecuzione: 'nessuna slide misurata' });
    if (esiti.length) {
      problemi += esiti.length;
      console.error(`✗ ${lezione}`);
      for (const e of esiti) {
        const cosa = [
          e.alto > 2 && `straborda di ${e.alto}px in basso`,
          e.largo && 'codice più largo del riquadro',
          e.laterale && 'contenuto che esce di lato (da un callout, una colonna o dalla slide)',
          e.tagliata && 'figura tagliata ai bordi',
          e.minuscola && 'figura ridotta sotto il 60%: non si legge proiettata (disponila in orizzontale o dalle una slide intera)',
          e.esecuzione,
        ].filter(Boolean);
        console.error(`    slide ${e.slide}: ${cosa.join(', ')}`);
      }
    } else {
      console.log(`✓ ${lezione}`);
    }
  }
  await browser.close();
  server.close();
  if (problemi) process.exit(1);
}

// ─── Provino ─────────────────────────────────────────────────────────────────

const PROVINI = join(SLIDES, '.provino');

/**
 * Tutte le slide di un mazzo in un'unica immagine, tre per riga e numerate,
 * come un provino fotografico: si rivede la presentazione con un colpo
 * d'occhio. Le slide si fotografano dalla presentazione costruita, come le
 * vede l'insegnante in classe: con tutti i clic fatti, le figure al passo
 * finale e i blocchi «risultato» già eseguiti.
 * Esce in slides/.provino/<volume>-<slug>.png.
 */
async function provino(lezioni) {
  const { chromium } = await import('playwright-chromium');
  mkdirSync(PROVINI, { recursive: true });
  const server = await serviStatic();
  const porta = server.address().port;
  const browser = await chromium.launch();
  const pagina = await browser.newPage({ viewport: { width: 980, height: 552 } });
  for (const lezione of lezioni) {
    if (!existsSync(join(USCITA, lezione, 'index.html'))) {
      console.error(`✗ ${lezione}: non costruita (npm run slides:build -- ${lezione})`);
      continue;
    }
    const cartella = join(PROVINI, lezione.replace('/', '-'));
    rmSync(cartella, { recursive: true, force: true });
    mkdirSync(cartella, { recursive: true });
    console.log(`▸ ${lezione}`);
    await pagina.goto(`http://127.0.0.1:${porta}/slides/${lezione}/#/1`);
    await pagina.waitForFunction(() => Number(document.documentElement.dataset.pdbTotale) > 0, null, { timeout: 30000 });
    const totale = Number(await pagina.evaluate(() => document.documentElement.dataset.pdbTotale));
    await pagina.evaluate(() => document.fonts.ready);
    for (let n = 1; n <= totale; n++) {
      await pagina.evaluate((k) => {
        location.hash = `#/${k}?clicks=99`;
      }, n);
      await pagina.waitForSelector(`.slidev-page-${n}`, { state: 'visible' });
      // Il tempo per i blocchi «risultato» e per le figure che si animano.
      await pagina
        .locator(`.slidev-page-${n} .pdb-run--risultato:not([data-stato="fatto"]):not([data-stato="errore"])`)
        .waitFor({ state: 'detached', timeout: 20000 })
        .catch(() => {});
      await pagina.waitForTimeout(n === 1 ? 1200 : 700);
      await pagina.evaluate((k) => {
        const accesso = window.__figure;
        if (!accesso) return;
        for (const f of accesso.elenco()) accesso.vai(f.id, f.passi - 1, 1);
      }, n);
      await pagina.waitForTimeout(150);
      await pagina.locator(`.slidev-page-${n}`).screenshot({ path: join(cartella, `${n}.png`) });
    }
    const immagini = readdirSync(cartella)
      .filter((f) => f.endsWith('.png'))
      .sort((a, b) => parseInt(a) - parseInt(b));
    const html = `<body style="margin:0;background:#3f3f46;display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:8px;width:1800px">${immagini
      .map(
        (f) =>
          `<div style="position:relative"><img src="${f}" style="width:100%;display:block"><b style="position:absolute;top:6px;left:6px;background:#09090b;color:#fff;font:600 15px sans-serif;padding:2px 7px;border-radius:4px">${parseInt(f)}</b></div>`,
      )
      .join('')}</body>`;
    writeFileSync(join(cartella, 'provino.html'), html);
    const foglio = await browser.newPage({ viewport: { width: 1816, height: 400 } });
    await foglio.goto(`file://${join(cartella, 'provino.html')}`);
    await foglio.waitForLoadState('load');
    const uscita = join(PROVINI, `${lezione.replace('/', '-')}.png`);
    await foglio.screenshot({ path: uscita, fullPage: true });
    await foglio.close();
    console.log(`  ${relative(RADICE, uscita)}`);
  }
  await browser.close();
  server.close();
}

// ─── Comandi ────────────────────────────────────────────────────────────────

const [comando, ...resto] = process.argv.slice(2);

switch (comando) {
  case 'dev': {
    const [lezione] = scegli(resto);
    if (!resto.length) {
      console.error('Indica la lezione: npm run slides:dev -- archivista/le-chiavi');
      process.exit(1);
    }
    esegui([fileMazzo(lezione), '--open']);
    break;
  }
  case 'build': {
    const lezioni = scegli(resto);
    controllaTutti(lezioni);
    for (const l of lezioni) costruisci(l);
    console.log(`\n✓ ${lezioni.length} presentazioni in ${relative(RADICE, USCITA)}/`);
    break;
  }
  case 'pdf': {
    const lezioni = scegli(resto);
    for (const l of lezioni) esporta(l);
    break;
  }
  case 'check':
    controllaTutti(scegli(resto));
    break;
  case 'verifica':
    await verifica(scegli(resto));
    break;
  case 'provino':
    await provino(scegli(resto));
    break;
  default:
    console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(2, 11).join('\n'));
    process.exit(comando ? 1 : 0);
}
