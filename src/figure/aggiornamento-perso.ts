/**
 * L'aggiornamento perso: McGonagall e Piton salvano due copie dello stesso
 * file. Sezione «Due professori nello stesso momento» di
 * volumes/archivista/che-cosa-fa-un-dbms.mdx. Nata come prototipo in G0.
 *
 * Due disposizioni con gli stessi oggetti e gli stessi passi: `larga`, tre
 * colonne affiancate, e `stretta`, le due memorie sopra e il disco sotto, per
 * gli schermi dove la larga scenderebbe sotto il corpo minimo.
 */
import type {
  FiguraDef,
  Oggetto,
  Scena,
} from '@site/src/components/Figura/tipi';

interface Colonna {
  x: number;
  y: number;
}

interface Disposizione {
  larghezza: number;
  altezza: number;
  colL: number;
  colA: number;
  mcg: Colonna;
  disco: Colonna;
  piton: Colonna;
  /** Frecce di salvataggio: partenza e arrivo. */
  salvaMcg: [number, number, number, number];
  salvaPiton: [number, number, number, number];
  esito: [number, number];
}

const LARGA: Disposizione = {
  larghezza: 680,
  altezza: 382,
  colL: 190,
  colA: 225,
  mcg: { x: 0, y: 100 },
  disco: { x: 245, y: 100 },
  piton: { x: 490, y: 100 },
  salvaMcg: [194, 272, 241, 272],
  salvaPiton: [486, 272, 439, 272],
  esito: [340, 365],
};

const STRETTA: Disposizione = {
  larghezza: 370,
  altezza: 690,
  colL: 175,
  colA: 225,
  mcg: { x: 0, y: 100 },
  piton: { x: 195, y: 100 },
  disco: { x: 97, y: 405 },
  salvaMcg: [70, 330, 118, 400],
  salvaPiton: [300, 330, 252, 400],
  esito: [185, 672],
};

