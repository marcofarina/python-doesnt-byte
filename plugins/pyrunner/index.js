const path = require('path');
const fs = require('fs');

const PLUGIN_NAME = 'pyrunner';

const DEFAULT_OPTIONS = {
  brythonSrc: 'https://cdn.jsdelivr.net/npm/brython@3.12.4/brython.min.js',
  brythonStdlibSrc:
    'https://cdn.jsdelivr.net/npm/brython@3.12.4/brython_stdlib.js',
  // SRI hash dei bundle pinnati a 3.12.4. Se la CDN serve un file diverso
  // (compromissione, MITM, mismatch di versione) il browser rifiuta lo script.
  brythonIntegrity:
    'sha384-7rPpfu6/m4Kt9MXKynqy9O9qlPkNnbNhhorIn114kwlsCY3AI3T9eXt+UgVcQ9Qg',
  brythonStdlibIntegrity:
    'sha384-JEgOSQ3kchBXLE0JDMOoSxjkqHdd8vNq3SY6/2KA4aPvCimeLMmt+cMnHIb0I4bw',
  libDir: 'bry-libs',
  examplesDir: 'py-examples',
  /**
   * Se `true` evita di iniettare gli script Brython in <head>: utile se un
   * altro plugin li sta già caricando, o per test. Default: iniezione attiva.
   */
  skipScriptInjection: false,
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
  const examplesAbsDir = path.join(context.siteDir, staticRoot, opts.examplesDir);
  const libUrl = path.posix.join(context.baseUrl, opts.libDir, '/');

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
      });
    },

    getPathsToWatch() {
      return [path.join(examplesAbsDir, '**/*.py')];
    },

    injectHtmlTags() {
      if (opts.skipScriptInjection) return { headTags: [] };
      const scriptTag = (src, integrity) => ({
        tagName: 'script',
        attributes: {
          src,
          ...(integrity ? { integrity } : {}),
          crossorigin: 'anonymous',
          referrerpolicy: 'no-referrer',
          defer: 'defer',
        },
      });
      return {
        headTags: [
          scriptTag(opts.brythonSrc, opts.brythonIntegrity),
          scriptTag(opts.brythonStdlibSrc, opts.brythonStdlibIntegrity),
        ],
      };
    },
  };
};

module.exports.PLUGIN_NAME = PLUGIN_NAME;
