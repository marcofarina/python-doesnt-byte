import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

// Biblioteca dell'Apprendista (Volume 4 — esercizi e laboratori).
//
// Gli esercizi sono raggruppati per volume di provenienza:
//   volume-sorgente > capitolo > lezione
//
// Modello IBRIDO al livello "lezione":
//   - lezione con SOLO esercizi rapidi → è una PAGINA singola (un doc)
//   - lezione con anche esercizi dedicati / laboratori → è una CATEGORIA, con
//     sotto una pagina per tipo (Esercizi rapidi / Esercizio: … / Laboratorio: …)
// Gli esercizietti di una pagina-batch sono sezioni <h2> (vanno nel TOC della
// pagina), non voci di sidebar.
//
// Regola di collapse (per evitare la "lista infinita"):
//   - categorie volume-sorgente: collapsed: false  → aperte, mostrano i capitoli
//   - categorie capitolo / lezione: collapsed: true → chiuse di default
// Così a colpo d'occhio si vedono i volumi-sorgente e l'elenco dei capitoli;
// il resto resta nascosto finché non si espande.
//
// NB: `themeConfig.docs.sidebar.autoCollapseCategories` è GLOBALE ed è a `true`:
// aprendo un capitolo, i fratelli si richiudono. Per questa sidebar sarebbe
// preferibile `false` (vedi nota in docusaurus.config.ts).

// Albero condiviso dai tre percorsi (it / liceo / its). Quando i percorsi
// divergeranno, duplicare e personalizzare per chiave.
const tree: SidebarsConfig[string] = [
  'intro',
  {
    type: 'category',
    label: 'Manuale del Programmatore',
    collapsed: false, // volume-sorgente: aperto
    items: [
      {
        type: 'category',
        label: 'Le basi',
        collapsed: true, // capitolo: chiuso
        items: [
          // lezione con solo esercizi rapidi → pagina singola
          'programmatore/le-basi/le-variabili',
          // lezione con più tipi di pagina → categoria
          {
            type: 'category',
            label: 'I tipi di dato',
            collapsed: true, // lezione: chiusa
            items: [
              'programmatore/le-basi/i-tipi-di-dato/esercizi-rapidi',
              'programmatore/le-basi/i-tipi-di-dato/esercizio-convertitore',
              'programmatore/le-basi/i-tipi-di-dato/laboratorio-convertitore',
            ],
          },
        ],
      },
    ],
  },
  // {
  //   type: 'category',
  //   label: 'Manuale dell'Artefice',
  //   collapsed: false,
  //   items: [ /* capitoli > lezioni > esercizi */ ],
  // },
  // {
  //   type: 'category',
  //   label: 'Manuale dell'Archivista',
  //   collapsed: false,
  //   items: [ /* capitoli > lezioni > esercizi */ ],
  // },
];

const sidebars: SidebarsConfig = {
  it: tree,
  liceo: tree,
  its: tree,
};

export default sidebars;
