const path = require('path');
const fs = require('fs');

// Fonte unica dei file dell'archivio (piano pm/piano-2026-10-archivio.md).
// I file vivono in static/archivio/<dataset>/<nome>.json: Brython li scarica da
// lì (static/bry-libs/archivio_hogwarts.py), React li riceve da questo plugin
// come testo, formattato com'è sul disco (<FileArchivio>, pannello Archivio).

const PLUGIN_NAME = 'archivio';
const ARCHIVE_DIR = 'archivio';

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
    // (`archivio: [punti.json, studenti.json]`). Un nome che non esiste ferma
    // la build qui, con la lezione e il file nel messaggio, invece di lasciare
    // un pannello vuoto in pagina.
    async allContentLoaded({ allContent }) {
      const file = allContent[PLUGIN_NAME]?.default?.file ?? {};
      const disponibili = Object.keys(file).join(', ') || 'nessuno';
      for (const [pluginName, byInstance] of Object.entries(allContent)) {
        if (!pluginName.includes('plugin-content-docs')) continue;
        for (const data of Object.values(byInstance)) {
          for (const version of data?.loadedVersions ?? []) {
            for (const doc of version.docs) {
              const dichiarati = doc.frontMatter.archivio;
              if (dichiarati === undefined) continue;
              const lezione = doc.source.replace(/^@site\//, '');
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
