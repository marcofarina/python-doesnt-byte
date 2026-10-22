/**
 * Per trovare le due assegnazioni di Neville il programma le legge tutte: 18
 * nel file piccolo, 20.018 in quello di tutta la scuola. Sezione «Quando il
 * registro cresce» di volumes/archivista/dati-fuori-dal-programma.mdx.
 *
 * Due blocchi uguali, uno per file: il foglio, il contatore delle
 * assegnazioni lette e le trovate. La lettura stende un evidenziatore su
 * tutto il foglio mentre il contatore sale. Il passo 3 ha `rivela`: la lezione chiede
 * di prevedere quante assegnazioni legge il programma la seconda volta.
 *
 * `larga`: i due blocchi affiancati. `stretta`: uno sopra l'altro.
 */
import type {
  Animazione,
  FiguraDef,
  Oggetto,
  Scena,
} from '@site/src/components/Figura/tipi';

interface Blocco {
  /** Foglio: angolo in alto a sinistra e misure. */
  x: number;
  y: number;
  l: number;
  a: number;
  /** Centro del contatore. */
  contaX: number;
  contaY: number;
  /** Riquadro delle trovate. */
  trovateX: number;
  trovateY: number;
}

interface Disposizione {
  larghezza: number;
  altezza: number;
  piccolo: Blocco;
  grande: Blocco;
}

const TROVATE_L = 240;
const TROVATE_A = 104;

const LARGA: Disposizione = {
  larghezza: 700,
  altezza: 436,
  piccolo: {
    x: 40,
    y: 16,
    l: 220,
    a: 120,
    contaX: 150,
    contaY: 306,
    trovateX: 30,
    trovateY: 332,
  },
  grande: {
    x: 400,
    y: 16,
    l: 280,
    a: 250,
    contaX: 540,
    contaY: 306,
    trovateX: 420,
    trovateY: 332,
  },
};

const STRETTA: Disposizione = {
  larghezza: 370,
  altezza: 756,
  piccolo: {
    x: 75,
    y: 16,
    l: 220,
    a: 120,
    contaX: 185,
    contaY: 172,
    trovateX: 65,
    trovateY: 196,
  },
  grande: {
    x: 45,
    y: 330,
    l: 280,
    a: 250,
    contaX: 185,
    contaY: 620,
    trovateX: 65,
    trovateY: 646,
  },
};

function crea(d: Disposizione): Scena {
  const blocco = (
    pre: string,
    b: Blocco,
    nome: string,
    contenuto: string,
  ): Oggetto[] => {
    return [
      {
        id: `${pre}-file`,
        tipo: 'file',
        natura: 'concetto',
        ruolo: 'dato',
        x: b.x,
        y: b.y,
        l: b.l,
        a: b.a,
        nome,
      },
      // La lettura stende l'evidenziatore su tutto il foglio, e lì resta.
      {
        id: `${pre}-letto`,
        tipo: 'evidenziatore',
        natura: 'dato',
        x: b.x + 10,
        y: b.y + 42,
        l: b.l - 20,
        a: b.a - 52,
      },
      {
        id: `${pre}-contenuto`,
        tipo: 'testo',
        natura: 'dato',
        ruolo: 'inchiostro',
        x: b.x + b.l / 2,
        y: b.y + 48 + (b.a - 48) / 2,
        testo: contenuto,
        ancora: 'middle',
        corpo: 'normale',
      },
      {
        id: `${pre}-conta`,
        tipo: 'contatore',
        natura: 'dato',
        ruolo: 'programma',
        x: b.contaX,
        y: b.contaY,
        unita: 'assegnazioni lette',
        corpo: 'grande',
      },
      {
        id: `${pre}-trovate`,
        tipo: 'riquadro',
        natura: 'concetto',
        ruolo: 'programma',
        x: b.trovateX,
        y: b.trovateY,
        l: TROVATE_L,
        a: TROVATE_A,
        etichetta: 'trovate',
      },
      ...[
        ['meno', 'Neville  -50'],
        ['piu', 'Neville  +10'],
      ].map(
        ([suff, testo], i): Oggetto => ({
          id: `${pre}-${suff}`,
          tipo: 'riga',
          natura: 'dato',
          ruolo: 'dato',
          x: b.trovateX + 20,
          y: b.trovateY + 32 + i * 34,
          l: TROVATE_L - 40,
          testo,
        }),
      ),
    ];
  };

  /** Il foglio si disegna, poi il contatore a 0 e il riquadro vuoto. */
  const entra = (pre: string): Animazione[] => [
    { fai: 'Create', id: `${pre}-file` },
    { fai: 'Write', id: `${pre}-contenuto`, ritardo: 560 },
    { fai: 'FadeIn', id: `${pre}-conta`, ritardo: 560 },
    { fai: 'Create', id: `${pre}-trovate`, ritardo: 560 },
  ];

  /** Il foglio si evidenzia tutto, il contatore sale, le due righe compaiono. */
  const legge = (
    pre: string,
    lette: number,
    durata: number,
    da = 0,
  ): Animazione[] => [
    {
      fai: 'Create',
      id: `${pre}-letto`,
      ritardo: da,
      durata,
      curva: 'lineare',
    },
    {
      fai: 'Count',
      id: `${pre}-conta`,
      a: lette,
      ritardo: da,
      durata,
      curva: 'lineare',
    },
    { fai: 'Create', id: `${pre}-meno`, ritardo: da + durata * 0.4 },
    { fai: 'Create', id: `${pre}-piu`, ritardo: da + durata * 0.75 },
  ];

  return {
    id: 'legge-tutto',
    titolo: 'Per trovarne due, le legge tutte',
    descrizione:
      'A sinistra punti.json, con 18 assegnazioni; a destra ' +
      'punti_tutta_la_scuola.json, con 20.018. Per trovare le due assegnazioni ' +
      'di Neville (-50 e +10) il programma legge 18 assegnazioni nel primo file ' +
      'e 20.018 nel secondo: le trovate sono due in tutti e due i casi.',
    larghezza: d.larghezza,
    altezza: d.altezza,
    oggetti: [
      ...blocco('p', d.piccolo, 'punti.json', '18 assegnazioni'),
      ...blocco(
        'g',
        d.grande,
        'punti_tutta_la_scuola.json',
        '20.018 assegnazioni',
      ),
    ],
    passi: [
      {
        didascalia:
          'punti.json contiene 18 assegnazioni, e il programma non ne ha ancora letta nessuna.',
        animazioni: entra('p'),
      },
      {
        didascalia: 'Le legge tutte e 18, e ne trova due.',
        animazioni: legge('p', 18, 1680),
      },
      {
        didascalia:
          'Nel registro di tutta la scuola le legge tutte e 20.018, e ne trova ancora due.',
        rivela: true,
        animazioni: [...entra('g'), ...legge('g', 20018, 2800, 1120)],
      },
      {
        didascalia:
          'Il lavoro cresce con il file, non con la risposta: le trovate restano due.',
        animazioni: [
          { fai: 'Indicate', id: 'p-trovate' },
          { fai: 'Indicate', id: 'g-trovate' },
        ],
      },
    ],
  };
}

const figura: FiguraDef = { scena: crea(LARGA), stretta: crea(STRETTA) };
export default figura;
