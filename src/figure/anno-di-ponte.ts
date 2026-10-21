/**
 * Il dizionario `anno_di` fa da ponte fra punti.json e studenti.json, e il
 * nome dello studente è il gancio: figura statica, un passo solo. Sezione
 * «Una domanda che attraversa due file» di
 * volumes/archivista/dati-fuori-dal-programma.mdx.
 *
 * Le righe sono quelle vere dei due file; `anno_di` ne mostra tre voci. Le
 * righe di Neville sono `riga` sovrapposte alle tabelle, come in
 * `tabelle-collegate`: nella tabella sotto la riga resta vuota.
 *
 * `larga`: i due file a sinistra, uno sopra l'altro, `anno_di` a destra.
 * `stretta`: punti.json, `anno_di` e studenti.json in colonna, con le frecce
 * che girano ai lati.
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
  punti: Posto;
  annoDi: Posto;
  studenti: Posto;
  /** Frecce: partenza, arrivo e curva. */
  cerca: [number, number, number, number, number];
  costruisce: [number, number, number, number, number];
  /** Etichette delle frecce: punto e ancora. */
  etCerca: [number, number, 'start' | 'middle' | 'end'];
  etCostruisce: [number, number, 'start' | 'middle' | 'end'];
}

const INTESTAZIONE = 32;
const RIGA = 28;

const COL_PUNTI = [190, 60, 113];
const COL_STUDENTI = [190, 113, 60];
const COL_ANNO_DI = [190, 60];
const somma = (c: number[]) => c.reduce((s, v) => s + v, 0);

/** Metà altezza della riga i (da 0) di una tabella che parte da y. */
const mezzaRiga = (y: number, i: number) =>
  y + INTESTAZIONE + RIGA * i + RIGA / 2;

/** Riga di Neville in ciascuna tabella. */
const R_PUNTI = 2;
const R_STUDENTI = 1;
const R_ANNO_DI = 1;

const LARGA: Disposizione = (() => {
  const punti = { x: 0, y: 36 };
  const studenti = { x: 0, y: 232 };
  const annoDi = { x: 500, y: 134 };
  const xSx = somma(COL_PUNTI) + 4;
  const xDx = annoDi.x - 4;
  const yArrivo = mezzaRiga(annoDi.y, R_ANNO_DI);
  return {
    larghezza: 750,
    altezza: 352,
    punti,
    annoDi,
    studenti,
    cerca: [xSx, mezzaRiga(punti.y, R_PUNTI), xDx, yArrivo - 6, 0],
    costruisce: [
      somma(COL_STUDENTI) + 4,
      mezzaRiga(studenti.y, R_STUDENTI),
      xDx,
      yArrivo + 6,
      0,
    ],
    etCerca: [438, 134, 'middle'],
    etCostruisce: [438, 302, 'middle'],
  };
})();

const STRETTA: Disposizione = (() => {
  const punti = { x: 9, y: 36 };
  const annoDi = { x: 64, y: 236 };
  const studenti = { x: 9, y: 422 };
  const yArrivo = mezzaRiga(annoDi.y, R_ANNO_DI);
  return {
    larghezza: 380,
    altezza: 540,
    punti,
    annoDi,
    studenti,
    cerca: [5, mezzaRiga(punti.y, R_PUNTI), annoDi.x - 4, yArrivo, 30],
    costruisce: [
      studenti.x + somma(COL_STUDENTI) + 4,
      mezzaRiga(studenti.y, R_STUDENTI),
      annoDi.x + somma(COL_ANNO_DI) + 4,
      yArrivo,
      30,
    ],
    etCerca: [30, 192, 'start'],
    etCostruisce: [300, 392, 'end'],
  };
})();

/** Celle vuote: il posto della riga di Neville. */
const VUOTA = (n: number): string[] => Array<string>(n).fill('');

const visibile = { opacita: 1, progresso: 1 };
const inRilievo = { ...visibile, enfasi: 1 };

