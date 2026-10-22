/**
 * Le occorrenze dell'associazione `appartiene`: figura statica, un passo solo.
 * Sezione «La colonna che collega» di volumes/archivista/le-associazioni.mdx,
 * dopo il riquadro di definizione.
 *
 * Due insiemi, gli studenti e le case, con una linea per ogni coppia per cui
 * il legame vale. Il rombo `appartiene` sta sopra e una graffa raccoglie le
 * linee: l'associazione è l'insieme delle coppie. La coppia della definizione,
 * (Harry Potter, Grifondoro), è in accento, e il suo nome è scritto sotto: senza,
 * il lettore freddo leggeva le linee come un conteggio, non come le coppie.
 *
 * `larga` e `stretta` hanno la stessa struttura: cambiano le misure degli
 * insiemi e il corpo dei nomi.
 */
import { larghezzaTesto } from '@site/src/components/Figura/misure';
import type {
  FiguraDef,
  Oggetto,
  Scena,
} from '@site/src/components/Figura/tipi';

interface Disposizione {
  larghezza: number;
  altezza: number;
  /** Insieme degli studenti: x, y, l, a. I nomi stanno al centro. */
  studenti: [number, number, number, number];
  case: [number, number, number, number];
  /** Linee di base dei nomi e delle case. */
  yNomi: number[];
  yCase: number[];
  corpo: 15 | 17;
  rombo: [number, number, number, number];
  /** Graffa: inizio, altezza e lunghezza, sotto il rombo. */
  graffa: [number, number, number];
  /** Il nome della coppia in accento, sotto gli insiemi, al centro. */
  occorrenza: [number, number];
}

const STUDENTI = [
  'Harry Potter',
  'Hermione Granger',
  'Draco Malfoy',
  'Padma Patil',
  'Cedric Diggory',
];
const CASE = ['Grifondoro', 'Serpeverde', 'Corvonero', 'Tassofrasso'];
/** Casa di ogni studente, come indice in CASE (studenti.json). */
const COPPIE = [0, 0, 1, 2, 3];

const LARGA: Disposizione = {
  larghezza: 700,
  altezza: 410,
  studenti: [10, 80, 270, 280],
  case: [430, 100, 250, 240],
  yNomi: [133, 179, 225, 271, 317],
  yCase: [154, 200, 246, 292],
  corpo: 17,
  rombo: [265, 0, 170, 60],
  graffa: [275, 86, 150],
  occorrenza: [350, 392],
};

const STRETTA: Disposizione = {
  larghezza: 380,
  altezza: 382,
  studenti: [0, 80, 196, 250],
  case: [222, 96, 148, 220],
  yNomi: [131, 172, 213, 254, 295],
  yCase: [151, 192, 233, 274],
  corpo: 15,
  rombo: [130, 0, 150, 56],
  graffa: [170, 76, 70],
  occorrenza: [190, 366],
};

const visibile = { opacita: 1, progresso: 1 };
const inRilievo = { ...visibile, enfasi: 1 };

function crea(d: Disposizione): Scena {
  const insieme = (
    id: string,
    [x, y, l, a]: [number, number, number, number],
    etichetta: string,
  ): Oggetto => ({
    id,
    tipo: 'insieme',
    natura: 'concetto',
    ruolo: 'tenue',
    x,
    y,
    l,
    a,
    etichetta,
    iniziale: visibile,
  });

  const cs = d.studenti[0] + d.studenti[2] / 2;
  const cc = d.case[0] + d.case[2] / 2;
  /** Mezza larghezza di un nome, per far partire le linee dal suo bordo. */
  const mezzo = (t: string) => larghezzaTesto(t, d.corpo, 'netto') / 2;

  const nome = (
    id: string,
    x: number,
    y: number,
    testo: string,
    evidente: boolean,
  ): Oggetto => ({
    id,
    tipo: 'testo',
    natura: 'dato',
    ruolo: 'dato',
    x,
    y,
    testo,
    corpo: d.corpo,
    ancora: 'middle',
    iniziale: evidente ? inRilievo : visibile,
  });

  const linee: Oggetto[] = COPPIE.map((c, i) => {
    const x = cs + mezzo(STUDENTI[i]) + 8;
    const y = d.yNomi[i] - 5;
    return {
      id: `coppia-${i}`,
      tipo: 'freccia',
      natura: 'dato',
      ruolo: 'inchiostro',
      x,
      y,
      dx: cc - mezzo(CASE[c]) - 8 - x,
      dy: d.yCase[c] - 5 - y,
      punte: 'nessuna',
      iniziale: i === 0 ? inRilievo : visibile,
    };
  });

  const [rx, ry, rl, ra] = d.rombo;
  const [gx, gy, gl] = d.graffa;

  return {
    id: 'occorrenze-appartiene',
    titolo: 'Le occorrenze dell’associazione appartiene',
    descrizione:
      'A sinistra l’insieme degli studenti: Harry Potter, Hermione Granger, ' +
      'Draco Malfoy, Padma Patil e Cedric Diggory. A destra l’insieme delle ' +
      'case: Grifondoro, Serpeverde, Corvonero e Tassofrasso. Una linea per ' +
      'ogni coppia studente-casa per cui vale il legame: Harry e Hermione con ' +
      'Grifondoro, Draco con Serpeverde, Padma con Corvonero, Cedric con ' +
      'Tassofrasso. Sopra le linee il rombo appartiene, con una graffa che le ' +
      'raccoglie tutte. In evidenza la coppia Harry Potter, Grifondoro.',
    larghezza: d.larghezza,
    altezza: d.altezza,
    oggetti: [
      insieme('studenti', d.studenti, 'studente'),
      insieme('case', d.case, 'casa'),
      {
        id: 'appartiene',
        tipo: 'rombo',
        natura: 'concetto',
        ruolo: 'inchiostro',
        x: rx,
        y: ry,
        l: rl,
        a: ra,
        nome: 'appartiene',
        iniziale: visibile,
      },
      {
        id: 'raccoglie',
        tipo: 'graffa',
        natura: 'concetto',
        ruolo: 'inchiostro',
        x: gx,
        y: gy,
        lunghezza: gl,
        verso: 'sopra',
        iniziale: visibile,
      },
      ...linee,
      ...STUDENTI.map((s, i) => nome(`s-${i}`, cs, d.yNomi[i], s, i === 0)),
      {
        id: 'occorrenza',
        tipo: 'testo',
        natura: 'dato',
        ruolo: 'dato',
        x: d.occorrenza[0],
        y: d.occorrenza[1],
        testo: 'un’occorrenza: (Harry Potter, Grifondoro)',
        corpo: d.corpo,
        ancora: 'middle',
        iniziale: inRilievo,
      },
      ...CASE.map((c, i) => nome(`c-${i}`, cc, d.yCase[i], c, i === 0)),
    ],
    passi: [
      {
        didascalia:
          'Ogni linea è un’occorrenza di appartiene, cioè una coppia studente-casa, come (Harry Potter, Grifondoro).',
        animazioni: [],
      },
    ],
  };
}

const figura: FiguraDef = { scena: crea(LARGA), stretta: crea(STRETTA) };
export default figura;
