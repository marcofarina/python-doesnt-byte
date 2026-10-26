<script setup lang="ts">
/**
 * Monta un componente React del libro dentro una slide Vue. Lo usano <Figura>
 * e <DiagrammaER>: le presentazioni mostrano gli stessi disegni, con le stesse
 * animazioni, del libro, senza copiarne il codice.
 */
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { createElement, type ComponentType } from 'react';
import { createRoot, type Root } from 'react-dom/client';

const props = defineProps<{
  componente: ComponentType<any>;
  proprieta?: Record<string, unknown>;
}>();

const emit = defineEmits<{ montato: [] }>();

const nodo = ref<HTMLElement | null>(null);
let radice: Root | null = null;

function disegna() {
  radice?.render(createElement(props.componente, props.proprieta ?? {}));
}

onMounted(() => {
  if (!nodo.value) return;
  radice = createRoot(nodo.value);
  disegna();
  emit('montato');
});

watch(() => [props.componente, props.proprieta], disegna, { deep: true });

onBeforeUnmount(() => {
  radice?.unmount();
  radice = null;
});
</script>

<template>
  <div ref="nodo" class="pdb-isola" />
</template>
