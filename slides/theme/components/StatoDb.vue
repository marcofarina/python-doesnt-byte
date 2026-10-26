<script setup lang="ts">
/**
 * <StatoDb dataset="archivista/registro-punti" tabelle="studente" /> — le
 * tabelle del database iniziale di un dataset, lette dallo stesso file .sql
 * dei blocchi `sql live` del libro. Non esegue niente: serve a mostrare i dati
 * prima di una query, e compare anche nel PDF.
 */
import { onMounted, shallowRef } from 'vue';
import { seedSnapshot } from '@site/src/theme/SQLRunner/sqlBridge';
import type { DbSnapshot } from '@site/src/theme/SQLRunner/types';
import { RADICE_STATICI } from '../composables/lezione';
import TabelleDb from './TabelleDb.vue';

const props = defineProps<{ dataset: string; tabelle?: string; massimo?: number }>();

const foto = shallowRef<DbSnapshot | null>(null);
const errore = shallowRef('');

onMounted(async () => {
  try {
    foto.value = await seedSnapshot(
      {
        workerUrl: `${RADICE_STATICI}sql-runner/worker.js`,
        glueUrl: `${RADICE_STATICI}sql-runner/sql-wasm.js`,
        wasmUrl: `${RADICE_STATICI}sql-runner/sql-wasm.wasm`,
      },
      props.dataset,
      `${RADICE_STATICI}sql-datasets/${props.dataset}.sql`,
    );
  } catch (e) {
    errore.value = e instanceof Error ? e.message : String(e);
  }
});
</script>

<template>
  <p v-if="errore" class="pdb-errore">{{ errore }}</p>
  <TabelleDb v-else-if="foto" class="pdb-statodb" :foto="foto" :tabelle="tabelle ?? foto.tables.map((t) => t.name).join(',')" :massimo="massimo" />
</template>
