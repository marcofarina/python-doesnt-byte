import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import clsx from 'clsx';
import {
  BracketsCurlyIcon,
  CompassDraftingIcon,
  DatabaseIcon,
  BookOpenCoverIcon,
} from '@site/src/components/VolumeIcons';
import styles from './styles.module.css';

type Accent = 'blue' | 'pink' | 'amber' | 'green';

interface Chapter {
  title: string;
  lessons: number;
  /** Rotta della pagina, solo per i capitoli già pubblicati. */
  to?: string;
}

interface Volume {
  n: string;
  label: string;
  accent: Accent;
  icon: (props: { size?: number }) => JSX.Element;
  chapters: Chapter[];
  draft?: boolean;
}

/*
 * TOC pianificata: i capitoli senza `to` non esistono ancora come pagine e i
 * conteggi in `lessons` sono di progetto, non misurati sul contenuto reale.
 * Tenere allineata a mano man mano che i volumi prendono forma; a regime
 * andrà derivata dai globalData delle istanze docs.
 */
const VOLUMES: Volume[] = [
  {
    n: '01',
    label: 'Manuale del Programmatore',
    accent: 'blue',
    icon: BracketsCurlyIcon,
    draft: true,
    chapters: [
      { title: 'Introduzione', lessons: 2, to: '/programmatore/' },
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
      { title: 'Introduzione', lessons: 2, to: '/artefice/' },
      {
        title: 'Perché gli oggetti?',
        lessons: 3,
        to: '/artefice/perche-gli-oggetti',
      },
      {
        title: 'Classi, istanze e metodi',
        lessons: 5,
        to: '/artefice/classi-e-istanze',
      },
      {
        title: 'Metodi di classe e statici',
        lessons: 3,
        to: '/artefice/metodi-di-classe-e-statici',
      },
      {
        title: 'Mostrare un oggetto',
        lessons: 2,
        to: '/artefice/mostrare-un-oggetto',
      },
      { title: 'Incapsulamento', lessons: 4, to: '/artefice/incapsulamento' },
    ],
  },
  {
    n: '03',
    label: 'Manuale dell’Archivista',
    accent: 'amber',
    icon: DatabaseIcon,
    draft: true,
    chapters: [
      { title: 'Introduzione', lessons: 2, to: '/archivista/' },
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
      { title: 'Introduzione', lessons: 1, to: '/apprendista/' },
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
  const segRef = useRef<HTMLDivElement>(null);
  const animatedRef = useRef(false);
  const activeRef = useRef(active);

  // Tutte le dipendenze sono ref stabili → la funzione è creata una volta sola
  // e gli effect qui sotto non la elencano come dep instabile.
  const moveIndicator = useCallback((i: number, animate: boolean) => {
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
  }, []);

  useLayoutEffect(() => {
    activeRef.current = active;
    moveIndicator(active, animatedRef.current);
    animatedRef.current = true;
  }, [active, moveIndicator]);

  useLayoutEffect(() => {
    const el = segRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() =>
      moveIndicator(activeRef.current, false),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, [moveIndicator]);

  // Roving tabindex: il focus deve seguire il tab attivo, altrimenti resta
  // su un bottone con tabIndex -1 e la navigazione da tastiera si rompe.
  function selectTab(i: number) {
    setActive(i);
    btnRefs.current[i]?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      selectTab((active + 1) % VOLUMES.length);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      selectTab((active - 1 + VOLUMES.length) % VOLUMES.length);
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
        ref={segRef}
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
                <Icon size={20} />
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
          {current.chapters.map((ch, i) => {
            const inner = (
              <>
                <span className={styles.num}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className={styles.title}>{ch.title}</span>
                <span className={styles.lessons}>
                  {ch.lessons} {ch.lessons === 1 ? 'lezione' : 'lezioni'}
                </span>
                {ch.to && (
                  <span className={styles.arrow}>
                    <ArrowRight />
                  </span>
                )}
              </>
            );
            // Freccia e hover solo sulle righe che portano davvero a una
            // pagina; i capitoli pianificati restano voci statiche.
            return ch.to ? (
              <Link
                key={ch.title}
                to={ch.to}
                className={clsx(styles.row, styles.rowLink)}
              >
                {inner}
              </Link>
            ) : (
              <div key={ch.title} className={clsx(styles.row, styles.rowSoon)}>
                {inner}
              </div>
            );
          })}
        </div>
      </div>

      <div className={clsx(styles.foot, !current.draft && styles.footHidden)}>
        <span className={styles.footDot} aria-hidden="true" />
        <span>Volume in stesura · nuovi capitoli in arrivo</span>
      </div>
    </section>
  );
}
