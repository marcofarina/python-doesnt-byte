<script setup lang="ts">
/** Il pannello della risposta, come lo <Spoiler block> del libro una volta aperto. */
defineProps<{ titolo?: string }>();
</script>

<template>
  <div class="pdb-risposta">
    <div class="pdb-etichetta pdb-risposta__titolo">{{ titolo ?? 'Che cosa succede' }}</div>
    <div class="pdb-risposta__corpo"><slot /></div>
  </div>
</template>

<style>
.pdb-risposta {
  padding: 14px 20px 16px;
  border-radius: var(--radius-md);
  background: var(--at-accent-bg);
  border: 1px solid var(--at-accent-border);
}

.pdb-risposta__titolo {
  color: var(--at-accent);
  margin-bottom: 6px;
}

.pdb-risposta__corpo {
  font-size: 20px;
  line-height: 1.4;
  color: var(--at-fg);
}
</style>
