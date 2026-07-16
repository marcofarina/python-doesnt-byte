const path = require('path');
const fs = require('fs');
const {
  parseMarkdownFile,
  DEFAULT_PARSE_FRONT_MATTER,
} = require('@docusaurus/utils');

const PLUGIN_NAME = 'curriculum';

// Volumi (istanze plugin-content-docs) in ordine curricolare: è l'ordine dei
// bit nel manifest e delle sezioni nel configuratore.
const VOLUMES = [
  { id: 'programmatore', label: 'Manuale del Programmatore' },
  { id: 'artefice', label: 'Manuale dell’Artefice' },
  { id: 'archivista', label: 'Manuale dell’Archivista' },
  { id: 'apprendista', label: 'Biblioteca dell’Apprendista' },
];

const MD_EXT = /\.mdx?$/;

// ── Helper condivisi con plugins/exercise-graph (stessa convenzione docId) ──

function humanize(segment) {
  const s = segment.replace(/[-_]+/g, ' ').trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function walkDocs(dir, baseDir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDocs(full, baseDir, out);
    } else if (entry.isFile() && MD_EXT.test(entry.name)) {
      const rel = path
        .relative(baseDir, full)
        .split(path.sep)
        .join('/')
        .replace(MD_EXT, '');
      out.push({ filePath: full, relId: rel });
    }
  }
  return out;
}

function resolveDocId(relId, frontMatter) {
  const override = frontMatter.id;
  if (typeof override !== 'string' || override.length === 0) return relId;
  const slash = relId.lastIndexOf('/');
  return slash === -1 ? override : `${relId.slice(0, slash + 1)}${override}`;
}

async function parseDoc(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  return parseMarkdownFile({
    filePath,
    fileContent,
    parseFrontMatter: DEFAULT_PARSE_FRONT_MATTER,
    removeContentTitle: true,
  });
}

// ── TOC ─────────────────────────────────────────────────────────────────────

// require() con cache bustata: in dev il watcher rilancia loadContent quando
// un file TOC cambia, ma senza questo il require riconsegnerebbe il modulo
// vecchio.
function freshRequire(modulePath) {
  delete require.cache[require.resolve(modulePath)];
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require(modulePath);
}

// Appiattisce un albero sidebar (stringhe doc + categorie annidate) nella
// lista ordinata dei docId volume-local.
function flattenTocDocIds(items, tocPath, out = []) {
  for (const item of items) {
    if (typeof item === 'string') {
      out.push(item);
    } else if (item && item.type === 'doc' && typeof item.id === 'string') {
      out.push(item.id);
    } else if (item && item.type === 'category' && Array.isArray(item.items)) {
      flattenTocDocIds(item.items, tocPath, out);
    } else {
      throw new Error(
        `[${PLUGIN_NAME}] Voce TOC non riconosciuta in ${tocPath}: ` +
          `${JSON.stringify(item)}. Attesi: docId stringa, {type:'doc'}, {type:'category'}.`,
      );
    }
  }
  return out;
}

// Clona l'albero TOC per il client, risolvendo i doc in { key, title }.
function buildClientTree(items, volumeId, titles) {
  return items.map((item) => {
    if (typeof item === 'string' || (item && item.type === 'doc')) {
      const docId = typeof item === 'string' ? item : item.id;
      const key = `${volumeId}/${docId}`;
      return { type: 'doc', key, title: titles[key] };
    }
    return {
      type: 'category',
      label: item.label,
      items: buildClientTree(item.items, volumeId, titles),
    };
  });
}

// ── Manifest ────────────────────────────────────────────────────────────────

function readManifest(manifestPath) {
  if (!fs.existsSync(manifestPath)) return null;
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  if (
    manifest.version !== 1 ||
    !Number.isInteger(manifest.currentEpoch) ||
    typeof manifest.epochs !== 'object' ||
    manifest.epochs === null ||
    !Array.isArray(manifest.epochs[String(manifest.currentEpoch)])
  ) {
    throw new Error(
      `[${PLUGIN_NAME}] ${manifestPath} malformato: attesi version=1, ` +
        `currentEpoch intero e epochs["<currentEpoch>"] array.`,
    );
  }
  for (const [epoch, entries] of Object.entries(manifest.epochs)) {
    const seen = new Set();
    for (const entry of entries) {
      if (seen.has(entry)) {
        throw new Error(
          `[${PLUGIN_NAME}] Entry duplicata nel manifest (epoca ${epoch}): «${entry}».`,
        );
      }
      seen.add(entry);
    }
  }
  return manifest;
}

