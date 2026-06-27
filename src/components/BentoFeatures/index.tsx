import { useRef, useState, type ReactNode } from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import PyRunner from '@site/src/theme/PyRunner';
import SQLRunner from '@site/src/theme/SQLRunner';
import Algorithm from '@site/src/components/Algorithm';
import styles from './styles.module.css';

interface Feature {
  kicker: string;
  title: string;
  desc: string;
  icon: ReactNode;
  demo: ReactNode;
}

/* Icone delle tab: Font Awesome Pro 7.1.0 duotone (primario currentColor +
 * secondario opacity .4). Il colore e l'animazione hover arrivano dalla
 * classe passata da fuori (vedi .icon* in styles). */
function PlayDuotone({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 512 512"
      aria-hidden="true"
    >
      <path
        opacity=".4"
        fill="currentColor"
        d="M0 256a256 256 0 1 0 512 0 256 256 0 1 0 -512 0zm176-88c0-8.7 4.7-16.7 12.3-20.9s16.8-4.1 24.3 .5l144 88c7.1 4.4 11.5 12.1 11.5 20.5s-4.4 16.1-11.5 20.5l-144 88c-7.4 4.5-16.7 4.7-24.3 .5S176 352.7 176 344l0-176z"
      />
      <path
        fill="currentColor"
        d="M212.5 147.5c-7.4-4.5-16.7-4.7-24.3-.5S176 159.3 176 168l0 176c0 8.7 4.7 16.7 12.3 20.9s16.8 4.1 24.3-.5l144-88c7.1-4.4 11.5-12.1 11.5-20.5s-4.4-16.1-11.5-20.5l-144-88z"
      />
    </svg>
  );
}

function TableDuotone({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 448 512"
      aria-hidden="true"
    >
      <path
        opacity=".4"
        fill="currentColor"
        d="M64 160l0 64 64 0 0 64-64 0 0 64 64 0 0 64 64 0 0-64 64 0 0 64 64 0 0-64 64 0 0-64-64 0 0-64 64 0 0-64-64 0 0-64-64 0 0 64-64 0 0-64-64 0 0 64-64 0zm128 64l64 0 0 64-64 0 0-64z"
      />
      <path
        fill="currentColor"
        d="M64 32C28.7 32 0 60.7 0 96L0 416c0 35.3 28.7 64 64 64l320 0c35.3 0 64-28.7 64-64l0-320c0-35.3-28.7-64-64-64L64 32zM384 96l0 320-320 0 0-320 320 0z"
      />
    </svg>
  );
}

function ChartDuotone({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 512 512"
      aria-hidden="true"
    >
      <path
        opacity=".4"
        fill="currentColor"
        d="M192 80c0-26.5 21.5-48 48-48l32 0c26.5 0 48 21.5 48 48l0 352c0 26.5-21.5 48-48 48l-32 0c-26.5 0-48-21.5-48-48l0-352z"
      />
      <path
        fill="currentColor"
        d="M432 96c-26.5 0-48 21.5-48 48l0 288c0 26.5 21.5 48 48 48l32 0c26.5 0 48-21.5 48-48l0-288c0-26.5-21.5-48-48-48l-32 0zM48 224c-26.5 0-48 21.5-48 48L0 432c0 26.5 21.5 48 48 48l32 0c26.5 0 48-21.5 48-48l0-160c0-26.5-21.5-48-48-48l-32 0z"
      />
    </svg>
  );
}

function SearchDuotone({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 512 512"
      aria-hidden="true"
    >
      <path
        opacity=".4"
        fill="currentColor"
        d="M64 208a144 144 0 1 0 288 0 144 144 0 1 0 -288 0z"
      />
      <path
        fill="currentColor"
        d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376C296.3 401.1 253.9 416 208 416 93.1 416 0 322.9 0 208S93.1 0 208 0 416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z"
      />
    </svg>
  );
}

