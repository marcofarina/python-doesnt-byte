/**
 * Le coppie di `appartiene` diventano la colonna `casa` della relazione
 * `studente`: figura animata, 4 passi, `rivela` sull'ultimo. Sezione «Uno a
 * molti: la casa nella riga dello studente» di
 * volumes/archivista/tradurre-in-tabelle.mdx, dopo il paragrafo della regola.
 *
 * Stessa forma di `occorrenze-appartiene` e `cardinalita-coppie`: gli insiemi
 * degli studenti e delle case, una linea per coppia, i nove studenti del
 * registro. Le matricole 1001, 1002, 1005 e 1006 sono quelle della tabella
 * della lezione; le altre sono scelte qui, nello stesso intervallo. Al passo 3
 * il nome di ogni casa parte dall'insieme ed entra nella riga del suo
 * studente. Al passo 4 gli insiemi lasciano il posto al tentativo inverso: la
 * relazione `casa` con le matricole, e Grifondoro con sei valori in una cella,
 * barrata. Quella cella va a capo, perché in una riga sola a 380 unità non ci
 * sta: per questo la riga di Grifondoro è fatta di riquadri e testi, non di
 * una `riga`.
 *
 * `larga`: insiemi a sinistra, tabella a destra. `stretta`: insiemi sopra,
 * tabella sotto. Il tentativo inverso prende il posto degli insiemi.
 */
import { larghezzaTesto } from '@site/src/components/Figura/misure';
import type {
  Animazione,
  FiguraDef,
  Oggetto,
  Scena,
} from '@site/src/components/Figura/tipi';

type Rett = [number, number, number, number];

