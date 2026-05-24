import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

// Manuale del Programmatore (Volume 1 — 3a).
// Una sidebar per percorso. Lo stesso doc può comparire in più percorsi
// con label/categoria diverse: l'URL del doc resta unico.
const sidebars: SidebarsConfig = {
  it: ['intro'],
  liceo: ['intro'],
  its: ['intro'],
};

export default sidebars;
