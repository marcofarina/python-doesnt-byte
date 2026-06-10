-- Dataset «biblioteca» — Volume 3, Manuale dell'Archivista.
-- Una piccola biblioteca scolastica: autori, libri e prestiti.
-- Questo file è il seed: ogni blocco SQL della lezione riparte da qui.

CREATE TABLE autori (
    id            INTEGER PRIMARY KEY,
    nome          TEXT    NOT NULL,
    paese         TEXT,
    anno_nascita  INTEGER
);

CREATE TABLE libri (
    id        INTEGER PRIMARY KEY,
    titolo    TEXT    NOT NULL,
    autore_id INTEGER REFERENCES autori(id),
    anno      INTEGER,
    genere    TEXT
);

CREATE TABLE prestiti (
    id                INTEGER PRIMARY KEY,
    libro_id          INTEGER NOT NULL REFERENCES libri(id),
    studente          TEXT    NOT NULL,
    classe            TEXT,
    data_prestito     TEXT    NOT NULL,
    data_restituzione TEXT
);

INSERT INTO autori (id, nome, paese, anno_nascita) VALUES
    (1, 'Italo Calvino',     'Italia',       1923),
    (2, 'J.R.R. Tolkien',    'Regno Unito',  1892),
    (3, 'Ursula K. Le Guin', 'Stati Uniti',  1929),
    (4, 'Primo Levi',        'Italia',       1919),
    (5, 'Douglas Adams',     'Regno Unito',  1952),
    (6, 'Rita Levi-Montalcini', 'Italia',    1909);

INSERT INTO libri (id, titolo, autore_id, anno, genere) VALUES
    (1,  'Il barone rampante',                  1, 1957, 'narrativa'),
    (2,  'Le città invisibili',                 1, 1972, 'narrativa'),
    (3,  'Lo Hobbit',                           2, 1937, 'fantasy'),
    (4,  'Il Signore degli Anelli',             2, 1954, 'fantasy'),
    (5,  'I reietti dell''altro pianeta',       3, 1974, 'fantascienza'),
    (6,  'La mano sinistra del buio',           3, 1969, 'fantascienza'),
    (7,  'Se questo è un uomo',                 4, 1947, 'memorialistica'),
    (8,  'Il sistema periodico',                4, 1975, 'racconti'),
    (9,  'Guida galattica per gli autostoppisti', 5, 1979, 'fantascienza'),
    (10, 'Elogio dell''imperfezione',           6, 1987, 'autobiografia'),
    (11, 'Marcovaldo',                          1, 1963, 'racconti'),
    (12, 'Il Silmarillion',                     2, 1977, 'fantasy');

INSERT INTO prestiti (id, libro_id, studente, classe, data_prestito, data_restituzione) VALUES
    (1, 3,  'Lia Rossi',      '3A', '2026-01-12', '2026-02-02'),
    (2, 9,  'Marco Bianchi',  '4B', '2026-01-20', '2026-02-15'),
    (3, 1,  'Sofia Greco',    '3A', '2026-02-01', NULL),
    (4, 4,  'Lia Rossi',      '3A', '2026-02-10', NULL),
    (5, 7,  'Andrea Russo',   '5C', '2026-02-12', '2026-03-01'),
    (6, 9,  'Sofia Greco',    '3A', '2026-03-05', NULL),
    (7, 11, 'Marco Bianchi',  '4B', '2026-03-15', NULL),
    (8, 5,  'Giulia Ferrari', '4B', '2026-04-02', '2026-04-30');
