/**
 * Il registro dei punti in un foglio di calcolo: figura statica, un passo solo.
 * Sezione «Il registro in un foglio di calcolo» di
 * volumes/archivista/il-modello-relazionale.mdx, al posto della tabella che
 * non sapeva mostrare la cella unita.
 *
 * I numeri sono quelli che la prosa cita: righe 1–9, colonne A–E, Grifondoro
 * in una cella unita sulle righe 2–5, i quattro corsi in una cella della
 * colonna D, righe vuote 6 e 8, il totale 13 nella riga 9 (E2:E9 darebbe 26).
 * I punti sono quelli del seed `archivista/registro-punti`.
 *
 * La griglia è fatta di linee: le tre linee orizzontali dentro la cella unita
 * saltano la colonna A. `larga`: ogni cella su una riga. `stretta`: il testo va
 * a capo dentro le celle, come con «testo a capo» di un foglio vero, perché a
 * 380 unità i corsi in una riga sola non ci stanno.
 */
import type {
  FiguraDef,
  Oggetto,
  Scena,
} from '@site/src/components/Figura/tipi';

interface Disposizione {
  larghezza: number;
  /** Colonne: numeri di riga, poi A–E. */
  colonne: [number, number, number, number, number, number];
  /** Altezza della banda delle lettere. */
  banda: number;
  /** Altezze delle righe 1–9. */
  righe: number[];
  /** Il testo delle colonne B e D va a capo dentro la cella. */
  aCapo?: boolean;
}

const CORSI = 'Erbologia, Incantesimi, Pozioni, Trasfigurazione';

/** Contenuto delle righe 1–9, colonne A–E; `null` = cella coperta dall'unione. */
const CELLE: (string | null)[][] = [
  ['Casa', 'Studente', 'Anno', 'Corsi', 'Punti'],
  ['Grifondoro', 'Harry Potter', '1', CORSI, '13'],
  [null, 'Hermione Granger', '1', CORSI, '−5'],
  [null, 'Ron Weasley', '1', CORSI, '55'],
  [null, 'Neville Longbottom', '1', CORSI, '−40'],
  ['', '', '', '', ''],
  ['Serpeverde', 'Draco Malfoy', '1', CORSI, '−10'],
  ['', '', '', '', ''],
  ['Totale', '', '', '', '13'],
];
const LETTERE = ['A', 'B', 'C', 'D', 'E'];
/** Colonne con numeri, allineati a destra come in un foglio vero. */
const NUMERI = new Set([2, 4]);

const LARGA: Disposizione = {
  larghezza: 690,
  colonne: [30, 92, 142, 52, 314, 58],
  banda: 26,
  righe: Array<number>(9).fill(28),
};

/** Righe con quattro righe di testo nella colonna D. */
const ALTA = 86;
const STRETTA: Disposizione = {
  larghezza: 380,
  colonne: [20, 77, 85, 42, 110, 44],
  banda: 24,
  righe: [28, ALTA, ALTA, ALTA, ALTA, 28, ALTA, 28, 28],
  aCapo: true,
};

const visibile = { opacita: 1, progresso: 1 };
const X0 = 1;
const Y0 = 1;
const MARGINE = 5;
/** Linea di base della prima riga di testo, dall'alto della cella. */
const BASE = 19;

