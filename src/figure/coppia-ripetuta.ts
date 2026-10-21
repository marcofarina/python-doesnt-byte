/**
 * La stessa coppia due volte: figura animata, 3 passi. Sezione «La stessa
 * coppia due volte» di volumes/archivista/associazioni-molti-a-molti.mdx,
 * dopo il paragrafo che parte da «Nel file `punti.json`».
 *
 * Le due assegnazioni sono la quarta e la quinta di
 * static/archivio/hogwarts/punti.json: Piton, Harry Potter, −1, due volte.
 * Come coppie di un'associazione entrano in un insieme e la seconda si posa
 * sulla prima e sparisce; come occorrenze di un'entità restano due, con il
 * loro `id`.
 *
 * Le righe in arrivo partono da `iniziale: { dx, dy }` sopra le due righe del
 * file e arrivano al loro posto con `MoveTo`, come le copie di
 * `aggiornamento-perso`. `larga`: insieme e riquadro affiancati sotto il
 * file. `stretta`: tutto in colonna.
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
  /** Prima riga del file; la seconda sta 34 più sotto. */
  file: Posto;
  /** Insieme delle coppie: x, y, l, a. */
  insieme: [number, number, number, number];
  /** Riquadro dell'entità: x, y, l, a. */
  entita: [number, number, number, number];
  /** Esiti sotto le righe: nell'insieme e nell'entità. */
  esitoInsieme: Posto;
  esitoEntita: Posto;
}

const COL_COPPIA = [70, 140, 50];
const COL_ENTITA = [60, 70, 140, 50];
const CELLE = ['Piton', 'Harry Potter', '−1'];
const PASSO_RIGA = 34;

const LARGA: Disposizione = {
  larghezza: 740,
  altezza: 370,
  file: { x: 240, y: 44 },
  insieme: [10, 160, 340, 160],
  entita: [390, 160, 340, 160],
  esitoInsieme: { x: 180, y: 290 },
  esitoEntita: { x: 560, y: 300 },
};

const STRETTA: Disposizione = {
  larghezza: 380,
  altezza: 510,
  file: { x: 60, y: 44 },
  insieme: [10, 140, 360, 150],
  entita: [20, 340, 340, 150],
  esitoInsieme: { x: 190, y: 258 },
  esitoEntita: { x: 190, y: 472 },
};

const visibile = { opacita: 1, progresso: 1 };
const somma = (c: number[]) => c.reduce((s, x) => s + x, 0);

