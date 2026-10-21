/**
 * Il file sul disco e la sua copia in memoria: figura statica, un passo solo.
 * Sandbox di G1 (docs/figure-test.mdx).
 */
import type { FiguraDef } from '@site/src/components/Figura/tipi';

const visibile = { opacita: 1, progresso: 1 };

const figura: FiguraDef = {
  scena: {
    id: 'file-e-copia',
    titolo: 'Il file e la sua copia in memoria',
    descrizione:
      'A sinistra il disco con il file punti.json, a destra la memoria del ' +
      'programma con la copia letta dal file: dopo la lettura i dati stanno in ' +
      'due posti.',
    larghezza: 520,
    altezza: 210,
    oggetti: [
      {
        id: 'disco',
        tipo: 'riquadro',
        natura: 'concetto',
        ruolo: 'tenue',
        x: 0,
        y: 10,
        l: 190,
        a: 190,
        etichetta: 'disco',
        iniziale: visibile,
      },
      {
        id: 'file',
        tipo: 'file',
        natura: 'concetto',
        ruolo: 'dato',
        x: 20,
        y: 54,
        l: 150,
        a: 120,
        nome: 'punti.json',
        iniziale: visibile,
      },
      {
        id: 'memoria',
        tipo: 'riquadro',
        natura: 'concetto',
        ruolo: 'programma',
        x: 330,
        y: 10,
        l: 190,
        a: 190,
        etichetta: 'memoria',
        iniziale: visibile,
      },
      {
        id: 'copia',
        tipo: 'file',
        natura: 'concetto',
        ruolo: 'dato',
        x: 350,
        y: 54,
        l: 150,
        a: 120,
        nome: 'registro',
        iniziale: visibile,
      },
      {
        id: 'legge',
        tipo: 'freccia',
        natura: 'concetto',
        ruolo: 'programma',
        x: 196,
        y: 114,
        dx: 128,
        dy: 0,
        curva: -18,
        etichetta: 'legge',
        iniziale: visibile,
      },
    ],
    passi: [
      {
        didascalia:
          'Dopo la lettura gli stessi dati stanno in due posti: sul disco e in memoria.',
        animazioni: [],
      },
    ],
  },
};
export default figura;
