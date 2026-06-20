const path = require('path');
const fs = require('fs');

const PLUGIN_NAME = 'pyrunner';

const DEFAULT_OPTIONS = {
  // Brython 3.12.4 self-hostato in static/<brythonDir>/ (niente CDN esterna:
  // stessa policy di font e sql.js — privacy, niente single point of failure,
  // funziona dietro reti che filtrano le CDN). Essendo same-origin non servono
  // SRI né crossorigin: l'integrità è garantita dal repo. I file sono stati
  // verificati contro l'hash sha384 che jsdelivr serviva per la 3.12.4.
  brythonDir: 'brython',
  brythonMain: 'brython.min.js',
  brythonStdlib: 'brython_stdlib.js',
  libDir: 'bry-libs',
  examplesDir: 'py-examples',
};

function walkPyFiles(dir, baseDir) {
  const out = {};
  if (!fs.existsSync(dir)) {
    console.warn(
      `[pyrunner] Directory esempi non trovata: ${dir} — nessun file .py caricato.`,
    );
    return out;
  }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      Object.assign(out, walkPyFiles(full, baseDir));
    } else if (entry.isFile() && entry.name.endsWith('.py')) {
      const rel = path.relative(baseDir, full).split(path.sep).join('/');
      out[rel] = fs.readFileSync(full, 'utf-8');
    }
  }
  return out;
}

module.exports = function pyrunnerPlugin(context, pluginOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...pluginOptions };
  const staticRoot =
    (context.siteConfig.staticDirectories &&
      context.siteConfig.staticDirectories[0]) ||
    'static';
  const examplesAbsDir = path.join(
    context.siteDir,
    staticRoot,
    opts.examplesDir,
  );
  const libUrl = path.posix.join(context.baseUrl, opts.libDir, '/');
  const brythonMainSrc = path.posix.join(
    context.baseUrl,
    opts.brythonDir,
    opts.brythonMain,
  );
  const brythonStdlibSrc = path.posix.join(
    context.baseUrl,
    opts.brythonDir,
    opts.brythonStdlib,
  );

  return {
    name: PLUGIN_NAME,

    async loadContent() {
      const examples = walkPyFiles(examplesAbsDir, examplesAbsDir);
      return { examples };
    },

    async contentLoaded({ content, actions }) {
      actions.setGlobalData({
        libUrl,
        examplesDir: opts.examplesDir,
        examples: content.examples,
        // Coordinate per caricare Brython on-demand lato client (vedi
        // src/pyBoot.ts). NON iniettiamo più gli <script> in <head>: così le
        // pagine senza alcun runner (homepage, landing dei volumi, /support,
        // 404, …) non scaricano ~1,1 MB di Brython core + stdlib inutilmente.
        // URL same-origin (self-hostati): niente SRI/crossorigin.
        brython: {
          mainSrc: brythonMainSrc,
          stdlibSrc: brythonStdlibSrc,
        },
      });
    },

    getPathsToWatch() {
      return [path.join(examplesAbsDir, '**/*.py')];
    },
  };
};

module.exports.PLUGIN_NAME = PLUGIN_NAME;