/* Icone duotone (Font Awesome Pro 7.1.0) per il blocco «E molto altro ancora».
 * Primario currentColor + secondario opacity .4: il colore deriva dal
 * contenitore di ciascuna voce. */
function RouteDuotone() {
  return (
    <svg width="22" height="22" viewBox="0 0 512 512" aria-hidden="true">
      <path
        opacity=".4"
        fill="currentColor"
        d="M96 512l320 0c53 0 96-43 96-96s-43-96-96-96l-96 0c-17.7 0-32-14.3-32-32s14.3-32 32-32l96 0c-5.1 0-9.9-2.1-13.3-6-8.7-10.1-27-32-44.1-58-12.9 0-25.7 0-38.6 0-53 0-96 43-96 96s43 96 96 96l96 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-262.6 0c-17.1 26-35.4 48-44.1 58-3.3 3.9-8.2 6-13.3 6z"
      />
      <path
        fill="currentColor"
        d="M320 96c0 54.5 63.8 132.1 82.7 154 3.3 3.9 8.2 6 13.3 6s9.9-2.1 13.3-6c19-21.9 82.7-99.6 82.7-154 0-53-43-96-96-96s-96 43-96 96zm64 0a32 32 0 1 1 64 0 32 32 0 1 1 -64 0zM0 352c0 54.5 63.8 132.1 82.7 154 3.3 3.9 8.2 6 13.3 6s9.9-2.1 13.3-6c19-21.9 82.7-99.6 82.7-154 0-53-43-96-96-96S0 299 0 352zm64 0a32 32 0 1 1 64 0 32 32 0 1 1 -64 0z"
      />
    </svg>
  );
}

function WandDuotone() {
  return (
    <svg width="22" height="22" viewBox="0 0 576 512" aria-hidden="true">
      <path
        opacity=".4"
        fill="currentColor"
        d="M0 128c0 6.4 3.8 12.2 9.7 14.7l50.1 21.5 21.5 50.1c2.5 5.9 8.3 9.7 14.7 9.7s12.2-3.8 14.7-9.7l21.5-50.1 50.1-21.5c5.9-2.5 9.7-8.3 9.7-14.7s-3.8-12.2-9.7-14.7l-50.1-21.5-21.5-50.1C108.2 35.8 102.4 32 96 32s-12.2 3.8-14.7 9.7L59.8 91.8 9.7 113.3C3.8 115.8 0 121.6 0 128zM192 32c0 3.3 2 6.2 5 7.4L233.8 54.2 248.6 91c1.2 3 4.2 5 7.4 5s6.2-2 7.4-5L278.2 54.2 315 39.4c3-1.2 5-4.2 5-7.4s-2-6.2-5-7.4L278.2 9.8 263.4-27c-1.2-3-4.2-5-7.4-5s-6.2 2-7.4 5L233.8 9.8 197 24.6c-3 1.2-5 4.2-5 7.4zm133.4 85.4c33.7 33.7 67.5 67.5 101.3 101.3 35.1-35.1 70.1-70.1 105.2-105.2 7.8-7.8 12.2-18.4 12.2-29.5s-4.4-21.6-12.2-29.5L489.5 12.2C481.6 4.4 471 0 460 0s-21.6 4.4-29.5 12.2c-35.1 35.1-70.1 70.1-105.2 105.2zM368 400c0 6.4 3.8 12.2 9.7 14.7l50.1 21.5 21.5 50.1c2.5 5.9 8.3 9.7 14.7 9.7s12.2-3.8 14.7-9.7l21.5-50.1 50.1-21.5c5.9-2.5 9.7-8.3 9.7-14.7s-3.8-12.2-9.7-14.7l-50.1-21.5-21.5-50.1c-2.5-5.9-8.3-9.7-14.7-9.7s-12.2 3.8-14.7 9.7l-21.5 50.1-50.1 21.5c-5.9 2.5-9.7 8.3-9.7 14.7z"
      />
      <path
        fill="currentColor"
        d="M426.6 218.6L325.4 117.4 44.2 398.5C36.4 406.4 32 417 32 428s4.4 21.6 12.2 29.5l42.3 42.3C94.4 507.6 105 512 116 512s21.6-4.4 29.5-12.2L426.6 218.6z"
      />
    </svg>
  );
}

