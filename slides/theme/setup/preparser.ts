import { definePreparserSetup } from '@slidev/types';
import { aggiungiSeguiti } from './seguiti';

// Le slide «risultato» dei blocchi con `seguito`: vedi setup/seguiti.ts.
export default definePreparserSetup(() => [
  {
    name: 'pdb:seguiti',
    transformRawLines(righe) {
      aggiungiSeguiti(righe);
    },
  },
]);
