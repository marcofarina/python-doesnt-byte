<script setup lang="ts">
/**
 * Prima slide del mazzo. Titolo, sottotitolo, volume e capitolo vengono dal
 * frontmatter iniziale: la slide non ha contenuto proprio (lo slot resta per
 * eccezioni, ed esce sotto il sottotitolo).
 */
import { computed } from 'vue';
import { useSlideContext } from '@slidev/client';
import { useLezione } from '../composables/lezione';
import logo from '@site/static/img/logo.svg?url';

const { $slidev } = useSlideContext();
const { titolo, sottotitolo, kicker, classeVolume } = useLezione();
const numero = computed(() => {
  const n = ($slidev.configs as { numero?: number }).numero;
  return n === undefined ? '' : String(n).padStart(2, '0');
});
</script>

<template>
  <div class="slidev-layout pdb pdb-copertina" :class="classeVolume">
    <div class="pdb-copertina__marchio">
      <img :src="logo" alt="" />
      Python Doesn’t Byte
    </div>
    <div class="pdb-copertina__centro">
      <div class="pdb-etichetta pdb-copertina__kicker">{{ kicker }}</div>
      <h1 class="pdb-copertina__titolo">{{ titolo }}</h1>
      <p v-if="sottotitolo" class="pdb-copertina__sottotitolo">{{ sottotitolo }}</p>
      <slot />
    </div>
    <div class="pdb-copertina__piede">
      <span class="pdb-etichetta">Presentazione della lezione</span>
      <div class="pdb-raggio" />
    </div>
    <div v-if="numero" class="pdb-copertina__numero" aria-hidden="true">{{ numero }}</div>
  </div>
</template>