function crea(d: Disposizione): Scena {
  const xs = d.colonne.reduce<number[]>(
    (acc, c, j) => [...acc, acc[j] + c],
    [X0],
  );
  const ys = d.righe.reduce<number[]>(
    (acc, r, i) => [...acc, acc[i] + r],
    [Y0 + d.banda],
  );
  const destra = xs[xs.length - 1];
  const fondo = ys[ys.length - 1];

  const testo = (
    id: string,
    x: number,
    y: number,
    t: string,
    extra: Partial<Oggetto> = {},
  ): Oggetto =>
    ({
      id,
      tipo: 'testo',
      natura: 'dato',
      ruolo: 'dato',
      x,
      y,
      testo: t,
      corpo: 'piccolo',
      iniziale: visibile,
      ...extra,
    }) as Oggetto;

  const linea = (
    id: string,
    x: number,
    y: number,
    dx: number,
    dy: number,
  ): Oggetto => ({
    id,
    tipo: 'freccia',
    natura: 'dato',
    ruolo: 'tenue',
    x,
    y,
    dx,
    dy,
    punte: 'nessuna',
    iniziale: visibile,
  });

  // Bande delle lettere e dei numeri di riga, sotto la griglia.
  const bande: Oggetto[] = [
    {
      id: 'banda-lettere',
      tipo: 'riquadro',
      natura: 'dato',
      ruolo: 'tenue',
      x: X0,
      y: Y0,
      l: destra - X0,
      a: d.banda,
      fondo: true,
      raggio: 'xs',
      iniziale: visibile,
    },
    {
      id: 'banda-numeri',
      tipo: 'riquadro',
      natura: 'dato',
      ruolo: 'tenue',
      x: X0,
      y: Y0,
      l: d.colonne[0],
      a: fondo - Y0,
      fondo: true,
      raggio: 'xs',
      iniziale: visibile,
    },
  ];

  const bordo: Oggetto = {
    id: 'bordo',
    tipo: 'riquadro',
    natura: 'dato',
    ruolo: 'tenue',
    x: X0,
    y: Y0,
    l: destra - X0,
    a: fondo - Y0,
    raggio: 'xs',
    iniziale: visibile,
  };

  // Linee verticali fra le colonne.
  const verticali = xs
    .slice(1, -1)
    .map((x, j) => linea(`v-${j}`, x, Y0, 0, fondo - Y0));

  // Linee orizzontali: sotto la banda e fra le righe. Dentro la cella unita
  // (fra le righe 2 e 5) la linea salta la colonna A.
  const orizzontali: Oggetto[] = ys.slice(0, -1).flatMap((y, i) => {
    const dentroUnione = i >= 2 && i <= 4;
    if (!dentroUnione) return [linea(`o-${i}`, X0, y, destra - X0, 0)];
    return [
      linea(`o-${i}`, X0, y, d.colonne[0], 0),
      linea(`o-${i}-b`, xs[2], y, destra - xs[2], 0),
    ];
  });

  const lettere = LETTERE.map((l, j) =>
    testo(
      `lettera-${l}`,
      (xs[j + 1] + xs[j + 2]) / 2,
      Y0 + d.banda / 2 + 5,
      l,
      { ruolo: 'tenue', ancora: 'middle' },
    ),
  );

  const numeri = d.righe.map((_, i) =>
    testo(
      `numero-${i + 1}`,
      X0 + d.colonne[0] / 2,
      ys[i] + BASE,
      String(i + 1),
      { ruolo: 'tenue', ancora: 'middle' },
    ),
  );

  const celle: Oggetto[] = CELLE.flatMap((riga, i) =>
    riga.flatMap((v, j) => {
      if (!v) return [];
      const id = `${LETTERE[j]}${i + 1}`;
      // La cella unita A2:A5: il nome a metà altezza delle quattro righe.
      if (id === 'A2') {
        const meta = (ys[1] + ys[5]) / 2;
        return [testo(id, xs[1] + MARGINE, meta + 5, v)];
      }
      if (NUMERI.has(j) && i > 0)
        return [
          testo(id, xs[j + 2] - MARGINE, ys[i] + BASE, v, { ancora: 'end' }),
        ];
      const capo =
        d.aCapo && (j === 1 || j === 3)
          ? d.colonne[j + 1] - 2 * MARGINE
          : undefined;
      return [
        testo(
          id,
          xs[j + 1] + MARGINE,
          ys[i] + BASE,
          v,
          capo ? { larghezzaMax: capo } : {},
        ),
      ];
    }),
  );

  return {
    id: 'foglio-di-calcolo',
    titolo: 'Il registro dei punti in un foglio di calcolo',
    descrizione:
      'Un foglio di calcolo con le colonne A, B, C, D, E e le righe numerate ' +
      'da 1 a 9. La riga 1 contiene i titoli Casa, Studente, Anno, Corsi, ' +
      'Punti. Nella colonna A, Grifondoro è scritto una volta in una cella ' +
      'unita sulle righe da 2 a 5, dove stanno Harry Potter (13 punti), ' +
      'Hermione Granger (−5), Ron Weasley (55) e Neville Longbottom (−40), ' +
      'tutti del primo anno. La riga 6 è vuota, la riga 7 è Serpeverde, ' +
      'Draco Malfoy, primo anno, −10; la riga 8 è vuota; la riga 9 ha ' +
      'Totale nella colonna A e 13 nella colonna E. In ogni riga di studente ' +
      'la cella della colonna D contiene i quattro corsi: Erbologia, ' +
      'Incantesimi, Pozioni, Trasfigurazione.',
    larghezza: d.larghezza,
    altezza: fondo + Y0,
    oggetti: [
      ...bande,
      bordo,
      ...verticali,
      ...orizzontali,
      ...lettere,
      ...numeri,
      ...celle,
    ],
    passi: [
      {
        didascalia:
          'Il registro dei punti in un foglio di calcolo: ogni riga ha un numero, ogni colonna una lettera.',
        animazioni: [],
      },
    ],
  };
}

const figura: FiguraDef = { scena: crea(LARGA), stretta: crea(STRETTA) };
export default figura;
