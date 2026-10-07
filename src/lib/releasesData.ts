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
    v: '0.17.0',
    date: '7 ottobre 2026',
    latest: true,
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
