// Configurazioni predefinite (preset) del configuratore percorsi: i vecchi
// percorsi IT/Liceo/ITS diventano codici curati. `keys` elenca le lezioni
// INCLUSE come chiavi globali «<volume>/<docId>» — devono tutte esistere
// nell'epoca corrente del manifest (validato dal plugin curriculum).
// Le label sono migrate da src/contexts/pathLabels.ts.
module.exports = [
  {
    id: 'it',
    label: 'Istituto Tecnico',
    short: 'IT',
    keys: [
      'programmatore/intro',
      'programmatore/variabili',
      'artefice/intro',
      'artefice/perche-gli-oggetti',
      'artefice/classi-e-istanze',
      'artefice/metodi-di-classe-e-statici',
      'artefice/mostrare-un-oggetto',
      'artefice/incapsulamento',
      'archivista/intro',
      'apprendista/intro',
      'apprendista/programmatore/le-basi/le-variabili',
      'apprendista/programmatore/le-basi/i-tipi-di-dato/esercizi-rapidi',
      'apprendista/programmatore/le-basi/i-tipi-di-dato/esercizio-convertitore',
      'apprendista/programmatore/le-basi/i-tipi-di-dato/laboratorio-convertitore',
    ],
  },
  {
    id: 'liceo',
    label: 'Liceo',
    short: 'Liceo',
    keys: [
      'programmatore/intro',
      'programmatore/variabili',
      'artefice/intro',
      'artefice/perche-gli-oggetti',
      'artefice/classi-e-istanze',
      'artefice/metodi-di-classe-e-statici',
      'artefice/mostrare-un-oggetto',
      'artefice/incapsulamento',
      'archivista/intro',
      'apprendista/intro',
      'apprendista/programmatore/le-basi/le-variabili',
      'apprendista/programmatore/le-basi/i-tipi-di-dato/esercizi-rapidi',
      'apprendista/programmatore/le-basi/i-tipi-di-dato/esercizio-convertitore',
      'apprendista/programmatore/le-basi/i-tipi-di-dato/laboratorio-convertitore',
    ],
  },
  {
    id: 'its',
    label: 'ITS',
    short: 'ITS',
    keys: [
      // Il percorso ITS del vecchio sistema escludeva `variabili` dal vol. 1.
      'programmatore/intro',
      'artefice/intro',
      'artefice/perche-gli-oggetti',
      'artefice/classi-e-istanze',
      'artefice/metodi-di-classe-e-statici',
      'artefice/mostrare-un-oggetto',
      'artefice/incapsulamento',
      'archivista/intro',
      'apprendista/intro',
      'apprendista/programmatore/le-basi/le-variabili',
      'apprendista/programmatore/le-basi/i-tipi-di-dato/esercizi-rapidi',
      'apprendista/programmatore/le-basi/i-tipi-di-dato/esercizio-convertitore',
      'apprendista/programmatore/le-basi/i-tipi-di-dato/laboratorio-convertitore',
    ],
  },
];
