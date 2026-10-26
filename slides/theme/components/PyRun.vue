<script setup lang="ts">
/**
 * <PyRun> attorno a un blocco ```python: in presentazione aggiunge «Esegui» e
 * mostra l'output, con lo stesso Brython e le stesse librerie dei blocchi
 * `py live` del libro (src/theme/PyRunner/bryBridge.ts, static/bry-libs/).
 * Nel PDF resta solo il codice.
 *
 * L'output non esce mai dalla slide: il suo riquadro si limita allo spazio
 * rimasto (composables/uscita.ts). `uscita="destra"` lo mette accanto al
 * codice invece che sotto.
 *
 * `risultato`: la slide mostra solo l'output, eseguito da solo appena la slide
 * esiste (anche nel PDF). Si usa nella slide dopo quella del codice, quando
 * sotto il codice non c'è posto per leggere il risultato.
 *
 * `errore`: il blocco finisce in errore di proposito (un `AttributeError` da
 * mostrare); `slides:verifica` esegue ogni blocco e segnala gli altri.
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { runPython } from '@site/src/theme/PyRunner/bryBridge';
import { useNav, useSlideContext } from '@slidev/client';
import { RADICE_STATICI } from '../composables/lezione';
import { useSpazioUscita } from '../composables/uscita';

const props = defineProps<{
  uscita?: 'sotto' | 'destra';
  risultato?: boolean;
  /** Il risultato ha una slide sua, subito dopo (setup/seguiti.ts). */
  seguito?: boolean;
  /** Il blocco va in errore apposta (lo dice `slides:verifica`). */
  errore?: boolean;
}>();

interface Riga {
  tipo: 'stdout' | 'stderr';
  testo: string;
}

const MAX_RIGHE = 400;

const nodo = ref<HTMLElement | null>(null);
const righe = ref<Riga[]>([]);
const stato = ref<'fermo' | 'carica' | 'corre' | 'fatto' | 'errore'>('fermo');
let pulisci: (() => void) | null = null;

const aperto = computed(() => stato.value !== 'fermo');
useSpazioUscita(nodo, aperto);

function idCodice(sorgente: string): string {
  let h = 5381;
  for (let i = 0; i < sorgente.length; i++) h = (h * 33) ^ sorgente.charCodeAt(i);
  return `pyr_${(h >>> 0).toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function sorgente(): string {
  const codice = nodo.value?.querySelector('pre code') ?? nodo.value?.querySelector('pre');
  return (codice?.textContent ?? '').replace(/ /g, ' ').replace(/\n+$/, '');
}

function esegui() {
  const codice = sorgente();
  if (!codice) return;
  pulisci?.();
  righe.value = [];
  stato.value = 'carica';
  pulisci = runPython(codice, {
    codeId: idCodice(codice),
    libUrl: `${RADICE_STATICI}bry-libs/`,
    brython: {
      mainSrc: `${RADICE_STATICI}brython/brython.min.js`,
      stdlibSrc: `${RADICE_STATICI}brython/brython_stdlib.js`,
    },
    onStart: () => {
      righe.value = [];
      stato.value = 'corre';
    },
    onLog: (tipo, testo) => {
      if (righe.value.length >= MAX_RIGHE) return;
      righe.value.push({ tipo, testo });
      if (tipo === 'stderr') stato.value = 'errore';
    },
    onDone: () => {
      if (stato.value !== 'errore') stato.value = 'fatto';
    },
    onError: (err) => {
      stato.value = 'errore';
      righe.value.push({ tipo: 'stderr', testo: `${err.message}\n` });
    },
  });
}

const { go } = useNav();
const { $page } = useSlideContext();

/** Con `seguito` il risultato è nella slide dopo: «Esegui» porta lì. */
function premi() {
  if (props.seguito && !props.risultato) go($page.value + 1);
  else esegui();
}

function azzera() {
  pulisci?.();
  righe.value = [];
  stato.value = 'fermo';
}

onMounted(() => {
  if (props.risultato) esegui();
});

onBeforeUnmount(() => pulisci?.());
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
      <div v-if="props.risultato" class="pdb-run__anteprima pdb-etichetta">Il codice della slide precedente</div>
      <div class="pdb-run__barra">
        <button class="pdb-run__esegui" type="button" :disabled="stato === 'carica'" @click.stop="premi">
          <span aria-hidden="true">▶</span> {{ stato === 'carica' ? 'Avvio Python…' : props.risultato ? 'Esegui di nuovo' : props.seguito ? 'Esegui →' : 'Esegui' }}
        </button>
        <button v-if="aperto && !props.risultato" class="pdb-run__azzera" type="button" @click.stop="azzera">Pulisci</button>
      </div>
    </div>
    <div v-if="aperto" class="pdb-run__esiti">
      <div class="pdb-run__uscita" :class="{ 'pdb-run__uscita--errore': stato === 'errore' }">
        <div class="pdb-etichetta pdb-run__titolo">Output</div>
        <pre class="pdb-run__testo"><span v-for="(r, i) in righe" :key="i" :class="`pdb-run__${r.tipo}`">{{ r.testo }}</span><span v-if="stato === 'fatto' && !righe.length" class="pdb-tenue">(nessun output)</span><span v-if="stato === 'carica' || stato === 'corre'" class="pdb-tenue">…</span></pre>
      </div>
    </div>
  </div>
</template>
