const path = require('path');
const fs = require('fs');
const { applyTrailingSlash } = require('@docusaurus/utils-common');

const PLUGIN_NAME = 'llms-txt';

// Genera `llms.txt` (https://llmstxt.org) a ogni build, così l'indice per gli
// assistenti AI segue da sé le pagine pubblicate. La parte scritta a mano vive
// in template.md: descrizioni, sezioni, pagine fuori dai docs. Ogni riga
// `<!-- docs:<id> -->` diventa l'elenco delle lezioni pubblicate di
// quell'istanza docs, nell'ordine della sidebar e con i capitoli come `###`.
// Le bozze (`draft: true`) in produzione non arrivano qui: escono da sole.
//
// Due guardie fanno fallire la build invece di pubblicare un indice sbagliato:
// un link del template verso una pagina che non esiste, e una pagina di
// src/pages che il template non cita e che non è in ESCLUSE.

// Pagine di src/pages che restano fuori di proposito (home, sandbox, strumenti
// da LIM, giochi non pubblici). Path senza baseUrl e senza barra finale.
const ESCLUSE = ['', '/test', '/archivio', '/level-editor', '/pyquest'];

const DIRECTIVE = /^<!-- docs:([\w-]+) -->$/;

// Path relativo al baseUrl, senza barra finale: la forma su cui si confronta.
function norm(p, baseUrl) {
  let rel = p.startsWith(baseUrl) ? p.slice(baseUrl.length - 1) : p;
  rel = rel.replace(/[?#].*$/, '').replace(/\/+$/, '');
  return rel;
}

// Descrizione su una riga sola, così la voce resta un elemento di lista.
function oneLine(s) {
  return (s ?? '').replace(/\s+/g, ' ').trim();
}

// Elenco Markdown delle lezioni di una versione docs, seguendo la sidebar:
// fuori dalla sidebar restano le note di servizio (es. docs/README.md) e le
// pagine `unlisted` (le sandbox di test), che non vanno indicizzate.
function docsList(version, url) {
  const byId = new Map(
    version.docs.filter((d) => !d.unlisted).map((d) => [d.id, d]),
  );
  const seen = new Set();
  const out = [];

  const item = (doc) => {
    seen.add(doc.id);
    const desc = oneLine(doc.description);
    return `- [${doc.title}](${url(doc.permalink)})${desc ? `: ${desc}` : ''}`;
  };

  const walk = (items, depth) => {
    for (const it of items) {
      if (it.type === 'doc' || it.type === 'ref') {
        const doc = byId.get(it.id);
        if (doc && !seen.has(doc.id)) out.push(item(doc));
      } else if (it.type === 'category') {
        const start = out.length;
        const linked = it.link?.type === 'doc' ? byId.get(it.link.id) : null;
        if (linked && !seen.has(linked.id)) out.push(item(linked));
        walk(it.items ?? [], depth + 1);
        // Intestazione solo se il capitolo ha almeno una lezione pubblicata.
        if (out.length > start && depth === 0) {
          out.splice(start, 0, '', `### ${it.label}`, '');
        }
      }
    }
  };

  for (const sidebar of Object.values(version.sidebars ?? {})) walk(sidebar, 0);
  return out.join('\n');
}

module.exports = function llmsTxt(context) {
  const { url: siteUrl, baseUrl, trailingSlash } = context.siteConfig;
  const origin = siteUrl.replace(/\/$/, '');
  const absUrl = (permalink) =>
    origin + applyTrailingSlash(permalink, { trailingSlash, baseUrl });

  let versions = {}; // id istanza docs → versione corrente
  let pagePaths = []; // permalink delle pagine di src/pages

  return {
    name: PLUGIN_NAME,

    getPathsToWatch() {
      return [path.join(__dirname, 'template.md')];
    },

    async allContentLoaded({ allContent }) {
      versions = {};
      for (const [id, data] of Object.entries(
        allContent['docusaurus-plugin-content-docs'] ?? {},
      )) {
        const v =
          data.loadedVersions.find((x) => x.versionName === 'current') ??
          data.loadedVersions[0];
        if (v) versions[id] = v;
      }
      const pages = allContent['docusaurus-plugin-content-pages']?.default;
      pagePaths = (pages ?? []).map((p) => p.permalink);
    },

    async postBuild({ outDir, routesPaths }) {
      const template = fs.readFileSync(
        path.join(__dirname, 'template.md'),
        'utf-8',
      );
      const errors = [];

      let body = template
        .split('\n')
        .map((line) => {
          const m = line.match(DIRECTIVE);
          if (!m) return line;
          const v = versions[m[1]];
          if (!v) {
            errors.push(`istanza docs sconosciuta: «${m[1]}»`);
            return '';
          }
          return docsList(v, absUrl);
        })
        .join('\n');

      // Link scritti a mano come `](/percorso/)`: si verificano e si rendono
      // assoluti (il baseUrl lo aggiunge il plugin, nel template non c'è).
      const routes = new Set(routesPaths.map((r) => norm(r, baseUrl)));
      const cited = new Set();
      body = body.replace(/\]\((\/[^)\s]*)\)/g, (_m, p) => {
        const rel = norm(p, '/');
        cited.add(rel);
        if (!routes.has(rel))
          errors.push(`link a una pagina inesistente: ${p}`);
        return `](${absUrl(baseUrl.replace(/\/$/, '') + (rel || '/'))})`;
      });

      for (const p of pagePaths) {
        const rel = norm(p, baseUrl);
        const escluso = ESCLUSE.some(
          (e) => rel === e || (e !== '' && rel.startsWith(`${e}/`)),
        );
        if (cited.has(rel) || escluso) {
          continue;
        }
        errors.push(
          `pagina ${rel}/ non citata: aggiungila a plugins/llms-txt/template.md o a ESCLUSE`,
        );
      }

      if (errors.length) {
        throw new Error(
          `[${PLUGIN_NAME}] llms.txt non generato:\n  - ${errors.join('\n  - ')}`,
        );
      }

      body = body.replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
      fs.writeFileSync(path.join(outDir, 'llms.txt'), body, 'utf-8');
      console.log(`[${PLUGIN_NAME}] scritto llms.txt`);
    },
  };
};
