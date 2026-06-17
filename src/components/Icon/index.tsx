import React, { type CSSProperties } from 'react';
import { DUOTONE, type IconName } from './icons';

export type { IconName };

interface IconProps {
  name: IconName;
  /** lato in px (altezza); la larghezza segue le proporzioni del viewBox */
  size?: number;
  /** colore del glifo (default: currentColor del contenitore) */
  color?: string;
  /** opacità del layer secondario nei glifi duotone (default 0.4) */
  secondaryOpacity?: number;
  /** se valorizzato rende l'icona accessibile con un <title> */
  title?: string;
  style?: CSSProperties;
  className?: string;
}

/**
 * Icona Font Awesome Pro 7.1.0 in stile duotone, resa come SVG inline.
 * Vedi src/components/Icon/icons.ts per il registro dei glifi.
 */
export default function Icon({
  name,
  size = 22,
  color = 'currentColor',
  secondaryOpacity = 0.4,
  title,
  style,
  className,
}: IconProps): React.JSX.Element | null {
  const g = DUOTONE[name];
  if (!g) return null;

  const [, , vw, vh] = g.vb.split(' ').map(Number);
  const height = size;
  const width = size * (vw / vh);

  // Glifo a layer singolo (primario vuoto) o brand: il secondario è la sagoma
  // intera e va reso pieno; altrimenti applica l'opacità duotone.
  const single = g.brand || !g.p;

  return (
    <svg
      width={width}
      height={height}
      viewBox={g.vb}
      fill="none"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      style={{ color, display: 'block', flexShrink: 0, ...style }}
      className={className}
    >
      {title && <title>{title}</title>}
      {g.s && (
        <path
          d={g.s}
          fill="currentColor"
          opacity={single ? 1 : secondaryOpacity}
        />
      )}
      {g.p && <path d={g.p} fill="currentColor" />}
    </svg>
  );
}
