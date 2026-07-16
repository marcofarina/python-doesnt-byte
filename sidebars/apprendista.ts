import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

// Biblioteca dell'Apprendista (Volume 4 — esercizi e laboratori).
// Sidebar UNICA: l'albero (struttura ibrida pagina/categoria per lezione,
// regole di collapse) vive in curriculum/toc/apprendista.js — fonte condivisa
// con il plugin curriculum; i percorsi personalizzati filtrano client-side.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const tree = require('../curriculum/toc/apprendista.js');

const sidebars: SidebarsConfig = {
  libro: tree,
};

export default sidebars;
