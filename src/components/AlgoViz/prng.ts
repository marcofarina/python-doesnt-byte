/** PRNG deterministico (mulberry32): stesso seed → stessa sequenza.
 *  Serve per SSR/hydration: i dati di `shuffle` devono coincidere tra
 *  server e client, quindi NIENTE Math.random nel percorso di render. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Permutazione di 1..n via Fisher–Yates con rnd dato. */
export function shuffledRange(n: number, rnd: () => number): number[] {
  const arr = Array.from({ length: n }, (_, i) => i + 1);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
