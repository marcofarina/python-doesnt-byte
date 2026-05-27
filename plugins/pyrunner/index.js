const path = require('path');
const fs = require('fs');

const PLUGIN_NAME = 'pyrunner';

const DEFAULT_OPTIONS = {
  brythonSrc: 'https://cdn.jsdelivr.net/npm/brython@3.12.4/brython.min.js',
  brythonStdlibSrc:
    'https://cdn.jsdelivr.net/npm/brython@3.12.4/brython_stdlib.js',
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
  if (!fs.existsSync(dir)) return out;
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
      return {
        headTags: [
          {
            tagName: 'script',
            attributes: {
              src: opts.brythonSrc,
              crossorigin: 'anonymous',
              referrerpolicy: 'no-referrer',
              defer: 'defer',
            },
          },
          {
            tagName: 'script',
            attributes: {
              src: opts.brythonStdlibSrc,
              crossorigin: 'anonymous',
              referrerpolicy: 'no-referrer',
              defer: 'defer',
            },
          },
        ],
      };
    },
  };
};

module.exports.PLUGIN_NAME = PLUGIN_NAME;
