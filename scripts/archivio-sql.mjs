/**
 * Genera i seed SQL del Volume 3 dai file JSON dell'archivio, che restano
 * l'unica fonte dei dati:
 *
 *   static/archivio/hogwarts/studenti.json  (nome, casa, anno)
 *   static/archivio/hogwarts/punti.json     (studente, casa, punti, professore)
 *   static/archivio/hogwarts/case.json      (nome, colori, animale)
 *     ->  static/sql-datasets/archivista/registro-punti.sql
 *     ->  static/sql-datasets/archivista/casa-attributo.sql
 *     ->  static/sql-datasets/archivista/casa-entita.sql
 *     ->  static/sql-datasets/archivista/omonimi.sql
 *     ->  static/sql-datasets/archivista/corsi-colonna.sql
 *     ->  static/sql-datasets/archivista/iscrizione.sql
 *
 * registro-punti: tre tabelle (studente, professore, assegnazione).
 * L'assegnazione NON porta la casa (sta in studente): è la normalizzazione
 * della lezione sul DBMS.
 * casa-attributo / casa-entita: le due versioni dello schema della lezione
 * «Entità e attributi» (la casa come colonna di studente, la casa come tabella).
 * omonimi: la tabella studente senza chiave, con due James Potter (lezione
 * «Identificare senza ambiguità: le chiavi»).
 * corsi-colonna / iscrizione: i corsi in una colonna di studente, poi
 * l'associazione molti a molti con il voto (lezione «Le associazioni molti a
 * molti»). Corsi e voti non sono nell'archivio JSON: stanno in CORSI e VOTI.
 *
 * Uso:
 *   node scripts/archivio-sql.mjs           riscrive il seed
 *   node scripts/archivio-sql.mjs --check   esce con codice 1 se un seed su
 *                                           disco differisce da quello generato
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const studentiPath = join(root, 'static/archivio/hogwarts/studenti.json');
const puntiPath = join(root, 'static/archivio/hogwarts/punti.json');
const casePath = join(root, 'static/archivio/hogwarts/case.json');
const outDir = join(root, 'static/sql-datasets/archivista');

const q = (text) => `'${String(text).replaceAll("'", "''")}'`;

const leggi = (path) => JSON.parse(readFileSync(path, 'utf8'));

function registroPunti(studenti, punti) {
  const casaDi = new Map(studenti.map((s) => [s.nome, s.casa]));
  for (const r of punti) {
    if (!casaDi.has(r.studente)) {
      throw new Error(
        `punti.json nomina «${r.studente}», che non è in studenti.json`,
      );
    }
    // La casa nel registro è ridondante: se diverge da studenti.json, il
    // seed (che la tiene solo in studente) smentirebbe la lezione 1.
    if (casaDi.get(r.studente) !== r.casa) {
      throw new Error(
        `${r.studente}: casa «${r.casa}» in punti.json, «${casaDi.get(r.studente)}» in studenti.json`,
      );
    }
  }
  // Professori nell'ordine in cui compaiono nel registro.
  const professori = [...new Set(punti.map((r) => r.professore))];

  const righeStudenti = studenti
    .map((s) => `    (${q(s.nome)}, ${q(s.casa)}, ${s.anno})`)
    .join(',\n');
  const righeProfessori = professori.map((p) => `    (${q(p)})`).join(',\n');
  const righeAssegnazioni = punti
    .map(
      (r, i) =>
        `    (${i + 1}, ${q(r.studente)}, ${r.punti}, ${q(r.professore)})`,
    )
    .join(',\n');

  return `-- Dataset «registro-punti» — Volume 3, Manuale dell'Archivista.
-- Il registro dei punti delle lezioni 1 e 2, in tre tabelle: studenti,
-- professori, assegnazioni. L'assegnazione non porta la casa: sta in studente.
--
-- FILE GENERATO da scripts/archivio-sql.mjs a partire da
-- static/archivio/hogwarts/{studenti,punti}.json. Non modificarlo a mano:
-- cambia i JSON e lancia \`npm run archivio:sql\`.

CREATE TABLE studente (
    nome  TEXT    PRIMARY KEY,
    casa  TEXT    NOT NULL,
    anno  INTEGER NOT NULL
);

CREATE TABLE professore (
    nome  TEXT    PRIMARY KEY
);

CREATE TABLE assegnazione (
    id          INTEGER PRIMARY KEY,
    studente    TEXT    NOT NULL REFERENCES studente(nome),
    punti       INTEGER NOT NULL,
    professore  TEXT    NOT NULL REFERENCES professore(nome)
);

INSERT INTO studente (nome, casa, anno) VALUES
${righeStudenti};

INSERT INTO professore (nome) VALUES
${righeProfessori};

INSERT INTO assegnazione (id, studente, punti, professore) VALUES
${righeAssegnazioni};
`;
}

function casaAttributo(studenti, case_) {
  const casa = new Map(case_.map((c) => [c.nome, c]));
  const righe = studenti
    .map((s) => {
      const c = casa.get(s.casa);
      return `    (${q(s.nome)}, ${q(s.casa)}, ${q(c.colori)}, ${q(c.animale)}, ${s.anno})`;
    })
    .join(',\n');

  return `-- Dataset «casa-attributo» — Volume 3, lezione «Entità e attributi».
-- La casa come attributo di studente: nome, colori e animale della casa sono
-- colonne di studente e si ripetono in ogni riga. Non esiste una tabella delle case.
--
-- FILE GENERATO da scripts/archivio-sql.mjs a partire da
-- static/archivio/hogwarts/{studenti,case}.json. Non modificarlo a mano:
-- cambia i JSON e lancia \`npm run archivio:sql\`.

CREATE TABLE studente (
    nome          TEXT    PRIMARY KEY,
    casa          TEXT    NOT NULL,
    colori_casa   TEXT    NOT NULL,
    animale_casa  TEXT    NOT NULL,
    anno          INTEGER NOT NULL
);

INSERT INTO studente (nome, casa, colori_casa, animale_casa, anno) VALUES
${righe};
`;
}

function casaEntita(studenti, case_) {
  const righeCase = case_
    .map((c) => `    (${q(c.nome)}, ${q(c.colori)}, ${q(c.animale)})`)
    .join(',\n');
  const righeStudenti = studenti
    .map((s) => `    (${q(s.nome)}, ${q(s.casa)}, ${s.anno})`)
    .join(',\n');

  return `-- Dataset «casa-entita» — Volume 3, lezione «Entità e attributi».
-- La casa come entità: colori e animale stanno una volta sola nella tabella
-- casa, e studente la nomina soltanto.
--
-- FILE GENERATO da scripts/archivio-sql.mjs a partire da
-- static/archivio/hogwarts/{studenti,case}.json. Non modificarlo a mano:
-- cambia i JSON e lancia \`npm run archivio:sql\`.

CREATE TABLE casa (
    nome     TEXT PRIMARY KEY,
    colori   TEXT NOT NULL,
    animale  TEXT NOT NULL
);

CREATE TABLE studente (
    nome  TEXT    PRIMARY KEY,
    casa  TEXT    NOT NULL REFERENCES casa(nome),
    anno  INTEGER NOT NULL
);

INSERT INTO casa (nome, colori, animale) VALUES
${righeCase};

INSERT INTO studente (nome, casa, anno) VALUES
${righeStudenti};
`;
}

/**
 * Corsi dei due anni presenti in studenti.json, con il professore che li
 * tiene. Un corso è identificato da materia e anno.
 */
