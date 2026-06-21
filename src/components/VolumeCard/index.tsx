import { useRef, type CSSProperties, type ReactNode } from 'react';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type Accent = 'blue' | 'pink' | 'amber' | 'green';

interface VolumeCardProps {
  to: string;
  kicker: string;
  title: string;
  desc: string;
  icon: ReactNode;
  accent?: Accent;
}

const PALETTES: Record<Accent, CSSProperties> = {
  blue: {
    ['--vol-glow' as string]: 'rgba(56,189,248,0.28)',
    ['--vol-shadow' as string]: 'rgba(56,189,248,0.4)',
    ['--vol-ring' as string]: 'rgba(56,189,248,0.4)',
    ['--vol-beam-1' as string]: 'var(--at-beam-1)',
    ['--vol-beam-2' as string]: 'var(--at-beam-2)',
    ['--vol-beam-3' as string]: 'var(--at-beam-3)',
    ['--vol-icon-bg' as string]:
      'linear-gradient(135deg, rgba(56,189,248,0.15), rgba(99,102,241,0.15))',
    ['--vol-icon-border' as string]: 'rgba(56,189,248,0.3)',
    ['--vol-icon-color' as string]: 'var(--at-accent-soft)',
    ['--vol-kicker-color' as string]: 'var(--at-accent-soft)',
  },
  pink: {
    ['--vol-glow' as string]: 'rgba(236,72,153,0.28)',
    ['--vol-shadow' as string]: 'rgba(236,72,153,0.4)',
    ['--vol-ring' as string]: 'rgba(236,72,153,0.4)',
    ['--vol-beam-1' as string]: 'var(--at-beam-2-1)',
    ['--vol-beam-2' as string]: 'var(--at-beam-2-2)',
    ['--vol-beam-3' as string]: 'var(--at-beam-2-3)',
    ['--vol-icon-bg' as string]:
      'linear-gradient(135deg, rgba(236,72,153,0.15), rgba(139,92,246,0.15))',
    ['--vol-icon-border' as string]: 'rgba(236,72,153,0.3)',
    ['--vol-icon-color' as string]: '#a21caf',
    ['--vol-kicker-color' as string]: '#a21caf',
  },
  amber: {
    ['--vol-glow' as string]: 'rgba(245,158,11,0.28)',
    ['--vol-shadow' as string]: 'rgba(245,158,11,0.4)',
    ['--vol-ring' as string]: 'rgba(245,158,11,0.4)',
    ['--vol-beam-1' as string]: '#f59e0b',
    ['--vol-beam-2' as string]: '#fb923c',
    ['--vol-beam-3' as string]: '#ef4444',
    ['--vol-icon-bg' as string]:
      'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(251,146,60,0.15))',
    ['--vol-icon-border' as string]: 'rgba(245,158,11,0.3)',
    ['--vol-icon-color' as string]: '#b45309',
    ['--vol-kicker-color' as string]: '#b45309',
  },
  green: {
    ['--vol-glow' as string]: 'rgba(34,197,94,0.28)',
    ['--vol-shadow' as string]: 'rgba(34,197,94,0.4)',
    ['--vol-ring' as string]: 'rgba(34,197,94,0.4)',
    ['--vol-beam-1' as string]: '#10b981',
    ['--vol-beam-2' as string]: '#14b8a6',
    ['--vol-beam-3' as string]: '#06b6d4',
    ['--vol-icon-bg' as string]:
      'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(20,184,166,0.15))',
    ['--vol-icon-border' as string]: 'rgba(34,197,94,0.3)',
    ['--vol-icon-color' as string]: '#15803d',
    ['--vol-kicker-color' as string]: '#15803d',
  },
};

function ArrowRight() {
  return (
    <svg
      width="16"
      height="16"
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

export default function VolumeCard({
  to,
  kicker,
  title,
  desc,
  icon,
  accent = 'blue',
}: VolumeCardProps) {
  const ref = useRef<HTMLAnchorElement>(null);

  function handleMove(e: React.MouseEvent<HTMLAnchorElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const px = x / r.width;
    const py = y / r.height;
    const ry = (px - 0.5) * 14;
    const rx = -(py - 0.5) * 12;
    el.style.transform = `perspective(1100px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0)`;
    el.style.setProperty('--vol-mx', `${x}px`);
    el.style.setProperty('--vol-my', `${y}px`);
  }

  function handleLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.transform = '';
  }

  return (
    <Link
      to={to}
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={styles.card}
      style={PALETTES[accent]}
    >
      <span className={styles.glow} aria-hidden="true" />
      <div className={styles.inner}>
        <div className={styles.iconBox}>{icon}</div>
        <div className={styles.body}>
          <div className={styles.kicker}>{kicker}</div>
          <Heading as="h3" className={styles.title}>
            {title}
          </Heading>
          <p className={styles.desc}>{desc}</p>
        </div>
        <div className={styles.arrow}>
          <ArrowRight />
        </div>
      </div>
    </Link>
  );
}
