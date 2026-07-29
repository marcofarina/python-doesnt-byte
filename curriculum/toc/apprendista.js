// Albero sidebar UNICO della Biblioteca dell'Apprendista (Volume 4 —
// esercizi e laboratori). Vedi programmatore.js per il ruolo di questi file.
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
module.exports = [
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
];
