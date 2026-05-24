/**
 * NavbarIconButton — un pulsante icona-solo per la navbar, visualmente
 * gemello del ColorModeToggle: 2rem rotondo, FA icon, popup neon al hover
 * con caret che punta al pulsante. Il colore del popup è parametrizzato
 * (es. cyan per link funzionali tipo GitHub, ambra per il caffè).
 */
import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import type {IconProp} from '@fortawesome/fontawesome-svg-core';

import styles from './styles.module.css';

export type IconButtonAccent = 'cyan' | 'amber';

interface Props {
  to: string;
  ariaLabel: string;
  tooltip: string;
  /** FontAwesome icon, es. `['fab', 'github']`. */
  icon: IconProp;
  /** Una taglia extra-larga è utile per icone con elementi sopra (es. mug-hot). */
  iconSize?: number;
  accent?: IconButtonAccent;
  target?: string;
  rel?: string;
}

export default function NavbarIconButton({
  to,
  ariaLabel,
  tooltip,
  icon,
  iconSize = 18,
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
      className={`${styles.btn} ${styles[accent]}`}>
      <FontAwesomeIcon
        icon={icon}
        className={styles.icon}
        style={{fontSize: iconSize}}
      />
      <span className={styles.tooltip} aria-hidden="true">
        <span className={styles.tooltipGlow} />
        <span className={styles.tooltipText}>{tooltip}</span>
      </span>
    </Link>
  );
}
