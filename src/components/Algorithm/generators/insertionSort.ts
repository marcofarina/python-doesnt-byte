import type {
  ArrayStep,
  ArrayTrace,
  GeneratorDef,
  GeneratorInput,
} from '../types';

const CODE = [
  'def insertion_sort(a):', // 0
  '    for i in range(1, len(a)):', // 1
  '        key = a[i]', // 2
  '        j = i - 1', // 3
  '        while j >= 0 and a[j] > key:', // 4
  '            a[j + 1] = a[j]', // 5
  '            j -= 1', // 6
  '        a[j + 1] = key', // 7
  '    return a', // 8
];

function generate({ data }: GeneratorInput): ArrayTrace {
  const a = data.slice();
  const n = a.length;
  const steps: ArrayStep[] = [];

  steps.push({
    op: 'phase',
    line: 1,
    text: 'Prendo i numeri uno alla volta e li inserisco al posto giusto tra quelli già sistemati.',
  });
  steps.push({
    op: 'markSorted',
    indices: [0],
    line: 1,
    note: 'Il primo numero, da solo, è già “ordinato”.',
  });

  for (let i = 1; i <= n - 1; i++) {
    const key = a[i];
    steps.push({
      op: 'extract',
      i,
      line: 2,
      note: `Estraggo ${key} e gli cerco il posto tra i numeri a sinistra.`,
    });
    let j = i - 1;
    while (j >= 0 && a[j] > key) {
      steps.push({
        op: 'compareExtracted',
        i: j,
        line: 4,
        note: `${a[j]} è più grande di ${key}: lo faccio scorrere a destra.`,
      });
      steps.push({ op: 'shiftRight', from: j, line: 5 });
      a[j + 1] = a[j];
      j -= 1;
    }
    if (j >= 0) {
      steps.push({
        op: 'compareExtracted',
        i: j,
        line: 4,
        note: `${a[j]} non è più grande di ${key}: il posto è qui accanto.`,
      });
    }
    steps.push({
      op: 'insertAt',
      i: j + 1,
      line: 7,
      note: `Inserisco ${key}.`,
    });
    a[j + 1] = key;
    const range: number[] = [];
    for (let k = 0; k <= i; k++) range.push(k);
    steps.push({ op: 'markSorted', indices: range, line: 7 });
  }

  steps.push({
    op: 'phase',
    line: 8,
    text: 'Tutti i numeri sono al loro posto: ho finito.',
  });

  return { initial: data.slice(), steps };
}

export const insertionSort: GeneratorDef = {
  id: 'insertion-sort',
  label: 'Insertion sort',
  kind: 'sort',
  file: 'insertion_sort.py',
  complexity: 'O(n²)',
  blurb: 'Inserisce ogni elemento al posto giusto nella parte già ordinata.',
  code: CODE,
  defaultData: [3, 4, 5, 7, 2, 8, 6, 9, 1],
  generate,
};
