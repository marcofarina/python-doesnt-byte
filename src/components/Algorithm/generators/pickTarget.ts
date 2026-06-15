/** Sceglie il valore da cercare per i generatori di ricerca.
 *  Con probabilità 0.75 un elemento presente (esito «trovato»), altrimenti
 *  il più piccolo intero positivo assente (esito «non trovato»).
 *  rnd ∈ [0,1) dal PRNG seeded → determinismo SSR. */
export function pickSearchTarget(data: number[], rnd: () => number): number {
  if (rnd() < 0.75 && data.length > 0) {
    return data[Math.floor(rnd() * data.length)];
  }
  const present = new Set(data);
  let t = 1;
  while (present.has(t)) t += 1;
  return t;
}
