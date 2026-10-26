<script setup lang="ts">
/**
 * Apre una sezione della lezione (un `##` del libro). Il numero è automatico,
 * e il titolo (il `#` della slide) diventa l'etichetta di testata di tutte le
 * slide che seguono, fino alla sezione successiva.
 */
import { useLezione } from '../composables/lezione';

const { numeroSezione, infoVolume, classeVolume } = useLezione();
</script>

<template>
  <div class="slidev-layout pdb pdb-sezione" :class="classeVolume">
    <div class="pdb-sezione__centro">
      <div class="pdb-sezione__numero">Sezione {{ numeroSezione }}</div>
      <slot />
    </div>
    <div class="pdb-copertina__piede">
      <span class="pdb-etichetta">{{ infoVolume.nome }}</span>
      <div class="pdb-raggio" />
    </div>
  </div>
</template>