function crea(d: Disposizione): Scena {
  const [ix, iy, il, ia] = d.insieme;
  const [ex, ey, el] = d.entita;
  const lCoppia = somma(COL_COPPIA);
  const lEntita = somma(COL_ENTITA);
  /** Posto della coppia, al centro dell'insieme. */
  const coppia = { x: ix + (il - lCoppia) / 2, y: iy + ia / 2 - 14 };
  const xEntita = ex + (el - lEntita) / 2;
  const yFile = (i: number) => d.file.y + PASSO_RIGA * i;

  const riga = (
    id: string,
    p: Posto,
    celle: string[],
    larghezze: number[],
    iniziale?: Oggetto['iniziale'],
  ): Oggetto => ({
    id,
    tipo: 'riga',
    natura: 'dato',
    ruolo: 'dato',
    x: p.x,
    y: p.y,
    l: somma(larghezze),
    celle,
    larghezze,
    iniziale,
  });

  /** Una riga che nasce sopra la riga i del file e arriva in p. */
  const daFile = (
    id: string,
    i: number,
    p: Posto,
    celle: string[],
    larghezze: number[],
  ): Oggetto =>
    riga(id, p, celle, larghezze, {
      dx: d.file.x - p.x,
      dy: yFile(i) - p.y,
    });

  const esito = (
    id: string,
    p: Posto,
    testo: string,
    ruolo: 'errore' | 'ok',
  ): Oggetto => ({
    id,
    tipo: 'testo',
    natura: 'concetto',
    ruolo,
    x: p.x,
    y: p.y,
    testo,
    corpo: 'normale',
    ancora: 'middle',
  });

  const yEntita = (i: number) => ey + 46 + PASSO_RIGA * i;

  return {
    id: 'coppia-ripetuta',
    titolo: 'La stessa coppia due volte: associazione o entità',
    descrizione:
      'Nel file punti.json la quarta e la quinta assegnazione sono uguali: ' +
      'Piton, Harry Potter, −1. Come coppie di un’associazione entrano in un ' +
      'insieme, la seconda coincide con la prima e ne resta una sola, con un ' +
      'solo −1. Come occorrenze di un’entità restano due, distinte dall’id 4 ' +
      'e dall’id 5, ognuna con il suo −1.',
    larghezza: d.larghezza,
    altezza: d.altezza,
    oggetti: [
      {
        id: 'titolo-file',
        tipo: 'testo',
        natura: 'dato',
        ruolo: 'dato',
        x: d.file.x,
        y: d.file.y - 12,
        testo: 'punti.json, quarta e quinta assegnazione',
        corpo: 'piccolo',
        iniziale: visibile,
      },
      riga('f-4', d.file, CELLE, COL_COPPIA, visibile),
      riga('f-5', { x: d.file.x, y: yFile(1) }, CELLE, COL_COPPIA, visibile),
      {
        id: 'insieme',
        tipo: 'insieme',
        natura: 'concetto',
        ruolo: 'tenue',
        x: ix,
        y: iy,
        l: il,
        a: ia,
        etichetta: 'come associazione',
        latoEtichetta: 'sotto',
      },
      daFile('coppia', 0, coppia, CELLE, COL_COPPIA),
      daFile('coppia-bis', 1, coppia, CELLE, COL_COPPIA),
      esito(
        'una-sola',
        d.esitoInsieme,
        'una coppia sola, un solo −1',
        'errore',
      ),
      {
        id: 'entita',
        tipo: 'riquadro',
        natura: 'concetto',
        ruolo: 'tenue',
        x: ex,
        y: ey,
        l: el,
        a: d.entita[3],
        etichetta: 'come entità',
      },
      daFile(
        'e-4',
        0,
        { x: xEntita, y: yEntita(0) },
        ['id 4', ...CELLE],
        COL_ENTITA,
      ),
      daFile(
        'e-5',
        1,
        { x: xEntita, y: yEntita(1) },
        ['id 5', ...CELLE],
        COL_ENTITA,
      ),
      esito('due', d.esitoEntita, 'due occorrenze, una per id', 'ok'),
    ],
    passi: [
      {
        didascalia:
          'Nel registro, Piton toglie due volte un punto a Harry: due assegnazioni uguali.',
        animazioni: [],
      },
      {
        didascalia:
          'Come associazione, le due coppie (Piton, Harry Potter) sono la stessa: ne resta una, con un solo −1.',
        animazioni: [
          { fai: 'Create', id: 'insieme' },
          { fai: 'FadeIn', id: 'coppia', ritardo: 280 },
          { fai: 'MoveTo', id: 'coppia', dx: 0, dy: 0, ritardo: 280 },
          { fai: 'FadeIn', id: 'coppia-bis', ritardo: 700 },
          { fai: 'MoveTo', id: 'coppia-bis', dx: 0, dy: 0, ritardo: 700 },
          { fai: 'FadeOut', id: 'coppia-bis', ritardo: 1540 },
          { fai: 'Indicate', id: 'coppia', ritardo: 1540 },
          { fai: 'Write', id: 'una-sola', ritardo: 1680 },
        ],
      },
      {
        didascalia:
          'Come entità, le due assegnazioni restano due occorrenze, con id 4 e id 5.',
        animazioni: [
          { fai: 'Create', id: 'entita' },
          { fai: 'FadeIn', id: 'e-4', ritardo: 280 },
          { fai: 'MoveTo', id: 'e-4', dx: 0, dy: 0, ritardo: 280 },
          { fai: 'FadeIn', id: 'e-5', ritardo: 420 },
          { fai: 'MoveTo', id: 'e-5', dx: 0, dy: 0, ritardo: 420 },
          { fai: 'Indicate', id: 'e-4', ritardo: 1260 },
          { fai: 'Indicate', id: 'e-5', ritardo: 1260 },
          { fai: 'Write', id: 'due', ritardo: 1400 },
        ],
      },
    ],
  };
}

const figura: FiguraDef = { scena: crea(LARGA), stretta: crea(STRETTA) };
export default figura;
