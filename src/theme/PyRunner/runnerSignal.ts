/**
 * Contratto fra i runner (PyRunner, SQLRunner) e i componenti che reagiscono
 * alla loro esecuzione (oggi <Spoiler>).
 *
 * - Il nodo radice di ogni runner porta l'attributo `data-runner`, anche nel
 *   fallback SSR: chi cerca «il runner che mi precede» lo trova già prima che
 *   BrowserOnly monti il componente vero.
 * - A fine esecuzione, riuscita o con errore, il runner emette
 *   `pdb:runner-done` dal proprio nodo radice, con `bubbles: true`: chi ascolta
 *   su `document` riconosce il runner da `event.target`.
 */
export const RUNNER_ATTR = 'data-runner';
export const RUNNER_SELECTOR = '[data-runner]';
export const RUNNER_DONE_EVENT = 'pdb:runner-done';

export function emitRunnerDone(root: HTMLElement | null): void {
  root?.dispatchEvent(new CustomEvent(RUNNER_DONE_EVENT, { bubbles: true }));
}
