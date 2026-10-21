/**
 * Le tre tabelle del registro collegate dai nomi: figura statica, un passo
 * solo. Sezione «Il registro in un database» di
 * volumes/archivista/che-cosa-fa-un-dbms.mdx.
 *
 * Le righe sono quelle vere del dataset `archivista/registro-punti`: le prime
 * tre di ogni tabella. Le tre righe collegate (Ron Weasley e McGonagall) sono
 * `riga` sovrapposte alle righe delle tabelle, con le stesse larghezze di
 * colonna, così l'accento cade sulla riga intera; nella tabella sotto la riga
 * resta vuota, perché due testi uguali uno sull'altro il banco li segnala.
 *
 * `larga`: studente e assegnazione affiancate, professore sotto. `stretta`: le
 * tre tabelle in colonna, con le frecce che girano ai lati.
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
  studente: Posto;
  assegnazione: Posto;
  professore: Posto;
  /** Frecce: partenza, arrivo e curva. */
  versoStudente: [number, number, number, number, number];
  versoProfessore: [number, number, number, number, number];
}

const INTESTAZIONE = 32;
const RIGA = 28;

const COL_STUDENTE = [169, 113, 60];
const COL_ASSEGNAZIONE = [169, 65, 113];
const COL_PROFESSORE = [113];

/** Metà altezza della riga i (da 0) di una tabella che parte da y. */
const mezzaRiga = (y: number, i: number) =>
  y + INTESTAZIONE + RIGA * i + RIGA / 2;

const LARGA: Disposizione = (() => {
  const studente = { x: 0, y: 36 };
  const assegnazione = { x: 398, y: 36 };
  const professore = { x: 398, y: 236 };
  const yRon = mezzaRiga(assegnazione.y, 2);
  return {
    larghezza: 745,
    altezza: 362,
    studente,
    assegnazione,
    professore,
    versoStudente: [assegnazione.x - 4, yRon, 346, mezzaRiga(studente.y, 2), 0],
    versoProfessore: [
      688,
      assegnazione.y + INTESTAZIONE + RIGA * 3 + 4,
      professore.x + 117,
      mezzaRiga(professore.y, 0),
      -40,
    ],
  };
})();

const STRETTA: Disposizione = (() => {
  const assegnazione = { x: 18, y: 32 };
  const studente = { x: 18, y: 218 };
  const professore = { x: 252, y: 402 };
  const yRon = mezzaRiga(assegnazione.y, 2);
  return {
    larghezza: 380,
    altezza: 530,
    studente,
    assegnazione,
    professore,
    versoStudente: [14, yRon, 14, mezzaRiga(studente.y, 2), 24],
    versoProfessore: [369, yRon, 369, mezzaRiga(professore.y, 0), -16],
  };
})();

/** Celle vuote: il posto della riga collegata. */
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
    iniziale: visibile,
  });

  /** La riga i (da 0) di una tabella, ridisegnata sopra per l'accento. */
  const collegata = (
    id: string,
    p: Posto,
    i: number,
    larghezze: number[],
    celle: string[],
  ): Oggetto => ({
    id,
    tipo: 'riga',
    natura: 'dato',
    ruolo: 'dato',
    x: p.x,
    y: p.y + INTESTAZIONE + RIGA * i,
    l: larghezze.reduce((s, c) => s + c, 0),
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
    ruolo: 'inchiostro',
    x,
    y,
    dx: x2 - x,
    dy: y2 - y,
    curva,
    iniziale: visibile,
  });

  return {
    id: 'tabelle-collegate',
    titolo: 'Tre tabelle collegate dai nomi',
    descrizione:
      'Le prime righe delle tabelle studente, assegnazione e professore. ' +
      'Nella riga di assegnazione Ron Weasley, 5, McGonagall, il nome dello ' +
      'studente indica la riga di Ron Weasley nella tabella studente, e il nome ' +
      'del professore la riga di McGonagall nella tabella professore.',
    larghezza: d.larghezza,
    altezza: d.altezza,
    oggetti: [
      nome('nome-studente', d.studente, 'studente'),
      tabella('studente', d.studente, ['nome', 'casa', 'anno'], COL_STUDENTE, [
        ['Harry Potter', 'Grifondoro', '1'],
        ['Hermione Granger', 'Grifondoro', '1'],
        VUOTA(3),
      ]),
      nome('nome-assegnazione', d.assegnazione, 'assegnazione'),
      tabella(
        'assegnazione',
        d.assegnazione,
        ['studente', 'punti', 'professore'],
        COL_ASSEGNAZIONE,
        [
          ['Hermione Granger', '-5', 'McGonagall'],
          ['Harry Potter', '5', 'McGonagall'],
          VUOTA(3),
        ],
      ),
      nome('nome-professore', d.professore, 'professore'),
      tabella('professore', d.professore, ['nome'], COL_PROFESSORE, [
        VUOTA(1),
        ['Piton'],
        ['Sprout'],
      ]),
      collegata('a-ron', d.assegnazione, 2, COL_ASSEGNAZIONE, [
        'Ron Weasley',
        '5',
        'McGonagall',
      ]),
      collegata('s-ron', d.studente, 2, COL_STUDENTE, [
        'Ron Weasley',
        'Grifondoro',
        '1',
      ]),
      collegata('p-mcg', d.professore, 0, COL_PROFESSORE, ['McGonagall']),
      freccia('verso-studente', d.versoStudente),
      freccia('verso-professore', d.versoProfessore),
    ],
    passi: [
      {
        didascalia:
          'Ogni assegnazione indica per nome una riga di studente e una di professore: qui Ron Weasley e McGonagall.',
        animazioni: [],
      },
    ],
  };
}

const figura: FiguraDef = { scena: crea(LARGA), stretta: crea(STRETTA) };
export default figura;
