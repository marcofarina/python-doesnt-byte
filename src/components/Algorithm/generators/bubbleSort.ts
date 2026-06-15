import type {
  ArrayStep,
  ArrayTrace,
  GeneratorDef,
  GeneratorInput,
} from '../types';

// Righe di pseudocodice (indice 0-based = valore di `line` negli step).
const CODE = [
  'def bubble_sort(a):', // 0
  '    n = len(a)', // 1
  '    for i in range(n - 1):', // 2
  '        for j in range(n - 1 - i):', // 3
  '            if a[j] > a[j + 1]:', // 4
  '                a[j], a[j+1] = a[j+1], a[j]', // 5
  '    return a', // 6
];

function generate({ data }: GeneratorInput): ArrayTrace {
  const a = data.slice();
  const n = a.length;
  const steps: ArrayStep[] = [];

  steps.push({
    op: 'phase',
    line: 1,
    text: 'Confronto i numeri vicini a due a due e, se sono nell’ordine sbagliato, li scambio: a ogni passata il più grande «risale» verso il fondo.',
  });

  let brokeEarly = false;
  for (let pass = 0; pass <= n - 2; pass++) {
    let swapped = false;
    for (let j = 0; j <= n - 2 - pass; j++) {
      steps.push({
        op: 'compare',
        i: j,
        j: j + 1,
        line: 4,
        cursor: { i: j, label: 'j' },
        note: `La coppia ${a[j]} e ${a[j + 1]}: il primo è più grande del secondo? Se sì, sono nell’ordine sbagliato.`,
      });
      if (a[j] > a[j + 1]) {
        const maggiore = a[j];
        steps.push({
          op: 'swap',
          i: j,
          j: j + 1,
          line: 5,
          cursor: { i: j, label: 'j' },
          note: `${maggiore} è più grande di ${a[j + 1]}: erano invertiti, li scambio così il maggiore scala verso destra.`,
        });
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        swapped = true;
      } else {
        steps.push({
          op: 'note',
          line: 4,
          cursor: { i: j, label: 'j' },
          note: `${a[j]} non supera ${a[j + 1]}: la coppia è già ordinata, la lascio com’è e proseguo.`,
        });
      }
    }
    steps.push({
      op: 'markSorted',
      indices: [n - 1 - pass],
      line: 3,
      note: `Passata finita: ${a[n - 1 - pass]} era il più grande tra quelli rimasti ed è arrivato in fondo. Da qui non lo tocco più.`,
    });
    if (!swapped) {
      const rest: number[] = [];
      for (let k = 0; k <= n - 2 - pass; k++) rest.push(k);
      if (rest.length) steps.push({ op: 'markSorted', indices: rest, line: 6 });
      steps.push({
        op: 'phase',
        line: 6,
        cursor: null,
        text: 'Una passata senza nemmeno uno scambio significa che è già tutto in ordine: posso fermarmi qui.',
      });
      brokeEarly = true;
      break;
    }
  }

  if (!brokeEarly) {
    steps.push({ op: 'markSorted', indices: [0], line: 6 });
    steps.push({
      op: 'phase',
      line: 6,
      cursor: null,
      text: 'Ogni numero è al suo posto: l’ordinamento è finito.',
    });
  }

  return { initial: data.slice(), steps };
}

export const bubbleSort: GeneratorDef = {
  id: 'bubble-sort',
  label: 'Bubble sort',
  kind: 'sort',
  file: 'bubble_sort.py',
  complexity: 'O(n²)',
  blurb: 'Confronta coppie adiacenti e le scambia finché non sono in ordine.',
  code: CODE,
  defaultData: [5, 3, 8, 1, 9, 2, 7],
  generate,
};
