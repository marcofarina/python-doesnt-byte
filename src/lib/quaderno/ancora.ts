/**
 * Descrivere un pezzo di testo e ritrovarlo dopo che la lezione è stata
 * riscritta (tabella «Scelte di default» del piano, riga «Ancoraggio»).
 *
 * Ricerca esatta → se il testo compare più volte, sceglie con contesto, titolo
 * e offset → se non compare, ricerca approssimata (al massimo un errore ogni
 * cinque caratteri) → altrimenti l'annotazione è orfana (null). Il punteggio
 * segue quello di Hypothesis (client/src/annotator/anchoring/match-quote.ts):
 * pesa il testo, poi il contesto prima e dopo, e solo per ultimo la posizione.
 */
import search from 'approx-string-match';

import { CONTESTO, type Selettore } from './tipi';
import { titoloPrima, type TestoPagina } from './testo';

export function descrivi(
  t: TestoPagina,
  inizio: number,
  fine: number,
): Selettore {
  return {
    esatto: t.testo.slice(inizio, fine),
    prima: t.testo.slice(Math.max(0, inizio - CONTESTO), inizio),
    dopo: t.testo.slice(fine, fine + CONTESTO),
    inizio,
    titolo: titoloPrima(t, inizio),
  };
}

const PESO = { testo: 50, prima: 20, dopo: 20, titolo: 5, posizione: 2 };
const PESO_TOTALE = Object.values(PESO).reduce((a, b) => a + b, 0);

/** 1 se `atteso` compare in `vicino` senza errori, 0 se non c'entra niente. */
function somiglianza(vicino: string, atteso: string): number {
  if (!atteso) return 1;
  if (!vicino) return 0;
  const m = search(vicino, atteso, atteso.length);
  if (!m.length) return 0;
  return 1 - Math.min(...m.map((x) => x.errors)) / atteso.length;
}

function punteggio(
  t: TestoPagina,
  s: Selettore,
  inizio: number,
  fine: number,
  errori: number,
): number {
  const testo = 1 - errori / Math.max(1, s.esatto.length);
  const prima = somiglianza(
    t.testo.slice(Math.max(0, inizio - s.prima.length), inizio),
    s.prima,
  );
  const dopo = somiglianza(t.testo.slice(fine, fine + s.dopo.length), s.dopo);
  const titolo = titoloPrima(t, inizio) === s.titolo ? 1 : 0;
  const posizione =
    1 - Math.abs(inizio - s.inizio) / Math.max(1, t.testo.length);
  return (
    (PESO.testo * testo +
      PESO.prima * prima +
      PESO.dopo * dopo +
      PESO.titolo * titolo +
      PESO.posizione * posizione) /
    PESO_TOTALE
  );
}

export function ancora(
  t: TestoPagina,
  s: Selettore,
): { inizio: number; fine: number } | null {
  if (!s.esatto) return null;
  const candidati: { inizio: number; fine: number; errori: number }[] = [];
  for (let i = t.testo.indexOf(s.esatto); i >= 0; ) {
    candidati.push({ inizio: i, fine: i + s.esatto.length, errori: 0 });
    i = t.testo.indexOf(s.esatto, i + 1);
  }
  if (candidati.length === 1) {
    const { inizio, fine } = candidati[0];
    return { inizio, fine };
  }
  if (!candidati.length) {
    const massimo = Math.floor(s.esatto.length / 5);
    if (massimo === 0) return null;
    for (const m of search(t.testo, s.esatto, massimo))
      candidati.push({ inizio: m.start, fine: m.end, errori: m.errors });
    if (!candidati.length) return null;
  }
  let migliore = candidati[0];
  let record = -1;
  for (const c of candidati) {
    const p = punteggio(t, s, c.inizio, c.fine, c.errori);
    if (p > record) {
      record = p;
      migliore = c;
    }
  }
  if (migliore.errori === 0)
    return { inizio: migliore.inizio, fine: migliore.fine };
  return agganciaParole(t.testo, s, migliore.inizio, migliore.fine);
}

const LETTERA = /[\p{L}\p{N}]/u;
const lettera = (c: string | undefined) => c !== undefined && LETTERA.test(c);

/**
 * La ricerca approssimata preferisce il risultato con meno errori, che può
 * finire a metà di una parola cambiata («carta.» contro «cartone.» finisce su
 * «carto»). Se il testo originale cominciava o finiva su un bordo di parola,
 * il bordo ritrovato si allarga fino alla parola intera, e alla punteggiatura
 * finale se è la stessa.
 */
function agganciaParole(
  testo: string,
  s: Selettore,
  inizio: number,
  fine: number,
): { inizio: number; fine: number } {
  const e = s.esatto;
  if (!lettera(e[0]) || !lettera(s.prima.at(-1)))
    while (inizio > 0 && lettera(testo[inizio - 1]) && lettera(testo[inizio]))
      inizio--;
  const ultimo = e.at(-1);
  if (!lettera(ultimo) || !lettera(s.dopo[0])) {
    while (
      fine < testo.length &&
      lettera(testo[fine - 1]) &&
      lettera(testo[fine])
    )
      fine++;
    if (
      ultimo &&
      !lettera(ultimo) &&
      !/\s/.test(ultimo) &&
      testo[fine] === ultimo
    )
      fine++;
  }
  return { inizio, fine };
}
