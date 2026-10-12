// Albero sidebar UNICO del Manuale dell'Archivista (Volume 3 — 5a).
// Vedi programmatore.js per il ruolo di questi file.
//
// Le lezioni stanno dentro la category del loro capitolo (numero e titolo da
// pm/syllabus-tre-volumi.md). Un capitolo nuovo nasce con la sua prima lezione:
// `label: 'N · Titolo'` e `customProps: { capitolo: N }`. Il numero esplicito
// alimenta il kicker «Capitolo NN» (src/theme/DocItem/Content): contarlo per
// posizione slitterebbe quando un percorso esclude un capitolo intero.
module.exports = [
  'intro',
  {
    type: 'category',
    label: '1 · Perché un database',
    customProps: { capitolo: 1 },
    items: [
      'dati-fuori-dal-programma',
      'stessa-informazione-due-volte',
      'che-cosa-fa-un-dbms',
    ],
  },
];
