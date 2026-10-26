<script setup lang="ts">
/**
 * Cornice comune alle slide di contenuto: testata con la sezione corrente e il
 * volume, corpo, piede con titolo della lezione e numero di pagina. È l'unico
 * posto che decide margini e griglia: i layout scelgono solo cosa mettere nel
 * corpo, così ogni slide di ogni mazzo ha gli stessi allineamenti.
 */
import { useLezione } from '../composables/lezione';

defineProps<{
  /** Classe del corpo, per i layout che lo dispongono in griglia. */
  corpo?: string;
  /** Etichetta di testata al posto della sezione (es. «Verifica»). */
  etichetta?: string;
}>();

const { titolo, infoVolume, etichettaSezione, pagina, totale, classeVolume } =
  useLezione();
</script>

<template>
  <div class="slidev-layout pdb pdb-cornice" :class="classeVolume">
    <header class="pdb-testata">
      <span class="pdb-etichetta pdb-testata__sezione">
        <span class="pdb-quadretto" aria-hidden="true" />
        {{ etichetta ?? etichettaSezione }}
      </span>
      <span class="pdb-etichetta">{{ infoVolume.nome }}</span>
    </header>
    <div class="pdb-corpo" :class="corpo">
      <slot />
    </div>
    <footer class="pdb-piede">
      <span class="pdb-piede__titolo">{{ titolo }}</span>
      <span class="pdb-piede__pagina">{{ pagina }}<span class="pdb-tenue"> / {{ totale }}</span></span>
    </footer>
  </div>
</template>
