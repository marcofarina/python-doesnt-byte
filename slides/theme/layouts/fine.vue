<script setup lang="ts">
/**
 * Ultima slide: la prossima lezione (lo slot) e il QR che porta alla lezione
 * nel libro, dove gli studenti trovano il codice da eseguire e i quiz.
 */
import { useLezione } from '../composables/lezione';

const { urlLezione, infoVolume, classeVolume } = useLezione();
</script>

<template>
  <div class="slidev-layout pdb pdb-fine" :class="classeVolume">
    <div class="pdb-fine__testo">
      <slot />
    </div>
    <div class="pdb-fine__qr">
      <div class="pdb-fine__qr-carta">
        <CodiceQr :valore="urlLezione" />
      </div>
      <div class="pdb-etichetta">Rileggi la lezione</div>
      <div class="pdb-fine__url">{{ urlLezione.replace('https://', '') }}</div>
    </div>
    <div class="pdb-fine__piede">
      <span class="pdb-etichetta">{{ infoVolume.nome }} · Python Doesn’t Byte</span>
      <div class="pdb-raggio" />
    </div>
  </div>
</template>
