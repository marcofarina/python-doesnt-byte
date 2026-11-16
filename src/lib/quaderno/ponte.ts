/**
 * Ponte fra l'Evidenziatore e il pannello Note (piano
 * pm/piano-2026-11-quaderno.md, fase Q2).
 *
 * - L'Evidenziatore ancora le annotazioni della pagina e pubblica qui dove sta
 *   ciascuna (`posti`): il pannello le mette in ordine di testo, allinea le
 *   schede al loro testo e sa quali sono orfane.
 * - La bozza è una nota nuova non ancora salvata: esiste solo qui, finché lo
 *   studente non preme «Salva». Così una nota abbandonata non lascia
 *   annotazioni vuote nel quaderno.
 * - Una richiesta chiede alla Colonna di aprire il pannello Note su una
 *   scheda, in lettura o in modifica (clic su un testo con nota, «Nota» nella
 *   barra o nel menu).
 *
 * Stato di pagina, in memoria: l'Evidenziatore lo azzera quando la pagina cambia.
 */
import { useSyncExternalStore } from 'react';

import type { Selettore } from './tipi';

export interface Posto {
  inizio: number;
  fine: number;
  range: Range;
}

export interface Richiesta {
  /** Id dell'annotazione, o `ID_BOZZA`. */
  id: string;
  modifica: boolean;
  /** Cresce a ogni richiesta: la stessa scheda si può chiedere due volte. */
  n: number;
}

export interface StatoPonte {
  /** L'Evidenziatore ha ancorato la pagina almeno una volta. */
  pronto: boolean;
  /** Id → posto nel testo; mancano le orfane. La bozza ha id `ID_BOZZA`. */
  posti: ReadonlyMap<string, Posto>;
  bozza: Selettore | null;
  richiesta: Richiesta | null;
}

export const ID_BOZZA = 'bozza';

const VUOTO: StatoPonte = {
  pronto: false,
  posti: new Map(),
  bozza: null,
  richiesta: null,
};

let stato: StatoPonte = VUOTO;
let contatore = 0;
const ascoltatori = new Set<() => void>();

function cambia(nuovo: StatoPonte): void {
  stato = nuovo;
  for (const f of ascoltatori) f();
}

function iscriviti(f: () => void): () => void {
  ascoltatori.add(f);
  return () => ascoltatori.delete(f);
}

export function usePonte(): StatoPonte {
  return useSyncExternalStore(
    iscriviti,
    () => stato,
    () => VUOTO,
  );
}

/** Il browser sa disegnare gli highlight? Senza, l'evidenziatore è spento. */
export function evidenziatoreSupportato(): boolean {
  return (
    typeof CSS !== 'undefined' &&
    !!CSS.highlights &&
    typeof Highlight === 'function'
  );
}

export function pubblicaPosti(posti: ReadonlyMap<string, Posto>): void {
  cambia({ ...stato, pronto: true, posti });
}

/** Pagina lasciata: niente posti, niente bozza, niente richieste. */
export function azzeraPonte(): void {
  cambia(VUOTO);
}

export function chiediScheda(id: string, modifica = false): void {
  contatore += 1;
  cambia({ ...stato, richiesta: { id, modifica, n: contatore } });
}

/** Una nota nuova sul testo descritto da `selettore`, aperta in modifica. */
export function iniziaBozza(selettore: Selettore): void {
  contatore += 1;
  cambia({
    ...stato,
    bozza: selettore,
    richiesta: { id: ID_BOZZA, modifica: true, n: contatore },
  });
}

export function chiudiBozza(): void {
  if (stato.bozza) cambia({ ...stato, bozza: null });
}

export function consumaRichiesta(n: number): void {
  if (stato.richiesta?.n === n) cambia({ ...stato, richiesta: null });
}