function crea(d: Disposizione): Scena {
  const fileX = 10;
  const fileL = d.colL - 20;
  const fileA = 172;
  const rigaX = fileX + 9;
  const rigaL = fileL - 18;

  /** Un file con contatore e ultima riga vecchia, dentro una colonna. */
  const file = (
    pre: string,
    c: Colonna,
    nome: string,
    iniziale?: Oggetto['iniziale'],
  ): Oggetto[] => [
    {
      id: `${pre}-file`,
      tipo: 'file',
      natura: 'concetto',
      ruolo: 'dato',
      x: c.x + fileX,
      y: c.y + 40,
      l: fileL,
      a: fileA,
      nome,
      iniziale,
    },
    {
      id: `${pre}-conta`,
      tipo: 'contatore',
      natura: 'dato',
      ruolo: 'dato',
      x: c.x + d.colL / 2,
      y: c.y + 102,
      unita: 'assegnazioni',
      corpo: 17,
      iniziale: { ...iniziale, valore: 18 },
    },
    {
      id: `${pre}-neville`,
      tipo: 'riga',
      natura: 'dato',
      ruolo: 'tenue',
      x: c.x + rigaX,
      y: c.y + 122,
      l: rigaL,
      testo: 'Neville  +10',
      iniziale,
    },
  ];

  const riga = (id: string, c: Colonna, testo: string): Oggetto => ({
    id,
    tipo: 'riga',
    natura: 'dato',
    ruolo: 'dato',
    x: c.x + rigaX,
    y: c.y + 158,
    l: rigaL,
    testo,
  });

  const colonna = (
    id: string,
    c: Colonna,
    etichetta: string,
    ruolo: 'tenue' | 'persona',
  ): Oggetto => ({
    id,
    tipo: 'riquadro',
    natura: 'concetto',
    ruolo,
    x: c.x,
    y: c.y,
    l: d.colL,
    a: d.colA,
    etichetta,
  });

  // Le copie partono dal disco: lì nascono, poi scivolano in memoria.
  const daDisco = (c: Colonna) => ({
    dx: d.disco.x - c.x,
    dy: d.disco.y - c.y,
  });

  const freccia = (
    id: string,
    [x, y, x2, y2]: [number, number, number, number],
  ): Oggetto => ({
    id,
    tipo: 'freccia',
    natura: 'concetto',
    ruolo: 'persona',
    x,
    y,
    x2,
    y2,
    etichetta: 'salva',
  });

  return {
    id: 'aggiornamento-perso',
    titolo: "L'aggiornamento perso",
    descrizione:
      'McGonagall e Piton leggono lo stesso file punti.json, aggiungono ognuno ' +
      "un'assegnazione alla propria copia e salvano uno dopo l'altro: il secondo " +
      'salvataggio cancella il primo, e il file conta 19 assegnazioni invece di 20.',
    larghezza: d.larghezza,
    altezza: d.altezza,
    oggetti: [
      colonna('disco', d.disco, 'disco', 'tenue'),
      ...file('d', d.disco, 'punti.json'),
      riga('d-ron', d.disco, 'Ron      −5'),
      riga('d-draco', d.disco, 'Draco    +5'),

      {
        id: 'mcg',
        tipo: 'persona',
        natura: 'concetto',
        ruolo: 'persona',
        x: d.mcg.x + 30,
        y: d.mcg.y - 38,
        nome: 'McGonagall',
      },
      colonna('mcg-mem', d.mcg, 'memoria', 'persona'),
      ...file('m', d.mcg, 'registro', daDisco(d.mcg)),
      riga('m-ron', d.mcg, 'Ron      −5'),

      {
        id: 'piton',
        tipo: 'persona',
        natura: 'concetto',
        ruolo: 'persona',
        x: d.piton.x + 30,
        y: d.piton.y - 38,
        nome: 'Piton',
      },
      colonna('piton-mem', d.piton, 'memoria', 'persona'),
      ...file('p', d.piton, 'registro', daDisco(d.piton)),
      riga('p-draco', d.piton, 'Draco    +5'),

      freccia('salva-mcg', d.salvaMcg),
      freccia('salva-piton', d.salvaPiton),

      {
        id: 'esito',
        tipo: 'testo',
        natura: 'concetto',
        ruolo: 'errore',
        x: d.esito[0],
        y: d.esito[1],
        testo: 'attese 20, nel file 19',
        ancora: 'middle',
        corpo: 19,
      },
    ],
    passi: [
      {
        didascalia: 'Sul disco, punti.json contiene 18 assegnazioni.',
        animazioni: [
          { fai: 'Create', id: 'disco' },
          { fai: 'Create', id: 'd-file', ritardo: 280 },
          { fai: 'FadeIn', id: 'd-conta', ritardo: 700 },
          { fai: 'FadeIn', id: 'd-neville', ritardo: 840 },
        ],
      },
      {
        didascalia:
          'McGonagall e Piton leggono il file: ognuno ha in memoria la propria copia.',
        animazioni: [
          { fai: 'Create', id: 'mcg' },
          { fai: 'Create', id: 'piton' },
          { fai: 'Create', id: 'mcg-mem', ritardo: 280 },
          { fai: 'Create', id: 'piton-mem', ritardo: 280 },
          ...['m', 'p'].flatMap((pre) =>
            [`${pre}-file`, `${pre}-conta`, `${pre}-neville`].flatMap((id) => [
              { fai: 'FadeIn' as const, id, ritardo: 840 },
              { fai: 'MoveTo' as const, id, dx: 0, dy: 0, ritardo: 840 },
            ]),
          ),
        ],
      },
      {
        didascalia:
          'Ognuno aggiunge la propria assegnazione alla propria copia: Ron −5, Draco +5.',
        animazioni: [
          { fai: 'Create', id: 'm-ron' },
          { fai: 'Indicate', id: 'm-ron' },
          { fai: 'Count', id: 'm-conta', a: 19 },
          { fai: 'Create', id: 'p-draco', ritardo: 280 },
          { fai: 'Indicate', id: 'p-draco', ritardo: 280 },
          { fai: 'Count', id: 'p-conta', a: 19, ritardo: 280 },
        ],
      },
      {
        didascalia:
          'McGonagall salva la sua copia: il file ha 19 assegnazioni.',
        animazioni: [
          { fai: 'Create', id: 'salva-mcg' },
          { fai: 'Create', id: 'd-ron', ritardo: 560 },
          { fai: 'Indicate', id: 'd-ron', ritardo: 560 },
          { fai: 'Count', id: 'd-conta', a: 19, ritardo: 560 },
        ],
      },
      {
        didascalia:
          "Piton salva la sua copia sopra il file: l'assegnazione di Ron sparisce.",
        rivela: true,
        animazioni: [
          { fai: 'Create', id: 'salva-piton' },
          { fai: 'Strike', id: 'd-ron', ritardo: 560 },
          { fai: 'FadeOut', id: 'd-ron', ritardo: 1260 },
          { fai: 'Create', id: 'd-draco', ritardo: 1400 },
          { fai: 'Indicate', id: 'd-draco', ritardo: 1400 },
        ],
      },
      {
        didascalia:
          "Nel file restano 19 assegnazioni, non 20: l'aggiornamento di McGonagall è perso.",
        animazioni: [
          { fai: 'Indicate', id: 'm-ron' },
          { fai: 'Write', id: 'esito', ritardo: 280 },
        ],
      },
    ],
  };
}

const figura: FiguraDef = { scena: crea(LARGA), stretta: crea(STRETTA) };
export default figura;
