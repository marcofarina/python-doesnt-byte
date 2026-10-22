/**
 * Due INSERT coordinati dal DBMS: McGonagall e Piton mandano ognuno la propria
 * riga, e nessuna si perde. Sezione «Due professori nello stesso momento» di
 * volumes/archivista/che-cosa-fa-un-dbms.mdx, subito dopo la figura
 * `aggiornamento-perso`, di cui riprende la disposizione: professori ai lati,
 * al centro il DBMS al posto del disco.
 *
 * Due disposizioni con gli stessi oggetti e gli stessi passi, come in
 * `aggiornamento-perso`: `larga` a tre colonne, `stretta` con le due memorie
 * sopra e il DBMS sotto.
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
  /** Altezza delle memorie, che contengono una riga sola. */
  memA: number;
  /** Altezza della colonna del DBMS. */
  dbmsA: number;
  mcg: Colonna;
  dbms: Colonna;
  piton: Colonna;
  /** Frecce degli INSERT: partenza, arrivo e curva. */
  inviaMcg: [number, number, number, number, number];
  inviaPiton: [number, number, number, number, number];
  /**
   * Etichette «INSERT», fuori dalle frecce: quella della freccia starebbe sul
   * bordo del DBMS (larga) o toccherebbe l'altra (stretta).
   */
  etMcg: [number, number];
  etPiton: [number, number];
  esito: [number, number];
}

const LARGA: Disposizione = {
  larghezza: 680,
  altezza: 396,
  colL: 190,
  memA: 90,
  dbmsA: 252,
  mcg: { x: 0, y: 100 },
  dbms: { x: 245, y: 100 },
  piton: { x: 490, y: 100 },
  inviaMcg: [150, 194, 241, 272, 30],
  inviaPiton: [530, 194, 439, 306, -30],
  etMcg: [200, 282],
  etPiton: [480, 306],
  esito: [340, 382],
};

const STRETTA: Disposizione = {
  larghezza: 370,
  altezza: 556,
  colL: 175,
  memA: 90,
  dbmsA: 252,
  mcg: { x: 0, y: 100 },
  piton: { x: 195, y: 100 },
  dbms: { x: 97, y: 262 },
  inviaMcg: [88, 194, 150, 258, 0],
  inviaPiton: [282, 194, 220, 258, 0],
  etMcg: [100, 236],
  etPiton: [270, 236],
  esito: [185, 542],
};

