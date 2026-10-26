/**
 * L'output di un esecutore (<PyRun>, <SqlRun>) non deve mai uscire dalla
 * slide: quando compare, il suo riquadro si limita allo spazio che resta fino
 * al fondo del corpo, e quello che non ci sta scorre dentro il riquadro. Se lo
 * spazio è troppo poco per leggere, il mazzo deve dare al risultato una slide
 * sua (`<SqlRun risultato>`): lo segnala `slides:verifica`.
 */
import { nextTick, onBeforeUnmount, watch, type Ref } from 'vue';

export function useSpazioUscita(
  radice: Ref<HTMLElement | null>,
  aperto: Ref<boolean>,
) {
  let osservatore: ResizeObserver | null = null;

  function misura() {
    const el = radice.value;
    const esiti = el?.querySelector<HTMLElement>('.pdb-run__esiti');
    const corpo = el?.closest<HTMLElement>('.pdb-corpo');
    if (!el || !esiti || !corpo || !corpo.clientHeight) return;
    // I rettangoli sullo schermo risentono della scala con cui Slidev adatta
    // la slide alla finestra: si riportano alle misure della slide.
    const scala = corpo.getBoundingClientRect().height / corpo.clientHeight || 1;
    const fondo = corpo.getBoundingClientRect().bottom;
    const cima = esiti.getBoundingClientRect().top;
    const spazio = Math.floor((fondo - cima) / scala) - 2;
    esiti.style.maxHeight = `${Math.max(spazio, 60)}px`;
  }

  watch(aperto, async (si) => {
    osservatore?.disconnect();
    if (!si) return;
    await nextTick();
    misura();
    const corpo = radice.value?.closest('.pdb-corpo');
    if (corpo) {
      osservatore = new ResizeObserver(misura);
      osservatore.observe(corpo);
    }
  });

  onBeforeUnmount(() => osservatore?.disconnect());
  return { misura };
}
