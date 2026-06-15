/**
 * Icone duotone inline per la ricerca — stesso spirito di
 * src/components/Algorithm/Icon.tsx: due layer (uno tenue di sfondo, uno
 * pieno in primo piano), temabili via `currentColor`, zero download extra.
 * Composte con primitive (cerchi/tratti) invece dei path FA Pro, così sono
 * sotto il nostro controllo e restano nitide a ogni dimensione.
 */
import React, { type ReactNode } from 'react';

interface IconProps {
  className?: string;
}

/** Lente d'ingrandimento duotone: disco tenue + anello e manico pieni. */
export function LensIcon({ className }: IconProps): ReactNode {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="10.5" cy="10.5" r="6.5" fill="currentColor" opacity="0.32" />
      <circle
        cx="10.5"
        cy="10.5"
        r="6.5"
        stroke="currentColor"
        strokeWidth="2"
      />
      <line
        x1="15.6"
        y1="15.6"
        x2="20.5"
        y2="20.5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Cerchio con X duotone: disco tenue + croce piena. Per chiudere la modale. */
export function CircleXmarkIcon({ className }: IconProps): ReactNode {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.3" />
      <path
        d="M8.7 8.7l6.6 6.6M15.3 8.7l-6.6 6.6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
