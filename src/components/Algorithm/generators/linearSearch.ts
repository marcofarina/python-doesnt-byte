import type {
  ArrayStep,
  ArrayTrace,
  GeneratorDef,
  GeneratorInput,
} from '../types';
import { pickSearchTarget } from './pickTarget';

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
  file: 'linear_search.py',
  complexity: 'O(n)',
  blurb: 'Scorre gli elementi uno a uno finché non trova il valore cercato.',
  defaultData: [4, 7, 1, 9, 3, 6, 2],
  pickTarget: pickSearchTarget,
  generate,
};