function crea(d: Disposizione): Scena {
  const rigaL = d.colL - 38;
  const { dbms } = d;

  const riga = (
    id: string,
    c: Colonna,
    dy: number,
    testo: string,
    ruolo: 'dato' | 'tenue' = 'dato',
    iniziale?: Oggetto['iniziale'],
  ): Oggetto => ({
    id,
    tipo: 'riga',
    natura: 'dato',
    ruolo,
    x: c.x + 19,
    y: c.y + dy,
    l: rigaL,
    testo,
    iniziale,
  });

  const memoria = (pre: string, c: Colonna, nome: string): Oggetto[] => [
    {
      id: pre,
      tipo: 'persona',
      natura: 'concetto',
      ruolo: 'persona',
      x: c.x + 30,
      y: c.y - 38,
      nome,
    },
    {
      id: `${pre}-mem`,
      tipo: 'riquadro',
      natura: 'concetto',
      ruolo: 'persona',
      x: c.x,
      y: c.y,
      l: d.colL,
      a: d.memA,
      etichetta: 'memoria',
    },
  ];

  const freccia = (
    id: string,
    [x, y, x2, y2, curva]: [number, number, number, number, number],
  ): Oggetto => ({
    id,
    tipo: 'freccia',
    natura: 'concetto',
    ruolo: 'persona',
    x,
    y,
    dx: x2 - x,
    dy: y2 - y,
    curva,
  });

  const etichetta = (
    id: string,
    [x, y]: [number, number],
    ancora: 'start' | 'end',
  ): Oggetto => ({
    id,
    tipo: 'testo',
    natura: 'concetto',
    ruolo: 'persona',
    x,
    y,
    testo: 'INSERT',
    corpo: 'piccolo',
    ancora,
  });

  return {
    id: 'insert-coordinati',
    titolo: 'Due INSERT coordinati dal DBMS',
    descrizione:
      'McGonagall e Piton non hanno in memoria il registro, solo la propria ' +
      'assegnazione. Ognuno la manda al DBMS con un INSERT, il DBMS aggiunge le ' +
      'due righe una dopo l’altra alla tabella assegnazione, e le righe passano ' +
      'da 18 a 20: nessuna assegnazione è persa.',
    larghezza: d.larghezza,
    altezza: d.altezza,
    oggetti: [
      {
        id: 'dbms',
        tipo: 'riquadro',
        natura: 'concetto',
        ruolo: 'tenue',
        x: dbms.x,
        y: dbms.y,
        l: d.colL,
        a: d.dbmsA,
        etichetta: 'DBMS',
      },
      {
        id: 'tabella',
        tipo: 'riquadro',
        natura: 'concetto',
        ruolo: 'dato',
        x: dbms.x + 10,
        y: dbms.y + 40,
        l: d.colL - 20,
        a: 196,
        etichetta: 'assegnazione',
      },
      {
        id: 'conta',
        tipo: 'contatore',
        natura: 'dato',
        ruolo: 'dato',
        x: dbms.x + d.colL / 2,
        y: dbms.y + 102,
        unita: 'righe',
        corpo: 17,
        iniziale: { valore: 18 },
      },
      riga('neville', dbms, 122, 'Neville  +10', 'tenue'),
      riga('ron', dbms, 158, 'Ron      −5'),
      riga('draco', dbms, 192, 'Draco    +5'),

      ...memoria('mcg', d.mcg, 'McGonagall'),
      riga('m-ron', d.mcg, 46, 'Ron      −5'),
      ...memoria('piton', d.piton, 'Piton'),
      riga('p-draco', d.piton, 46, 'Draco    +5'),

      freccia('invia-mcg', d.inviaMcg),
      freccia('invia-piton', d.inviaPiton),
      etichetta('et-mcg', d.etMcg, 'end'),
      etichetta('et-piton', d.etPiton, 'start'),

      {
        id: 'esito',
        tipo: 'testo',
        natura: 'concetto',
        ruolo: 'ok',
        x: d.esito[0],
        y: d.esito[1],
        testo: 'attese 20, nella tabella 20',
        ancora: 'middle',
        corpo: 19,
      },
    ],
    passi: [
      {
        didascalia: 'Nel database, la tabella assegnazione contiene 18 righe.',
        animazioni: [
          { fai: 'Create', id: 'dbms' },
          { fai: 'Create', id: 'tabella', ritardo: 280 },
          { fai: 'FadeIn', id: 'conta', ritardo: 700 },
          { fai: 'FadeIn', id: 'neville', ritardo: 840 },
        ],
      },
      {
        didascalia:
          'McGonagall e Piton hanno in memoria solo la propria assegnazione: Ron −5, Draco +5.',
        animazioni: [
          { fai: 'Create', id: 'mcg' },
          { fai: 'Create', id: 'piton' },
          { fai: 'Create', id: 'mcg-mem', ritardo: 280 },
          { fai: 'Create', id: 'piton-mem', ritardo: 280 },
          { fai: 'Create', id: 'm-ron', ritardo: 840 },
          { fai: 'Create', id: 'p-draco', ritardo: 840 },
        ],
      },
      {
        didascalia:
          'McGonagall manda un INSERT: il DBMS aggiunge la riga di Ron, e le righe diventano 19.',
        animazioni: [
          { fai: 'Create', id: 'invia-mcg' },
          { fai: 'Write', id: 'et-mcg', ritardo: 280 },
          { fai: 'Create', id: 'ron', ritardo: 560 },
          { fai: 'Indicate', id: 'ron', ritardo: 560 },
          { fai: 'Count', id: 'conta', a: 19, ritardo: 560 },
        ],
      },
      {
        didascalia:
          'Piton manda un INSERT: il DBMS aggiunge la riga di Draco, e le righe diventano 20.',
        animazioni: [
          { fai: 'Create', id: 'invia-piton' },
          { fai: 'Write', id: 'et-piton', ritardo: 280 },
          { fai: 'Create', id: 'draco', ritardo: 560 },
          { fai: 'Indicate', id: 'draco', ritardo: 560 },
          { fai: 'Count', id: 'conta', a: 20, ritardo: 560 },
        ],
      },
      {
        didascalia:
          'La riga di Ron è ancora nella tabella: 20 righe, nessuna assegnazione persa.',
        animazioni: [
          { fai: 'Indicate', id: 'ron' },
          { fai: 'Write', id: 'esito', ritardo: 280 },
        ],
      },
    ],
  };
}

const figura: FiguraDef = { scena: crea(LARGA), stretta: crea(STRETTA) };
export default figura;
