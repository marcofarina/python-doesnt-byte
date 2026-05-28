import { useRef, useState, type ReactNode } from 'react';
import clsx from 'clsx';
import PyRunner from '@site/src/theme/PyRunner';
import styles from './styles.module.css';

interface Feature {
  kicker: string;
  title: string;
  desc: string;
  icon: ReactNode;
  demo: ReactNode;
}

function PlayIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--at-accent)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="6 4 20 12 6 20 6 4" />
    </svg>
  );
}

function GraphIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="5" cy="6" r="2.2" />
      <circle cx="19" cy="6" r="2.2" />
      <circle cx="12" cy="13" r="2.2" />
      <circle cx="6" cy="19" r="2.2" />
      <circle cx="18" cy="19" r="2.2" />
      <line x1="6.6" y1="7.5" x2="10.6" y2="11.6" />
      <line x1="17.4" y1="7.5" x2="13.4" y2="11.6" />
      <line x1="10.7" y1="14.7" x2="7.3" y2="17.4" />
      <line x1="13.3" y1="14.7" x2="16.7" y2="17.4" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a21caf" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="6.5" />
      <line x1="20" y1="20" x2="15.5" y2="15.5" />
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

function ComingSoonPanel({
  icon,
  title,
  body,
}: {
  icon: ReactNode;
  title: string;
  body: ReactNode;
}) {
  return (
    <div className={styles.comingWrap}>
      <div className={styles.comingIcon}>{icon}</div>
      <div className={styles.comingTitle}>{title}</div>
      <div className={styles.comingBody}>{body}</div>
      <span className={styles.comingBadge}>Prossimamente</span>
    </div>
  );
}

const FEATURES: Feature[] = [
  {
    kicker: '01',
    title: 'Esempi vivi',
    desc: 'Ogni snippet gira nella pagina. Modificalo, sperimenta, rompi qualcosa: il libro risponde.',
    icon: <PlayIcon />,
    demo: <PyRunner code={HERO_CODE} title="piramide.py" />,
  },
  {
    kicker: '02',
    title: 'Algoritmi animati',
    desc: 'Ordinamento, ricorsione, grafi: visualizzazioni interattive per vedere ogni passo.',
    icon: <GraphIcon />,
    demo: (
      <ComingSoonPanel
        icon={<GraphIcon />}
        title="Visualizzatore di algoritmi"
        body={
          <>
            Ogni algoritmo del libro avrà la sua animazione: step-by-step,
            controlli play/pausa, evidenziazione delle variabili in gioco.
          </>
        }
      />
    ),
  },
  {
    kicker: '03',
    title: 'Cerca, non sfogliare',
    desc: 'Trova subito un concetto, una definizione, un esempio. Senza indice analitico né rilegatura.',
    icon: <SearchIcon />,
    demo: (
      <ComingSoonPanel
        icon={<SearchIcon />}
        title="Ricerca full-text"
        body={
          <>
            <div className={styles.fakeSearch}>
              <SearchIcon />
              <input
                type="text"
                placeholder="Cerca una funzione, un concetto, un esempio…"
                disabled
                aria-label="Anteprima del campo di ricerca"
              />
              <span className={styles.fakeKbd}>⌘K</span>
            </div>
            Risultati istantanei con anteprima del contesto, scorciatoia da
            tastiera, niente indice analitico da impaginare.
          </>
        }
      />
    ),
  },
];

interface CardProps {
  feature: Feature;
  index: number;
  active: boolean;
  onSelect: () => void;
  panelId: string;
}

function SpotlightCard({
  feature,
  index,
  active,
  onSelect,
  panelId,
}: CardProps) {
  const ref = useRef<HTMLButtonElement>(null);
  function onMove(e: React.MouseEvent<HTMLButtonElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--at-mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--at-my', `${e.clientY - r.top}px`);
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
      onClick={onSelect}
      className={clsx(styles.card, active && styles.cardActive)}
    >
      <div className={styles.iconBox}>{feature.icon}</div>
      <div className={styles.body}>
        <div className={styles.kicker}>{feature.kicker}</div>
        <h3 className={styles.cardTitle}>{feature.title}</h3>
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
        <h2 className={`${styles.title} at-grad-text`}>
          Pensato per imparare facendo.
        </h2>
        <p className={styles.subtitle}>
          Tre cose che un libro di testo, sulla carta, non può fare.
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
    </section>
  );
}
