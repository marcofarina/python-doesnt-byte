<script setup lang="ts">
/** La citazione d'apertura della lezione (<Epigraph> nel libro). */
import { useLezione } from '../composables/lezione';

defineProps<{ autore?: string }>();
const { classeVolume } = useLezione();
</script>

<template>
  <div class="slidev-layout pdb pdb-epigrafe" :class="classeVolume">
    <figure class="pdb-epigrafe__carta">
      <span class="pdb-epigrafe__segno" aria-hidden="true">“</span>
      <blockquote class="pdb-epigrafe__testo"><slot /></blockquote>
      <figcaption v-if="autore" class="pdb-epigrafe__autore">{{ autore }}</figcaption>
    </figure>
  </div>
</template>
