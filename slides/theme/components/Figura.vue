<script setup lang="ts">
/**
 * <Figura id="unione-senza-chiave" /> — la figura animata del libro
 * (src/figure/<id>.ts), con il suo player: Avvia, Avanti, Indietro.
 *
 * In presentazione parte da sola quando la slide è in vista, come nel libro.
 * Nel PDF e nelle anteprime non c'è tempo per l'animazione: la figura si
 * ferma sul passo finale, che è quello che lo studente deve ricordare.
 */
import { computed, shallowRef, watchEffect } from 'vue';
import { useNav, useSlideContext } from '@slidev/client';
import FiguraReact from '@site/src/components/Figura';
import IsolaReact from './IsolaReact.vue';

const props = defineProps<{ id: string }>();

const moduli = import.meta.glob<{ default: unknown }>('@site/src/figure/*.ts');
const { $renderContext } = useSlideContext();
const { isPrintMode } = useNav();

const figura = shallowRef<unknown>(null);
const errore = shallowRef('');

watchEffect(async () => {
  const chiave = Object.keys(moduli).find((k) => k.endsWith(`/${props.id}.ts`));
  if (!chiave) {
    errore.value = `Figura «${props.id}» non trovata in src/figure/.`;
    return;
  }
  figura.value = (await moduli[chiave]()).default;
});

const ferma = computed(
  () => isPrintMode.value || $renderContext.value !== 'slide',
);

interface Accesso {
  vai: (id: string, passo: number, fase?: number) => boolean;
  elenco: () => { id: string; passi: number }[];
}

/**
 * Fuori dalla presentazione: ultimo passo, animazione completa. Il player
 * avvia l'autoplay quando la figura entra in vista, cioè subito: `vai` lo
 * ferma, quindi lo ripetiamo per il primo secondo e mezzo, finché l'autoplay
 * non può più ripartire (parte una volta sola).
 */
function allaFine() {
  if (!ferma.value) return;
  const vai = () => {
    const accesso = (window as unknown as { __figure?: Accesso }).__figure;
    const voce = accesso?.elenco().find((f) => f.id === props.id);
    if (accesso && voce) accesso.vai(props.id, voce.passi - 1, 1);
  };
  for (const ms of [50, 300, 700, 1200]) setTimeout(vai, ms);
}
</script>

<template>
  <p v-if="errore" class="pdb-errore">{{ errore }}</p>
  <IsolaReact
    v-else-if="figura"
    class="pdb-figura-libro"
    :componente="FiguraReact"
    :proprieta="{ figura }"
    @montato="allaFine"
  />
</template>
