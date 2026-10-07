import { createContext } from 'react';

/**
 * Contratto fra i runner (PyRunner, SQLRunner) e i componenti che reagiscono
 * alla loro esecuzione (<Spoiler>, <Challenge>).
 *
 * - Il nodo radice di ogni runner porta l'attributo `data-runner`, anche nel
 *   fallback SSR: chi cerca «il runner che mi precede» lo trova già prima che
 *   BrowserOnly monti il componente vero.
 * - A fine esecuzione, riuscita o con errore, il runner emette
 *   `pdb:runner-done` dal proprio nodo radice, con `bubbles: true`: chi ascolta
 *   su `document` riconosce il runner da `event.target`.
 * - `event.detail` è sempre un {@link RunnerDoneDetail}. Fuori da un
 *   <Challenge> `esito` vale `null`; dentro, il runner esegue la verifica e
 *   riporta l'esito. <Spoiler> ignora il detail: per lui conta l'esecuzione.
 * - Un runner sa di essere un esercizio leggendo {@link ChallengeContext}:
 *   se il valore non è `null`, il blocco `### POST` è la verifica e non va
 *   accodato al codice dello studente.
 */
export const RUNNER_ATTR = 'data-runner';
export const RUNNER_SELECTOR = '[data-runner]';
export const RUNNER_DONE_EVENT = 'pdb:runner-done';

/**
 * - `risolto`: il codice dello studente è arrivato in fondo e la verifica passa.
 * - `non-risolto`: la verifica non passa (assert fallito o errore nella verifica).
 * - `errore`: il codice dello studente ha sollevato un'eccezione; la verifica
 *   non è partita.
 */
export type Esito = 'risolto' | 'non-risolto' | 'errore';

export interface RunnerDoneDetail {
  esito: Esito | null;
  /**
   * Il messaggio dell'`assert` fallito, da mostrare allo studente. `null`
   * quando non c'è (assert senza messaggio, errore nella verifica, esito
   * diverso da `non-risolto`): il componente mostra un testo generico.
   */
  messaggio: string | null;
}

const NO_CHALLENGE: RunnerDoneDetail = { esito: null, messaggio: null };

export function emitRunnerDone(
  root: HTMLElement | null,
  detail: RunnerDoneDetail = NO_CHALLENGE,
): void {
  root?.dispatchEvent(
    new CustomEvent<RunnerDoneDetail>(RUNNER_DONE_EVENT, {
      bubbles: true,
      detail,
    }),
  );
}

/** Quello che un <Challenge> dice al runner che contiene. */
export interface ChallengeState {
  /** L'esercizio è stato risolto almeno una volta da quando la pagina è aperta. */
  solved: boolean;
}

/** `null` = il runner non è dentro un <Challenge>: comportamento normale. */
export const ChallengeContext = createContext<ChallengeState | null>(null);
