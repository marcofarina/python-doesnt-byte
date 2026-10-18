-- Dataset «corsi-colonna» — Volume 3, lezione «Le associazioni molti a molti».
-- I corsi seguiti da ogni studente scritti in una sola colonna di testo: è
-- l'errore che la lezione mostra (nessuna cella è uguale a 'Pozioni').
--
-- FILE GENERATO da scripts/archivio-sql.mjs a partire da
-- static/archivio/hogwarts/studenti.json e da MATERIE nello script.
-- Non modificarlo a mano: lancia `npm run archivio:sql`.

CREATE TABLE studente (
    nome   TEXT    PRIMARY KEY,
    casa   TEXT    NOT NULL,
    anno   INTEGER NOT NULL,
    corsi  TEXT    NOT NULL
);

INSERT INTO studente (nome, casa, anno, corsi) VALUES
    ('Harry Potter', 'Grifondoro', 1, 'Erbologia, Incantesimi, Pozioni, Trasfigurazione'),
    ('Hermione Granger', 'Grifondoro', 1, 'Erbologia, Incantesimi, Pozioni, Trasfigurazione'),
    ('Ron Weasley', 'Grifondoro', 1, 'Erbologia, Incantesimi, Pozioni, Trasfigurazione'),
    ('Neville Longbottom', 'Grifondoro', 1, 'Erbologia, Incantesimi, Pozioni, Trasfigurazione'),
    ('Draco Malfoy', 'Serpeverde', 1, 'Erbologia, Incantesimi, Pozioni, Trasfigurazione'),
    ('Padma Patil', 'Corvonero', 1, 'Erbologia, Incantesimi, Pozioni, Trasfigurazione'),
    ('Fred Weasley', 'Grifondoro', 3, 'Erbologia, Incantesimi, Pozioni, Trasfigurazione'),
    ('George Weasley', 'Grifondoro', 3, 'Erbologia, Incantesimi, Pozioni, Trasfigurazione'),
    ('Cedric Diggory', 'Tassofrasso', 3, 'Erbologia, Incantesimi, Pozioni, Trasfigurazione');