function LinkSwapDuotone() {
  return (
    <svg width="22" height="22" viewBox="0 0 512 512" aria-hidden="true">
      <path
        opacity=".4"
        fill="currentColor"
        d="M9.4 361.4l96-96c12.5-12.5 32.8-12.5 45.3 0s12.5 32.8 0 45.3L109.3 352 480 352c17.7 0 32 14.3 32 32s-14.3 32-32 32l-370.7 0 41.4 41.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0l-96-96c-12.5-12.5-12.5-32.8 0-45.3z"
      />
      <path
        fill="currentColor"
        d="M502.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-96 96c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L402.7 160 32 160c-17.7 0-32-14.3-32-32S14.3 96 32 96l370.7 0-41.4-41.4c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l96 96z"
      />
    </svg>
  );
}

const HERO_CODE = `# Cambia il numero, ripremi Run
righe = 7
for i in range(1, righe + 1):
    spazi = " " * (righe - i)
    stelle = "*" * (2 * i - 1)
    print(spazi + stelle)
`;

const SQL_DEMO = `-- Modifica la query e ripremi Run
SELECT a.nome, COUNT(*) AS prestiti
FROM prestiti p
JOIN libri l   ON l.id = p.libro_id
JOIN autori a  ON a.id = l.autore_id
GROUP BY a.nome
ORDER BY prestiti DESC
LIMIT 3;
`;

const FEATURES: Feature[] = [
  {
    kicker: '01',
    title: 'Esempi vivi',
    desc: 'Ogni snippet gira nella pagina. Modificalo, sperimenta, rompi qualcosa: il libro risponde.',
    icon: <PlayDuotone className={styles.iconPlay} />,
    demo: <PyRunner code={HERO_CODE} title="piramide.py" />,
  },
  {
    kicker: '02',
    title: 'Database dal vivo',
    desc: 'Interroghi un vero SQLite nel browser. Zero installazioni: scrivi SQL e vedi le righe.',
    icon: <TableDuotone className={styles.iconData} />,
    demo: (
      <SQLRunner
        code={SQL_DEMO}
        dataset="archivista/biblioteca"
        title="biblioteca.sql"
        runOnMount
        maxLines={10}
      />
    ),
  },
  {
    kicker: '03',
    title: 'Algoritmi animati',
    desc: 'Ordinamento, ricerca, ricorsione: visualizzazioni interattive per vedere ogni passo.',
    icon: <ChartDuotone className={styles.iconAlgo} />,
    demo: <Algorithm name="bubble-sort" mode="study" shuffle={6} />,
  },
  {
    kicker: '04',
    title: 'Cerca, non sfogliare',
    desc: 'Trova subito un concetto, una definizione, un esempio. Senza indice analitico né rilegatura.',
    icon: <SearchDuotone className={styles.iconSearch} />,
    demo: (
      <div className={styles.searchPromo}>
        <button
          type="button"
          className={styles.searchField}
          onClick={() =>
            window.dispatchEvent(new CustomEvent('pdb:open-search'))
          }
        >
          <SearchDuotone />
          <span className={styles.searchFieldText}>
            Cerca una funzione, un concetto, un esempio…
          </span>
          <span className={styles.fakeKbd}>⌘K</span>
        </button>
        <p className={styles.searchPromoNote}>
          Risultati istantanei con anteprima del contesto e scorciatoia da
          tastiera. Niente indice analitico da impaginare.
        </p>
      </div>
    ),
  },
];

interface MoreItem {
  icon: ReactNode;
  title: string;
  desc: string;
  color: string;
}

