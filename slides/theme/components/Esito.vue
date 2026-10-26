<script setup lang="ts">
/** <Esito /> e <Esito :ok="false" />: il segno ✓ / ✗ degli elenchi «giusto o sbagliato» del libro. */
withDefaults(defineProps<{ ok?: boolean }>(), { ok: true });
</script>

<template>
  <span class="pdb-esito" :class="ok ? 'pdb-esito--ok' : 'pdb-esito--ko'" :aria-label="ok ? 'corretto' : 'sbagliato'">{{ ok ? '✓' : '✗' }}</span>
</template>

<style>
.pdb-esito {
  display: inline-grid;
  place-items: center;
  width: 1.15em;
  height: 1.15em;
  margin-right: 0.3em;
  border-radius: 999px;
  font-family: var(--font-mono-ui);
  font-size: 0.82em;
  font-weight: 600;
  vertical-align: 0.08em;
}

.pdb-esito--ok {
  color: var(--ok);
  background: var(--ok-bg);
}

.pdb-esito--ko {
  color: var(--ko);
  background: var(--ko-bg);
}
</style>
