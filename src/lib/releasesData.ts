// releasesData.ts — dati della pagina "Note di rilascio" (/note-di-rilascio).
//
// ⚠️ DATI SEGNAPOSTO. Le due voci qui sotto servono solo a mostrare come si
// comporta la pagina (blocco feature, gruppi per categoria, badge "Ultima",
// filtri, timeline). La cronologia reale partirà dalla v1.0.0 al rilascio
// ufficiale: a quel punto svuota `RELEASES` e aggiungi le voci vere — la più
// recente in cima, con `latest: true`. Una sola voce può popolare più
// categorie; tutte sono opzionali.

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
    v: '2.3.0',
    date: '12 giugno 2026',
    latest: true,
    feature: {
      title: 'Visualizzatore di algoritmi interattivo',
      body: 'Ordina, cerca, ripeti: i principali algoritmi del primo volume ora si eseguono passo-passo direttamente nella pagina, con controllo della velocità e confronti evidenziati in tempo reale.',
      shot: 'Visualizzatore Algoritmi',
    },
    notes: {
      new: [
        'Visualizzatore interattivo per Bubble Sort, Selection Sort e ricerca binaria',
        'Selettore del carattere: leggi in serif o sans con un clic',
        'Scorciatoia da tastiera per saltare tra i capitoli',
      ],
      content: [
        'Nuovo capitolo «Ricorsione» nel Manuale del Programmatore',
        'Sezione «Comprensioni di lista» ampliata con cinque nuovi esempi',
      ],
      improved: [
        'Caricamento delle pagine più rapido sui dispositivi lenti',
        'Evidenziazione della sintassi più precisa per f-string e decoratori',
      ],
      fixed: [
        'Il pulsante «Esegui» restava bloccato dopo un errore di runtime',
        'Alcuni refusi nel capitolo «Cicli for»',
      ],
      cleanup: ['Aggiornate le dipendenze di Docusaurus'],
    },
  },
  {
    v: '2.2.1',
    date: '28 maggio 2026',
    notes: {
      fixed: [
        'Il menu laterale non si chiudeva dopo aver scelto un capitolo su mobile',
        'I blocchi di codice molto lunghi uscivano dal margine in lettura serif',
        'Il tema scuro non veniva ricordato fra una visita e l’altra',
      ],
      cleanup: [
        'Messaggi d’errore dei blocchi di codice più chiari e specifici',
        'Ridotto il peso delle immagini di copertina dei volumi',
      ],
    },
  },
];
