/**
 * Il quaderno come sezione dello zaino (piano pm/piano-2026-11-quaderno.md,
 * fase Q4). Si registra all'import: lo importa `src/theme/Root.tsx` prima di
 * avviare la sincronizzazione.
 *
 * Lo zaino tocca il quaderno solo con le vie dell'archivio: legge lo stato,
 * porta in locale il risultato dell'unione con `importa` (che unisce e non
 * sostituisce mai), svuota con `svuota`, pota le lapidi vecchie con
 * `potaLapidi`. L'elenco delle orfane (`pdb:quaderno-orfane`) resta fuori.
 */
import { registraSezione } from '../zaino/sezioni';
import { importa, iscriviti, leggiQuaderno, svuota, valida } from './archivio';
import { quadernoVuoto, type Quaderno } from './tipi';
import { potaLapidi, unisci } from './unisci';

registraSezione<Quaderno>({
  nome: 'quaderno',
  formato: 1,
  vuota: quadernoVuoto,
  leggi: leggiQuaderno,
  scrivi: (q) => {
    importa(q);
  },
  unisci,
  iscriviti,
  valida,
  svuota,
  pota: potaLapidi,
});
