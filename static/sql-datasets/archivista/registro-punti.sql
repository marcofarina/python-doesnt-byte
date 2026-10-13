-- Dataset «registro-punti» — Volume 3, Manuale dell'Archivista.
-- Il registro dei punti delle lezioni 1 e 2, in tre tabelle: studenti,
-- professori, assegnazioni. L'assegnazione non porta la casa: sta in studente.
--
-- FILE GENERATO da scripts/archivio-sql.mjs a partire da
-- static/archivio/hogwarts/{studenti,punti}.json. Non modificarlo a mano:
-- cambia i JSON e lancia `npm run archivio:sql`.

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
    ('Harry Potter', 'Grifondoro', 1),
    ('Hermione Granger', 'Grifondoro', 1),
    ('Ron Weasley', 'Grifondoro', 1),
    ('Neville Longbottom', 'Grifondoro', 1),
    ('Draco Malfoy', 'Serpeverde', 1),
    ('Padma Patil', 'Corvonero', 1),
    ('Fred Weasley', 'Grifondoro', 3),
    ('George Weasley', 'Grifondoro', 3),
    ('Cedric Diggory', 'Tassofrasso', 3);

INSERT INTO professore (nome) VALUES
    ('McGonagall'),
    ('Piton'),
    ('Sprout'),
    ('Flitwick'),
    ('Silente');

INSERT INTO assegnazione (id, studente, punti, professore) VALUES
    (1, 'Hermione Granger', -5, 'McGonagall'),
    (2, 'Harry Potter', 5, 'McGonagall'),
    (3, 'Ron Weasley', 5, 'McGonagall'),
    (4, 'Harry Potter', -1, 'Piton'),
    (5, 'Harry Potter', -1, 'Piton'),
    (6, 'Draco Malfoy', 10, 'Piton'),
    (7, 'Fred Weasley', -10, 'Piton'),
    (8, 'George Weasley', -10, 'Piton'),
    (9, 'Cedric Diggory', 10, 'Sprout'),
    (10, 'Padma Patil', 10, 'Flitwick'),
    (11, 'Harry Potter', -50, 'McGonagall'),
    (12, 'Hermione Granger', -50, 'McGonagall'),
    (13, 'Neville Longbottom', -50, 'McGonagall'),
    (14, 'Draco Malfoy', -20, 'McGonagall'),
    (15, 'Ron Weasley', 50, 'Silente'),
    (16, 'Hermione Granger', 50, 'Silente'),
    (17, 'Harry Potter', 60, 'Silente'),
    (18, 'Neville Longbottom', 10, 'Silente');
