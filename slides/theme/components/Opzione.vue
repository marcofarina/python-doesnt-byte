<script setup lang="ts">
/**
 * Una risposta del quiz (layout `quiz`). Al primo clic della slide la
 * risposta `corretta` si accende, le altre si attenuano e sotto ognuna compare
 * la spiegazione `perche` (il <QuizFeedback> del libro). Nel PDF le
 * spiegazioni sono già aperte: lo studente lo usa per ripassare.
 *
 * `perche` è testo semplice con due eccezioni: `codice` e **grassetto**. Le
 * stesse due eccezioni valgono per il testo della risposta, che Slidev non
 * interpreta come markdown quando il tag sta su una riga sola.
 */
import { computed, onMounted, ref } from 'vue';
import { useSlideContext } from '@slidev/client';

const props = defineProps<{ corretta?: boolean; perche?: string }>();
const { $clicks } = useSlideContext();

const aperta = computed(() => $clicks.value >= 1);

const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const formatta = (testo: string) =>
  escape(testo)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

const spiegazione = computed(() => formatta(props.perche ?? ''));

// Il testo della risposta arriva dallo slot già come testo: se contiene
// `codice` o **grassetto** lo si riscrive una volta, al montaggio. Lo slot di
// un'opzione è statico, quindi Vue non lo ridisegna sopra.
const risposta = ref<HTMLElement | null>(null);
onMounted(() => {
  const el = risposta.value;
  if (!el || el.children.length) return;
  const testo = el.textContent ?? '';
  if (/`[^`]+`|\*\*[^*]+\*\*/.test(testo)) el.innerHTML = formatta(testo.trim());
});
</script>

<template>
  <div
    class="pdb-opzione"
    :class="{
      'pdb-opzione--aperta': aperta,
      'pdb-opzione--giusta': aperta && corretta,
      'pdb-opzione--altra': aperta && !corretta,
    }"
  >
    <span class="pdb-opzione__lettera" aria-hidden="true" />
    <div class="pdb-opzione__testo">
      <div ref="risposta" class="pdb-opzione__risposta"><slot /></div>
      <div v-if="aperta && perche" class="pdb-opzione__perche" v-html="spiegazione" />
    </div>
  </div>
</template>

<style>
.pdb-opzione {
  counter-increment: opzione;
  display: grid;
  grid-template-columns: 30px 1fr;
  gap: 14px;
  align-items: start;
  padding: 10px 16px;
  border-radius: var(--radius-sm);
  background: var(--at-bg-panel);
  box-shadow: var(--shadow-card);
  font-size: 19px;
  line-height: 1.35;
  transition:
    opacity var(--dur-normal) var(--ease-smooth),
    background var(--dur-normal) var(--ease-smooth);
}

.pdb-opzione__lettera {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: var(--at-bg-chip);
  font-family: var(--font-mono-ui);
  font-size: 13px;
  font-weight: 500;
  color: var(--at-muted);
}

.pdb-opzione__lettera::before {
  content: counter(opzione, upper-alpha);
}

.pdb-opzione__perche {
  margin-top: 4px;
  font-size: 16px;
  line-height: 1.35;
  color: var(--at-muted);
}

.pdb-opzione--altra {
  opacity: 0.62;
  box-shadow: none;
  background: transparent;
}

.pdb-opzione--giusta {
  background: var(--ok-bg);
  box-shadow: 0 0 0 1.5px var(--ok) inset;
}

.pdb-opzione--giusta .pdb-opzione__lettera {
  background: var(--ok);
  color: #fff;
}

.pdb-opzione--giusta .pdb-opzione__lettera::before {
  content: '✓';
}

.pdb-opzione--giusta .pdb-opzione__perche {
  color: var(--at-fg);
}
</style>
