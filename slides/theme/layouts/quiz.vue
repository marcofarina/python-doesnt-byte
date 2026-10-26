<script setup lang="ts">
/**
 * Una domanda del <QuizDeck> del libro. Il titolo (# …) è la domanda, le
 * risposte sono <Opzione>, una per riga: al clic la corretta si accende e
 * compaiono le spiegazioni. `numero`: «1 di 3» in testata.
 */
import { computed } from 'vue';

const props = defineProps<{ numero?: string }>();
const etichetta = computed(() =>
  props.numero ? `Verifica · Domanda ${props.numero}` : 'Verifica',
);
</script>

<template>
  <Cornice :etichetta="etichetta">
    <div class="pdb-quiz">
      <slot />
    </div>
    <span v-click class="pdb-quiz__scatto" aria-hidden="true" />
  </Cornice>
</template>
