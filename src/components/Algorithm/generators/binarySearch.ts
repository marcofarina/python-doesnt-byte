import type {
  ArrayStep,
  ArrayTrace,
  GeneratorDef,
  GeneratorInput,
} from '../types';

/** Come la ricerca lineare, ma applicato al dato già ordinato. */
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
    text: 'La sequenza è ordinata: a ogni passo posso scartare metà dei numeri rimasti.',
  });

  let lo = 0;
  let hi = n - 1;
  // Nota della decisione precedente, mostrata sulla prossima op `range`.
  let pendingNote: string | undefined;

  while (lo <= hi) {
    steps.push({
      op: 'range',
      lo,
      hi,
      note: pendingNote ?? `Cerco tra le posizioni ${lo} e ${hi}.`,
    });
    pendingNote = undefined;
    const mid = (lo + hi) >> 1;
    steps.push({
      op: 'pointer',
      name: 'mid',
      i: mid,
      note: `Guardo il numero in mezzo: ${a[mid]}.`,
    });
    steps.push({
      op: 'compareTarget',
      i: mid,
      note: `${a[mid]} è il numero che cerco?`,
    });
    if (a[mid] === tgt) {
      steps.push({
        op: 'outcome',
        found: true,
        i: mid,
        note: `Trovato! ${tgt} è in posizione ${mid}.`,
      });
      steps.push({ op: 'pointer', name: 'mid', i: null });
      steps.push({ op: 'clearRange' });
      return { initial: data.slice(), target: tgt, steps };
    }
    if (a[mid] < tgt) {
      pendingNote = `${a[mid]} è troppo piccolo: scarto la metà sinistra.`;
      lo = mid + 1;
    } else {
      pendingNote = `${a[mid]} è troppo grande: scarto la metà destra.`;
      hi = mid - 1;
    }
  }

  steps.push({ op: 'pointer', name: 'mid', i: null });
  steps.push({ op: 'clearRange' });
  steps.push({
    op: 'outcome',
    found: false,
    note: `Non è rimasto niente da controllare: ${tgt} non c’è.`,
  });

  return { initial: data.slice(), target: tgt, steps };
}

export const binarySearch: GeneratorDef = {
  id: 'binary-search',
  label: 'Ricerca binaria',
  kind: 'search',
  defaultData: [1, 3, 4, 7, 9, 11, 14, 17],
  prepare: (data) => data.slice().sort((x, y) => x - y),
  pickTarget,
  generate,
};
