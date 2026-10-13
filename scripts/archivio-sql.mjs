/**
 * Genera il seed SQL del registro dei punti (Volume 3) dai file JSON
 * dell'archivio, che restano l'unica fonte dei dati:
 *
 *   static/archivio/hogwarts/studenti.json  (nome, casa, anno)
 *   static/archivio/hogwarts/punti.json     (studente, casa, punti, professore)
 *     ->  static/sql-datasets/archivista/registro-punti.sql
 *
 * Tre tabelle: studente, professore, assegnazione. L'assegnazione NON porta
 * la casa (sta in studente): è la normalizzazione della lezione sul DBMS.
 *
 * Uso:
 *   node scripts/archivio-sql.mjs           riscrive il seed
 *   node scripts/archivio-sql.mjs --check   esce con codice 1 se il seed su
 *                                           disco differisce da quello generato
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const studentiPath = join(root, 'static/archivio/hogwarts/studenti.json');
const puntiPath = join(root, 'static/archivio/hogwarts/punti.json');
const outPath = join(root, 'static/sql-datasets/archivista/registro-punti.sql');

const q = (text) => `'${String(text).replaceAll("'", "''")}'`;

function generate() {
  const studenti = JSON.parse(readFileSync(studentiPath, 'utf8'));
  const punti = JSON.parse(readFileSync(puntiPath, 'utf8'));

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

const atteso = generate();

if (process.argv.includes('--check')) {
  const attuale = existsSync(outPath) ? readFileSync(outPath, 'utf8') : null;
  if (attuale !== atteso) {
    console.error(
      "registro-punti.sql non coincide con i JSON dell'archivio. " +
        'Rigeneralo con: npm run archivio:sql',
    );
    process.exit(1);
  }
  console.log("✓ registro-punti.sql è allineato ai JSON dell'archivio");
} else {
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, atteso);
  console.log('✓ static/sql-datasets/archivista/registro-punti.sql');
}
