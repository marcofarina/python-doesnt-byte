/**
 * Unione di due quaderni: la stessa per l'importazione di un file e per lo
 * zaino. Pura, commutativa e idempotente: unisci(a, b) e unisci(b, a) danno lo
 * stesso quaderno, unisci(a, a) dà a (se a è ordinato come lo ordina unisci).
 *
 * Per ogni annotazione vince la `modificata` più recente; a parità il
 * `dispositivo` maggiore; a parità ancora (non dovrebbe succedere) il JSON
 * maggiore, perché il risultato non dipenda dall'ordine. Le cancellazioni sono
 * lapidi (`cancellata: true`) e vincono con la stessa regola. Limite accettato:
 * un dispositivo con l'orologio avanti fa vincere le sue modifiche.
 *
 * La potatura delle lapidi vecchie (`potaLapidi`) è a parte, perché dipende
 * dall'ora: unisci non guarda l'orologio.
 */
import type { Annotazione, Quaderno } from './tipi';

/** Per quanto si tiene una lapide: 18 mesi. */
export const DURATA_LAPIDI_MS = 548 * 24 * 60 * 60 * 1000;

function ora(iso: string): number {
  const t = Date.parse(iso);
  return Number.isNaN(t) ? -Infinity : t;
}

function confronta(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** > 0 se vince a, < 0 se vince b, 0 se sono identiche. */
function vincitore(a: Annotazione, b: Annotazione): number {
  return (
    Math.sign(ora(a.modificata) - ora(b.modificata)) ||
    confronta(a.dispositivo, b.dispositivo) ||
    confronta(JSON.stringify(a), JSON.stringify(b))
  );
}

/** Ordine stabile del risultato: per data di creazione, poi per id. */
function ordine(a: Annotazione, b: Annotazione): number {
  return (
    Math.sign(ora(a.creata) - ora(b.creata)) ||
    confronta(a.creata, b.creata) ||
    confronta(a.id, b.id)
  );
}

export function unisci(a: Quaderno, b: Quaderno): Quaderno {
  const perId = new Map<string, Annotazione>();
  for (const x of [...a.annotazioni, ...b.annotazioni]) {
    const y = perId.get(x.id);
    if (!y || vincitore(x, y) > 0) perId.set(x.id, x);
  }
  const legendaA =
    Math.sign(ora(a.legendaModificata) - ora(b.legendaModificata)) ||
    confronta(JSON.stringify(a.legenda), JSON.stringify(b.legenda));
  const l = legendaA >= 0 ? a : b;
  return {
    formato: 1,
    annotazioni: [...perId.values()].sort(ordine),
    legenda: { ...l.legenda },
    legendaModificata: l.legendaModificata,
  };
}

/** Toglie le lapidi più vecchie di 18 mesi rispetto ad `adesso`. */
export function potaLapidi(q: Quaderno, adesso: number): Quaderno {
  const soglia = adesso - DURATA_LAPIDI_MS;
  const annotazioni = q.annotazioni.filter(
    (x) => !x.cancellata || ora(x.modificata) >= soglia,
  );
  return annotazioni.length === q.annotazioni.length
    ? q
    : { ...q, annotazioni };
}
