<script setup lang="ts">
/**
 * <SqlRun dataset="archivista/registro-punti"> attorno a un blocco ```sql: in
 * presentazione «Esegui» lancia la query sullo stesso database dei blocchi
 * `sql live` del libro (sql.js nel worker di static/sql-runner/, dataset in
 * static/sql-datasets/). Nel PDF resta solo la query.
 *
 * `database`: dopo l'esecuzione mostra anche le tabelle, come il pannello
 * «Database» del libro, con righe nuove, modificate e tolte evidenziate. Con
 * un valore (`database="studente,assegnazione"`) mostra quelle tabelle; senza,
 * quelle che la query ha cambiato.
 *
 * `persistente`: il database non riparte da capo a ogni esecuzione, ed è lo
 * stesso per tutte le slide del mazzo con lo stesso dataset: un INSERT in una
 * slide si ritrova nella SELECT della slide dopo. «Ripristina» lo riporta
 * allo stato iniziale.
 *
 * L'output non esce mai dalla slide: il suo riquadro si limita allo spazio
 * rimasto (composables/uscita.ts).
 *
 * `risultato`: la slide mostra solo il risultato (e il pannello «Database»),
 * eseguito da solo appena la slide esiste, anche nel PDF. Si usa nella slide
 * dopo quella della query, quando sotto la query non c'è posto per leggerlo.
 *
 * `errore`: la query finisce in errore di proposito (un vincolo violato da
 * mostrare); `slides:verifica` esegue ogni blocco e segnala gli altri errori.
 */
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue';
import {
  resetDb,
  runSql,
  SqlRunError,
  SqlTimeoutError,
} from '@site/src/theme/SQLRunner/sqlBridge';
import type { DbSnapshot, SqlResultSet } from '@site/src/theme/SQLRunner/types';
import { useNav, useSlideContext } from '@slidev/client';
import { RADICE_STATICI } from '../composables/lezione';
import { useSpazioUscita } from '../composables/uscita';
import TabelleDb from './TabelleDb.vue';

const props = defineProps<{
  dataset?: string;
  uscita?: 'sotto' | 'destra';
  database?: boolean | string;
  persistente?: boolean;
  risultato?: boolean;
  /** Il risultato ha una slide sua, subito dopo (setup/seguiti.ts). */
  seguito?: boolean;
  /** La query va in errore apposta (lo dice `slides:verifica`). */
  errore?: boolean;
}>();

const nodo = ref<HTMLElement | null>(null);
const risultati = shallowRef<SqlResultSet[]>([]);
const foto = shallowRef<DbSnapshot | null>(null);
const modificate = ref(0);
const errore = ref('');
const stato = ref<'fermo' | 'corre' | 'fatto' | 'errore'>('fermo');
let vivo = true;

const aperto = computed(() => stato.value === 'fatto' || stato.value === 'errore');
useSpazioUscita(nodo, aperto);

const URL = {
  workerUrl: `${RADICE_STATICI}sql-runner/worker.js`,
  glueUrl: `${RADICE_STATICI}sql-runner/sql-wasm.js`,
  wasmUrl: `${RADICE_STATICI}sql-runner/sql-wasm.wasm`,
};

// Con `persistente` tutte le slide dello stesso dataset condividono il DB.
const istanza = props.persistente
  ? `slide-db-${props.dataset ?? 'vuoto'}`
  : `slide-${Math.random().toString(36).slice(2, 9)}`;

const conDatabase = computed(() => props.database !== undefined && props.database !== false);
const tabelle = computed(() => (typeof props.database === 'string' && props.database ? props.database : undefined));

function sorgente(): string {
  const codice = nodo.value?.querySelector('pre code') ?? nodo.value?.querySelector('pre');
  return (codice?.textContent ?? '').replace(/ /g, ' ').trim();
}

