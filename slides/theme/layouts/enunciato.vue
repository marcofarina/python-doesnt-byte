<!--
  Una frase sola, grande: l'idea che la slide deve lasciare. Il primo
  paragrafo è l'enunciato (il **grassetto** prende il colore del volume), i
  successivi una nota più piccola.
-->
<template>
  <Cornice corpo="pdb-corpo--centro">
    <div class="pdb-enunciato">
      <slot />
    </div>
  </Cornice>
</template>

<style scoped>
.pdb-enunciato :deep(p:first-child) {
  font-family: var(--font-display);
  font-size: 40px;
  line-height: 1.18;
  font-weight: 500;
  letter-spacing: -0.015em;
  color: var(--at-titolo);
  margin-bottom: 22px;
}

.pdb-enunciato :deep(p:first-child strong) {
  color: var(--at-accent);
  font-weight: 600;
}

.pdb-enunciato :deep(p:not(:first-child)) {
  color: var(--at-muted);
}
</style>
