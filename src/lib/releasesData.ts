// releasesData.ts — dati della pagina "Note di rilascio" (/note-di-rilascio).
//
// Fonte dei dati: questo file, scritto a mano. La cronologia pubblica parte
// dalla v0.16.0, la prima versione per gli studenti; le versioni precedenti
// erano lavoro di cantiere e restano nei tag git e in pm/board.json.
//
// Chi lo aggiorna: la procedura di rilascio (fase R7 del piano 0.16.0 e ogni
// release futura). Aggiungi la voce nuova IN CIMA con `latest: true` e togli
// `latest` dalla precedente. Una voce può popolare più categorie; tutte sono
// opzionali. Scrivi solo ciò che è davvero online in quella versione.

import { type IconName } from '@site/src/components/Icon';

/** Le cinque famiglie di modifiche di un rilascio. */
export type ReleaseCategory =
  | 'new' // Novità
  | 'content' // Contenuti
  | 'improved' // Migliorato
  | 'fixed' // Correzioni
  | 'cleanup'; // Pulizia

/** Blocco "in evidenza" di un rilascio (hero della voce). */
export interface ReleaseFeature {
  title: string;
  body: string;
  /** Etichetta dell'anteprima (segnaposto a strisce). In futuro potrà
      diventare il path di uno screenshot reale. */
  shot?: string;
}

export interface Release {
  /** numero di versione senza la "v" iniziale (es. "1.0.0") */
  v: string;
  /** data in chiaro, italiana (es. "12 giugno 2026") */
  date: string;
  /** marca la voce come l'ultima pubblicata (badge + nodo evidenziato) */
  latest?: boolean;
  feature?: ReleaseFeature;
  /** voci per categoria; ogni categoria è opzionale */
  notes: Partial<Record<ReleaseCategory, string[]>>;
}

/** Ordine di visualizzazione delle categorie dentro una voce e nei filtri. */
export const CAT_ORDER: ReleaseCategory[] = [
  'new',
  'content',
  'improved',
  'fixed',
  'cleanup',
];

/** Etichetta + icona per ogni categoria. I colori vivono nella pagina, perché
    dipendono dal tema (light/dark). */
export const CATEGORY_META: Record<
  ReleaseCategory,
  { label: string; icon: IconName }
> = {
  new: { label: 'Novità', icon: 'sparkles' },
  content: { label: 'Contenuti', icon: 'book-open' },
  improved: { label: 'Migliorato', icon: 'arrow-trend-up' },
  fixed: { label: 'Correzioni', icon: 'wrench' },
  cleanup: { label: 'Pulizia', icon: 'broom-wide' },
};

export const RELEASES: Release[] = [
  {
    v: '0.20.1',
    date: '20 ottobre 2026',
    latest: true,
    notes: {
      improved: [
        'Il libro ha un indirizzo suo: https://python.rainbowbits.cloud. I vecchi indirizzi rainbowbits.cloud/python-doesnt-byte portano alla stessa pagina in quello nuovo, anche dai link già condivisi.',
        'Il browser tiene i dati salvati separati per ogni indirizzo: chi aveva attivato un percorso lo ritrova riaprendo il link del percorso, oppure lo sceglie di nuovo dalla pagina Percorso.',
      ],
      fixed: [
        'I link che finiscono con la barra, come quelli condivisi su Classroom, aprono subito la pagina giusta, senza il lampo di «pagina non trovata».',
      ],
    },
  },
  {
    v: '0.20.0',
    date: '19 ottobre 2026',
    notes: {
      content: [
        'Volume 3, Manuale dell’Archivista: il capitolo 2, «Modellare il dominio», si completa con sei lezioni: «Le associazioni», «Le cardinalità», «Identificare senza ambiguità: le chiavi», «Le associazioni molti a molti», «Generalizzazioni» e «Leggere un dominio e ricavarne il modello».',
      ],
      improved: [
        'Nei diagrammi E/R la cardinalità di una linea è facoltativa, così le lezioni che vengono prima delle cardinalità disegnano linee senza etichetta; sono ammesse anche cardinalità numeriche come (2,2).',
      ],
    },
  },
  {
    v: '0.19.0',
    date: '15 ottobre 2026',
    notes: {
      content: [
        'Volume 3, Manuale dell’Archivista: si apre il capitolo 2, «Modellare il dominio», con la lezione «Entità e attributi».',
      ],
      new: [
        'Diagrammi E/R disegnati a mano libera, in notazione italiana: rettangoli per le entità, rombi per le associazioni, cerchi per gli attributi.',
        'Pannello «Database»: nelle lezioni del Volume 3 le tabelle come le ha lasciate l’ultimo blocco eseguito, con le righe nuove, modificate e tolte evidenziate.',
      ],
      improved: [
        'Nella pagina Supporta il totale raccolto si legge all’italiana, con la virgola.',
      ],
    },
  },
  {
    v: '0.18.0',
    date: '13 ottobre 2026',
    notes: {
      content: [
        'Volume 3, Manuale dell’Archivista: la terza lezione, «Che cosa fa un DBMS al posto tuo», che chiude il capitolo 1.',
        'Le introduzioni dei quattro volumi: obiettivi con conoscenze, abilità e competenze, e come è costruito ogni volume, capitolo per capitolo.',
        'Volume 3: le prime due lezioni rilette, con più callout e qualche momento più leggero.',
      ],
      new: [
        'Pannello «Archivio»: nelle lezioni del Volume 3 i file su cui si lavora, come punti.json e studenti.json, restano consultabili accanto al testo e si aprono a tutto schermo per la LIM.',
        'Nello SQLRunner una query può restare nascosta, con il solo risultato in vista: il pulsante «Mostra la query» la rivela.',
        'Nell’introduzione di ogni volume di teoria, una barra mostra quante lezioni sono uscite su quelle previste.',
      ],
      improved: [
        'Nella barra laterale le lezioni del Volume 3 sono raggruppate per capitolo.',
        'Nei confronti fra codice giusto e sbagliato, icone disegnate al posto delle emoji ✅ e ❌.',
      ],
    },
  },
  {
    v: '0.17.1',
    date: '7 ottobre 2026',
    notes: {
      fixed: [
        'Nei percorsi IT, Liceo e ITS compare anche la prima lezione del Volume 3, «I dati che non stanno più nel programma».',
      ],
    },
  },
  {
    v: '0.17.0',
    date: '7 ottobre 2026',
    notes: {
      content: [
        'Volume 3, Manuale dell’Archivista: la seconda lezione, «La stessa informazione scritta due volte».',
      ],
      new: [
        'Esercizi verificati: nel PyRunner e nello SQLRunner un esercizio può controllare da solo la risposta dello studente.',
        'Le soluzioni e le risposte alle domande di previsione restano nascoste finché non esegui il codice.',
      ],
    },
  },
  {
    v: '0.16.0',
    date: '6 ottobre 2026',
    notes: {
      new: ['Prima versione pubblica del libro per gli studenti.'],
      content: [
        'Volume 3, Manuale dell’Archivista: la prima lezione, «I dati che non stanno più nel programma».',
      ],
      fixed: [
        'Nel PyRunner funzionano import random e import os, e random.seed() produce le stesse sequenze di Python.',
      ],
      improved: [
        'L’indirizzo del sito è ora https://rainbowbits.cloud, senza www.',
      ],
    },
  },
];
