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
    text: 'Scelgo un perno e divido i numeri: prima i più piccoli, poi il perno, poi i più grandi. Ripeto sulle due parti.',
  });

  function qs(lo: number, hi: number): void {
    if (lo > hi) return;
    if (lo === hi) {
      steps.push({
        op: 'markSorted',
        indices: [lo],
        note: 'Un numero da solo è già al suo posto.',
      });
      return;
    }
    steps.push({ op: 'range', lo, hi, label: 'partiziono' });
    const pivot = a[hi];
    steps.push({
      op: 'pointer',
      name: 'P',
      i: hi,
      note: `Il perno è ${pivot}.`,
    });
    let i = lo;
    steps.push({ op: 'pointer', name: 'L', i });
    for (let j = lo; j <= hi - 1; j++) {
      steps.push({ op: 'pointer', name: 'R', i: j });
      steps.push({
        op: 'compare',
        i: j,
        j: hi,
        note: `${a[j]} è più piccolo del perno ${pivot}?`,
      });
      if (a[j] < pivot) {
        if (i !== j) {
          steps.push({
            op: 'swap',
            i,
            j,
            note: 'Sì: lo sposto nella zona dei più piccoli.',
          });
          [a[i], a[j]] = [a[j], a[i]];
        } else {
          steps.push({ op: 'note', note: 'Sì, ed è già nella zona giusta.' });
        }
        i += 1;
        steps.push({ op: 'pointer', name: 'L', i });
      } else {
        steps.push({ op: 'note', note: 'No: per ora resta dov’è.' });
      }
    }
    if (i !== hi) {
      steps.push({
        op: 'swap',
        i,
        j: hi,
        note: 'Metto il perno tra le due zone: è al suo posto definitivo.',
      });
      [a[i], a[hi]] = [a[hi], a[i]];
    } else {
      steps.push({
        op: 'note',
        note: 'Il perno è già al suo posto definitivo.',
      });
    }
    steps.push({ op: 'markSorted', indices: [i] });
    steps.push({ op: 'pointer', name: 'L', i: null });
    steps.push({ op: 'pointer', name: 'R', i: null });
    steps.push({ op: 'pointer', name: 'P', i: null });
    steps.push({ op: 'clearRange' });
    qs(lo, i - 1);
    qs(i + 1, hi);
  }

  qs(0, n - 1);
  steps.push({
    op: 'phase',
    text: 'Tutti i numeri sono al loro posto: ho finito.',
  });

  return { initial: data.slice(), steps };
}

export const quicksort: GeneratorDef = {
  id: 'quicksort',
  label: 'Quicksort',
  kind: 'sort',
  defaultData: [3, 5, 4, 1, 2, 9, 8, 7, 6],
  generate,
};
