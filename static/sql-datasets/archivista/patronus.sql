-- Dataset «patronus» — Volume 3, lezione «Il valore che non c'è: NULL».
-- Gli studenti dell'Esercito di Silente nel 1995-96, più Draco Malfoy, con il
-- loro Patronus. Draco non ne ha uno secondo J. K. Rowling (citata da HP
-- Lexicon); a Neville nessuna fonte ne assegna uno. La loro cella è NULL.
-- La casa di studente è una chiave esterna senza NOT NULL: una riga può non
-- nominare nessuna casa, ed è accettata.
--
-- FILE GENERATO da scripts/archivio-sql.mjs a partire da case.json e da
-- PATRONUS nello script. Non modificarlo a mano: lancia `npm run archivio:sql`.

CREATE TABLE casa (
    nome     TEXT PRIMARY KEY,
    colori   TEXT NOT NULL,
    animale  TEXT NOT NULL
);

CREATE TABLE studente (
    nome      TEXT    PRIMARY KEY,
    casa      TEXT    REFERENCES casa(nome),
    anno      INTEGER NOT NULL,
    patronus  TEXT
);

INSERT INTO casa (nome, colori, animale) VALUES
    ('Grifondoro', 'rosso e oro', 'leone'),
    ('Serpeverde', 'verde e argento', 'serpente'),
    ('Corvonero', 'blu e bronzo', 'aquila'),
    ('Tassofrasso', 'giallo e nero', 'tasso');

INSERT INTO studente (nome, casa, anno, patronus) VALUES
    ('Harry Potter', 'Grifondoro', 5, 'cervo'),
    ('Hermione Granger', 'Grifondoro', 5, 'lontra'),
    ('Ron Weasley', 'Grifondoro', 5, 'terrier'),
    ('Ginny Weasley', 'Grifondoro', 4, 'cavallo'),
    ('Luna Lovegood', 'Corvonero', 4, 'lepre'),
    ('Cho Chang', 'Corvonero', 6, 'cigno'),
    ('Seamus Finnigan', 'Grifondoro', 5, 'volpe'),
    ('Ernie Macmillan', 'Tassofrasso', 5, 'cinghiale'),
    ('Neville Longbottom', 'Grifondoro', 5, NULL),
    ('Draco Malfoy', 'Serpeverde', 5, NULL);
