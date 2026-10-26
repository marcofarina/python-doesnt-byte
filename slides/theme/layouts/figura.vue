<script setup lang="ts">
/**
 * Titolo e una figura che prende tutto lo spazio rimasto: <Figura>,
 * <DiagrammaER>, un diagramma mermaid. Il titolo (# …) sta nello slot
 * predefinito, la figura in ::figura::.
 * `didascalia`: riga in piccolo sotto la figura.
 * ::lato:: (facoltativo): testo accanto alla figura, a sinistra; la figura
 * prende la colonna destra e si scala a quella. `lato: destra` lo sposta.
 *
 * Le figure del libro si impaginano sulla larghezza (e sotto una larghezza
 * minima non si stringono più): qui conta l'altezza. La figura si impagina a
 * tutta larghezza e poi si scala in proporzione con `transform`, in giù se è
 * troppo alta, in su (fino a 1,5) se è piccola; il transform non cambia le
 * misure con cui si è impaginata, quindi niente ricalcoli a catena. Si
 * riscala a ogni cambio di misura (font caricati, un passo della figura con
 * una didascalia più lunga).
 */
import { onBeforeUnmount, onMounted, ref } from 'vue';

defineProps<{ didascalia?: string; lato?: 'sinistra' | 'destra' }>();

const spazio = ref<HTMLElement | null>(null);
const figura = ref<HTMLElement | null>(null);
const scala = ref(1);
let osservatore: ResizeObserver | null = null;

/** Oltre questo ingrandimento il tratto a mano delle figure si sgrana. */
const MAX_INGRANDIMENTO = 1.5;

/**
 * Il primo SVG dentro la figura, anche dentro uno shadow DOM: Slidev disegna
 * i diagrammi mermaid in una shadow root, che querySelector non attraversa.
 */
function trovaSvg(radice: Element | ShadowRoot): SVGSVGElement | null {
  const diretto = radice.querySelector('svg');
  if (diretto) return diretto;
  for (const el of radice.querySelectorAll('*')) {
    if (el.shadowRoot) {
      const dentro = trovaSvg(el.shadowRoot);
      if (dentro) return dentro;
    }
  }
  return null;
}

function adatta() {
  if (!spazio.value || !figura.value) return;
  const alto = spazio.value.clientHeight;
  const altezza = figura.value.offsetHeight;
  if (!alto || !altezza) return;
  // La larghezza vera del disegno: i diagrammi E/R e mermaid hanno una
  // larghezza massima e restano stretti al centro della riga. Il rettangolo
  // misurato risente della scala già applicata: la si toglie.
  // Se il disegno non si trova (o non ha ancora una misura) si può solo
  // rimpicciolire: ingrandire alla cieca lo farebbe uscire di lato.
  // Si confrontano due rettangoli sullo schermo (disegno e spazio), che
  // risentono allo stesso modo della scala con cui Slidev adatta la slide.
  // Le figure animate del libro hanno una cornice (con i comandi) più larga
  // del disegno: si misura quella. Gli altri (DiagrammaER, mermaid) si
  // misurano sul disegno, perché la loro cornice è larga quanto la riga.
  const cornice = figura.value.querySelector('.pdb-figura-libro > figure');
  const disegno = (cornice ?? trovaSvg(figura.value))?.getBoundingClientRect().width ?? 0;
  const spazioSchermo = spazio.value.getBoundingClientRect().width;
  const vera = disegno / (scala.value || 1);
  const massimo =
    vera > 0 && spazioSchermo > 0
      ? Math.min(spazioSchermo / vera, MAX_INGRANDIMENTO)
      : 1;
  scala.value = Math.min(alto / altezza, massimo);
}

onMounted(() => {
  osservatore = new ResizeObserver(adatta);
  if (spazio.value) osservatore.observe(spazio.value);
  if (figura.value) osservatore.observe(figura.value);
  void document.fonts.ready.then(adatta);
});

onBeforeUnmount(() => osservatore?.disconnect());
</script>

<template>
  <Cornice>
    <slot name="default" />
    <div class="pdb-figura__riga" :class="{ 'pdb-figura__riga--lato': $slots.lato, 'pdb-figura__riga--destra': lato === 'destra' }">
      <div v-if="$slots.lato" class="pdb-figura__lato">
        <slot name="lato" />
      </div>
      <div ref="spazio" class="pdb-figura">
        <div ref="figura" class="pdb-figura__adatta" :style="{ transform: scala !== 1 ? `scale(${scala})` : undefined }">
          <slot name="figura" />
        </div>
      </div>
    </div>
    <p v-if="didascalia" class="pdb-figura__didascalia">{{ didascalia }}</p>
  </Cornice>
</template>
