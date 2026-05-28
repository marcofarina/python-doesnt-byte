/**
 * Etichette umane dei percorsi didattici, condivise fra PathSelector,
 * OffPathBanner e qualsiasi altro componente che debba mostrarle.
 * Aggiungi qui se un volume introduce un nuovo percorso.
 */
export const PATH_LABEL: Record<string, string> = {
  it: 'Istituto Tecnico',
  liceo: 'Liceo',
  its: 'ITS',
};

/** Etichetta breve da usare nei controlli compatti (toggle in navbar). */
export const PATH_LABEL_SHORT: Record<string, string> = {
  it: 'IT',
  liceo: 'Liceo',
  its: 'ITS',
};

export function pathLabel(id: string, short = false): string {
  const map = short ? PATH_LABEL_SHORT : PATH_LABEL;
  return map[id] ?? id;
}
