import type {
  ArrayStep,
  ArrayTrace,
  GeneratorDef,
  GeneratorInput,
} from '../types';

/** Con probabilità 0.75 un elemento presente (esito «trovato»), altrimenti
 *  il più piccolo intero positivo assente (esito «non trovato»). */
function pickTarget(data: number[], rnd: () => number): number {
  if (rnd() < 0.75 && data.length > 0) {
    return data[Math.floor(rnd() * data.length)];
  }
  const present = new Set(data);
  let t = 1;
  while (present.has(t)) t += 1;
  return t;
}

function generate({ data, target }: GeneratorInput): ArrayTrace {
  const a = data.slice();
  const n = a.length;
  const tgt = target as number;
  const steps: ArrayStep[] = [];

  steps.push({
    op: 'phase',
    text: 'Controllo i numeri uno per uno, dal primo all’ultimo.',
  });

  for (let i = 0; i <= n - 1; i++) {
    steps.push({ op: 'pointer', name: 'i', i });
    steps.push({
      op: 'compareTarget',
      i,
      note: `${a[i]} è il numero che cerco?`,
    });
    if (a[i] === tgt) {
      steps.push({
        op: 'outcome',
        found: true,
        i,
        note: `Sì! ${tgt} è in posizione ${i}.`,
      });
      steps.push({ op: 'pointer', name: 'i', i: null });
      return { initial: data.slice(), target: tgt, steps };
    }
    steps.push({
      op: 'fade',
      indices: [i],
      note: 'No: lo scarto e vado avanti.',
    });
  }

  steps.push({ op: 'pointer', name: 'i', i: null });
  steps.push({
    op: 'outcome',
    found: false,
    note: `Li ho controllati tutti: ${tgt} non c’è.`,
  });

  return { initial: data.slice(), target: tgt, steps };
}

export const linearSearch: GeneratorDef = {
  id: 'linear-search',
  label: 'Ricerca lineare',
  kind: 'search',
  defaultData: [4, 7, 1, 9, 3, 6, 2],
  pickTarget,
  generate,
};
