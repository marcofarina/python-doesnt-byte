import { useRef, useState } from 'react';
import Link from '@docusaurus/Link';
import clsx from 'clsx';
import styles from './styles.module.css';

interface Chapter {
  title: string;
  to: string;
}

interface Volume {
  id: string;
  short: string;
  label: string;
  accent: 'blue' | 'pink' | 'amber' | 'green';
  chapters: Chapter[];
  draft?: boolean;
}

const VOLUMES: Volume[] = [
  {
    id: 'programmatore',
    short: 'Programmatore',
    label: 'Manuale del Programmatore',
    accent: 'blue',
    chapters: [
      { title: 'Introduzione', to: '/programmatore/' },
      { title: 'Variabili', to: '/programmatore/variabili' },
    ],
  },
  {
    id: 'artefice',
    short: 'Artefice',
    label: "Manuale dell'Artefice",
    accent: 'pink',
    chapters: [
      { title: 'Introduzione', to: '/artefice/' },
      { title: 'Perché gli oggetti?', to: '/artefice/perche-gli-oggetti' },
      { title: 'Classi, istanze e metodi', to: '/artefice/classi-e-istanze' },
      {
        title: 'Metodi di classe e statici',
        to: '/artefice/metodi-di-classe-e-statici',
      },
      { title: 'Mostrare un oggetto', to: '/artefice/mostrare-un-oggetto' },
    ],
    draft: true,
  },
  {
    id: 'archivista',
    short: 'Archivista',
    label: "Manuale dell'Archivista",
    accent: 'amber',
    chapters: [{ title: 'Introduzione', to: '/archivista/' }],
    draft: true,
  },
  {
    id: 'apprendista',
    short: 'Apprendista',
    label: "Biblioteca dell'Apprendista",
    accent: 'green',
    chapters: [{ title: 'Introduzione', to: '/apprendista/' }],
    draft: true,
  },
];

function ArrowRight() {
  return (
    <svg
      width="14"
      height="14"
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

function Row({ chapter, index }: { chapter: Chapter; index: number }) {
  const ref = useRef<HTMLAnchorElement>(null);
  function onMove(e: React.MouseEvent<HTMLAnchorElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--at-mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--at-my', `${e.clientY - r.top}px`);
  }
  return (
    <Link ref={ref} to={chapter.to} onMouseMove={onMove} className={styles.row}>
      <div className={styles.rowInner}>
        <span className={styles.num}>{String(index + 1).padStart(2, '0')}</span>
        <span className={styles.title}>{chapter.title}</span>
        <span className={styles.arrow}>
          <ArrowRight />
        </span>
      </div>
    </Link>
  );
}

export default function ChapterIndex() {
  const [active, setActive] = useState(0);
  const panelId = 'chapter-index-panel';

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
    <section className={styles.wrap}>
      <div className={styles.head}>
        <h2 className={styles.label}>Indice</h2>
        <span className={styles.count}>{current.label}</span>
      </div>
      <div
        className={styles.tabs}
        role="tablist"
        aria-label="Volumi del libro"
        onKeyDown={onKeyDown}
      >
        {VOLUMES.map((v, i) => (
          <button
            key={v.id}
            type="button"
            role="tab"
            aria-selected={i === active}
            aria-controls={panelId}
            tabIndex={i === active ? 0 : -1}
            onClick={() => setActive(i)}
            className={clsx(
              styles.tab,
              styles[`accent_${v.accent}`],
              i === active && styles.tabActive,
            )}
          >
            {v.short}
          </button>
        ))}
      </div>
      <div
        id={panelId}
        role="tabpanel"
        aria-label={current.label}
        className={styles.panel}
      >
        <div key={active} className={styles.panelSlot}>
          <div className={styles.list}>
            {current.chapters.map((ch, i) => (
              <Row key={ch.to} chapter={ch} index={i} />
            ))}
          </div>
          {current.draft && (
            <div className={styles.draftNote}>
              Volume in stesura — nuovi capitoli in arrivo.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
