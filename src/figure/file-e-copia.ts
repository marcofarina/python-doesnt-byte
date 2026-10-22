/**
 * Il file sul disco e la sua copia in memoria: figura statica, un passo solo.
 * Nata nella sandbox di G1 (docs/figure-test.mdx), è anche la figura di «Il
 * registro delle case» in volumes/archivista/dati-fuori-dal-programma.mdx.
 *
 * Le prime tre assegnazioni di punti.json stanno in tutti e due i fogli: sono
 * le righe uguali a dire che la lettura copia il file, e non lo sposta.
 *
 * `larga`: disco e memoria affiancati. `stretta`: il disco sopra, la memoria
 * sotto.
 */
import type {
  FiguraDef,
  Oggetto,
  Scena,
} from '@site/src/components/Figura/tipi';

const visibile = { opacita: 1, progresso: 1 };

const RIGHE = ['Hermione  -5', 'Harry     +5', 'Ron       +5'];

/** Le prime righe del registro, dentro il foglio che parte da (x, y). */
const righe = (pre: string, x: number, y: number): Oggetto[] =>
  RIGHE.map((testo, i) => ({
    id: `${pre}-${i}`,
    tipo: 'riga',
    natura: 'dato',
    ruolo: 'dato',
    x: x + 10,
    y: y + 40 + i * 32,
    l: 130,
    testo,
    iniziale: visibile,
  }));

interface Disposizione {
  larghezza: number;
  altezza: number;
  disco: [number, number];
  memoria: [number, number];
  /** Freccia «legge»: partenza, spostamento e curva. */
  legge: [number, number, number, number, number];
}

const LARGA: Disposizione = {
  larghezza: 520,
  altezza: 236,
  disco: [0, 10],
  memoria: [330, 10],
  legge: [196, 126, 128, 0, -18],
};

const STRETTA: Disposizione = {
  larghezza: 380,
  altezza: 526,
  disco: [95, 10],
  memoria: [95, 300],
  legge: [190, 232, 0, 62, 18],
};

const crea = (d: Disposizione): Scena => {
  const [dx, dy] = d.disco;
  const [mx, my] = d.memoria;
  const [lx, ly, ldx, ldy, curva] = d.legge;
  return {
    id: 'file-e-copia',
    titolo: 'Il file e la sua copia in memoria',
    descrizione:
      'Il disco con il file punti.json e la memoria del programma con la ' +
      'lista registro, letta dal file: le stesse righe stanno ' +
      'in tutti e due, e dopo la lettura i dati stanno in due posti.',
    larghezza: d.larghezza,
    altezza: d.altezza,
    oggetti: [
      {
        id: 'disco',
        tipo: 'riquadro',
        natura: 'concetto',
        ruolo: 'tenue',
        x: dx,
        y: dy,
        l: 190,
        a: 216,
        etichetta: 'disco',
        iniziale: visibile,
      },
      {
        id: 'file',
        tipo: 'file',
        natura: 'concetto',
        ruolo: 'dato',
        x: dx + 20,
        y: dy + 40,
        l: 150,
        a: 152,
        nome: 'punti.json',
        iniziale: visibile,
      },
      ...righe('f', dx + 20, dy + 40),
      {
        id: 'memoria',
        tipo: 'riquadro',
        natura: 'concetto',
        ruolo: 'programma',
        x: mx,
        y: my,
        l: 190,
        a: 216,
        etichetta: 'memoria',
        iniziale: visibile,
      },
      {
        id: 'copia',
        tipo: 'file',
        natura: 'concetto',
        ruolo: 'dato',
        x: mx + 20,
        y: my + 40,
        l: 150,
        a: 152,
        nome: 'registro',
        iniziale: visibile,
      },
      ...righe('c', mx + 20, my + 40),
      {
        id: 'legge',
        tipo: 'freccia',
        natura: 'concetto',
        ruolo: 'programma',
        x: lx,
        y: ly,
        dx: ldx,
        dy: ldy,
        curva,
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
  };
};

const figura: FiguraDef = { scena: crea(LARGA), stretta: crea(STRETTA) };
export default figura;
