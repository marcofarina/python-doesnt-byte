/**
 * Le copie dell'anno nel registro invecchiano: il 1° settembre studenti.json
 * passa al secondo anno e le copie restano al primo. Sezione «Copie che
 * invecchiano» di volumes/archivista/stessa-informazione-due-volte.mdx.
 *
 * Una disposizione sola, stretta per natura: studenti.json sopra, il registro
 * sotto con le colonne allineate, e le frecce delle copie che girano a
 * destra dalla cella dell'anno. Le righe di Neville sono `riga` sovrapposte
 * alle tabelle (come in `tabelle-collegate`); quando cambiano, una `riga`
 * nuova prende il posto della vecchia con `Transform`.
 */
import type { FiguraDef, Oggetto } from '@site/src/components/Figura/tipi';

const INTESTAZIONE = 32;
const RIGA = 28;
const COL = [184, 104, 54];
const L = COL.reduce((s, c) => s + c, 0);

const X = 4;
const Y_STUDENTI = 64;
const Y_PUNTI = 190;
const Y_DOMANDA = 324;

const yRiga = (y: number, i: number) => y + INTESTAZIONE + RIGA * i;
const visibile = { opacita: 1, progresso: 1 };

const nome = (id: string, y: number, testo: string): Oggetto => ({
  id,
  tipo: 'testo',
  natura: 'dato',
  ruolo: 'dato',
  x: X,
  y: y - 10,
  testo,
  famiglia: 'codice',
  corpo: 'normale',
  iniziale: visibile,
});

const riga = (
  id: string,
  y: number,
  celle: string[],
  ruolo: 'dato' | 'errore',
  iniziale?: Oggetto['iniziale'],
): Oggetto => ({
  id,
  tipo: 'riga',
  natura: 'dato',
  ruolo,
  x: X,
  y,
  l: L,
  celle,
  larghezze: COL,
  iniziale,
});

const copia = (id: string, i: number): Oggetto => ({
  id,
  tipo: 'freccia',
  natura: 'concetto',
  ruolo: 'tenue',
  x: X + L + 4,
  y: yRiga(Y_STUDENTI, 0) + RIGA / 2,
  dx: 0,
  dy: yRiga(Y_PUNTI, i) + RIGA / 2 - (yRiga(Y_STUDENTI, 0) + RIGA / 2),
  curva: -(16 + i * 10),
  iniziale: visibile,
});

const risposta = (
  id: string,
  y: number,
  testo: string,
  ruolo: 'dato' | 'errore',
): Oggetto => ({
  id,
  tipo: 'testo',
  natura: 'dato',
  ruolo,
  x: X,
  y,
  testo,
  famiglia: 'codice',
  corpo: 'normale',
});

const NEVILLE = 'Neville Longbottom';

const figura: FiguraDef = {
  scena: {
    id: 'copie-che-invecchiano',
    titolo: "Le copie dell'anno invecchiano",
    descrizione:
      'In studenti.json Neville Longbottom è al primo anno, e il registro ne ' +
      "copia l'anno in ognuna delle sue due assegnazioni (-50 e +10). Il 1° " +
      'settembre studenti.json passa a 2, le copie restano a 1, e alla domanda ' +
      '«in che anno è Neville?» i due file danno due risposte diverse.',
    larghezza: 380,
    altezza: 392,
    oggetti: [
      {
        id: 'data',
        tipo: 'testo',
        natura: 'concetto',
        ruolo: 'inchiostro',
        x: X + L,
        y: 22,
        testo: '1° settembre',
        ancora: 'end',
        corpo: 'grande',
      },
      nome('nome-studenti', Y_STUDENTI, 'studenti.json'),
      {
        id: 'studenti',
        tipo: 'tabella',
        natura: 'dato',
        ruolo: 'dato',
        x: X,
        y: Y_STUDENTI,
        colonne: ['nome', 'casa', 'anno'],
        larghezze: COL,
        righe: [['', '', '']],
        iniziale: visibile,
      },
      riga(
        's-1',
        yRiga(Y_STUDENTI, 0),
        [NEVILLE, 'Grifondoro', '1'],
        'dato',
        visibile,
      ),
      riga('s-2', yRiga(Y_STUDENTI, 0), [NEVILLE, 'Grifondoro', '2'], 'dato'),

      nome('nome-punti', Y_PUNTI, 'punti.json'),
      {
        id: 'punti',
        tipo: 'tabella',
        natura: 'dato',
        ruolo: 'dato',
        x: X,
        y: Y_PUNTI,
        colonne: ['studente', 'punti', 'anno'],
        larghezze: COL,
        righe: [
          ['', '', ''],
          ['', '', ''],
        ],
        iniziale: visibile,
      },
      riga(
        'p-meno',
        yRiga(Y_PUNTI, 0),
        [NEVILLE, '-50', '1'],
        'dato',
        visibile,
      ),
      riga('p-piu', yRiga(Y_PUNTI, 1), [NEVILLE, '+10', '1'], 'dato', visibile),
      riga('p-meno-falsa', yRiga(Y_PUNTI, 0), [NEVILLE, '-50', '1'], 'errore'),
      riga('p-piu-falsa', yRiga(Y_PUNTI, 1), [NEVILLE, '+10', '1'], 'errore'),
      copia('copia-meno', 0),
      copia('copia-piu', 1),

      {
        id: 'domanda',
        tipo: 'testo',
        natura: 'concetto',
        ruolo: 'inchiostro',
        x: X,
        y: Y_DOMANDA,
        testo: 'In che anno è Neville?',
        corpo: 'normale',
      },
      risposta('r-studenti', Y_DOMANDA + 30, 'studenti.json → 2', 'dato'),
      risposta('r-punti', Y_DOMANDA + 58, 'punti.json    → 1', 'errore'),
    ],
    passi: [
      {
        didascalia:
          "Il registro copia l'anno di Neville da studenti.json in ognuna delle sue assegnazioni.",
        animazioni: [],
      },
      {
        didascalia:
          'Il 1° settembre Neville passa al secondo anno in studenti.json.',
        animazioni: [
          { fai: 'Write', id: 'data' },
          { fai: 'Transform', da: 's-1', a: 's-2', ritardo: 560 },
          { fai: 'Indicate', id: 's-2', ritardo: 560 },
        ],
      },
      {
        didascalia:
          'Nessuno aggiorna le copie: restano a 1, e da vere diventano false.',
        animazioni: [
          { fai: 'Transform', da: 'p-meno', a: 'p-meno-falsa' },
          { fai: 'Transform', da: 'p-piu', a: 'p-piu-falsa' },
        ],
      },
      {
        didascalia:
          'Alla stessa domanda i due file danno due risposte diverse.',
        animazioni: [
          { fai: 'Write', id: 'domanda' },
          { fai: 'FadeIn', id: 'r-studenti', ritardo: 560 },
          { fai: 'FadeIn', id: 'r-punti', ritardo: 560 },
          { fai: 'Indicate', id: 'r-studenti', ritardo: 560 },
          { fai: 'Indicate', id: 'r-punti', ritardo: 560 },
        ],
      },
    ],
  },
};
export default figura;
