const path = require('path');
const fs = require('fs');
const {
  parseMarkdownFile,
  DEFAULT_PARSE_FRONT_MATTER,
} = require('@docusaurus/utils');

const PLUGIN_NAME = 'exercise-graph';

// Tutti i volumi (istanze plugin-content-docs). Le lezioni-sorgente vivono nei
// primi tre; gli esercizi nel quarto (apprendista).
const VOLUMES = ['programmatore', 'artefice', 'archivista', 'apprendista'];

const MD_EXT = /\.mdx?$/;

// Umanizza un id-segmento come fallback per il titolo quando manca il
// frontmatter (`title`/`sidebar_label`) e l'H1: «le-stringhe» → «Le stringhe».
function humanize(segment) {
  const s = segment.replace(/[-_]+/g, ' ').trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Cammina ricorsivamente una cartella-volume e ritorna la lista dei file
// markdown con il loro docId volume-local (path relativo senza estensione,
// separatori posix). Replica la convenzione di id di @docusaurus/plugin-content-docs.
function walkDocs(dir, baseDir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    // Esclude file/cartelle con prefisso `_` o `.` — stessa convenzione di
    // content-docs (es. _category_.json, _esercizio-template.mdx, partial), che
    // li tiene fuori dal build: il grafo deve ignorarli per non validare un
    // template-segnaposto.
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

// docId effettivo: il frontmatter `id` sovrascrive l'ultimo segmento del path
// (stessa regola di content-docs). Senza override → relId.
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

// Normalizza una chiave globale «<volume>/<docId>» in { volume, docId }.
// Lo split è sul PRIMO `/`: il volume è il primo segmento, il resto è il docId
// volume-local (che può contenere altri `/`).
function splitKey(raw, filePath, field) {
  if (typeof raw !== 'string' || !raw.includes('/')) {
    throw new Error(
      `[exercise-graph] ${field} non valido in ${filePath}: ` +
        `atteso «<volume>/<docId>», ricevuto ${JSON.stringify(raw)}.`,
    );
  }
  const slash = raw.indexOf('/');
  const volume = raw.slice(0, slash);
  const docId = raw.slice(slash + 1);
  if (!VOLUMES.includes(volume)) {
    throw new Error(
      `[exercise-graph] ${field} in ${filePath}: volume sconosciuto «${volume}». ` +
        `Volumi validi: ${VOLUMES.join(', ')}.`,
    );
  }
  return { volume, docId, key: `${volume}/${docId}` };
}

module.exports = function exerciseGraphPlugin(context) {
  const volumeDir = (v) => path.join(context.siteDir, 'volumes', v);

  return {
    name: PLUGIN_NAME,

    async loadContent() {
      // ── Indice delle lezioni (tutti i volumi) ────────────────────────────
      // lessons["<volume>/<docId>"] = { title } — usato per validare i
      // riferimenti e per il display lato client.
      const lessons = {};
      // exercises["<docId>"] = record completo (la chiave è il docId
      // volume-local dell'esercizio; il volume è sempre `apprendista`).
      const exercises = {};
      // byLesson["<volume>/<docId>"] = [ref...] — mappa inversa lezione→esercizi.
      const byLesson = {};

      // Raccolgo prima TUTTI i doc di tutti i volumi, così la validazione degli
      // esercizi vede l'indice completo delle lezioni.
      const docsByVolume = {};
      await Promise.all(
        VOLUMES.map(async (volume) => {
          const base = volumeDir(volume);
          const files = walkDocs(base, base);
          const parsed = await Promise.all(
            files.map(async ({ filePath, relId }) => {
              const { frontMatter, contentTitle } = await parseDoc(filePath);
              const docId = resolveDocId(relId, frontMatter);
              const title =
                (typeof frontMatter.title === 'string' && frontMatter.title) ||
                (typeof frontMatter.sidebar_label === 'string' &&
                  frontMatter.sidebar_label) ||
                contentTitle ||
                humanize(docId.split('/').pop());
              const key = `${volume}/${docId}`;
              lessons[key] = { title };
              return { filePath, docId, key, frontMatter, title };
            }),
          );
          docsByVolume[volume] = parsed;
        }),
      );

      // ── Esercizi (solo `apprendista`, marcati da `assigned_in`) ───────────
      for (const doc of docsByVolume.apprendista) {
        const { filePath, docId, frontMatter, title } = doc;
        if (typeof frontMatter.assigned_in === 'undefined') continue; // non è un esercizio

        const assignedIn = splitKey(
          frontMatter.assigned_in,
          filePath,
          'assigned_in',
        );
        if (!lessons[assignedIn.key]) {
          throw new Error(
            `[exercise-graph] ${filePath}: assigned_in «${assignedIn.key}» ` +
              `non corrisponde ad alcuna lezione esistente.`,
          );
        }

        const theoryRaw = Array.isArray(frontMatter.theory)
          ? frontMatter.theory
          : [];
        const theory = theoryRaw.map((t) => {
          const ref = splitKey(t, filePath, 'theory');
          if (!lessons[ref.key]) {
            throw new Error(
              `[exercise-graph] ${filePath}: theory «${ref.key}» ` +
                `non corrisponde ad alcuna lezione esistente.`,
            );
          }
          return { volume: ref.volume, docId: ref.docId, title: lessons[ref.key].title };
        });

        const record = {
          docId,
          title,
          kind:
            typeof frontMatter.exercise_kind === 'string'
              ? frontMatter.exercise_kind
              : 'rapidi',
          n: typeof frontMatter.n === 'string' ? frontMatter.n : undefined,
          lessonId:
            typeof frontMatter.lesson_id === 'string'
              ? frontMatter.lesson_id
              : undefined,
          difficulty:
            typeof frontMatter.difficulty === 'string'
              ? frontMatter.difficulty
              : undefined,
          time: typeof frontMatter.time === 'string' ? frontMatter.time : undefined,
          assignedIn: {
            volume: assignedIn.volume,
            docId: assignedIn.docId,
            title: lessons[assignedIn.key].title,
          },
          theory,
        };
        exercises[docId] = record;

        // Backlink inverso: l'esercizio è «assegnato in» assignedIn → lo
        // elenchiamo su quella lezione. La teoria NON genera backlink (non è
        // assegnazione, solo supporto).
        (byLesson[assignedIn.key] ??= []).push({
          docId,
          title,
          kind: record.kind,
          difficulty: record.difficulty,
          time: record.time,
        });
      }

      return { exercises, byLesson, lessons };
    },

    async contentLoaded({ content, actions }) {
      actions.setGlobalData(content);
    },

    getPathsToWatch() {
      return VOLUMES.map((v) => path.join(volumeDir(v), '**/*.{md,mdx}'));
    },
  };
};

module.exports.PLUGIN_NAME = PLUGIN_NAME;
