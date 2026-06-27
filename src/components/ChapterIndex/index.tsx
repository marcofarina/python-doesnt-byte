import { useLayoutEffect, useRef, useState } from 'react';
import Heading from '@theme/Heading';
import clsx from 'clsx';
import styles from './styles.module.css';

type Accent = 'blue' | 'pink' | 'amber' | 'green';

interface Chapter {
  title: string;
  lessons: number;
}

interface Volume {
  n: string;
  label: string;
  accent: Accent;
  icon: () => JSX.Element;
  chapters: Chapter[];
  draft?: boolean;
}

/*
 * Icone dei volumi: Font Awesome Pro 7.1.0 — stile duotone, le stesse delle
 * VolumeCard a inizio homepage. Path primario `currentColor` + secondario
 * `opacity .4`. Il colore segue `currentColor`, impostato per accent dal CSS.
 */
function BracketsCurlyIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 576 512" aria-hidden="true">
      <path
        opacity=".4"
        fill="currentColor"
        d="M352 64c0 17.7 14.3 32 32 32l32 0c17.7 0 32 14.3 32 32l0 37.5c0 25.5 10.1 49.9 28.1 67.9l22.6 22.6-22.6 22.6c-18 18-28.1 42.4-28.1 67.9l0 37.5c0 17.7-14.3 32-32 32l-32 0c-17.7 0-32 14.3-32 32s14.3 32 32 32l32 0c53 0 96-43 96-96l0-37.5c0-8.5 3.4-16.6 9.4-22.6l45.3-45.3c12.5-12.5 12.5-32.8 0-45.3l-45.3-45.3c-6-6-9.4-14.1-9.4-22.6l0-37.5c0-53-43-96-96-96l-32 0c-17.7 0-32 14.3-32 32z"
      />
      <path
        fill="currentColor"
        d="M64 128c0-53 43-96 96-96l32 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-32 0c-17.7 0-32 14.3-32 32l0 37.5c0 25.5-10.1 49.9-28.1 67.9L77.3 256 99.9 278.6c18 18 28.1 42.4 28.1 67.9l0 37.5c0 17.7 14.3 32 32 32l32 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-32 0c-53 0-96-43-96-96l0-37.5c0-8.5-3.4-16.6-9.4-22.6L9.4 278.6c-12.5-12.5-12.5-32.8 0-45.3l45.3-45.3c6-6 9.4-14.1 9.4-22.6L64 128z"
      />
    </svg>
  );
}

function CompassDraftingIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 512 512" aria-hidden="true">
      <path
        opacity=".4"
        fill="currentColor"
        d="M31.2 276c-11.1-13.8-8.8-33.9 5-45s33.9-8.8 45 5c5.7 7.1 11.8 13.8 18.2 20.1L66.5 312.9C53.7 301.6 41.8 289.3 31.2 276zm124.1 89.9l32.7-56.4c21.5 6.8 44.3 10.5 68.1 10.5s46.6-3.7 68.1-10.5c33.7-10.7 63.9-29.2 88.6-53.4 6.5-6.3 12.6-13.1 18.2-20.1 11.1-13.8 31.2-16 45-5s16 31.2 5 45c-10.7 13.3-22.5 25.6-35.3 36.9-52.5 45.9-119.6 71.2-189.5 71.1-35.4 0-69.4-6.4-100.7-18.1z"
      />
      <path
        fill="currentColor"
        d="M343.2 136.2c5.6-12.2 8.8-25.8 8.8-40.2 0-53-43-96-96-96s-96 43-96 96c0 14.3 3.1 27.9 8.8 40.2L6.5 416.5C2.2 423.9 0 432.2 0 440.6L0 496c0 5.5 2.9 10.7 7.6 13.6s10.6 3.2 15.6 .7l55.4-27.7c8.4-4.2 15.4-10.8 20.1-18.9L256 191.9 324.1 309.5c33.7-10.7 63.9-29.2 88.6-53.4L343.2 136.2zM224 96a32 32 0 1 1 64 0 32 32 0 1 1 -64 0zM356.7 365.9l56.6 97.8c4.7 8.1 11.7 14.7 20.1 18.9l55.4 27.7c5 2.5 10.9 2.2 15.6-.7s7.6-8.1 7.6-13.6l0-55.4c0-8.4-2.2-16.7-6.5-24.1l-60-103.7c-25.9 22.7-55.9 40.8-88.8 53z"
      />
    </svg>
  );
}

function DatabaseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 448 512" aria-hidden="true">
      <path
        opacity=".4"
        fill="currentColor"
        d="M0 80l0 48c0 44.2 100.3 80 224 80s224-35.8 224-80l0-48C448 35.8 347.7 0 224 0S0 35.8 0 80zM0 205.8L0 288c0 44.2 100.3 80 224 80s224-35.8 224-80l0-82.2c-14.8 9.8-31.8 17.7-49.5 24-47 16.8-108.7 26.2-174.5 26.2S96.4 246.5 49.5 229.8c-17.6-6.3-34.7-14.2-49.5-24zm0 160L0 432c0 44.2 100.3 80 224 80s224-35.8 224-80l0-66.2c-14.8 9.8-31.8 17.7-49.5 24-47 16.8-108.7 26.2-174.5 26.2S96.4 406.5 49.5 389.8c-17.6-6.3-34.7-14.2-49.5-24z"
      />
      <path
        fill="currentColor"
        d="M0 205.8L0 128c0 44.2 100.3 80 224 80s224-35.8 224-80l0 77.8c-14.8 9.8-31.8 17.7-49.5 24-47 16.8-108.7 26.2-174.5 26.2S96.4 246.5 49.5 229.8c-17.6-6.3-34.7-14.2-49.5-24zm0 160L0 288c0 44.2 100.3 80 224 80s224-35.8 224-80l0 77.8c-14.8 9.8-31.8 17.7-49.5 24-47 16.8-108.7 26.2-174.5 26.2S96.4 406.5 49.5 389.8c-17.6-6.3-34.7-14.2-49.5-24z"
      />
    </svg>
  );
}

function BookOpenCoverIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 576 512" aria-hidden="true">
      <path
        opacity=".4"
        fill="currentColor"
        d="M288 72l0 382c3.6 0 7.3-.6 10.8-1.9l38.6-13.8c41.5-14.8 85.1-22.4 129.2-22.4l61.5 0c26.5 0 48-21.5 48-48l0-288c0-26.5-21.5-48-48-48l-61.5 0c-44 0-87.7 7.6-129.2 22.4L288 72z"
      />
      <path
        fill="currentColor"
        d="M238.6 54.4L288 72 288 454c-3.6 0-7.3-.6-10.8-1.9l-38.6-13.8C197.2 423.6 153.5 416 109.5 416L48 416c-26.5 0-48-21.5-48-48L0 80C0 53.5 21.5 32 48 32l61.5 0c44 0 87.7 7.6 129.2 22.4zM24 464l85.5 0c46.8 0 93.2 8 137.2 23.8l38.6 13.8c1.7 .6 3.6 .6 5.4 0l38.6-13.8c44-15.7 90.5-23.8 137.2-23.8l85.5 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-85.5 0c-41.3 0-82.2 7.1-121.1 21l-38.6 13.8c-12.2 4.3-25.5 4.3-37.7 0L230.6 533c-38.9-13.9-79.8-21-121.1-21L24 512c-13.3 0-24-10.7-24-24s10.7-24 24-24z"
      />
    </svg>
  );
}

