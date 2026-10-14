-- Dataset «casa-attributo» — Volume 3, lezione «Entità e attributi».
-- La casa come attributo di studente: nome, colori e animale della casa sono
-- colonne di studente e si ripetono in ogni riga. Non esiste una tabella delle case.
--
-- FILE GENERATO da scripts/archivio-sql.mjs a partire da
-- static/archivio/hogwarts/{studenti,case}.json. Non modificarlo a mano:
-- cambia i JSON e lancia `npm run archivio:sql`.

CREATE TABLE studente (
    nome          TEXT    PRIMARY KEY,
    casa          TEXT    NOT NULL,
    colori_casa   TEXT    NOT NULL,
    animale_casa  TEXT    NOT NULL,
    anno          INTEGER NOT NULL
);

INSERT INTO studente (nome, casa, colori_casa, animale_casa, anno) VALUES
    ('Harry Potter', 'Grifondoro', 'rosso e oro', 'leone', 1),
    ('Hermione Granger', 'Grifondoro', 'rosso e oro', 'leone', 1),
    ('Ron Weasley', 'Grifondoro', 'rosso e oro', 'leone', 1),
    ('Neville Longbottom', 'Grifondoro', 'rosso e oro', 'leone', 1),
    ('Draco Malfoy', 'Serpeverde', 'verde e argento', 'serpente', 1),
    ('Padma Patil', 'Corvonero', 'blu e bronzo', 'aquila', 1),
    ('Fred Weasley', 'Grifondoro', 'rosso e oro', 'leone', 3),
    ('George Weasley', 'Grifondoro', 'rosso e oro', 'leone', 3),
    ('Cedric Diggory', 'Tassofrasso', 'giallo e nero', 'tasso', 3);
