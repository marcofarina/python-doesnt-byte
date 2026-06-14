import type { ArraySceneState, ArrayStep, ArrayTrace } from './types';

/** Avviso solo in sviluppo: le precondizioni violate non lanciano. */
function devWarn(message: string): void {
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.warn(`[Algorithm] ${message}`);
  }
}

/** Stato iniziale della scena a partire dalla trace. */
export function initArrayState(trace: ArrayTrace): ArraySceneState {
  return {
    items: trace.initial.map((value, id) => ({ id, value })),
    extracted: null,
    pointers: [],
    range: null,
    comparing: null,
    sorted: [],
    faded: [],
    outcome: null,
    phase: '',
    note: '',
  };
}

/** Applica uno step allo stato in modo **puro** (ritorna un nuovo stato).
 *  La nota corrente si azzera se lo step non ne porta una; la fase persiste. */
export function applyArrayStep(
  state: ArraySceneState,
  step: ArrayStep,
): ArraySceneState {
  const next: ArraySceneState = { ...state };

  switch (step.op) {
    case 'compare':
      next.comparing = {
        a: { kind: 'item', i: step.i },
        b: { kind: 'item', i: step.j },
      };
      break;

    case 'compareTarget':
      next.comparing = {
        a: { kind: 'item', i: step.i },
        b: { kind: 'target' },
      };
      break;

    case 'compareExtracted':
      next.comparing = {
        a: { kind: 'item', i: step.i },
        b: { kind: 'extracted' },
      };
      break;

    case 'swap': {
      const { i, j } = step;
      if (
        i < 0 ||
        j < 0 ||
        i >= state.items.length ||
        j >= state.items.length
      ) {
        devWarn(`swap fuori range: ${i}, ${j}`);
        break;
      }
      const items = state.items.slice();
      [items[i], items[j]] = [items[j], items[i]];
      next.items = items;
      next.comparing = null;
      break;
    }

    case 'extract': {
      const item = state.items[step.i];
      if (!item) {
        devWarn(`extract su slot vuoto: ${step.i}`);
        break;
      }
      const items = state.items.slice();
      items[step.i] = null;
      next.items = items;
      next.extracted = { item, overIndex: step.i };
      next.comparing = null;
      break;
    }

    case 'shiftRight': {
      const { from } = step;
      // precondizione: lo slot a destra dev'essere vuoto.
      if (state.items[from + 1] !== null) {
        devWarn(`shiftRight: slot ${from + 1} non vuoto`);
        break;
      }
      if (!state.items[from]) {
        devWarn(`shiftRight: slot ${from} vuoto`);
        break;
      }
      const items = state.items.slice();
      items[from + 1] = items[from];
      items[from] = null;
      next.items = items;
      if (state.extracted) {
        next.extracted = { ...state.extracted, overIndex: from };
      }
      next.comparing = null;
      break;
    }

    case 'insertAt': {
      const { i } = step;
      if (state.items[i] !== null) {
        devWarn(`insertAt: slot ${i} non vuoto`);
        break;
      }
      if (!state.extracted) {
        devWarn('insertAt: nessun elemento estratto');
        break;
      }
      const items = state.items.slice();
      items[i] = state.extracted.item;
      next.items = items;
      next.extracted = null;
      next.comparing = null;
      break;
    }

    case 'pointer': {
      const pointers = state.pointers.filter((p) => p.name !== step.name);
      if (step.i !== null) pointers.push({ name: step.name, i: step.i });
      next.pointers = pointers;
      break;
    }

    case 'range':
      next.range = { lo: step.lo, hi: step.hi, label: step.label };
      break;

    case 'clearRange':
      next.range = null;
      break;

    case 'markSorted': {
      const set = new Set(state.sorted);
      step.indices.forEach((x) => set.add(x));
      next.sorted = Array.from(set).sort((a, b) => a - b);
      break;
    }

    case 'fade': {
      const set = new Set(state.faded);
      step.indices.forEach((x) => set.add(x));
      next.faded = Array.from(set).sort((a, b) => a - b);
      break;
    }

    case 'outcome':
      next.outcome = step.found
        ? { found: true, i: step.i as number }
        : { found: false };
      next.comparing = null;
      break;

    case 'phase':
      next.phase = step.text;
      break;

    case 'note':
      // solo gestione nota (sotto)
      break;

    default: {
      const exhaustive: never = step;
      devWarn(`op sconosciuta: ${JSON.stringify(exhaustive)}`);
    }
  }

  // Regola trasversale, dopo l'effetto specifico.
  next.note = step.note ?? '';
  return next;
}