const VOLUMES: Volume[] = [
  {
    n: '01',
    label: 'Manuale del Programmatore',
    accent: 'blue',
    icon: BracketsCurlyIcon,
    draft: true,
    chapters: [
      { title: 'Introduzione', lessons: 2 },
      { title: 'Fondamenti di Python', lessons: 4 },
      { title: 'Le basi del linguaggio', lessons: 5 },
      { title: 'Strutture di controllo', lessons: 4 },
      { title: 'Funzioni', lessons: 4 },
      { title: 'Strutture dati', lessons: 5 },
    ],
  },
  {
    n: '02',
    label: 'Manuale dell’Artefice',
    accent: 'pink',
    icon: CompassDraftingIcon,
    draft: true,
    chapters: [
      { title: 'Introduzione', lessons: 2 },
      { title: 'Perché gli oggetti?', lessons: 3 },
      { title: 'Classi, istanze e metodi', lessons: 5 },
      { title: 'Metodi di classe e statici', lessons: 3 },
      { title: 'Mostrare un oggetto', lessons: 2 },
      { title: 'Incapsulamento', lessons: 4 },
    ],
  },
  {
    n: '03',
    label: 'Manuale dell’Archivista',
    accent: 'amber',
    icon: DatabaseIcon,
    draft: true,
    chapters: [
      { title: 'Introduzione', lessons: 2 },
      { title: 'File e formati', lessons: 4 },
      { title: 'Database relazionali', lessons: 5 },
      { title: 'SQL essenziale', lessons: 6 },
      { title: 'Serializzazione', lessons: 3 },
    ],
  },
  {
    n: '04',
    label: 'Biblioteca dell’Apprendista',
    accent: 'green',
    icon: BookOpenCoverIcon,
    draft: true,
    chapters: [
      { title: 'Introduzione', lessons: 1 },
      { title: 'Mini-progetti guidati', lessons: 5 },
      { title: 'Algoritmi visualizzati', lessons: 4 },
      { title: 'Sfide di codice', lessons: 6 },
    ],
  },
];

function ArrowRight() {
  return (
    <svg
      className={styles.arrowSvg}
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

export default function ChapterIndex() {
  const [active, setActive] = useState(0);
  const panelId = 'chapter-index-panel';

  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const animatedRef = useRef(false);

  function moveIndicator(i: number, animate: boolean) {
    const ind = indicatorRef.current;
    const btn = btnRefs.current[i];
    if (!ind || !btn) return;
    if (!animate) ind.classList.add(styles.noAnim);
    ind.style.transform = `translate(${btn.offsetLeft}px, ${btn.offsetTop}px)`;
    ind.style.width = `${btn.offsetWidth}px`;
    ind.style.height = `${btn.offsetHeight}px`;
    if (!animate) {
      // riattiva l'animazione dopo due frame (come nel template originale)
      requestAnimationFrame(() =>
        requestAnimationFrame(() => ind.classList.remove(styles.noAnim)),
      );
    }
  }

  useLayoutEffect(() => {
    moveIndicator(active, animatedRef.current);
    animatedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  useLayoutEffect(() => {
    function onResize() {
      moveIndicator(active, false);
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      setActive((a) => (a + 1) % VOLUMES.length);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setActive((a) => (a - 1 + VOLUMES.length) % VOLUMES.length);
    }
  }

  const current = VOLUMES[active];

  return (
    <section className={clsx(styles.wrap, styles[`accent_${current.accent}`])}>
      <div className={styles.head}>
        <Heading as="h2" className={styles.label}>
          Indice
        </Heading>
        <span className={styles.headVolume}>{current.label}</span>
      </div>

      <div
        className={styles.seg}
        role="tablist"
        aria-label="Volumi del libro"
        onKeyDown={onKeyDown}
      >
        <span
          ref={indicatorRef}
          className={styles.indicator}
          aria-hidden="true"
        />
        {VOLUMES.map((v, i) => {
          const Icon = v.icon;
          return (
            <button
              key={v.n}
              ref={(el) => {
                btnRefs.current[i] = el;
              }}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-controls={panelId}
              tabIndex={i === active ? 0 : -1}
              onClick={() => setActive(i)}
              className={clsx(
                styles.segBtn,
                i === active && styles.segBtnActive,
              )}
            >
              <span className={styles.segIco}>
                <Icon />
              </span>
              <span className={styles.segTxt}>
                <span className={styles.segKicker}>VOL. {v.n}</span>
                <span className={styles.segName}>{v.label}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div
        id={panelId}
        role="tabpanel"
        aria-label={current.label}
        className={styles.panel}
      >
        <div key={active} className={styles.list}>
          {current.chapters.map((ch, i) => (
            <div key={ch.title} className={styles.row}>
              <span className={styles.num}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className={styles.title}>{ch.title}</span>
              <span className={styles.lessons}>
                {ch.lessons} {ch.lessons === 1 ? 'lezione' : 'lezioni'}
              </span>
              <span className={styles.arrow}>
                <ArrowRight />
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className={clsx(styles.foot, !current.draft && styles.footHidden)}>
        <span className={styles.footDot} aria-hidden="true" />
        <span>Volume in stesura · nuovi capitoli in arrivo</span>
      </div>
    </section>
  );
}
