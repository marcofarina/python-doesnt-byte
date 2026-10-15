-- Dataset «casa-entita» — Volume 3, lezione «Entità e attributi».
-- La casa come entità: colori e animale stanno una volta sola nella tabella
-- casa, e studente la nomina soltanto.
--
-- FILE GENERATO da scripts/archivio-sql.mjs a partire da
-- static/archivio/hogwarts/{studenti,case}.json. Non modificarlo a mano:
-- cambia i JSON e lancia `npm run archivio:sql`.

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
    ('Grifondoro', 'rosso e oro', 'leone'),
    ('Serpeverde', 'verde e argento', 'serpente'),
    ('Corvonero', 'blu e bronzo', 'aquila'),
    ('Tassofrasso', 'giallo e nero', 'tasso');

INSERT INTO studente (nome, casa, anno) VALUES
    ('Harry Potter', 'Grifondoro', 1),
    ('Hermione Granger', 'Grifondoro', 1),
    ('Ron Weasley', 'Grifondoro', 1),
    ('Neville Longbottom', 'Grifondoro', 1),
    ('Draco Malfoy', 'Serpeverde', 1),
    ('Padma Patil', 'Corvonero', 1),
    ('Fred Weasley', 'Grifondoro', 3),
    ('George Weasley', 'Grifondoro', 3),
    ('Cedric Diggory', 'Tassofrasso', 3);
