/**
 * Banco di verifica delle figure (<Figura>, fase G3 del piano
 * pm/piano-2026-10-figure-animate.md): per ogni figura di una pagina e per ogni
 * passo scatta una foto alla fine del passo (e a metà, con --meta) in chiaro e
 * in scuro a 1100 e a 1440 px, e a 375 px con l'emulazione mobile, e misura nel
 * browser:
 *
 *   - testo fuori dal viewBox;
 *   - testi che si sovrappongono;
 *   - corpo del testo sotto 12 px reali a 375 px;
 *   - contrasto testo/sfondo sotto 4,5:1, sui colori risolti;
 *   - più di 8 passi;
 *   - didascalia più lunga di 20 parole.
 *
 * Lavora contro `npm start` sulla porta 3000 (i font si caricano lì). Le foto
 * vanno in .figure-foto/<pagina>/<figura>/<passo>-<tema>-<larghezza>.png, il
 * rapporto in .figure-foto/<pagina>/rapporto.json.
 *
 * Uso:
 *   npm run figure:foto -- docs/figure-test            tutte le figure
 *   npm run figure:foto -- docs/figure-test --meta     anche a metà passo
 *   npm run figure:foto -- docs/figure-test --figura perso-ibrido
 *   npm run figure:foto -- docs/figure-test --freddo   foto per il lettore freddo
 *
 * Con --freddo il banco scatta solo la fine di ogni passo in chiaro su desktop,
 * senza la barra della didascalia e dei comandi, in
 * .figure-foto/<pagina>/freddo/<figura>/<passo>.png: sono le foto che riceve il
 * lettore freddo della skill nuova-figura. I controlli girano lo stesso.
 *
 * Il browser è il Chrome installato (`channel: 'chrome'`); per usarne un altro,
 * FIGURE_CHROME=/percorso/chrome. Per un dev server su un'altra porta,
 * FIGURE_SERVER=http://localhost:3001. Esce con codice 1 se c'è almeno un errore.
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

const RADICE = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  '..',
);
const SERVER = process.env.FIGURE_SERVER ?? 'http://localhost:3000';
const BASE = '/python-doesnt-byte/';

const MAX_PASSI = 8;
const MAX_PAROLE = 20;
const MIN_PX = 12;
const MIN_CONTRASTO = 4.5;

const VARIANTI = [
  {
    tema: 'chiaro',
    larghezza: 1100,
    ctx: { viewport: { width: 1100, height: 900 }, deviceScaleFactor: 1.5 },
  },
  {
    tema: 'scuro',
    larghezza: 1100,
    ctx: { viewport: { width: 1100, height: 900 }, deviceScaleFactor: 1.5 },
  },
  {
    tema: 'chiaro',
    larghezza: 375,
    ctx: {
      viewport: { width: 375, height: 800 },
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2,
    },
  },
  // Nelle lezioni la colonna «Archivio» stringe il testo: a 1100 px la figura
  // è larga 568 px e mostra la disposizione stretta. La larga compare da circa
  // 1280 px in su, e a 1440 la si fotografa nei due temi.
  {
    tema: 'chiaro',
    larghezza: 1440,
    ctx: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.5 },
  },
  {
    tema: 'scuro',
    larghezza: 1440,
    ctx: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.5 },
  },
];

function argomenti(argv) {
  const a = { pagina: null, meta: false, freddo: false, figure: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--meta') a.meta = true;
    else if (argv[i] === '--freddo') a.freddo = true;
    else if (argv[i] === '--figura') a.figure.push(argv[++i]);
    else if (!a.pagina) a.pagina = argv[i];
  }
  return a;
}

/** Da `docs/figure-test` al permalink, dai metadati che `npm start` scrive. */
function permalink(pagina) {
  if (pagina.startsWith('/')) return pagina;
  const sorgente = pagina.replace(/\.mdx?$/, '');
  const dir = path.join(RADICE, '.docusaurus/docusaurus-plugin-content-docs');
  if (!fs.existsSync(dir)) return null;
  for (const plugin of fs.readdirSync(dir)) {
    const cartella = path.join(dir, plugin);
    if (!fs.statSync(cartella).isDirectory()) continue;
    for (const f of fs.readdirSync(cartella)) {
      if (!f.endsWith('.json')) continue;
      const testo = fs.readFileSync(path.join(cartella, f), 'utf8');
      if (!testo.includes(`"@site/${sorgente}.md`)) continue;
      const m = JSON.parse(testo);
      if (m.source?.replace(/^@site\//, '').replace(/\.mdx?$/, '') === sorgente)
        return m.permalink.endsWith('/') ? m.permalink : `${m.permalink}/`;
    }
  }
  return null;
}

const parole = (s) => s.trim().split(/\s+/).filter(Boolean).length;

/**
 * Controlli di un passo, eseguiti nella pagina sulla disposizione visibile
 * della figura. Restituisce gli errori come { controllo, messaggio }.
 */
function controllaPasso({ id, mobile, MIN_PX, MIN_CONTRASTO }) {
  const errori = [];
  const fig = document.querySelector(`[data-figura="${id}"]`);
  const svg = [...fig.querySelectorAll('svg')].find((s) => s.checkVisibility());
  if (!svg)
    return [
      { controllo: 'disposizione', messaggio: 'nessuna disposizione visibile' },
    ];

  // Colori risolti in RGBA 0…255 tramite una tela di un pixel.
  const tela = document.createElement('canvas').getContext('2d', {
    willReadFrequently: true,
  });
  const rgba = (css) => {
    tela.clearRect(0, 0, 1, 1);
    tela.fillStyle = '#000';
    tela.fillStyle = css;
    tela.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = tela.getImageData(0, 0, 1, 1).data;
    return [r, g, b, a / 255];
  };
  const sopra = ([r, g, b, a], [R, G, B]) => [
    r * a + R * (1 - a),
    g * a + G * (1 - a),
    b * a + B * (1 - a),
  ];
  const luminanza = (c) => {
    const [r, g, b] = c.map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const contrasto = (a, b) => {
    const [l1, l2] = [luminanza(a), luminanza(b)].sort((x, y) => y - x);
    return (l1 + 0.05) / (l2 + 0.05);
  };
  const opacita = (e) => {
    let o = 1;
    for (let n = e; n && n !== svg.parentElement; n = n.parentElement)
      o *= parseFloat(getComputedStyle(n).opacity);
    return o;
  };
  // checkVisibility() non vede il display: none dei gruppi SVG antenati.
  const visibile = (e) => {
    for (let n = e; n && n !== svg; n = n.parentElement) {
      const st = getComputedStyle(n);
      if (st.display === 'none' || st.visibility === 'hidden') return false;
    }
    return true;
  };
  const sfondoPagina = () => {
    for (let n = svg; n; n = n.parentElement) {
      const c = rgba(getComputedStyle(n).backgroundColor);
      if (c[3] > 0.99) return c.slice(0, 3);
    }
    return [255, 255, 255];
  };
  const nome = (t) => `«${t.textContent.trim().slice(0, 30)}»`;

  const vb = svg.viewBox.baseVal;
  const rs = svg.getBoundingClientRect();
  const sx = rs.width / vb.width;
  const sy = rs.height / vb.height;
  const testi = [...svg.querySelectorAll('text')].filter(
    (t) => t.textContent.trim() && visibile(t) && opacita(t) > 0.05,
  );
  const scatole = testi.map((t) => t.getBoundingClientRect());
  const fondo = sfondoPagina();

  testi.forEach((t, i) => {
    const r = scatole[i];
    // Fuori dal viewBox, in unità del viewBox (tolleranza mezza unità).
    const fuori = [
      (rs.left - r.left) / sx,
      (r.right - rs.right) / sx,
      (rs.top - r.top) / sy,
      (r.bottom - rs.bottom) / sy,
    ];
    if (Math.max(...fuori) > 0.5)
      errori.push({
        controllo: 'viewBox',
        messaggio: `fuori dal viewBox: ${nome(t)} di ${Math.round(Math.max(...fuori))} unità`,
      });

    // Corpo reale a 375 px.
    if (mobile) {
      const m = t.getScreenCTM();
      const px =
        parseFloat(getComputedStyle(t).fontSize) * Math.hypot(m.a, m.b);
      if (px < MIN_PX)
        errori.push({
          controllo: 'corpo',
          messaggio: `corpo sotto ${MIN_PX} px: ${nome(t)} a ${px.toFixed(1)} px`,
        });
    }

    // Contrasto sullo sfondo reale: le forme piene sotto il centro del testo,
    // dalla più bassa, sopra il fondo della pagina.
    const cx = (r.left + r.right) / 2;
    const cy = (r.top + r.bottom) / 2;
    let sotto = fondo;
    const forme = document
      .elementsFromPoint(cx, cy)
      .filter(
        (e) =>
          e !== t &&
          svg.contains(e) &&
          e instanceof SVGGeometryElement &&
          getComputedStyle(e).fill !== 'none',
      )
      .reverse();
    for (const f of forme) {
      const c = rgba(getComputedStyle(f).fill);
      c[3] *= parseFloat(getComputedStyle(f).fillOpacity) * opacita(f);
      sotto = sopra(c, sotto);
    }
    const c = rgba(getComputedStyle(t).fill);
    c[3] *= opacita(t);
    const k = contrasto(sopra(c, sotto), sotto);
    if (k < MIN_CONTRASTO)
      errori.push({
        controllo: 'contrasto',
        messaggio: `contrasto ${k.toFixed(2)}:1: ${nome(t)}`,
      });
  });

  // Testi sovrapposti: l'intersezione supera il 15% della scatola minore.
  for (let i = 0; i < scatole.length; i++)
    for (let j = i + 1; j < scatole.length; j++) {
      const a = scatole[i];
      const b = scatole[j];
      const l = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (l <= 2 || h <= 2) continue;
      const minore = Math.min(a.width * a.height, b.width * b.height);
      if (l * h > 0.15 * minore)
        errori.push({
          controllo: 'sovrapposti',
          messaggio: `testi sovrapposti: ${nome(testi[i])} e ${nome(testi[j])}`,
        });
    }
  return errori;
}

async function main() {
  const a = argomenti(process.argv.slice(2));
  if (!a.pagina) {
    console.error(
      'Uso: npm run figure:foto -- <pagina> [--meta] [--figura id]',
    );
    process.exit(2);
  }
  try {
    const r = await fetch(`${SERVER}${BASE}`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
  } catch (e) {
    console.error(
      `Il server ${SERVER} non risponde (${e.message}): avvia \`npm start\` e riprova.`,
    );
    process.exit(2);
  }
  const url = permalink(a.pagina);
  if (!url) {
    console.error(`Pagina non trovata: ${a.pagina} (es. docs/figure-test).`);
    process.exit(2);
  }
  const nomePagina = a.pagina.startsWith('/')
    ? a.pagina.replace(/^\/|\/$/g, '').replace(/\//g, '-')
    : a.pagina.replace(/\.mdx?$/, '');
  const uscita = path.join(
    RADICE,
    '.figure-foto',
    nomePagina,
    a.freddo ? 'freddo' : '',
  );
  fs.rmSync(uscita, { recursive: true, force: true });
  fs.mkdirSync(uscita, { recursive: true });

  const browser = await chromium.launch(
    process.env.FIGURE_CHROME
      ? { executablePath: process.env.FIGURE_CHROME }
      : { channel: 'chrome' },
  );
  const rapporto = {
    pagina: a.pagina,
    url,
    data: new Date().toISOString(),
    figure: [],
  };
  const perId = new Map();
  let foto = 0;

  const varianti = a.freddo ? VARIANTI.slice(0, 1) : VARIANTI;
  const fasiPasso = a.freddo || !a.meta ? [1] : [0.5, 1];
  for (const v of varianti) {
    const variante = `${v.tema}-${v.larghezza}`;
    const ctx = await browser.newContext({
      ...v.ctx,
      colorScheme: v.tema === 'scuro' ? 'dark' : 'light',
    });
    const page = await ctx.newPage();
    const tema = v.tema === 'scuro' ? 'dark' : 'light';
    await page.goto(`${SERVER}${url}?figure-ferme&docusaurus-theme=${tema}`, {
      waitUntil: 'networkidle',
    });
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({ content: '.navbar{display:none!important}' });
    if (a.freddo)
      await page.addStyleTag({
        content: '[data-figura] figcaption{display:none!important}',
      });
    let elenco = await page.evaluate(() => window.__figure?.elenco() ?? []);
    if (a.figure.length) elenco = elenco.filter((f) => a.figure.includes(f.id));

    for (const f of elenco) {
      if (!perId.has(f.id)) {
        const voce = { id: f.id, passi: f.passi, errori: [] };
        if (f.passi > MAX_PASSI)
          voce.errori.push({
            controllo: 'passi',
            messaggio: `${f.passi} passi (al massimo ${MAX_PASSI})`,
          });
        f.didascalie.forEach((d, i) => {
          if (parole(d) > MAX_PAROLE)
            voce.errori.push({
              passo: i + 1,
              controllo: 'didascalia',
              messaggio: `${parole(d)} parole (al massimo ${MAX_PAROLE})`,
            });
        });
        perId.set(f.id, voce);
        rapporto.figure.push(voce);
      }
      const voce = perId.get(f.id);
      const cartella = path.join(uscita, f.id);
      fs.mkdirSync(cartella, { recursive: true });
      const el = page.locator(`[data-figura="${f.id}"]`);
      await page.waitForSelector(`[data-figura="${f.id}"][data-figura-pronta]`);

      for (let p = 1; p <= f.passi; p++) {
        for (const fase of fasiPasso) {
          await page.evaluate(
            ([id, p, fase]) => window.__figure.vai(id, p, fase),
            [f.id, p, fase],
          );
          await page.waitForFunction(
            ([id, p, fase]) => {
              const e = document.querySelector(`[data-figura="${id}"]`);
              return (
                e.dataset.figuraPasso === String(p) &&
                Number(e.dataset.figuraFase) === fase
              );
            },
            [f.id, p, fase],
          );
          await page.evaluate(
            () =>
              new Promise((r) =>
                requestAnimationFrame(() => requestAnimationFrame(r)),
              ),
          );
          const n = String(p).padStart(2, '0');
          const file = a.freddo
            ? `${n}.png`
            : fase < 1
              ? `${n}-meta-${variante}.png`
              : `${n}-${variante}.png`;
          await el.screenshot({ path: path.join(cartella, file) });
          foto++;
          if (fase < 1) continue;
          const errori = await page.evaluate(controllaPasso, {
            id: f.id,
            mobile: v.larghezza < 600,
            MIN_PX,
            MIN_CONTRASTO,
          });
          for (const e of errori)
            voce.errori.push({ passo: p, variante, ...e });
        }
      }
    }
    await ctx.close();
  }
  await browser.close();

  const totale = rapporto.figure.reduce((s, f) => s + f.errori.length, 0);
  rapporto.foto = foto;
  rapporto.errori = totale;
  fs.writeFileSync(
    path.join(uscita, 'rapporto.json'),
    `${JSON.stringify(rapporto, null, 2)}\n`,
  );

  console.log(
    `${a.pagina}: ${rapporto.figure.length} figure, ${foto} foto in ${path.relative(RADICE, uscita)}/`,
  );
  for (const f of rapporto.figure) {
    console.log(`  ${f.errori.length ? '✗' : '✓'} ${f.id} (${f.passi} passi)`);
    for (const e of f.errori)
      console.log(
        `      ${e.passo ? `passo ${e.passo}` : 'scena'}${e.variante ? `, ${e.variante}` : ''}: ${e.messaggio}`,
      );
  }
  console.log(totale ? `${totale} errori.` : 'Nessun errore.');
  process.exit(totale ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