const MATERIE = [
  ['Erbologia', 'Sprout'],
  ['Incantesimi', 'Flitwick'],
  ['Pozioni', 'Piton'],
  ['Trasfigurazione', 'McGonagall'],
];

/** Voti in decimi, nell'ordine di MATERIE. Inventati per la lezione. */
const VOTI = {
  'Harry Potter': [6, 7, 5, 6],
  'Hermione Granger': [9, 10, 9, 10],
  'Ron Weasley': [6, 6, 5, 5],
  'Neville Longbottom': [10, 5, 4, 5],
  'Draco Malfoy': [6, 7, 9, 7],
  'Padma Patil': [8, 9, 7, 8],
  'Fred Weasley': [5, 7, 6, 6],
  'George Weasley': [5, 7, 6, 6],
  'Cedric Diggory': [8, 8, 7, 8],
};

/** I due James Potter: il padre di Harry e suo figlio. */
const JAMES = [
  { nome: 'James Potter', casa: 'Grifondoro', anno: 1 },
  { nome: 'James Potter', casa: 'Grifondoro', anno: 1 },
];

function omonimi(studenti, punti) {
  const tutti = [...studenti, ...JAMES];
  const righeStudenti = tutti
    .map((s) => `    (${q(s.nome)}, ${q(s.casa)}, ${s.anno})`)
    .join(',\n');
  const professori = [...new Set(punti.map((r) => r.professore))];
  const righeProfessori = professori.map((p) => `    (${q(p)})`).join(',\n');
  const assegnazioni = [
    ...punti,
    { studente: 'James Potter', punti: 10, professore: 'McGonagall' },
  ];
  const righeAssegnazioni = assegnazioni
    .map(
      (r, i) =>
        `    (${i + 1}, ${q(r.studente)}, ${r.punti}, ${q(r.professore)})`,
    )
    .join(',\n');

  return `-- Dataset «omonimi» — Volume 3, lezione «Identificare senza ambiguità: le chiavi».
-- Il registro dei punti con la tabella studente SENZA chiave: i due James
-- Potter (il padre di Harry e suo figlio) sono due righe uguali, e
-- l'assegnazione di dieci punti a «James Potter» si aggancia a entrambe.
-- Senza chiave su studente.nome, assegnazione.studente non può avere il
-- vincolo di chiave esterna (SQLite lo rifiuterebbe come «foreign key mismatch»).
--
-- FILE GENERATO da scripts/archivio-sql.mjs a partire da
-- static/archivio/hogwarts/{studenti,punti}.json. Non modificarlo a mano:
-- cambia i JSON (o JAMES nello script) e lancia \`npm run archivio:sql\`.

CREATE TABLE studente (
    nome  TEXT    NOT NULL,
    casa  TEXT    NOT NULL,
    anno  INTEGER NOT NULL
);

CREATE TABLE professore (
    nome  TEXT    PRIMARY KEY
);

CREATE TABLE assegnazione (
    id          INTEGER PRIMARY KEY,
    studente    TEXT    NOT NULL,
    punti       INTEGER NOT NULL,
    professore  TEXT    NOT NULL REFERENCES professore(nome)
);

INSERT INTO studente (nome, casa, anno) VALUES
${righeStudenti};

INSERT INTO professore (nome) VALUES
${righeProfessori};

INSERT INTO assegnazione (id, studente, punti, professore) VALUES
${righeAssegnazioni};
`;
}

