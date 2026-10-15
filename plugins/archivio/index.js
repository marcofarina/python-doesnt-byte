const path = require('path');
const fs = require('fs');

// Fonte unica dei file dell'archivio (piano pm/piano-2026-10-archivio.md).
// I file vivono in static/archivio/<dataset>/<nome>.json: Brython li scarica da
// lì (static/bry-libs/archivio_hogwarts.py), React li riceve da questo plugin
// come testo, formattato com'è sul disco (<FileArchivio>, pannello Archivio).

const PLUGIN_NAME = 'archivio';
const ARCHIVE_DIR = 'archivio';
// Seed dei SQLRunner: il frontmatter `database:` ne nomina uno per chiave
// (archivista/registro-punti → static/sql-datasets/archivista/registro-punti.sql).
const DATASET_DIR = 'sql-datasets';

function walkJsonFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkJsonFiles(full, out);
    else if (entry.isFile() && entry.name.endsWith('.json')) out.push(full);
  }
  return out;
}

module.exports = function archivioPlugin(context) {
  const staticRoot =
    (context.siteConfig.staticDirectories &&
      context.siteConfig.staticDirectories[0]) ||
    'static';
  const archiveAbsDir = path.join(context.siteDir, staticRoot, ARCHIVE_DIR);
  const datasetAbsDir = path.join(context.siteDir, staticRoot, DATASET_DIR);

  function controllaDatabase(lezione, chiave) {
    if (chiave === undefined) return;
    if (typeof chiave !== 'string' || chiave.trim() === '') {
      throw new Error(
        `[archivio] ${lezione}: «database:» deve essere la chiave di un dataset, ` +
          'per esempio archivista/registro-punti.',
      );
    }
    const seed = path.join(datasetAbsDir, `${chiave}.sql`);
    // La chiave non deve uscire da static/sql-datasets/.
    const dentro = path.relative(datasetAbsDir, seed);
    if (
      dentro.startsWith('..') ||
      path.isAbsolute(dentro) ||
      !fs.existsSync(seed)
    ) {
      throw new Error(
        `[archivio] ${lezione} dichiara «${chiave}» in database:, ` +
          `ma il file static/${DATASET_DIR}/${chiave}.sql non esiste.`,
      );
    }
  }

  return {
    name: PLUGIN_NAME,

    async loadContent() {
      // Le lezioni dichiarano i file per nome (punti.json), senza dataset:
      // due file con lo stesso nome in dataset diversi sarebbero ambigui.
      const file = {};
      const origine = {};
      if (!fs.existsSync(archiveAbsDir)) return { file };
      for (const full of walkJsonFiles(archiveAbsDir).sort()) {
        const nome = path.basename(full);
        const rel = path
          .relative(archiveAbsDir, full)
          .split(path.sep)
          .join('/');
        if (nome in file) {
          throw new Error(
            `[archivio] Due file con lo stesso nome: ${origine[nome]} e ${rel}. ` +
              'Le lezioni dichiarano i file per nome: rinominane uno.',
          );
        }
        file[nome] = fs.readFileSync(full, 'utf-8');
        origine[nome] = rel;
      }
      return { file };
    },

    async contentLoaded({ content, actions }) {
      actions.setGlobalData({ file: content.file });
    },

    // Una lezione dichiara i file del pannello Archivio nel frontmatter
    // (`archivio: [punti.json, studenti.json]`) e il dataset del pannello
    // Database (`database: archivista/registro-punti`, piano
    // pm/piano-2026-10-pannello-database.md). Un nome che non esiste ferma la
    // build qui, con la lezione e il nome nel messaggio, invece di lasciare un
    // pannello vuoto in pagina.
    async allContentLoaded({ allContent }) {
      const file = allContent[PLUGIN_NAME]?.default?.file ?? {};
      const disponibili = Object.keys(file).join(', ') || 'nessuno';
      for (const [pluginName, byInstance] of Object.entries(allContent)) {
        if (!pluginName.includes('plugin-content-docs')) continue;
        for (const data of Object.values(byInstance)) {
          for (const version of data?.loadedVersions ?? []) {
            for (const doc of version.docs) {
              const lezione = doc.source.replace(/^@site\//, '');
              controllaDatabase(lezione, doc.frontMatter.database);
              const dichiarati = doc.frontMatter.archivio;
              if (dichiarati === undefined) continue;
              if (
                !Array.isArray(dichiarati) ||
                !dichiarati.every((n) => typeof n === 'string')
              ) {
                throw new Error(
                  `[archivio] ${lezione}: «archivio:» deve essere una lista di nomi di file, ` +
                    'per esempio [punti.json, studenti.json].',
                );
              }
              for (const nome of dichiarati) {
                if (!(nome in file)) {
                  throw new Error(
                    `[archivio] ${lezione} dichiara «${nome}» in archivio:, ` +
                      `ma in static/archivio/ non c'è nessun file con questo nome. ` +
                      `File disponibili: ${disponibili}.`,
                  );
                }
              }
            }
          }
        }
      }
    },

    getPathsToWatch() {
      return [path.join(archiveAbsDir, '**/*.json')];
    },
  };
};

module.exports.PLUGIN_NAME = PLUGIN_NAME;