async function esegui() {
  const sql = sorgente();
  if (!sql) return;
  stato.value = 'corre';
  errore.value = '';
  try {
    const esito = await runSql(URL, {
      instanceId: istanza,
      sql,
      datasetKey: props.dataset,
      datasetUrl: props.dataset ? `${RADICE_STATICI}sql-datasets/${props.dataset}.sql` : undefined,
      stateful: !!props.persistente,
      maxRows: 50,
      timeoutMs: 5000,
      snapshot: conDatabase.value,
    });
    if (!vivo) return;
    risultati.value = esito.results;
    modificate.value = esito.rowsModified;
    foto.value = esito.snapshot ?? null;
    stato.value = 'fatto';
  } catch (e) {
    if (!vivo) return;
    risultati.value = [];
    foto.value = e instanceof SqlRunError ? (e.snapshot ?? null) : null;
    errore.value =
      e instanceof SqlTimeoutError
        ? 'La query non ha risposto in tempo ed è stata fermata.'
        : e instanceof Error
          ? e.message
          : String(e);
    stato.value = 'errore';
  }
}

const { go } = useNav();
const { $page } = useSlideContext();

/** Con `seguito` il risultato è nella slide dopo: «Esegui» porta lì. */
function premi() {
  if (props.seguito && !props.risultato) go($page.value + 1);
  else void esegui();
}

async function azzera() {
  stato.value = 'fermo';
  risultati.value = [];
  foto.value = null;
  errore.value = '';
  if (props.persistente) await resetDb(URL, istanza);
}

onMounted(() => {
  if (props.risultato) void esegui();
});

onBeforeUnmount(() => {
  vivo = false;
});
</script>

<template>
  <div
    ref="nodo"
    class="pdb-run"
    :data-stato="stato"
    :data-errore-atteso="props.errore ? '' : undefined"
    :data-seguito="props.seguito && !props.risultato ? '' : undefined"
    :class="{
      'pdb-run--destra': props.uscita === 'destra',
      'pdb-run--aperto': aperto,
      'pdb-run--risultato': props.risultato,
    }"
  >
    <div class="pdb-run__codice">
      <slot />
      <div v-if="props.risultato" class="pdb-run__anteprima pdb-etichetta">La query della slide precedente</div>
      <div class="pdb-run__barra">
        <button class="pdb-run__esegui" type="button" :disabled="stato === 'corre'" @click.stop="premi">
          <span aria-hidden="true">▶</span> {{ stato === 'corre' ? 'Esecuzione…' : props.risultato ? 'Esegui di nuovo' : props.seguito ? 'Esegui →' : 'Esegui' }}
        </button>
        <button v-if="(aperto || persistente) && !props.risultato" class="pdb-run__azzera" type="button" @click.stop="azzera">
          {{ persistente ? 'Ripristina' : 'Pulisci' }}
        </button>
      </div>
    </div>
    <div v-if="aperto" class="pdb-run__esiti">
      <div class="pdb-run__uscita" :class="{ 'pdb-run__uscita--errore': stato === 'errore' }">
        <div class="pdb-etichetta pdb-run__titolo">Risultato</div>
        <pre v-if="errore" class="pdb-run__testo pdb-run__stderr">{{ errore }}</pre>
        <template v-else>
          <div v-for="(r, i) in risultati" :key="i" class="pdb-run__tabella">
            <table>
              <thead><tr><th v-for="c in r.columns" :key="c">{{ c }}</th></tr></thead>
              <tbody>
                <tr v-for="(riga, j) in r.rows" :key="j"><td v-for="(v, k) in riga" :key="k">{{ v === null ? 'NULL' : v }}</td></tr>
              </tbody>
            </table>
            <div v-if="!r.rows.length" class="pdb-run__testo pdb-tenue">(nessuna riga)</div>
            <div v-if="r.truncated" class="pdb-run__testo pdb-tenue">… {{ r.totalRows }} righe in tutto</div>
          </div>
          <p v-if="!risultati.length" class="pdb-run__testo pdb-tenue">
            {{ modificate ? `Fatto: ${modificate} ${modificate === 1 ? 'riga modificata' : 'righe modificate'}.` : 'Fatto: nessuna riga da mostrare.' }}
          </p>
        </template>
      </div>
      <div v-if="conDatabase && foto" class="pdb-run__database">
        <div class="pdb-etichetta pdb-run__titolo-db">
          Database
          <span v-if="foto.changedRows" class="pdb-run__cambi">{{ foto.changedRows }} {{ foto.changedRows === 1 ? 'riga cambiata' : 'righe cambiate' }}</span>
        </div>
        <TabelleDb :foto="foto" :tabelle="tabelle" :massimo="5" />
      </div>
    </div>
  </div>
</template>
