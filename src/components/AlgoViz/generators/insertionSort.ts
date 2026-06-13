import type {
  ArrayStep,
  ArrayTrace,
  GeneratorDef,
  GeneratorInput,
} from '../types';

function generate({ data }: GeneratorInput): ArrayTrace {
  const a = data.slice();
  const n = a.length;
  const steps: ArrayStep[] = [];

  steps.push({
    op: 'phase',
    text: 'Prendo i numeri uno alla volta e li inserisco al posto giusto tra quelli già sistemati.',
  });
  steps.push({
    op: 'markSorted',
    indices: [0],
    note: 'Il primo numero, da solo, è già “ordinato”.',
  });

  for (let i = 1; i <= n - 1; i++) {
    const key = a[i];
    steps.push({
      op: 'extract',
      i,
      note: `Estraggo ${key} e gli cerco il posto tra i numeri a sinistra.`,
    });
    let j = i - 1;
    while (j >= 0 && a[j] > key) {
      steps.push({
        op: 'compareExtracted',
        i: j,
        note: `${a[j]} è più grande di ${key}: lo faccio scorrere a destra.`,
      });
      steps.push({ op: 'shiftRight', from: j });
      a[j + 1] = a[j];
      j -= 1;
    }
    if (j >= 0) {
      steps.push({
        op: 'compareExtracted',
        i: j,
        note: `${a[j]} non è più grande di ${key}: il posto è qui accanto.`,
      });
    }
    steps.push({ op: 'insertAt', i: j + 1, note: `Inserisco ${key}.` });
    a[j + 1] = key;
    const range: number[] = [];
    for (let k = 0; k <= i; k++) range.push(k);
    steps.push({ op: 'markSorted', indices: range });
  }

  steps.push({
    op: 'phase',
    text: 'Tutti i numeri sono al loro posto: ho finito.',
  });

  return { initial: data.slice(), steps };
}

export const insertionSort: GeneratorDef = {
  id: 'insertion-sort',
  label: 'Insertion sort',
  kind: 'sort',
  defaultData: [3, 4, 5, 7, 2, 8, 6, 9, 1],
  generate,
};