function crea(d: Disposizione): Scena {
  const nome = (id: string, p: Posto, testo: string): Oggetto => ({
    id,
    tipo: 'testo',
    natura: 'dato',
    ruolo: 'dato',
    x: p.x,
    y: p.y - 10,
    testo,
    famiglia: 'codice',
    corpo: 'normale',
    iniziale: visibile,
  });

  const tabella = (
    id: string,
    p: Posto,
    colonne: string[],
    larghezze: number[],
    righe: string[][],
    ruolo: 'dato' | 'programma' = 'dato',
  ): Oggetto => ({
    id,
    tipo: 'tabella',
    natura: 'dato',
    ruolo,
    x: p.x,
    y: p.y,
    colonne,
    larghezze,
    righe,
    iniziale: visibile,
  });

  /** La riga i (da 0) di una tabella, ridisegnata sopra per l'accento. */
  const neville = (
    id: string,
    p: Posto,
    i: number,
    larghezze: number[],
    celle: string[],
    ruolo: 'dato' | 'programma' = 'dato',
  ): Oggetto => ({
    id,
    tipo: 'riga',
    natura: 'dato',
    ruolo,
    x: p.x,
    y: p.y + INTESTAZIONE + RIGA * i,
    l: somma(larghezze),
    celle,
    larghezze,
    iniziale: inRilievo,
  });

  const freccia = (
    id: string,
    [x, y, x2, y2, curva]: [number, number, number, number, number],
  ): Oggetto => ({
    id,
    tipo: 'freccia',
    natura: 'concetto',
    ruolo: 'programma',
    x,
    y,
    dx: x2 - x,
    dy: y2 - y,
    curva,
    iniziale: visibile,
  });

  const etichetta = (
    id: string,
    [x, y, ancora]: [number, number, 'start' | 'middle' | 'end'],
    testo: string,
  ): Oggetto => ({
    id,
    tipo: 'testo',
    natura: 'concetto',
    ruolo: 'programma',
    x,
    y,
    testo,
    ancora,
    corpo: 'piccolo',
    iniziale: visibile,
  });

  return {
    id: 'anno-di-ponte',
    titolo: 'Il nome fa da ponte fra due file',
    descrizione:
      'Una riga di punti.json (Neville Longbottom, -50, McGonagall), la riga di ' +
      'Neville Longbottom in studenti.json (Grifondoro, anno 1) e il dizionario ' +
      'anno_di, costruito da studenti.json. Il nome dello studente porta ' +
      "dall'assegnazione alla voce di anno_di, che dà l'anno: 1.",
    larghezza: d.larghezza,
    altezza: d.altezza,
    oggetti: [
      nome('nome-punti', d.punti, 'punti.json'),
      tabella(
        'punti',
        d.punti,
        ['studente', 'punti', 'professore'],
        COL_PUNTI,
        [
          ['Harry Potter', '-50', 'McGonagall'],
          ['Hermione Granger', '-50', 'McGonagall'],
          VUOTA(3),
        ],
      ),
      nome('nome-studenti', d.studenti, 'studenti.json'),
      tabella('studenti', d.studenti, ['nome', 'casa', 'anno'], COL_STUDENTI, [
        ['Ron Weasley', 'Grifondoro', '1'],
        VUOTA(3),
        ['Draco Malfoy', 'Serpeverde', '1'],
      ]),
      {
        ...nome('nome-anno-di', d.annoDi, 'anno_di'),
        ruolo: 'programma',
      },
      tabella(
        'anno-di',
        d.annoDi,
        ['chiave', 'valore'],
        COL_ANNO_DI,
        [['Ron Weasley', '1'], VUOTA(2), ['Draco Malfoy', '1']],
        'programma',
      ),
      neville('p-neville', d.punti, R_PUNTI, COL_PUNTI, [
        'Neville Longbottom',
        '-50',
        'McGonagall',
      ]),
      neville('s-neville', d.studenti, R_STUDENTI, COL_STUDENTI, [
        'Neville Longbottom',
        'Grifondoro',
        '1',
      ]),
      neville(
        'a-neville',
        d.annoDi,
        R_ANNO_DI,
        COL_ANNO_DI,
        ['Neville Longbottom', '1'],
        'programma',
      ),
      freccia('cerca', d.cerca),
      freccia('costruisce', d.costruisce),
      etichetta('et-cerca', d.etCerca, 'cerca il nome'),
      etichetta('et-costruisce', d.etCostruisce, 'nome → anno'),
    ],
    passi: [
      {
        didascalia:
          "anno_di, costruito da studenti.json, porta dal nome al suo anno: il nome aggancia la riga di punti.json all'anno.",
        animazioni: [],
      },
    ],
  };
}

const figura: FiguraDef = { scena: crea(LARGA), stretta: crea(STRETTA) };
export default figura;
