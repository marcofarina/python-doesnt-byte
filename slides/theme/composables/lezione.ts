/**
 * Dati della lezione per la cornice delle slide: volume, titolo, sezione
 * corrente, numero di pagina. Arrivano tutti dal frontmatter iniziale del mazzo
 * (vedi slides/README.md) e dalla posizione della slide: chi scrive le slide
 * non li ripete mai.
 */
import { computed } from 'vue';
import { useSlideContext } from '@slidev/client';

/** Indirizzo pubblico del libro: il QR della slide finale punta lì. */
export const SITO = 'https://python.rainbowbits.cloud';

/**
 * Radice del sito da cui si servono Brython, sql.js e i dataset. Le
 * presentazioni pubblicate stanno dentro il sito (/slides/…); in sviluppo
 * static/ è la public di Vite (theme/vite.config.ts). In tutti e due i casi è
 * la radice del dominio.
 */
export const RADICE_STATICI = '/';

export const VOLUMI: Record<string, { nome: string; breve: string; n: number }> =
  {
    programmatore: { nome: 'Manuale del Programmatore', breve: 'Programmatore', n: 1 },
    artefice: { nome: 'Manuale dell’Artefice', breve: 'Artefice', n: 2 },
    archivista: { nome: 'Manuale dell’Archivista', breve: 'Archivista', n: 3 },
    apprendista: { nome: 'Biblioteca dell’Apprendista', breve: 'Apprendista', n: 4 },
  };

interface Configurazione {
  title?: string;
  volume?: string;
  lezione?: string;
  capitolo?: number | string;
  sottotitolo?: string;
}

interface Diapositiva {
  no: number;
  meta?: {
    slide?: {
      title?: string;
      frontmatter?: Record<string, unknown>;
    };
  };
}

const due = (n: number) => String(n).padStart(2, '0');

export function useLezione() {
  const { $slidev, $page, $frontmatter } = useSlideContext();

  const config = computed(() => $slidev.configs as unknown as Configurazione);
  const volume = computed(() => config.value.volume ?? 'programmatore');
  const infoVolume = computed(
    () => VOLUMI[volume.value] ?? VOLUMI.programmatore,
  );

  /** `archivista/le-chiavi` → URL della lezione nel libro. */
  const urlLezione = computed(() =>
    config.value.lezione ? `${SITO}/${config.value.lezione}/` : SITO,
  );

  const diapositive = computed(
    () => ($slidev.nav.slides as unknown as Diapositiva[]) ?? [],
  );

  /** Le slide `layout: sezione`, nell'ordine, con il loro numero. */
  const sezioni = computed(() =>
    diapositive.value
      .filter((d) => d.meta?.slide?.frontmatter?.layout === 'sezione')
      .map((d, i) => ({
        no: d.no,
        numero: i + 1,
        titolo: String(
          d.meta?.slide?.frontmatter?.titolo ?? d.meta?.slide?.title ?? '',
        ),
      })),
  );

  /** La sezione in cui cade questa slide: l'ultima aperta prima di lei. */
  const sezione = computed(() => {
    const qui = $page.value;
    let corrente: (typeof sezioni.value)[number] | null = null;
    for (const s of sezioni.value) if (s.no <= qui) corrente = s;
    return corrente;
  });

  const etichettaSezione = computed(() => {
    const esplicita = $frontmatter.sezione as string | undefined;
    if (esplicita) return esplicita;
    const s = sezione.value;
    return s ? `${due(s.numero)} · ${s.titolo}` : 'Introduzione';
  });

  const numeroSezione = computed(() => {
    const qui = sezioni.value.find((s) => s.no === $page.value);
    return qui ? due(qui.numero) : '';
  });

  const kicker = computed(() => {
    const parti = [infoVolume.value.nome];
    if (config.value.capitolo !== undefined)
      parti.push(`Capitolo ${due(Number(config.value.capitolo))}`);
    return parti.join(' · ');
  });

  return {
    titolo: computed(() => config.value.title ?? ''),
    sottotitolo: computed(() => config.value.sottotitolo ?? ''),
    volume,
    infoVolume,
    kicker,
    urlLezione,
    etichettaSezione,
    numeroSezione,
    pagina: computed(() => due($page.value)),
    totale: computed(() => due($slidev.nav.total)),
    classeVolume: computed(() => `vol-${volume.value}`),
  };
}
