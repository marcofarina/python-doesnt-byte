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
    text: 'Confronto le coppie di numeri vicini: a ogni giro il più grande “sale” in fondo.',
  });

  let brokeEarly = false;
  for (let pass = 0; pass <= n - 2; pass++) {
    let swapped = false;
    for (let j = 0; j <= n - 2 - pass; j++) {
      steps.push({
        op: 'compare',
        i: j,
        j: j + 1,
        note: `Confronto ${a[j]} e ${a[j + 1]}.`,
      });
      if (a[j] > a[j + 1]) {
        const maggiore = a[j];
        steps.push({
          op: 'swap',
          i: j,
          j: j + 1,
          note: `${maggiore} è più grande: li scambio.`,
        });
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        swapped = true;
      } else {
        steps.push({
          op: 'note',
          note: 'Sono già nell’ordine giusto: li lascio così.',
        });
      }
    }
    steps.push({
      op: 'markSorted',
      indices: [n - 1 - pass],
      note: `${a[n - 1 - pass]} è arrivato al suo posto.`,
    });
    if (!swapped) {
      const rest: number[] = [];
      for (let k = 0; k <= n - 2 - pass; k++) rest.push(k);
      if (rest.length) steps.push({ op: 'markSorted', indices: rest });
      steps.push({
        op: 'phase',
        text: 'Nessuno scambio in questo giro: la sequenza è ordinata.',
      });
      brokeEarly = true;
      break;
    }
  }

  if (!brokeEarly) {
    steps.push({ op: 'markSorted', indices: [0] });
    steps.push({
      op: 'phase',
      text: 'Tutti i numeri sono al loro posto: ho finito.',
    });
  }

  return { initial: data.slice(), steps };
}

export const bubbleSort: GeneratorDef = {
  id: 'bubble-sort',
  label: 'Bubble sort',
  kind: 'sort',
  defaultData: [5, 3, 8, 1, 9, 2, 7],
  generate,
};
