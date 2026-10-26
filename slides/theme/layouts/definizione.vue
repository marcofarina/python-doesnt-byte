<script setup lang="ts">
/** Una definizione da sola, al centro (:::definition del libro). */
defineProps<{ titolo?: string }>();
</script>

<template>
  <Cornice corpo="pdb-corpo--centro">
    <div class="pdb-definizione">
      <Callout tipo="definition" :titolo="titolo"><slot /></Callout>
    </div>
  </Cornice>
</template>
