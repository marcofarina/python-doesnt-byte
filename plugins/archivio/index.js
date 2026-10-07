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

    getPathsToWatch() {
      return [path.join(archiveAbsDir, '**/*.json')];
    },
  };
};

module.exports.PLUGIN_NAME = PLUGIN_NAME;
