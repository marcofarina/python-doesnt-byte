import { useRef, type ReactNode } from 'react';
import styles from './styles.module.css';

interface Feature {
  kicker: string;
  title: string;
  desc: string;
  icon: ReactNode;
}

function CodeIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--at-accent)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function BeakerIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4.5 3h15M6 3v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3M6 14h12" />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a21caf" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

const FEATURES: Feature[] = [
  {
    kicker: '01',
    title: 'Clean Code',
    desc: 'Codice esemplare, commentato, sempre eseguibile direttamente nella pagina.',
    icon: <CodeIcon />,
  },
  {
    kicker: '02',
    title: 'Laboratori',
    desc: 'Esercizi guidati, quiz inline, animazioni interattive degli algoritmi.',
    icon: <BeakerIcon />,
  },
  {
    kicker: '03',
    title: 'Deep Dives',
    desc: 'Approfondimenti sui temi più sottili: scope, mutabilità, performance.',
    icon: <LayersIcon />,
  },
];

function SpotlightCard({ feature }: { feature: Feature }) {
  const ref = useRef<HTMLDivElement>(null);
  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--at-mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--at-my', `${e.clientY - r.top}px`);
  }
  return (
    <div ref={ref} onMouseMove={onMove} className={styles.card}>
      <div className={styles.iconBox}>{feature.icon}</div>
      <div className={styles.body}>
        <div className={styles.kicker}>{feature.kicker}</div>
        <h3 className={styles.cardTitle}>{feature.title}</h3>
        <p className={styles.cardDesc}>{feature.desc}</p>
      </div>
    </div>
  );
}

export default function BentoFeatures() {
  return (
    <section className={styles.wrap}>
      <div className={styles.head}>
        <h2 className={`${styles.title} at-grad-text`}>
          Pensato per imparare facendo.
        </h2>
        <p className={styles.subtitle}>
          Tre pilastri che rendono questo libro diverso dagli altri.
        </p>
      </div>
      <div className={styles.grid}>
        {FEATURES.map((f) => (
          <SpotlightCard key={f.kicker} feature={f} />
        ))}
      </div>
    </section>
  );
}
