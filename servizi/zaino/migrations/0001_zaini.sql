-- Zaini cifrati: il servizio non sa leggere `blob` (IV di 12 byte ‖ testo
-- cifrato AES-GCM). `versione` cresce a ogni scrittura ed è l'ETag;
-- `aggiornato` (millisecondi Unix) serve a cancellare gli zaini fermi.
CREATE TABLE zaini (
  id TEXT PRIMARY KEY,
  blob BLOB NOT NULL,
  versione INTEGER NOT NULL,
  aggiornato INTEGER NOT NULL
);
