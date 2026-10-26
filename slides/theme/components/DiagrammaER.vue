<script setup lang="ts">
/**
 * <DiagrammaER :entita="[…]" :associazioni="[…]" /> — lo stesso componente
 * del libro, con le stesse proprietà (src/components/DiagrammaER/types.ts):
 * si copia il blocco dalla lezione e si cambia solo `{…}` in `"…"`.
 */
import { useAttrs } from 'vue';
import DiagrammaReact from '@site/src/components/DiagrammaER';
import IsolaReact from './IsolaReact.vue';

defineOptions({ inheritAttrs: false });
const attributi = useAttrs();
</script>

<template>
  <IsolaReact class="pdb-diagramma-libro" :componente="DiagrammaReact" :proprieta="attributi" />
</template>
