import { useRef } from 'react';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

interface Chapter {
  title: string;
  to: string;
  sections: number;
}

const CHAPTERS: Chapter[] = [
  { title: 'Introduzione', to: '/docs/intro', sections: 1 },
  {
    title: 'Fondamenti di Python',
    to: '/docs/category/fondamenti-di-python',
    sections: 1,
  },
  {
    title: 'Le basi del linguaggio',
    to: '/docs/basi-del-linguaggio',
    sections: 5,
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
        <span className={styles.num}>
          {String(index + 1).padStart(2, '0')}
        </span>
        <span className={styles.title}>{chapter.title}</span>
        <span className={styles.sections}>
          {chapter.sections} {chapter.sections === 1 ? 'sezione' : 'sezioni'}
        </span>
        <span className={styles.arrow}>
          <ArrowRight />
        </span>
      </div>
    </Link>
  );
}

export default function ChapterIndex() {
  return (
    <section className={styles.wrap}>
      <div className={styles.head}>
        <h2 className={styles.label}>Indice</h2>
        <span className={styles.count}>{CHAPTERS.length} capitoli</span>
      </div>
      <div className={styles.list}>
        {CHAPTERS.map((ch, i) => (
          <Row key={ch.to} chapter={ch} index={i} />
        ))}
      </div>
    </section>
  );
}