function controllaVoti(studenti) {
  for (const s of studenti) {
    if (!VOTI[s.nome]) {
      throw new Error(`${s.nome} è in studenti.json ma non ha voti in VOTI`);
    }
  }
}

function corsiColonna(studenti) {
  controllaVoti(studenti);
  const elenco = MATERIE.map(([m]) => m).join(', ');
  const righe = studenti
    .map((s) => `    (${q(s.nome)}, ${q(s.casa)}, ${s.anno}, ${q(elenco)})`)
    .join(',\n');

  return `-- Dataset «corsi-colonna» — Volume 3, lezione «Le associazioni molti a molti».
-- I corsi seguiti da ogni studente scritti in una sola colonna di testo: è
-- l'errore che la lezione mostra (nessuna cella è uguale a 'Pozioni').
--
-- FILE GENERATO da scripts/archivio-sql.mjs a partire da
-- static/archivio/hogwarts/studenti.json e da MATERIE nello script.
-- Non modificarlo a mano: lancia \`npm run archivio:sql\`.

CREATE TABLE studente (
    nome   TEXT    PRIMARY KEY,
    casa   TEXT    NOT NULL,
    anno   INTEGER NOT NULL,
    corsi  TEXT    NOT NULL
);

INSERT INTO studente (nome, casa, anno, corsi) VALUES
${righe};
`;
}

