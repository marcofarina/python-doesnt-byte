-- Dataset «iscrizione» — Volume 3, lezione «Le associazioni molti a molti».
-- L'associazione molti a molti fra studente e corso, con il voto: una riga
-- di iscrizione per ogni coppia studente–corso. Il corso è identificato da
-- materia e anno.
--
-- FILE GENERATO da scripts/archivio-sql.mjs a partire da
-- static/archivio/hogwarts/studenti.json e da MATERIE e VOTI nello script.
-- Non modificarlo a mano: lancia `npm run archivio:sql`.

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
    ('Harry Potter', 'Grifondoro', 1),
    ('Hermione Granger', 'Grifondoro', 1),
    ('Ron Weasley', 'Grifondoro', 1),
    ('Neville Longbottom', 'Grifondoro', 1),
    ('Draco Malfoy', 'Serpeverde', 1),
    ('Padma Patil', 'Corvonero', 1),
    ('Fred Weasley', 'Grifondoro', 3),
    ('George Weasley', 'Grifondoro', 3),
    ('Cedric Diggory', 'Tassofrasso', 3);

INSERT INTO corso (materia, anno, professore) VALUES
    ('Erbologia', 1, 'Sprout'),
    ('Incantesimi', 1, 'Flitwick'),
    ('Pozioni', 1, 'Piton'),
    ('Trasfigurazione', 1, 'McGonagall'),
    ('Erbologia', 3, 'Sprout'),
    ('Incantesimi', 3, 'Flitwick'),
    ('Pozioni', 3, 'Piton'),
    ('Trasfigurazione', 3, 'McGonagall');

INSERT INTO iscrizione (studente, materia, anno, voto) VALUES
    ('Harry Potter', 'Erbologia', 1, 6),
    ('Harry Potter', 'Incantesimi', 1, 7),
    ('Harry Potter', 'Pozioni', 1, 5),
    ('Harry Potter', 'Trasfigurazione', 1, 6),
    ('Hermione Granger', 'Erbologia', 1, 9),
    ('Hermione Granger', 'Incantesimi', 1, 10),
    ('Hermione Granger', 'Pozioni', 1, 9),
    ('Hermione Granger', 'Trasfigurazione', 1, 10),
    ('Ron Weasley', 'Erbologia', 1, 6),
    ('Ron Weasley', 'Incantesimi', 1, 6),
    ('Ron Weasley', 'Pozioni', 1, 5),
    ('Ron Weasley', 'Trasfigurazione', 1, 5),
    ('Neville Longbottom', 'Erbologia', 1, 10),
    ('Neville Longbottom', 'Incantesimi', 1, 5),
    ('Neville Longbottom', 'Pozioni', 1, 4),
    ('Neville Longbottom', 'Trasfigurazione', 1, 5),
    ('Draco Malfoy', 'Erbologia', 1, 6),
    ('Draco Malfoy', 'Incantesimi', 1, 7),
    ('Draco Malfoy', 'Pozioni', 1, 9),
    ('Draco Malfoy', 'Trasfigurazione', 1, 7),
    ('Padma Patil', 'Erbologia', 1, 8),
    ('Padma Patil', 'Incantesimi', 1, 9),
    ('Padma Patil', 'Pozioni', 1, 7),
    ('Padma Patil', 'Trasfigurazione', 1, 8),
    ('Fred Weasley', 'Erbologia', 3, 5),
    ('Fred Weasley', 'Incantesimi', 3, 7),
    ('Fred Weasley', 'Pozioni', 3, 6),
    ('Fred Weasley', 'Trasfigurazione', 3, 6),
    ('George Weasley', 'Erbologia', 3, 5),
    ('George Weasley', 'Incantesimi', 3, 7),
    ('George Weasley', 'Pozioni', 3, 6),
    ('George Weasley', 'Trasfigurazione', 3, 6),
    ('Cedric Diggory', 'Erbologia', 3, 8),
    ('Cedric Diggory', 'Incantesimi', 3, 8),
    ('Cedric Diggory', 'Pozioni', 3, 7),
    ('Cedric Diggory', 'Trasfigurazione', 3, 8);