function writeManifest(manifestPath, manifest) {
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

module.exports = function curriculumPlugin(context) {
  const siteDir = context.siteDir;
  const tocDir = path.join(siteDir, 'curriculum', 'toc');
  const presetsPath = path.join(siteDir, 'curriculum', 'presets.js');
  const manifestPath = path.join(siteDir, 'curriculum', 'manifest.json');
  const volumeDir = (v) => path.join(siteDir, 'volumes', v);

  return {
    name: PLUGIN_NAME,

    async loadContent() {
      const isProduction = process.env.NODE_ENV === 'production';

      // ── TOC + titoli ──────────────────────────────────────────────────────
      // titles["<volume>/<docId>"] — risolti dal frontmatter come in
      // exercise-graph (title > sidebar_label > H1 > humanize).
      const titles = {};
      const volumes = [];
      const tocKeys = []; // tutte le lezioni, in ordine curricolare

      for (const { id: volumeId, label } of VOLUMES) {
        const tocPath = path.join(tocDir, `${volumeId}.js`);
        const tree = freshRequire(tocPath);
        const docIds = flattenTocDocIds(tree, tocPath);

        const base = volumeDir(volumeId);
        const files = walkDocs(base, base);
        const byDocId = {};
        await Promise.all(
          files.map(async ({ filePath, relId }) => {
            const { frontMatter, contentTitle } = await parseDoc(filePath);
            const docId = resolveDocId(relId, frontMatter);
            byDocId[docId] = { filePath, frontMatter, contentTitle };
          }),
        );

        for (const docId of docIds) {
          const doc = byDocId[docId];
          if (!doc) {
            throw new Error(
              `[${PLUGIN_NAME}] ${tocPath}: il doc «${docId}» non esiste in ` +
                `volumes/${volumeId}/.`,
            );
          }
          const { frontMatter, contentTitle } = doc;
          titles[`${volumeId}/${docId}`] =
            (typeof frontMatter.title === 'string' && frontMatter.title) ||
            (typeof frontMatter.sidebar_label === 'string' &&
              frontMatter.sidebar_label) ||
            contentTitle ||
            humanize(docId.split('/').pop());
          tocKeys.push(`${volumeId}/${docId}`);
        }

        volumes.push({
          id: volumeId,
          label,
          tree: buildClientTree(tree, volumeId, titles),
        });
      }

      // ── Manifest: valida/appendi (epoca corrente) ─────────────────────────
      let manifest = readManifest(manifestPath);
      if (!manifest) {
        if (isProduction) {
          throw new Error(
            `[${PLUGIN_NAME}] curriculum/manifest.json mancante. Lancia ` +
              `\`npm start\` per generarlo e committalo.`,
          );
        }
        manifest = { version: 1, currentEpoch: 1, epochs: { 1: [] } };
      }

      const epochKey = String(manifest.currentEpoch);
      const current = manifest.epochs[epochKey];
      const known = new Set(current);
      const missing = tocKeys.filter((key) => !known.has(key));
      if (missing.length > 0) {
        if (isProduction) {
          throw new Error(
            `[${PLUGIN_NAME}] ${missing.length} lezioni della TOC mancano dal ` +
              `manifest (epoca ${epochKey}): ${missing.join(', ')}. Il manifest ` +
              `committato è la fonte unica delle posizioni di bit: lancia ` +
              `\`npm start\` (le appende) e committa curriculum/manifest.json.`,
          );
        }
        manifest.epochs[epochKey] = [...current, ...missing];
        writeManifest(manifestPath, manifest);
        console.log(
          `[${PLUGIN_NAME}] Appese ${missing.length} lezioni al manifest ` +
            `(epoca ${epochKey}): ${missing.join(', ')} — ricordati di ` +
            `committare curriculum/manifest.json.`,
        );
      }

      // ── Preset: ogni chiave deve esistere nell'epoca corrente ────────────
      const presets = freshRequire(presetsPath);
      const currentSet = new Set(manifest.epochs[epochKey]);
      for (const preset of presets) {
        for (const key of preset.keys) {
          if (!currentSet.has(key)) {
            throw new Error(
              `[${PLUGIN_NAME}] Il preset «${preset.id}» referenzia ` +
                `«${key}», assente dall'epoca corrente del manifest.`,
            );
          }
        }
      }

      // ── Pagine sempre visibili: le intro dei volumi ───────────────────────
      const alwaysVisible = VOLUMES.map((v) => `${v.id}/intro`).filter((key) =>
        tocKeys.includes(key),
      );

      return { volumes, manifest, presets, alwaysVisible };
    },

    async contentLoaded({ content, actions }) {
      actions.setGlobalData(content);
    },

    getPathsToWatch() {
      // NB: NON manifest.json — il plugin lo scrive in dev, watcharlo
      // innescherebbe un loop di rebuild.
      return [path.join(tocDir, '*.js'), presetsPath];
    },
  };
};

module.exports.PLUGIN_NAME = PLUGIN_NAME;
module.exports.VOLUMES = VOLUMES;
