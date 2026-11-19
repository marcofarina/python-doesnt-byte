/**
 * Le pagine con l'evidenziatore: le quattro istanze dei volumi più la sandbox
 * `docs/quaderno-test.mdx` (tabella «Scelte di default» del piano). La chiave
 * di una pagina è `<pluginId>/<docId>`: stabile fra le release, non dipende
 * dall'URL.
 */
const VOLUMI = new Set([
  'programmatore',
  'artefice',
  'archivista',
  'apprendista',
]);
const SANDBOX = 'default/quaderno-test';

/** La chiave della pagina, o null se la pagina non ha l'evidenziatore. */
export function chiavePagina(pluginId: string, docId: string): string | null {
  const chiave = `${pluginId}/${docId}`;
  return VOLUMI.has(pluginId) || chiave === SANDBOX ? chiave : null;
}

/** Il contenitore del testo della lezione (src/theme/DocItem/Content). */
export const SELETTORE_RADICE = '.theme-doc-markdown';