const MORE: MoreItem[] = [
  {
    icon: <RouteDuotone />,
    title: 'Percorsi adattivi',
    desc: 'Il libro si rimodella sul tuo indirizzo: Informatica, Liceo Scienze Applicate o ITS.',
    color: '#2563eb',
  },
  {
    icon: <WandDuotone />,
    title: 'Spiegamelo facile',
    desc: 'Copi un prompt pronto — o lo mandi al tuo LLM preferito — per farti rispiegare codice ed errori a parole tue.',
    color: '#7c3aed',
  },
  {
    icon: <LinkSwapDuotone />,
    title: 'Esercizi e teoria, collegati',
    desc: 'Ogni esercizio sa da quale lezione nasce; ogni lezione sa come allenarti.',
    color: '#0d9488',
  },
];

interface CardProps {
  feature: Feature;
  index: number;
  active: boolean;
  onSelect: () => void;
  panelId: string;
}

function SpotlightCard({ feature, active, onSelect, panelId }: CardProps) {
  const ref = useRef<HTMLButtonElement>(null);
  function onMove(e: React.MouseEvent<HTMLButtonElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--at-mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--at-my', `${e.clientY - r.top}px`);
  }
  // Riporta lo spotlight al centro così non «riappare» all'angolo al rientro.
  function onLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.removeProperty('--at-mx');
    el.style.removeProperty('--at-my');
  }
  return (
    <button
      ref={ref}
      type="button"
      role="tab"
      aria-selected={active}
      aria-controls={panelId}
      tabIndex={active ? 0 : -1}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={onSelect}
      className={clsx(styles.card, active && styles.cardActive)}
    >
      <div className={styles.iconBox}>{feature.icon}</div>
      <div className={styles.body}>
        <div className={styles.kicker}>{feature.kicker}</div>
        <Heading as="h3" className={styles.cardTitle}>
          {feature.title}
        </Heading>
        <p className={styles.cardDesc}>{feature.desc}</p>
      </div>
      <span className={styles.cardArrow} aria-hidden="true">
        {active ? '▾' : '→'}
      </span>
    </button>
  );
}

export default function BentoFeatures() {
  const [active, setActive] = useState(0);
  const panelId = 'bento-demo-panel';

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      setActive((a) => (a + 1) % FEATURES.length);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setActive((a) => (a - 1 + FEATURES.length) % FEATURES.length);
    }
  }

  return (
    <section className={styles.wrap}>
      <div className={styles.head}>
        <Heading as="h2" className={`${styles.title} at-grad-text`}>
          Pensato per imparare facendo.
        </Heading>
        <p className={styles.subtitle}>
          Cose che un libro di testo, sulla carta, non può fare.
        </p>
      </div>
      <div
        className={styles.grid}
        role="tablist"
        aria-label="Pilastri del libro"
        onKeyDown={onKeyDown}
      >
        {FEATURES.map((f, i) => (
          <SpotlightCard
            key={f.kicker}
            feature={f}
            index={i}
            active={i === active}
            onSelect={() => setActive(i)}
            panelId={panelId}
          />
        ))}
      </div>
      <div
        id={panelId}
        role="tabpanel"
        aria-label={FEATURES[active].title}
        className={styles.demoPanel}
      >
        <div key={active} className={styles.demoSlot}>
          {FEATURES[active].demo}
        </div>
      </div>

      <div className={styles.more}>
        <div className={styles.moreHead}>E molto altro ancora…</div>
        <ul className={styles.moreGrid}>
          {MORE.map((m) => (
            <li
              key={m.title}
              className={styles.moreItem}
              style={{ ['--more-color' as string]: m.color }}
            >
              <span className={styles.moreIcon}>{m.icon}</span>
              <div className={styles.moreBody}>
                <div className={styles.moreItemTitle}>{m.title}</div>
                <p className={styles.moreItemDesc}>{m.desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
