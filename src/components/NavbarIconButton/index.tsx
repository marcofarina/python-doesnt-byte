/**
 * NavbarIconButton — un pulsante icona-solo per la navbar, visualmente
 * gemello del ColorModeToggle: 2rem rotondo, FA icon, popup neon al hover
 * con caret che punta al pulsante. Il colore del popup è parametrizzato
 * (es. cyan per link funzionali tipo GitHub, ambra per il caffè).
 */
import React, { type ReactNode } from 'react';
import Link from '@docusaurus/Link';

import styles from './styles.module.css';

export type IconButtonAccent = 'cyan' | 'amber' | 'red';

interface Props {
  to: string;
  ariaLabel: string;
  tooltip: string;
  /** L'icona da renderizzare (FA, SVG importato, qualsiasi ReactNode). */
  icon: ReactNode;
  accent?: IconButtonAccent;
  target?: string;
  rel?: string;
}

export default function NavbarIconButton({
  to,
  ariaLabel,
  tooltip,
  icon,
  accent = 'cyan',
  target,
  rel,
}: Props): ReactNode {
  return (
    <Link
      to={to}
      target={target}
      rel={rel}
      aria-label={ariaLabel}
      className={`${styles.btn} ${styles[accent]}`}
    >
      <span className={styles.icon} aria-hidden="true">
        {icon}
      </span>
      <span className={styles.tooltip} aria-hidden="true">
        <span className={styles.tooltipGlow} />
        <span className={styles.tooltipText}>{tooltip}</span>
      </span>
    </Link>
  );
}
