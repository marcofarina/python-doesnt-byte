/**
 * Le cardinalità di `appartiene` contate sulle coppie: figura animata, 4 passi.
 * Sezione «Quante case per uno studente» di volumes/archivista/le-cardinalita.mdx,
 * dopo il paragrafo sulla notazione `(min,max)`.
 *
 * Stessa forma di `occorrenze-appartiene` (la figura della lezione prima): gli
 * insiemi degli studenti e delle case, una linea per coppia. Qui gli studenti
 * sono i nove del registro (static/archivio/hogwarts/studenti.json). Si conta
 * prima da uno studente, poi da una casa; all'ultimo passo Padma esce e
 * Corvonero resta con zero linee, come dopo la cancellazione della lezione
 * «Entità e attributi». Il nome di Padma resta, barrato: se sparisse, il posto
 * vuoto non si vedrebbe, e il lettore freddo l'ha letta ancora nell'insieme,
 * senza casa.
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
  /** Linea di base del primo studente e passo fra uno e l'altro. */
  yNome: number;
  passoNomi: number;
  /** Linee di base delle case. */
  yCase: number[];
  corpo: 15 | 17;
}

const STUDENTI = [
  'Harry Potter',
  'Hermione Granger',
  'Ron Weasley',
  'Neville Longbottom',
  'Fred Weasley',
  'George Weasley',
  'Draco Malfoy',
  'Padma Patil',
  'Cedric Diggory',
];
const CASE = ['Grifondoro', 'Serpeverde', 'Corvonero', 'Tassofrasso'];
/** Casa di ogni studente, come indice in CASE. */
const COPPIE = [0, 0, 0, 0, 0, 0, 1, 2, 3];
const PADMA = 7;
const CORVONERO = 2;

const LARGA: Disposizione = {
  larghezza: 700,
  altezza: 420,
  studenti: [10, 50, 290, 350],
  case: [420, 110, 260, 250],
  yNome: 107,
  passoNomi: 31,
  yCase: [172, 222, 272, 322],
  corpo: 17,
};

const STRETTA: Disposizione = {
  larghezza: 380,
  altezza: 390,
  studenti: [0, 50, 186, 330],
  case: [214, 100, 154, 250],
  yNome: 102,
  passoNomi: 29,
  yCase: [166, 210, 254, 298],
  corpo: 15,
};

const visibile = { opacita: 1, progresso: 1 };

function crea(d: Disposizione): Scena {
  const cs = d.studenti[0] + d.studenti[2] / 2;
  const cc = d.case[0] + d.case[2] / 2;
  const mezzo = (t: string, corpo: number = d.corpo) =>
    larghezzaTesto(t, corpo, 'netto') / 2;
  const yNome = (i: number) => d.yNome + d.passoNomi * i;

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

  const nome = (id: string, x: number, y: number, testo: string): Oggetto => ({
    id,
    tipo: 'testo',
    natura: 'dato',
    ruolo: 'dato',
    x,
    y,
    testo,
    corpo: d.corpo,
    ancora: 'middle',
    iniziale: visibile,
  });

  /** Cardinalità accanto al nome dell'insieme, che sta 16 sopra il bordo. */
  const card = (
    id: string,
    [x, y, l]: [number, number, number, number],
    etichetta: string,
    testo: string,
  ): Oggetto => ({
    id,
    tipo: 'testo',
    natura: 'concetto',
    ruolo: 'inchiostro',
    x: x + l / 2 + larghezzaTesto(etichetta, 17, 'mano') / 2 + 10,
    y: y - 16,
    testo,
    corpo: 'normale',
  });

  const linee: Oggetto[] = COPPIE.map((c, i) => {
    const x = cs + mezzo(STUDENTI[i]) + 8;
    const y = yNome(i) - 5;
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
    };
  });

  /** Quante linee arrivano a ogni casa, a destra del nome. */
  const conti: Oggetto[] = CASE.map((c, i) => ({
    id: `conta-${i}`,
    tipo: 'contatore',
    natura: 'dato',
    ruolo: 'inchiostro',
    x: cc + mezzo(c) + 14,
    y: d.yCase[i],
    unita: '',
    corpo: d.corpo,
    iniziale: { valore: COPPIE.filter((k) => k === i).length },
  }));

  return {
    id: 'cardinalita-coppie',
    titolo: 'Le cardinalità di appartiene, contate sulle coppie',
    descrizione:
      'Gli insiemi dei nove studenti del registro e delle quattro case, con ' +
      'una linea per ogni coppia di appartiene. Ogni studente ha una linea ' +
      'sola, e accanto a studente si legge (1,1). Grifondoro ha sei linee, ' +
      'Serpeverde, Corvonero e Tassofrasso una ciascuna. Padma Patil è ' +
      'barrata, e senza di lei Corvonero resta con zero linee, e accanto a casa si legge (0,N).',
    larghezza: d.larghezza,
    altezza: d.altezza,
    oggetti: [
      insieme('studenti', d.studenti, 'studente'),
      insieme('case', d.case, 'casa'),
      ...linee,
      ...STUDENTI.map((s, i) => nome(`s-${i}`, cs, yNome(i), s)),
      ...CASE.map((c, i) => nome(`c-${i}`, cc, d.yCase[i], c)),
      ...conti,
      {
        id: 'barra-padma',
        tipo: 'freccia',
        natura: 'dato',
        ruolo: 'errore',
        x: cs - mezzo(STUDENTI[PADMA]) - 6,
        y: yNome(PADMA) - 5,
        dx: 2 * mezzo(STUDENTI[PADMA]) + 12,
        dy: 0,
        punte: 'nessuna',
      },
      card('card-studente', d.studenti, 'studente', '(1,1)'),
      card('card-casa', d.case, 'casa', '(0,N)'),
    ],
    passi: [
      {
        didascalia:
          'I nove studenti del registro, ognuno con la linea verso la sua casa.',
        animazioni: linee.map((l, i) => ({
          fai: 'Create' as const,
          id: l.id,
          ritardo: 120 * i,
        })),
      },
      {
        didascalia:
          'Contando da uno studente, ognuno ha una linea sola: accanto a studente va (1,1).',
        animazioni: [
          ...linee.map((l) => ({ fai: 'Indicate' as const, id: l.id })),
          { fai: 'Write', id: 'card-studente', ritardo: 280 },
        ],
      },
      {
        didascalia:
          'Contando da una casa, Grifondoro ha sei linee e le altre case una ciascuna.',
        animazioni: conti.flatMap((c, i) => [
          { fai: 'FadeIn' as const, id: c.id, ritardo: 200 * i },
          { fai: 'Indicate' as const, id: c.id, ritardo: 200 * i },
        ]),
      },
      {
        didascalia:
          'Senza Padma, Corvonero resta con zero linee: accanto a casa va (0,N).',
        animazioni: [
          { fai: 'Create', id: 'barra-padma' },
          { fai: 'FadeOut', id: `coppia-${PADMA}`, ritardo: 420 },
          { fai: 'Count', id: `conta-${CORVONERO}`, a: 0, ritardo: 560 },
          { fai: 'Indicate', id: `conta-${CORVONERO}`, ritardo: 560 },
          { fai: 'Write', id: 'card-casa', ritardo: 840 },
        ],
      },
    ],
  };
}

const figura: FiguraDef = { scena: crea(LARGA), stretta: crea(STRETTA) };
export default figura;