interface Disposizione {
  larghezza: number;
  altezza: number;
  /** Insieme degli studenti: x, y, l, a. I nomi stanno al centro. */
  studenti: Rett;
  case: Rett;
  /** Linea di base del primo studente e passo fra uno e l'altro. */
  yNome: number;
  passoNomi: number;
  /** Linee di base delle case. */
  yCase: number[];
  corpo: 15 | 17;
  /** Angolo in alto a sinistra della tabella studente. */
  tabella: [number, number];
  /** Angolo in alto a sinistra della relazione casa del tentativo inverso. */
  inversa: [number, number];
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
const MATRICOLE = [1001, 1002, 1003, 1004, 1007, 1008, 1005, 1006, 1009];
/** Studenti nell'ordine delle righe della tabella: per matricola. */
const RIGHE = STUDENTI.map((_, i) => i).sort(
  (a, b) => MATRICOLE[a] - MATRICOLE[b],
);

const INTESTAZIONE = 32;
const RIGA = 28;
const MARGINE = 10;
const COL_STUDENTE = [82, 94];
const COL_CASA = 122;
const COL_INVERSA = [122, 186];
/** La riga di Grifondoro nel tentativo inverso: due righe di testo. */
const ALTA = 50;

const LARGA: Disposizione = {
  larghezza: 740,
  altezza: 400,
  studenti: [0, 40, 230, 350],
  case: [270, 90, 160, 250],
  yNome: 97,
  passoNomi: 31,
  yCase: [140, 190, 240, 290],
  corpo: 17,
  tabella: [442, 60],
  inversa: [40, 130],
};

const STRETTA: Disposizione = {
  larghezza: 380,
  altezza: 694,
  studenti: [0, 36, 186, 330],
  case: [214, 86, 154, 250],
  yNome: 88,
  passoNomi: 29,
  yCase: [152, 196, 240, 284],
  corpo: 15,
  tabella: [41, 406],
  inversa: [40, 110],
};

const visibile = { opacita: 1, progresso: 1 };

function crea(d: Disposizione): Scena {
  const cs = d.studenti[0] + d.studenti[2] / 2;
  const cc = d.case[0] + d.case[2] / 2;
  const mezzo = (t: string) => larghezzaTesto(t, d.corpo, 'netto') / 2;
  const yNome = (i: number) => d.yNome + d.passoNomi * i;

  const insieme = (
    id: string,
    [x, y, l, a]: Rett,
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

  const etichettaTabella = (
    id: string,
    [x, y]: [number, number],
    testo: string,
  ): Oggetto => ({
    id,
    tipo: 'testo',
    natura: 'dato',
    ruolo: 'dato',
    x,
    y: y - 10,
    testo,
    famiglia: 'codice',
    corpo: 'normale',
  });

  const [tx, ty] = d.tabella;
  const xCasa = tx + COL_STUDENTE[0] + COL_STUDENTE[1];

  /** Il valore della colonna casa: parte dal nome della casa nell'insieme. */
  const valori: Oggetto[] = RIGHE.map((s, r) => {
    const casa = CASE[COPPIE[s]];
    const x = xCasa + MARGINE;
    const y = ty + INTESTAZIONE + RIGA * r + 19;
    const l = larghezzaTesto(casa, 15, 'netto', 'codice');
    return {
      id: `valore-${s}`,
      tipo: 'testo',
      natura: 'dato',
      ruolo: 'dato',
      x,
      y,
      testo: casa,
      famiglia: 'codice',
      corpo: 'piccolo',
      iniziale: { dx: cc - l / 2 - x, dy: d.yCase[COPPIE[s]] - y },
    };
  });

  const [ix, iy] = d.inversa;
  const yGrifondoro = iy + INTESTAZIONE + RIGA * 3;
  const lInversa = COL_INVERSA[0] + COL_INVERSA[1];

  const inversa: Oggetto[] = [
    etichettaTabella('nome-casa', d.inversa, 'casa'),
    {
      id: 'casa-inversa',
      tipo: 'tabella',
      natura: 'dato',
      ruolo: 'dato',
      x: ix,
      y: iy,
      colonne: ['nome', 'studenti'],
      larghezze: COL_INVERSA,
      righe: [
        ['Serpeverde', '1005'],
        ['Corvonero', '1006'],
        ['Tassofrasso', '1009'],
      ],
    },
    ...[0, 1].map(
      (j): Oggetto => ({
        id: `g-cella-${j}`,
        tipo: 'riquadro',
        natura: 'dato',
        ruolo: 'dato',
        x: ix + (j === 0 ? 0 : COL_INVERSA[0]),
        y: yGrifondoro,
        l: COL_INVERSA[j],
        a: ALTA,
        raggio: 'xs',
      }),
    ),
    {
      id: 'g-nome',
      tipo: 'testo',
      natura: 'dato',
      ruolo: 'dato',
      x: ix + MARGINE,
      y: yGrifondoro + 20,
      testo: 'Grifondoro',
      famiglia: 'codice',
      corpo: 'piccolo',
    },
    {
      id: 'g-studenti',
      tipo: 'testo',
      natura: 'dato',
      ruolo: 'dato',
      x: ix + COL_INVERSA[0] + MARGINE,
      y: yGrifondoro + 20,
      testo: COPPIE.map((c, i) => (c === 0 ? MATRICOLE[i] : null))
        .filter((m) => m !== null)
        .join(', '),
      famiglia: 'codice',
      corpo: 'piccolo',
      larghezzaMax: COL_INVERSA[1] - 2 * MARGINE,
    },
    {
      id: 'g-barra',
      tipo: 'freccia',
      natura: 'dato',
      ruolo: 'errore',
      x: ix - 6,
      y: yGrifondoro + ALTA / 2,
      dx: lInversa + 12,
      dy: 0,
      punte: 'nessuna',
    },
    {
      id: 'g-esito',
      tipo: 'testo',
      natura: 'concetto',
      ruolo: 'errore',
      x: ix + lInversa / 2,
      y: yGrifondoro + ALTA + 34,
      testo: 'sei valori in una cella',
      corpo: 'normale',
      ancora: 'middle',
    },
  ];

  const pairs = [
    insieme('studenti', d.studenti, 'studente'),
    insieme('case', d.case, 'casa'),
    ...linee,
    ...STUDENTI.map((s, i) => nome(`s-${i}`, cs, yNome(i), s)),
    ...CASE.map((c, i) => nome(`c-${i}`, cc, d.yCase[i], c)),
  ];

  const passo3: Animazione[] = [
    { fai: 'Create', id: 'colonna-casa' },
    ...valori.flatMap((v, r): Animazione[] => {
      const ritardo = 420 + 160 * r;
      return [
        { fai: 'FadeIn', id: v.id, ritardo },
        { fai: 'MoveTo', id: v.id, dx: 0, dy: 0, ritardo, durata: 840 },
        { fai: 'Indicate', id: v.id, ritardo },
      ];
    }),
  ];

  return {
    id: 'coppie-in-colonna',
    titolo: 'Le coppie di appartiene diventano la colonna casa',
    descrizione:
      'Gli insiemi dei nove studenti del registro e delle quattro case, con ' +
      'una linea per ogni coppia di appartiene: Harry, Hermione, Ron, ' +
      'Neville, Fred e George con Grifondoro, Draco con Serpeverde, Padma con ' +
      'Corvonero, Cedric con Tassofrasso. Accanto, la relazione studente con ' +
      'matricola e nome, da 1001 a 1009. Il nome della casa di ogni coppia ' +
      'entra nella riga del suo studente, in una nuova colonna casa. Poi il ' +
      'verso opposto: una relazione casa con la colonna studenti, dove ' +
      'Serpeverde ha 1005, Corvonero 1006, Tassofrasso 1009, e Grifondoro ' +
      'avrebbe sei matricole in una cella sola, 1001, 1002, 1003, 1004, 1007 e ' +
      '1008: la riga è barrata.',
    larghezza: d.larghezza,
    altezza: d.altezza,
    oggetti: [
      ...pairs,
      etichettaTabella('nome-studente', d.tabella, 'studente'),
      {
        id: 'studente',
        tipo: 'tabella',
        natura: 'dato',
        ruolo: 'dato',
        x: tx,
        y: ty,
        colonne: ['matricola', 'nome'],
        larghezze: COL_STUDENTE,
        righe: RIGHE.map((s) => [
          String(MATRICOLE[s]),
          STUDENTI[s].split(' ')[0],
        ]),
      },
      {
        id: 'colonna-casa',
        tipo: 'tabella',
        natura: 'dato',
        ruolo: 'dato',
        x: xCasa,
        y: ty,
        colonne: ['casa'],
        larghezze: [COL_CASA],
        righe: RIGHE.map(() => ['']),
      },
      ...valori,
      ...inversa,
    ],
    passi: [
      {
        didascalia:
          'Ogni linea è una coppia studente-casa, e ogni studente compare in una coppia sola.',
        animazioni: linee.map((l, i) => ({
          fai: 'Create' as const,
          id: l.id,
          ritardo: 120 * i,
        })),
      },
      {
        didascalia:
          'La relazione studente ha una riga per ogni studente, e ancora nessuna colonna per la casa.',
        animazioni: [
          { fai: 'Create', id: 'studente' },
          { fai: 'Write', id: 'nome-studente', ritardo: 280 },
        ],
      },
      {
        didascalia:
          'Ogni coppia diventa un valore: la casa entra nella riga del suo studente, nella nuova colonna.',
        animazioni: passo3,
      },
      {
        didascalia:
          'Nell’altro verso la colonna starebbe in casa, e Grifondoro dovrebbe tenere le matricole dei suoi sei studenti.',
        rivela: true,
        animazioni: [
          ...pairs.map((o) => ({ fai: 'FadeOut' as const, id: o.id })),
          { fai: 'Create', id: 'casa-inversa', ritardo: 560 },
          { fai: 'Write', id: 'nome-casa', ritardo: 700 },
          { fai: 'Create', id: 'g-cella-0', ritardo: 840 },
          { fai: 'Create', id: 'g-cella-1', ritardo: 840 },
          { fai: 'Write', id: 'g-nome', ritardo: 980 },
          { fai: 'Write', id: 'g-studenti', ritardo: 980 },
          { fai: 'Indicate', id: 'g-studenti', ritardo: 980 },
          { fai: 'Create', id: 'g-barra', ritardo: 1820 },
          { fai: 'Write', id: 'g-esito', ritardo: 2100 },
        ],
      },
    ],
  };
}

const figura: FiguraDef = { scena: crea(LARGA), stretta: crea(STRETTA) };
export default figura;
