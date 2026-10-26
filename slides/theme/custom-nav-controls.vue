<script setup lang="ts">
/**
 * Un pulsante in più nella barra di Slidev: la lezione nel libro. Pubblica
 * anche il numero di slide sulla pagina, per la verifica.
 */
import { watchEffect } from 'vue';
import { configs, useNav } from '@slidev/client';
import { SITO } from './composables/lezione';

// Il numero di slide, per `slides:verifica` (scripts/slides.mjs): comprese
// quelle che il preparser aggiunge, che nel sorgente non ci sono.
const { total } = useNav();
watchEffect(() => {
  document.documentElement.dataset.pdbTotale = String(total.value);
});

const lezione = (configs as { lezione?: string }).lezione ?? '';
const urlLezione = lezione ? `${SITO}/${lezione}/` : SITO;
</script>

<template>
  <a class="slidev-icon-btn" :href="urlLezione" target="_blank" rel="noopener" title="Apri la lezione nel libro">
    <div class="i-carbon:book" />
  </a>
</template>