function iscrizione(studenti) {
  controllaVoti(studenti);
  const anni = [...new Set(studenti.map((s) => s.anno))].sort();
  const righeStudenti = studenti
    .map((s) => `    (${q(s.nome)}, ${q(s.casa)}, ${s.anno})`)
    .join(',\n');
  const righeCorsi = anni
    .flatMap((a) => MATERIE.map(([m, p]) => `    (${q(m)}, ${a}, ${q(p)})`))
    .join(',\n');
  const righeIscrizioni = studenti
    .flatMap((s) =>
      MATERIE.map(
        ([m], i) =>
          `    (${q(s.nome)}, ${q(m)}, ${s.anno}, ${VOTI[s.nome][i]})`,
      ),
    )
    .join(',\n');

  return `-- Dataset «iscrizione» — Volume 3, lezione «Le associazioni molti a molti».
-- L'associazione molti a molti fra studente e corso, con il voto: una riga
-- di iscrizione per ogni coppia studente–corso. Il corso è identificato da
-- materia e anno.
--
-- FILE GENERATO da scripts/archivio-sql.mjs a partire da
-- static/archivio/hogwarts/studenti.json e da MATERIE e VOTI nello script.
-- Non modificarlo a mano: lancia \`npm run archivio:sql\`.

CREATE TABLE studente (
    nome  TEXT    PRIMARY KEY,
    casa  TEXT    NOT NULL,
    anno  INTEGER NOT NULL
);

CREATE TABLE corso (
    materia     TEXT    NOT NULL,
    anno        INTEGER NOT NULL,
    professore  TEXT    NOT NULL,
    PRIMARY KEY (materia, anno)
);

CREATE TABLE iscrizione (
    studente  TEXT    NOT NULL REFERENCES studente(nome),
    materia   TEXT    NOT NULL,
    anno      INTEGER NOT NULL,
    voto      INTEGER NOT NULL,
    PRIMARY KEY (studente, materia, anno),
    FOREIGN KEY (materia, anno) REFERENCES corso(materia, anno)
);

INSERT INTO studente (nome, casa, anno) VALUES
${righeStudenti};

INSERT INTO corso (materia, anno, professore) VALUES
${righeCorsi};

INSERT INTO iscrizione (studente, materia, anno, voto) VALUES
${righeIscrizioni};
`;
}

function generate() {
  const studenti = leggi(studentiPath);
  const punti = leggi(puntiPath);
  const case_ = leggi(casePath);

  const note = new Set(case_.map((c) => c.nome));
  for (const s of studenti) {
    if (!note.has(s.casa)) {
      throw new Error(
        `${s.nome}: casa «${s.casa}» in studenti.json, che non è in case.json`,
      );
    }
  }

  return {
    'registro-punti.sql': registroPunti(studenti, punti),
    'casa-attributo.sql': casaAttributo(studenti, case_),
    'casa-entita.sql': casaEntita(studenti, case_),
    'omonimi.sql': omonimi(studenti, punti),
    'corsi-colonna.sql': corsiColonna(studenti),
    'iscrizione.sql': iscrizione(studenti),
  };
}

const seed = generate();

if (process.argv.includes('--check')) {
  let ok = true;
  for (const [nome, atteso] of Object.entries(seed)) {
    const path = join(outDir, nome);
    const attuale = existsSync(path) ? readFileSync(path, 'utf8') : null;
    if (attuale !== atteso) {
      console.error(
        `${nome} non coincide con i JSON dell'archivio. ` +
          'Rigeneralo con: npm run archivio:sql',
      );
      ok = false;
    } else {
      console.log(`✓ ${nome} è allineato ai JSON dell'archivio`);
    }
  }
  if (!ok) process.exit(1);
} else {
  mkdirSync(outDir, { recursive: true });
  for (const [nome, contenuto] of Object.entries(seed)) {
    writeFileSync(join(outDir, nome), contenuto);
    console.log(`✓ static/sql-datasets/archivista/${nome}`);
  }
}
