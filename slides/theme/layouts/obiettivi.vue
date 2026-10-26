<!--
  Prerequisiti e obiettivi affiancati (:::prereq e :::learn del libro).
  Slot: ::prerequisiti:: e ::imparerai::; quello predefinito tiene il titolo.
-->
<template>
  <Cornice etichetta="Prima di cominciare">
    <slot />
    <div class="pdb-obiettivi">
      <Callout tipo="prereq"><slot name="prerequisiti" /></Callout>
      <Callout tipo="learn" titolo="Cosa imparerai"><slot name="imparerai" /></Callout>
    </div>
  </Cornice>
</template>
