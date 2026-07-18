import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

// Manuale dell'Archivista (Volume 3 — 5a).
// Sidebar UNICA: l'albero vive in curriculum/toc/ (fonte condivisa con il
// plugin curriculum); i percorsi personalizzati filtrano client-side.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const tree = require('../curriculum/toc/archivista.js');

const sidebars: SidebarsConfig = {
  libro: tree,
};

export default sidebars;
