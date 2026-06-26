const path = require('path');
const fs = require('fs');
const {
  parseMarkdownFile,
  DEFAULT_PARSE_FRONT_MATTER,
} = require('@docusaurus/utils');

const PLUGIN_NAME = 'copy-page-md';

// Placeholder per i componenti interattivi che non hanno senso in Markdown.
const OMITTED = '_[contenuto interattivo omesso — vedi la pagina online]_';

// ─── Sanitizzazione MDX → Markdown ───────────────────────────────────────────
// Il corpus segue convenzioni documentate (CLAUDE.md): per la v1 bastano regole
// stringa. Obiettivo: «abbastanza pulito da farsi leggere da un LLM», non
// Markdown perfetto. Upgrade futuro: un passo remark/AST.

// Inline del file referenziato da `<PyRunner src="…/foo.py" />` come blocco
// ```python. Best-effort: se il file manca, lascia un placeholder.
function inlinePyRunnerSrc(src, siteDir) {
  try {
    const abs = path.join(siteDir, 'static', 'py-examples', src);
    const code = fs.readFileSync(abs, 'utf-8').trimEnd();
    return `\`\`\`python\n${code}\n\`\`\``;
  } catch {
    return OMITTED;
  }
}

// Componenti interattivi che non hanno una resa testuale utile → placeholder.
const INTERACTIVE = [
  'Quiz',
  'QuizDeck',
  'Algorithm',
  'SQLRunner',
  'PyRunnerCustom',
  'PyRunner',
];

// Trasforma il JSX della PROSA (i blocchi/inline di codice sono già protetti dal
// chiamante, così esempi che mostrano `<Tag>` non vengono toccati).
function transformJsx(s, siteDir) {
  // Righe di import/export MDX e commenti JSX `{/* … */}`.
  s = s.replace(/^\s*(?:import|export)\s.+$/gm, '');
  s = s.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

  // <PyRunner src="…" … /> → inline del .py (prima delle OMITTED su PyRunner).
  s = s.replace(
    /<PyRunner\b[^>]*\bsrc=["']([^"']+)["'][^>]*\/>/g,
    (_m, src) => inlinePyRunnerSrc(src, siteDir),
  );

  // <InlineCode …>x</InlineCode> → `x` (tollera attributi, es. kind="keyword").
  s = s.replace(/<InlineCode\b[^>]*>([\s\S]*?)<\/InlineCode>/g, '`$1`');

  // <Tooltip …>parola</Tooltip> → parola (tiene i children, scarta la def).
  s = s.replace(/<Tooltip\b[^>]*>([\s\S]*?)<\/Tooltip>/g, '$1');

  // <TabItem … label="X" …> → intestazione **X** (i wrapper Tabs/TabItem li
  // toglie la catch-all, tenendo il contenuto delle tab).
  s = s.replace(
    /<TabItem\b[^>]*\blabel=["']([^"']+)["'][^>]*>/g,
    '\n**$1**\n\n',
  );

  // Componenti interattivi → placeholder (forma a blocco e self-closing).
  for (const c of INTERACTIVE) {
    s = s.replace(new RegExp(`<${c}\\b[\\s\\S]*?</${c}>`, 'g'), OMITTED);
    s = s.replace(new RegExp(`<${c}\\b[^>]*/>`, 'g'), OMITTED);
  }

  // Catch-all: rimuove i tag JSX rimasti (componenti capitalizzati) tenendone i
  // children — Epigraph, Tabs, Exercise, Solution, FAIcon, DocCardList, ecc.
  s = s.replace(/<[A-Z][A-Za-z0-9]*\b[^>]*\/>/g, ''); // self-closing
  s = s.replace(/<[A-Z][A-Za-z0-9]*\b[^>]*?>/g, ''); // apertura
  s = s.replace(/<\/[A-Z][A-Za-z0-9]*>/g, ''); // chiusura

  return s;
}

