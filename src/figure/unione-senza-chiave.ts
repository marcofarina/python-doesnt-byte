/**
 * Senza chiave, un'assegnazione si unisce a due studenti: figura animata,
 * 3 passi. Sezione «Senza chiave» di volumes/archivista/le-chiavi.mdx, dopo
 * lo spoiler dei 23 punti.
 *
 * I dati sono quelli del dataset `archivista/omonimi`: l'assegnazione 19,
 * dieci punti di McGonagall a «James Potter», e le due righe di James Potter
 * nella tabella `studente`, uguali. La somma di Grifondoro senza
 * l'assegnazione è 3 (la query della lezione sul DBMS).
 *
 * Le frecce partono dalla cella del nome, la colonna su cui si unisce.
 * `larga`: le due tabelle affiancate, l'unione e la somma sotto; le frecce
 * escono da sotto la cella. `stretta`: tutto in colonna, con le frecce che
 * scendono a sinistra, accanto alla colonna dei nomi.
 */
import type {
  FiguraDef,
  Oggetto,
  Scena,
} from '@site/src/components/Figura/tipi';

interface Posto {
  x: number;
  y: number;
}

interface Disposizione {
  larghezza: number;
  altezza: number;
  assegnazione: Posto;
  studente: Posto;
  unione: Posto;
  colAssegnazione: number[];
  colStudente: number[];
  colUnione: number[];
  /** Frecce verso le due righe: partenza, arrivo e curva. */
  frecce: [number, number, number, number, number][];
  somma: Posto;
}

const INTESTAZIONE = 32;
const RIGA = 28;

const mezzaRiga = (p: Posto, i: number) =>
  p.y + INTESTAZIONE + RIGA * i + RIGA / 2;

const LARGA: Disposizione = (() => {
  const assegnazione = { x: 0, y: 36 };
  const studente = { x: 420, y: 36 };
  const unione = { x: 190, y: 196 };
  /** Sotto la cella «James Potter» dell'assegnazione. */
  const yCella = assegnazione.y + INTESTAZIONE + RIGA + 4;
  return {
    larghezza: 730,
    altezza: 404,
    assegnazione,
    studente,
    unione,
    colAssegnazione: [150, 70, 120],
    colStudente: [150, 110, 50],
    colUnione: [150, 70, 120],
    frecce: [
      [75, yCella, studente.x - 6, mezzaRiga(studente, 0), 60],
      [75, yCella, studente.x - 6, mezzaRiga(studente, 1), 80],
    ],
    somma: { x: 365, y: 330 },
  };
})();

const STRETTA: Disposizione = (() => {
  const assegnazione = { x: 30, y: 36 };
  const studente = { x: 30, y: 160 };
  const unione = { x: 30, y: 312 };
  const y0 = mezzaRiga(assegnazione, 0);
  return {
    larghezza: 380,
    altezza: 512,
    assegnazione,
    studente,
    unione,
    colAssegnazione: [140, 50, 110],
    colStudente: [140, 110, 50],
    colUnione: [140, 50, 110],
    frecce: [
      [26, y0, 26, mezzaRiga(studente, 0), 18],
      [26, y0, 26, mezzaRiga(studente, 1), 30],
    ],
    somma: { x: 190, y: 448 },
  };
})();

const VUOTA = (n: number): string[] => Array<string>(n).fill('');
const visibile = { opacita: 1, progresso: 1 };
const somma = (c: number[]) => c.reduce((s, x) => s + x, 0);

