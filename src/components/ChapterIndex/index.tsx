import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import clsx from 'clsx';
import {
  BracketsCurlyIcon,
  CompassDraftingIcon,
  DatabaseIcon,
  BookOpenCoverIcon,
} from '@site/src/components/VolumeIcons';
import { useAllDocsData } from '@docusaurus/plugin-content-docs/client';
import {
  useCurriculumPluginData,
  type CurriculumTreeItem,
} from '@site/src/contexts/CurriculumContext';
import {
  resolvePermalink,
  volumeLabel,
  type AllDocsData,
} from '@site/src/lib/docResolve';
import styles from './styles.module.css';

type Accent = 'blue' | 'pink' | 'amber' | 'green';

interface Lesson {
  key: string;
  title: string;
  to: string;
  /** Capitolo (categoria di primo livello della TOC), se c'è. */
  group?: string;
}

interface Volume {
  id: string;
  n: string;
  accent: Accent;
  icon: (props: { size?: number }) => JSX.Element;
}

/*
 * L'indice non ha liste scritte a mano: le lezioni vengono dalla TOC del
 * volume (plugin curriculum) e compaiono solo se la pagina esiste davvero nei
 * docs pubblicati (useAllDocsData). Una lezione in bozza (draft: true) non è
 * nella build di produzione, quindi non compare; quando esce dalla bozza
 * compare da sola.
 */
const VOLUMES: Volume[] = [
  { id: 'programmatore', n: '01', accent: 'blue', icon: BracketsCurlyIcon },
  { id: 'artefice', n: '02', accent: 'pink', icon: CompassDraftingIcon },
  { id: 'archivista', n: '03', accent: 'amber', icon: DatabaseIcon },
  { id: 'apprendista', n: '04', accent: 'green', icon: BookOpenCoverIcon },
];

/** Lezioni pubblicate di un volume, in ordine di TOC, intro esclusa. */
function collectLessons(
  volumeId: string,
  tree: CurriculumTreeItem[],
  allData: AllDocsData,
): Lesson[] {
  const out: Lesson[] = [];
  const walk = (items: CurriculumTreeItem[], group?: string) => {
    for (const item of items) {
      if (item.type === 'category') {
        walk(item.items, group ?? item.label);
        continue;
      }
      const docId = item.key.slice(volumeId.length + 1);
      if (docId === 'intro') continue;
      const to = resolvePermalink(allData, volumeId, docId);
      if (to) out.push({ key: item.key, title: item.title, to, group });
    }
  };
  walk(tree);
  return out;
}

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
  const allData = useAllDocsData();
  const curriculum = useCurriculumPluginData();
  const lessonsByVolume = useMemo(() => {
    const treeById = new Map(curriculum.volumes.map((v) => [v.id, v.tree]));
    return VOLUMES.map((v) =>
      collectLessons(v.id, treeById.get(v.id) ?? [], allData),
    );
  }, [curriculum, allData]);
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
  const currentLabel = volumeLabel(current.id);
  const lessons = lessonsByVolume[active];

  return (
    <section className={clsx(styles.wrap, styles[`accent_${current.accent}`])}>
      <div className={styles.head}>
        <Heading as="h2" className={styles.label}>
          Indice
        </Heading>
        <span className={styles.headVolume}>{currentLabel}</span>
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
                <span className={styles.segName}>{volumeLabel(v.id)}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div
        id={panelId}
        role="tabpanel"
        aria-label={currentLabel}
        className={styles.panel}
      >
        <div key={active} className={styles.list}>
          {lessons.length === 0 ? (
            <div className={clsx(styles.row, styles.rowSoon)}>
              <span className={styles.num}>—</span>
              <span className={styles.title}>
                In costruzione: le lezioni escono man mano che sono pronte.
              </span>
            </div>
          ) : (
            lessons.map((l, i) => (
              <Link
                key={l.key}
                to={l.to}
                className={clsx(styles.row, styles.rowLink)}
              >
                <span className={styles.num}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className={styles.title}>{l.title}</span>
                {l.group && <span className={styles.lessons}>{l.group}</span>}
                <span className={styles.arrow}>
                  <ArrowRight />
                </span>
              </Link>
            ))
          )}
        </div>
      </div>

      <div className={styles.foot}>
        <span className={styles.footDot} aria-hidden="true" />
        <span>Volume in stesura · nuovi capitoli in arrivo</span>
      </div>
    </section>
  );
}