function sanitize(body, siteDir) {
  // Normalizza l'info-string dei fence (solo le righe di apertura: i chiusi sono
  // ``` nudi e non matchano `py`/`sql`).
  let s = body
    .replace(/^(\s*)```py\b[^\n]*$/gm, '$1```python')
    .replace(/^(\s*)```sql\b[^\n]*$/gm, '$1```sql');

  // Proteggi i blocchi di codice e l'inline code: il JSX-stripping non deve
  // toccare esempi che contengono `<Componente>`.
  const blocks = [];
  s = s.replace(/```[\s\S]*?```/g, (m) => `\x00B${blocks.push(m) - 1}\x00`);
  const inlines = [];
  s = s.replace(/`[^`\n]+`/g, (m) => `\x00I${inlines.push(m) - 1}\x00`);

  s = transformJsx(s, siteDir);

  // Ripristina (inline prima, poi blocchi).
  s = s.replace(/\x00I(\d+)\x00/g, (_m, i) => inlines[+i]);
  s = s.replace(/\x00B(\d+)\x00/g, (_m, i) => blocks[+i]);

  // Collassa run di righe vuote (≥3) introdotti dalle rimozioni.
  return s.replace(/\n{3,}/g, '\n\n').trim();
}

async function toCleanMarkdown(absPath, doc, context) {
  const fileContent = fs.readFileSync(absPath, 'utf-8');
  const { content } = await parseMarkdownFile({
    filePath: absPath,
    fileContent,
    parseFrontMatter: DEFAULT_PARSE_FRONT_MATTER,
    removeContentTitle: true,
  });

  const siteUrl = context.siteConfig.url.replace(/\/$/, '');
  const pageUrl = siteUrl + doc.permalink;
  const body = sanitize(content, context.siteDir);

  return (
    `# ${doc.title}\n\n` +
    `> Fonte: ${pageUrl} — «Python Doesn’t Byte»\n\n` +
    `${body}\n`
  );
}

// Percorso di output del .md, coerente col fetch lato client. Il permalink
// include il baseUrl: lo si toglie perché outDir è già la radice servita a
// baseUrl. Permalink con `/` finale (landing/category) → index.md.
function outFile(outDir, permalink, baseUrl) {
  let rel = permalink.startsWith(baseUrl)
    ? permalink.slice(baseUrl.length)
    : permalink.replace(/^\//, '');
  rel = rel.replace(/^\//, '');
  return rel === '' || rel.endsWith('/')
    ? path.join(outDir, rel, 'index.md')
    : path.join(outDir, `${rel}.md`);
}

module.exports = function copyPageMd(context) {
  // Manifest condiviso tra allContentLoaded (calcolo) e postBuild (scrittura).
  let manifest = []; // [{ permalink, md }]

  return {
    name: PLUGIN_NAME,

    async allContentLoaded({ allContent, actions }) {
      manifest = [];
      for (const [pluginName, byInstance] of Object.entries(allContent)) {
        if (!pluginName.includes('plugin-content-docs')) continue;
        for (const data of Object.values(byInstance)) {
          if (!data || !Array.isArray(data.loadedVersions)) continue;
          const version =
            data.loadedVersions.find((v) => v.versionName === 'current') ??
            data.loadedVersions[0];
          for (const doc of version?.docs ?? []) {
            const abs = doc.source.replace(/^@site/, context.siteDir);
            try {
              const md = await toCleanMarkdown(abs, doc, context);
              manifest.push({ permalink: doc.permalink, md });
            } catch (err) {
              console.warn(
                `[${PLUGIN_NAME}] salto ${doc.permalink}: ${err.message}`,
              );
            }
          }
        }
      }

      // Dev (`npm start`): postBuild non gira → esponi il Markdown via global
      // data, così «Copia pagina» funziona senza file statici. In produzione
      // resta `{}` per non gonfiare il bundle: i .md sono file statici servibili.
      const pages =
        process.env.NODE_ENV === 'production'
          ? {}
          : Object.fromEntries(manifest.map((m) => [m.permalink, m.md]));
      actions.setGlobalData({ pages });
    },

    async postBuild({ outDir, siteConfig }) {
      for (const { permalink, md } of manifest) {
        const file = outFile(outDir, permalink, siteConfig.baseUrl);
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, md, 'utf-8');
      }
      console.log(`[${PLUGIN_NAME}] scritti ${manifest.length} file .md`);
    },
  };
};
