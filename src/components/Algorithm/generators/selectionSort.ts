import type {
  ArrayStep,
  ArrayTrace,
  GeneratorDef,
  GeneratorInput,
} from '../types';

const CODE = [
  'def selection_sort(a):', // 0
  '    n = len(a)', // 1
  '    for i in range(n):', // 2
  '        m = i', // 3
  '        for j in range(i + 1, n):', // 4
  '            if a[j] < a[m]:', // 5
  '                m = j', // 6
  '        a[i], a[m] = a[m], a[i]', // 7
  '    return a', // 8
];

function generate({ data }: GeneratorInput): ArrayTrace {
  const a = data.slice();
  const n = a.length;
  const steps: ArrayStep[] = [];

  steps.push({
    op: 'phase',
    line: 1,
    text: 'A ogni giro cerco il numero più piccolo della parte non ordinata e lo porto in testa.',
  });

  for (let i = 0; i <= n - 2; i++) {
    let min = i;
    steps.push({
      op: 'pointer',
      name: 'min',
      i,
      line: 3,
      note: `Per ora il più piccolo è ${a[i]}.`,
    });
    for (let j = i + 1; j <= n - 1; j++) {
      steps.push({
        op: 'compare',
        i: j,
        j: min,
        line: 5,
        note: `Confronto ${a[j]} con il minimo attuale, ${a[min]}.`,
      });
      if (a[j] < a[min]) {
        min = j;
        steps.push({
          op: 'pointer',
          name: 'min',
          i: j,
          line: 6,
          note: `${a[j]} è più piccolo: è il nuovo minimo.`,
        });
      }
    }
    if (min !== i) {
      steps.push({
        op: 'swap',
        i,
        j: min,
        line: 7,
        note: `Porto ${a[min]} all’inizio della parte non ordinata.`,
      });
      [a[i], a[min]] = [a[min], a[i]];
    } else {
      steps.push({
        op: 'note',
        line: 7,
        note: `${a[i]} è già al posto giusto.`,
      });
    }
    steps.push({ op: 'markSorted', indices: [i], line: 2 });
  }

  steps.push({ op: 'pointer', name: 'min', i: null });
  steps.push({ op: 'markSorted', indices: [n - 1], line: 8 });
  steps.push({
    op: 'phase',
    line: 8,
    text: 'Tutti i numeri sono al loro posto: ho finito.',
  });

  return { initial: data.slice(), steps };
}

export const selectionSort: GeneratorDef = {
  id: 'selection-sort',
  label: 'Selection sort',
  kind: 'sort',
  file: 'selection_sort.py',
  complexity: 'O(n²)',
  blurb: 'Trova il minimo della parte non ordinata e lo porta in testa.',
  code: CODE,
  defaultData: [9, 5, 3, 1, 2, 8, 6, 4, 7],
  generate,
};
