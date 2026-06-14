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
    text: 'A ogni giro cerco il numero più piccolo della parte non ordinata e lo porto in testa.',
  });

  for (let i = 0; i <= n - 2; i++) {
    let min = i;
    steps.push({
      op: 'pointer',
      name: 'min',
      i,
      note: `Per ora il più piccolo è ${a[i]}.`,
    });
    for (let j = i + 1; j <= n - 1; j++) {
      steps.push({
        op: 'compare',
        i: j,
        j: min,
        note: `Confronto ${a[j]} con il minimo attuale, ${a[min]}.`,
      });
      if (a[j] < a[min]) {
        min = j;
        steps.push({
          op: 'pointer',
          name: 'min',
          i: j,
          note: `${a[j]} è più piccolo: è il nuovo minimo.`,
        });
      }
    }
    if (min !== i) {
      steps.push({
        op: 'swap',
        i,
        j: min,
        note: `Porto ${a[min]} all’inizio della parte non ordinata.`,
      });
      [a[i], a[min]] = [a[min], a[i]];
    } else {
      steps.push({ op: 'note', note: `${a[i]} è già al posto giusto.` });
    }
    steps.push({ op: 'markSorted', indices: [i] });
  }

  steps.push({ op: 'pointer', name: 'min', i: null });
  steps.push({ op: 'markSorted', indices: [n - 1] });
  steps.push({
    op: 'phase',
    text: 'Tutti i numeri sono al loro posto: ho finito.',
  });

  return { initial: data.slice(), steps };
}

export const selectionSort: GeneratorDef = {
  id: 'selection-sort',
  label: 'Selection sort',
  kind: 'sort',
  defaultData: [9, 5, 3, 1, 2, 8, 6, 4, 7],
  generate,
};