function crea(d: Disposizione): Scena {
  const nome = (
    id: string,
    p: Posto,
    testo: string,
    iniziale?: Oggetto['iniziale'],
  ): Oggetto => ({
    id,
    tipo: 'testo',
    natura: 'dato',
    ruolo: 'dato',
    x: p.x,
    y: p.y - 10,
    testo,
    famiglia: 'codice',
    corpo: 'normale',
    iniziale,
  });

  const tabella = (
    id: string,
    p: Posto,
    colonne: string[],
    larghezze: number[],
    righe: string[][],
    iniziale?: Oggetto['iniziale'],
  ): Oggetto => ({
    id,
    tipo: 'tabella',
    natura: 'dato',
    ruolo: 'dato',
    x: p.x,
    y: p.y,
    colonne,
    larghezze,
    righe,
    iniziale,
  });

  /** Riga i (da 0) dell'unione, sopra le celle vuote della tabella. */
  const unita = (i: number): Oggetto => ({
    id: `unita-${i}`,
    tipo: 'riga',
    natura: 'dato',
    ruolo: 'dato',
    x: d.unione.x,
    y: d.unione.y + INTESTAZIONE + RIGA * i,
    l: somma(d.colUnione),
    celle: ['James Potter', '10', 'Grifondoro'],
    larghezze: d.colUnione,
  });

  const frecce: Oggetto[] = d.frecce.map(([x, y, x2, y2, curva], i) => ({
    id: `unisce-${i}`,
    tipo: 'freccia',
    natura: 'concetto',
    ruolo: 'inchiostro',
    x,
    y,
    dx: x2 - x,
    dy: y2 - y,
    curva,
  }));

  return {
    id: 'unione-senza-chiave',
    titolo: 'Un’assegnazione unita a due studenti con lo stesso nome',
    descrizione:
      'L’assegnazione James Potter, 10, McGonagall e la tabella studente ' +
      'senza chiave, con due righe uguali: James Potter, Grifondoro, 1. ' +
      'Unendo le assegnazioni agli studenti con lo stesso nome, ' +
      'l’assegnazione si aggancia a tutte e due le righe e l’unione ne ha ' +
      'due. Nella somma di Grifondoro i dieci punti entrano due volte: ' +
      '3 + 10 + 10 = 23, invece di 13.',
    larghezza: d.larghezza,
    altezza: d.altezza,
    oggetti: [
      nome('nome-assegnazione', d.assegnazione, 'assegnazione', visibile),
      tabella(
        'assegnazione',
        d.assegnazione,
        ['studente', 'punti', 'professore'],
        d.colAssegnazione,
        [['James Potter', '10', 'McGonagall']],
        visibile,
      ),
      nome('nome-studente', d.studente, 'studente', visibile),
      tabella(
        'studente',
        d.studente,
        ['nome', 'casa', 'anno'],
        d.colStudente,
        [
          ['James Potter', 'Grifondoro', '1'],
          ['James Potter', 'Grifondoro', '1'],
        ],
        visibile,
      ),
      ...frecce,
      nome('nome-unione', d.unione, 'assegnazione JOIN studente'),
      tabella('unione', d.unione, ['studente', 'punti', 'casa'], d.colUnione, [
        VUOTA(3),
        VUOTA(3),
      ]),
      unita(0),
      unita(1),
      {
        id: 'somma',
        tipo: 'testo',
        natura: 'dato',
        ruolo: 'errore',
        x: d.somma.x,
        y: d.somma.y,
        testo: 'Grifondoro: 3 + 10 + 10 = 23',
        famiglia: 'codice',
        corpo: 'grande',
        ancora: 'middle',
      },
      {
        id: 'attesi',
        tipo: 'testo',
        natura: 'concetto',
        ruolo: 'tenue',
        x: d.somma.x,
        y: d.somma.y + 28,
        testo: '3 sono i punti degli altri studenti: con un James solo, 13',
        larghezzaMax: 340,
        corpo: 'normale',
        ancora: 'middle',
      },
    ],
    passi: [
      {
        didascalia:
          'Un’assegnazione a James Potter, e nella tabella studente, senza chiave, due righe con quel nome.',
        animazioni: [],
      },
      {
        didascalia:
          'Unendo per nome, l’assegnazione si aggancia a tutte e due le righe: l’unione ne ha due.',
        animazioni: [
          { fai: 'Create', id: 'unisce-0' },
          { fai: 'Create', id: 'unisce-1', ritardo: 140 },
          { fai: 'FadeIn', id: 'nome-unione', ritardo: 560 },
          { fai: 'Create', id: 'unione', ritardo: 560 },
          { fai: 'Create', id: 'unita-0', ritardo: 840 },
          { fai: 'Create', id: 'unita-1', ritardo: 840 },
          { fai: 'Indicate', id: 'unita-0', ritardo: 840 },
          { fai: 'Indicate', id: 'unita-1', ritardo: 840 },
        ],
      },
      {
        didascalia:
          'Nella somma di Grifondoro i dieci punti entrano due volte: 23 invece di 13.',
        animazioni: [
          { fai: 'Write', id: 'somma' },
          { fai: 'FadeIn', id: 'attesi', ritardo: 700 },
        ],
      },
    ],
  };
}

const figura: FiguraDef = { scena: crea(LARGA), stretta: crea(STRETTA) };
export default figura;
