<script setup lang="ts">
/**
 * «Prova a prevedere»: la domanda (o il codice) resta in vista, la risposta
 * arriva al clic successivo. È lo <Spoiler block> del libro.
 * Slot: quello predefinito per titolo e domanda, ::risposta:: per la
 * risposta. `invito`: il testo sopra la risposta nascosta.
 * `affiancata: true`: codice a sinistra, invito e risposta a destra; serve
 * quando il codice è lungo e sotto non resta posto per la risposta.
 */
defineProps<{ invito?: string; affiancata?: boolean }>();
</script>

<template>
  <Cornice>
    <div :class="{ 'pdb-domanda--affiancata': affiancata }">
      <div class="pdb-domanda__domanda">
        <slot />
      </div>
      <div class="pdb-domanda__lato">
        <div class="pdb-domanda__invito">
          <span aria-hidden="true">◆</span>
          {{ invito ?? 'Prima di andare avanti, prova a prevedere la risposta.' }}
        </div>
        <div v-click class="pdb-domanda__risposta">
          <Risposta><slot name="risposta" /></Risposta>
        </div>
      </div>
    </div>
  </Cornice>
</template>
