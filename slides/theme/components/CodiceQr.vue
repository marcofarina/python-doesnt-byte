<script setup lang="ts">
/** QR in SVG, generato in locale (lo stesso pacchetto `qrcode` del sito). */
import { ref, watchEffect } from 'vue';
import QRCode from 'qrcode';

const props = defineProps<{ valore: string }>();
const svg = ref('');

watchEffect(async () => {
  svg.value = await QRCode.toString(props.valore, {
    type: 'svg',
    margin: 0,
    errorCorrectionLevel: 'M',
    color: { dark: '#27272a', light: '#ffffff' },
  });
});
</script>

<template>
  <div class="pdb-qr" role="img" :aria-label="`Codice QR: ${valore}`" v-html="svg" />
</template>
