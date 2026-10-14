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
 *
 * registro-punti: tre tabelle (studente, professore, assegnazione).
 * L'assegnazione NON porta la casa (sta in studente): è la normalizzazione
 * della lezione sul DBMS.
 * casa-attributo / casa-entita: le due versioni dello schema della lezione
 * «Entità e attributi» (la casa come colonna di studente, la casa come tabella).
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
