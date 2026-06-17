// Costanti condivise del sito: riferimenti che potrebbero cambiare nel tempo
// (mail di contatto, ecc.), centralizzati qui per non hardcodarli nei componenti.
// Importa da '@site/src/lib/site' dove servono.

/** Email di contatto pubblica. */
export const CONTACT_EMAIL = 'marco@rainbowbits.cloud';

/** Pronta per `href={...}` di un link mail. */
export const CONTACT_MAILTO = `mailto:${CONTACT_EMAIL}`;
