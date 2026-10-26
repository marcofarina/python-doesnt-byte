// Presentazioni delle lezioni (slides/, vedi slides/README.md).
//
// Un mazzo slides/decks/<volume>/<slug>.md appartiene alla lezione
// volumes/<volume>/<slug>.mdx e, una volta costruito (npm run slides:build),
// è servito a /slides/<volume>/<slug>/. Il plugin dice al pulsante «Presenta»
// (src/components/PresentaButton) quali lezioni ne hanno uno: legge i sorgenti, non static/slides/, così in sviluppo il
// pulsante c'è anche prima della build (e porta a una 404 finché non la fai).
const path = require('path');
const fs = require('fs');

const PLUGIN_NAME = 'presentazioni';
const DECKS_DIR = path.join('slides', 'decks');

module.exports = function presentazioniPlugin(context) {
  const decksAbs = path.join(context.siteDir, DECKS_DIR);

  return {
    name: PLUGIN_NAME,

    getPathsToWatch() {
      return [path.join(decksAbs, '*', '*.md')];
    },

    async loadContent() {
      const presentazioni = {};
      if (!fs.existsSync(decksAbs)) return { presentazioni };
      for (const volume of fs.readdirSync(decksAbs, { withFileTypes: true })) {
        if (!volume.isDirectory() || volume.name.startsWith('_')) continue;
        for (const file of fs.readdirSync(path.join(decksAbs, volume.name))) {
          if (!file.endsWith('.md') || file.startsWith('_')) continue;
          const slug = file.replace(/\.md$/, '');
          // Chiave: `<pluginId>/<docId>`, come il campo `lezione:` del mazzo.
          presentazioni[`${volume.name}/${slug}`] = {
            url: `/slides/${volume.name}/${slug}/`,
          };
        }
      }
      return { presentazioni };
    },

    async contentLoaded({ content, actions }) {
      actions.setGlobalData(content);
    },
  };
};
