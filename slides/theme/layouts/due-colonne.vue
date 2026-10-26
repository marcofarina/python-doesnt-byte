<script setup lang="ts">
/**
 * Due colonne sotto il titolo. Slot ::sinistra:: e ::destra::; quello
 * predefinito tiene il titolo e un eventuale testo che le precede.
 * `rapporto`: '1/1' (predefinito), '3/2', '2/3', '2/1', '1/2'.
 * `sinistra` / `destra`: etichette in mono sopra le colonne (es. le due
 * schede di un <Tabs> del libro).
 * `centro: true` allinea le colonne al centro in verticale.
 */
import { computed } from 'vue';

const props = defineProps<{
  rapporto?: string;
  sinistra?: string;
  destra?: string;
  centro?: boolean;
}>();

const colonne = computed(() => {
  const [a, b] = (props.rapporto ?? '1/1').split('/').map(Number);
  return `${a || 1}fr ${b || 1}fr`;
});
</script>

<template>
  <Cornice>
    <slot />
    <div class="pdb-colonne" :class="{ 'pdb-colonne--centro': centro }" :style="{ '--colonne': colonne }">
      <div class="pdb-colonna">
        <span v-if="sinistra" class="pdb-etichetta pdb-colonna__etichetta">{{ sinistra }}</span>
        <slot name="sinistra" />
      </div>
      <div class="pdb-colonna">
        <span v-if="destra" class="pdb-etichetta pdb-colonna__etichetta">{{ destra }}</span>
        <slot name="destra" />
      </div>
    </div>
  </Cornice>
</template>
