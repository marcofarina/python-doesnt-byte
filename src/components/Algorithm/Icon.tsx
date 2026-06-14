import type { CSSProperties } from 'react';

/**
 * Set di icone duotone inline (estratte da Font Awesome 7.1.0 Duotone).
 *
 * Perché inline e non il webfont: per la manciata di icone che servono qui
 * (~9) il webfont duotone pesa ~318 KB; questi path sommano a un paio di KB,
 * danno due-toni veri (layer primario opacità 1, secondario .4), sono temabili
 * con `currentColor` (prendono l'accent del blocco) e non aggiungono download.
 *
 * `secondary` è il layer di sfondo (sotto, attenuato); `primary`, se presente,
 * il layer in primo piano a piena opacità. Le icone "mono" (play/pause) hanno
 * un solo layer: lì il secondary è disegnato a opacità piena.
 */

interface IconDef {
  vb: string;
  secondary: string;
  primary?: string;
}

const ICONS = {
  play: {
    vb: '0 0 448 512',
    secondary:
      'M91.2 36.9c-12.4-6.8-27.4-6.5-39.6 .7S32 57.9 32 72l0 368c0 14.1 7.5 27.2 19.6 34.4s27.2 7.5 39.6 .7l336-184c12.8-7 20.8-20.5 20.8-35.1s-8-28.1-20.8-35.1l-336-184z',
  },
  pause: {
    vb: '0 0 384 512',
    secondary:
      'M48 32C21.5 32 0 53.5 0 80L0 432c0 26.5 21.5 48 48 48l64 0c26.5 0 48-21.5 48-48l0-352c0-26.5-21.5-48-48-48L48 32zm224 0c-26.5 0-48 21.5-48 48l0 352c0 26.5 21.5 48 48 48l64 0c26.5 0 48-21.5 48-48l0-352c0-26.5-21.5-48-48-48l-64 0z',
  },
  'backward-step': {
    vb: '0 0 384 512',
    secondary:
      'M64 208.1l0 95.7 258 169.6c12.3 8.1 28 8.8 41 1.8s21-20.5 21-35.2l0-368c0-14.7-8.1-28.2-21-35.2s-28.7-6.3-41 1.8L64 208.1z',
    primary:
      'M32 32l0 0C14.3 32 0 46.3 0 64L0 448c0 17.7 14.3 32 32 32l0 0c17.7 0 32-14.3 32-32L64 64c0-17.7-14.3-32-32-32z',
  },
  'forward-step': {
    vb: '0 0 384 512',
    secondary:
      'M0 72L0 440c0 14.7 8.1 28.2 21 35.2s28.7 6.3 41-1.8l258-169.6 0-95.7-258-169.6c-12.3-8.1-28-8.8-41-1.8S0 57.3 0 72z',
    primary:
      'M352 32l0 0c17.7 0 32 14.3 32 32l0 384c0 17.7-14.3 32-32 32l0 0c-17.7 0-32-14.3-32-32l0-384c0-17.7 14.3-32 32-32z',
  },
  'forward-fast': {
    vb: '0 0 512 512',
    secondary:
      'M0 64L0 448c0 12.9 7.8 24.6 19.8 29.6s25.7 2.2 34.9-6.9L224 301.3 224 448c0 12.9 7.8 24.6 19.8 29.6s25.7 2.2 34.9-6.9L448 301.3 448 210.7 278.6 41.4c-9.2-9.2-22.9-11.9-34.9-6.9S224 51.1 224 64L224 210.7 54.6 41.4c-9.2-9.2-22.9-11.9-34.9-6.9S0 51.1 0 64z',
    primary:
      'M480 480c17.7 0 32-14.3 32-32l0-384c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 384c0 17.7 14.3 32 32 32z',
  },
  'rotate-left': {
    vb: '0 0 512 512',
    secondary:
      'M39.8 393.1C49.7 408.7 61.4 423.5 75 437 175 537 337 537 437 437S537 175 437 75C342.8-19.3 193.3-24.7 92.7 58.8l45.5 45.5c75.3-58.6 184.3-53.3 253.5 15.9 75 75 75 196.5 0 271.5s-196.5 75-271.5 0c-10.2-10.2-19-21.3-26.4-33-9.5-14.9-29.3-19.3-44.2-9.8s-19.3 29.3-9.8 44.2z',
    primary:
      'M168 192L24 192c-13.3 0-24-10.7-24-24L0 24C0 14.3 5.8 5.5 14.8 1.8S34.1 .2 41 7L185 151c6.9 6.9 8.9 17.2 5.2 26.2S177.7 192 168 192z',
  },
  shuffle: {
    vb: '0 0 512 512',
    secondary:
      'M0 384c0 17.7 14.3 32 32 32l64 0c30.2 0 58.7-14.2 76.8-38.4L224 309.3c-13.3-17.8-26.7-35.6-40-53.3l-62.4 83.2c-6 8.1-15.5 12.8-25.6 12.8l-64 0c-17.7 0-32 14.3-32 32zM224 202.7c13.3 17.8 26.7 35.6 40 53.3l62.4-83.2c6-8.1 15.5-12.8 25.6-12.8l32 0 0 32c0 12.9 7.8 24.6 19.8 29.6s25.7 2.2 34.9-6.9l64-64c6-6 9.4-14.1 9.4-22.6s-3.4-16.6-9.4-22.6l-64-64c-9.2-9.2-22.9-11.9-34.9-6.9S384 51.1 384 64l0 32-32 0c-30.2 0-58.7 14.2-76.8 38.4L224 202.7z',
    primary:
      'M352 416c-30.2 0-58.7-14.2-76.8-38.4L121.6 172.8c-6-8.1-15.5-12.8-25.6-12.8l-64 0c-17.7 0-32-14.3-32-32S14.3 96 32 96l64 0c30.2 0 58.7 14.2 76.8 38.4L326.4 339.2c6 8.1 15.5 12.8 25.6 12.8l32 0 0-32c0-12.9 7.8-24.6 19.8-29.6s25.7-2.2 34.9 6.9l64 64c6 6 9.4 14.1 9.4 22.6s-3.4 16.6-9.4 22.6l-64 64c-9.2 9.2-22.9 11.9-34.9 6.9S384 460.9 384 448l0-32-32 0z',
  },
  'book-open': {
    vb: '0 0 512 512',
    secondary:
      'M256 72l0 445.3c4.2 0 8.4-.8 12.3-2.5l12.8-5.3c46.8-19.5 97-29.5 147.7-29.5l35.2 0c26.5 0 48-21.5 48-48l0-352c0-26.5-21.5-48-48-48l-35.2 0c-50.7 0-100.9 10-147.7 29.5L256 72z',
    primary:
      'M256 72L230.9 61.5C184.1 42 133.9 32 83.2 32L48 32C21.5 32 0 53.5 0 80L0 432c0 26.5 21.5 48 48 48l35.2 0c50.7 0 100.9 10 147.7 29.5l12.8 5.3c3.9 1.6 8.1 2.5 12.3 2.5L256 72z',
  },
  flask: {
    vb: '0 0 448 512',
    secondary: 'M68.9 448l73.1-128 164 0 73.1 128-310.3 0z',
    primary:
      'M160 0L320 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l0 151.5 120.5 210.8c4.9 8.7 7.5 18.5 7.5 28.4 0 31.6-25.6 57.3-57.3 57.3L57.3 512C25.6 512 0 486.4 0 454.7 0 444.7 2.6 435 7.5 426.3L128 215.5 128 64c-17.7 0-32-14.3-32-32S110.3 0 128 0l32 0zm32 64l0 151.5c0 11.1-2.9 22.1-8.4 31.8L68.9 448 379.1 448 264.4 247.3c-5.5-9.7-8.4-20.6-8.4-31.8l0-151.5-64 0z',
  },
} satisfies Record<string, IconDef>;

export type IconName = keyof typeof ICONS;

interface IconProps {
  name: IconName;
  className?: string;
  style?: CSSProperties;
}

export default function Icon({ name, className, style }: IconProps) {
  const def: IconDef = ICONS[name];
  return (
    <svg
      className={className}
      style={style}
      viewBox={def.vb}
      width="1em"
      height="1em"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d={def.secondary}
        opacity={def.primary ? 'var(--alg-icon-secondary, 0.4)' : 1}
      />
      {def.primary && <path d={def.primary} />}
    </svg>
  );
}
