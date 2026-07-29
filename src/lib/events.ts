/**
 * Eventi custom di window condivisi tra componenti disaccoppiati.
 *
 * Tenerli qui (non come stringhe letterali sparse) evita che un dispatcher e il
 * suo listener divergano per un typo: una rinomina qui rompe in compilazione i
 * punti d'uso, invece di trasformare il click in un no-op silenzioso.
 */

/** Apre la modale di ricerca da fuori la navbar (es. il box «Cerca» della home). */
export const OPEN_SEARCH_EVENT = 'pdb:open-search';
