import { useEffect, useMemo, useRef, type CSSProperties } from 'react';
import clsx from 'clsx';
import {
  useCurriculumPluginData,
  type CurriculumTreeItem,
} from '@site/src/contexts/CurriculumContext';
import styles from './styles.module.css';

/*
 * Barra di avanzamento di un volume: lezioni pubblicate su lezioni previste.
 *
 * Le pubblicate si contano dalla TOC del volume (plugin curriculum), intro e
 * bozze escluse, quindi il numero si aggiorna da solo quando una lezione esce.
 * Le previste sono un numero scritto nell'introduzione del volume, ricavato da
 * pm/syllabus-tre-volumi.md: va aggiornato quando cambia il programma.
 *
 * La barra si scalda con la percentuale: più colori nel gradiente, scorrimento
 * più veloce, bagliore più forte e, oltre il 60%, una micro vibrazione casuale
 * che cresce fino al 100%. Al 100% la vibrazione si ferma e resta l'arcobaleno.
 * Con prefers-reduced-motion niente vibrazione (e la guardia globale di
 * custom.css ferma le animazioni CSS).
 */

type Accent = 'blue' | 'pink' | 'amber' | 'green';

const ACCENT_BY_VOLUME: Record<string, Accent> = {
  programmatore: 'blue',
  artefice: 'pink',
  archivista: 'amber',
  apprendista: 'green',
};

/** Arcobaleno di Rainbow Bits, letto a partire dall'accento del volume. */
const RAINBOW = [
  '#1d68e1',
  '#0891b2',
  '#16a34a',
  '#eab308',
  '#f97316',
  '#db2777',
  '#7c3aed',
];
const START_BY_ACCENT: Record<Accent, number> = {
  blue: 0,
  green: 2,
  amber: 4,
  pink: 5,
};

/** Soglia oltre la quale la barra comincia a vibrare. */
const SOGLIA_VIBRAZIONE = 0.6;

function countPublished(items: CurriculumTreeItem[]): number {
  let n = 0;
  for (const item of items) {
    if (item.type === 'category') n += countPublished(item.items);
    else if (!item.draft && !item.key.endsWith('/intro')) n += 1;
  }
  return n;
}

/** Gradiente con un numero di colori che cresce con la percentuale. */
function buildGradient(p: number, accent: Accent): string {
  const start = START_BY_ACCENT[accent];
  const quanti = Math.min(RAINBOW.length, 2 + Math.floor(p * 6));
  const colori = Array.from(
    { length: quanti },
    (_, i) => RAINBOW[(start + i) % RAINBOW.length],
  );
  // Il primo colore si ripete in coda: con background-size al 200% lo
  // scorrimento torna al punto di partenza senza salti.
  return `linear-gradient(90deg, ${[...colori, colori[0]].join(', ')})`;
}

interface Props {
  /** Id del volume (istanza docs): programmatore, artefice, archivista… */
  volume: string;
  /** Lezioni previste dal syllabus. */
  previste: number;
  /** Solo per le pagine di test: forza il numero di lezioni pubblicate. */
  pubblicate?: number;
}

export default function AvanzamentoVolume({
  volume,
  previste,
  pubblicate,
}: Props) {
  const curriculum = useCurriculumPluginData();
  const contate = useMemo(() => {
    const tree = curriculum.volumes.find((v) => v.id === volume)?.tree ?? [];
    return countPublished(tree);
  }, [curriculum, volume]);

  const fatte = Math.min(pubblicate ?? contate, previste);
  const p = previste > 0 ? fatte / previste : 0;
  const percento = Math.round(p * 100);
  const completo = fatte >= previste && previste > 0;
  const accent = ACCENT_BY_VOLUME[volume] ?? 'blue';

  const barRef = useRef<HTMLDivElement>(null);

  // Micro vibrazione casuale: ampiezza e frequenza crescono dal 60% al 100%.
  useEffect(() => {
    const bar = barRef.current;
    if (!bar || completo || p < SOGLIA_VIBRAZIONE) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const t = (p - SOGLIA_VIBRAZIONE) / (1 - SOGLIA_VIBRAZIONE);
    const ampiezza = 0.4 + t * t * 2.2; // px
    const pausa = 140 - t * 100; // ms fra due scosse
    let timer: number;
    const scuoti = () => {
      const dx = (Math.random() * 2 - 1) * ampiezza;
      const dy = (Math.random() * 2 - 1) * ampiezza * 0.6;
      const rot = (Math.random() * 2 - 1) * t * 0.35;
      bar.style.transform = `translate(${dx}px, ${dy}px) rotate(${rot}deg)`;
      timer = window.setTimeout(scuoti, pausa * (0.5 + Math.random()));
    };
    scuoti();
    return () => {
      window.clearTimeout(timer);
      bar.style.transform = '';
    };
  }, [p, completo]);

  const vars = {
    '--p': p,
    '--fill': `${percento}%`,
    '--grad': buildGradient(p, accent),
    '--h': `${10 + p * 8}px`,
    '--speed': `${(6 - p * 4.8).toFixed(2)}s`,
    '--glow': `${4 + p * 26}px`,
    '--glow-alpha': `${Math.round(15 + p * 55)}%`,
  } as CSSProperties;

  return (
    <figure
      className={clsx(
        styles.card,
        styles[`accent_${accent}`],
        p >= SOGLIA_VIBRAZIONE && styles.hot,
        completo && styles.done,
      )}
      style={vars}
    >
      <div className={styles.head}>
        <span className={styles.count}>
          <strong>{fatte}</strong>
          <span className={styles.of}>/ {previste} lezioni</span>
        </span>
        <span className={styles.percent}>{percento}%</span>
      </div>
      <div
        ref={barRef}
        className={styles.track}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={previste}
        aria-valuenow={fatte}
        aria-valuetext={`${fatte} lezioni pubblicate su ${previste}`}
      >
        {fatte > 0 && (
          <div className={styles.fill}>
            <span className={styles.spark} aria-hidden="true" />
          </div>
        )}
      </div>
      <figcaption className={styles.caption}>
        {completo
          ? 'Volume completo: tutte le lezioni previste sono pubblicate.'
          : 'Lezioni pubblicate su quelle previste dal programma del volume.'}
      </figcaption>
    </figure>
  );
}
