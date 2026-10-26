<script setup lang="ts">
/**
 * <Callout tipo="warning" titolo="…"> — i callout del libro (:::warning,
 * :::definition, :::cleancode…), con le stesse icone, colori e titoli
 * predefiniti (src/theme/Admonition/index.tsx).
 */
import { computed } from 'vue';

const props = defineProps<{ tipo?: string; titolo?: string }>();

const REGISTRO: Record<string, { titolo: string; icona: string | null }> = {
  prereq: { titolo: 'Prerequisiti', icona: 'prereq' },
  learn: { titolo: 'Cosa imparerai in questa lezione', icona: 'learn' },
  exercise: { titolo: 'Cosa imparerai con questo esercizio', icona: 'exercise' },
  definition: { titolo: 'Definizioni', icona: 'definition' },
  history: { titolo: 'Cenni storici', icona: 'history' },
  code: { titolo: 'Programmazione', icona: 'code' },
  cleancode: { titolo: 'Clean code', icona: 'cleancode' },
  nutshell: { titolo: 'In a nutshell', icona: 'nutshell' },
  mindmap: { titolo: 'Mindmap', icona: 'mindmap' },
  info: { titolo: 'Informazioni utili', icona: 'info' },
  tip: { titolo: 'Suggerimento', icona: 'tip' },
  warning: { titolo: 'Attenzione', icona: 'warning' },
  danger: { titolo: 'Pericolo', icona: 'danger' },
  note: { titolo: 'Nota', icona: null },
};

const icone = import.meta.glob<string>('@site/static/img/callouts/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
});

const voce = computed(() => REGISTRO[props.tipo ?? 'note'] ?? REGISTRO.note);
const tipo = computed(() => (REGISTRO[props.tipo ?? ''] ? props.tipo : 'note'));
const icona = computed(() => {
  const nome = voce.value.icona;
  if (!nome) return null;
  const chiave = Object.keys(icone).find((k) => k.endsWith(`/${nome}.png`));
  return chiave ? icone[chiave] : null;
});
</script>

<template>
  <aside class="pdb-callout" :style="{ '--c-bg': `var(--callout-${tipo}-bg)`, '--c-fg': `var(--callout-${tipo}-fg)` }">
    <div class="pdb-callout__testata">
      <img v-if="icona" :src="icona" alt="" class="pdb-callout__icona" />
      <span class="pdb-callout__titolo">{{ titolo ?? voce.titolo }}</span>
    </div>
    <div class="pdb-callout__corpo"><slot /></div>
  </aside>
</template>

<style>
.pdb-callout {
  margin: 14px 0 0;
  padding: 16px 22px 18px;
  border-radius: var(--radius-md);
  background: var(--c-bg);
  color: var(--at-fg);
}

.pdb-callout__testata {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.pdb-callout__icona {
  width: 26px;
  height: 26px;
  flex: none;
}

.pdb-callout__titolo {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 650;
  color: var(--c-fg);
  line-height: 1.15;
}

.pdb-callout__corpo {
  font-size: 20px;
  line-height: 1.4;
}

.slidev-layout.pdb .pdb-callout__corpo ul > li::marker {
  color: var(--c-fg);
}
</style>
