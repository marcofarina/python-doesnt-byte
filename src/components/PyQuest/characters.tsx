/**
 * Registry data-driven dei personaggi PyQuest (spec D13).
 *
 * Ogni personaggio ha uno sprite SVG inline (colori via CSS var → dark mode
 * gratis, definite in GameScene.module.css) e i flavor text di esito nel suo
 * registro. Lo sprite è disegnato in vista dall'alto rivolto a nord: il
 * renderer lo orienta nelle 4 direzioni con una rotate.
 *
 * V1 implementa Byte completo; `monty` è la predisposizione dati per il volume
 * futuro (sprite placeholder, la struttura è quella definitiva).
 */

import type { ReactElement } from 'react';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faGhost,
  faSkull,
  faDragon,
  faSpider,
  faBug,
  faGem,
  faKey,
  faCoins,
  faStar,
  faHeart,
  faFlagCheckered,
} from '@fortawesome/free-solid-svg-icons';

export interface CharacterDef {
  /** Nome proprio, usato nei pannelli di esito. */
  name: string;
  /** Sprite SVG inline, vista dall'alto, rivolto a nord (il renderer ruota). */
  sprite: ReactElement;
  /** Flavor text di esito, nel registro del personaggio (sarcasmo ≈3/5). */
  flavor: {
    win: string;
    death: string;
    stepLimit: (maxSteps: number) => string;
    /** Bump ripetuto: il codice è terminato ma l'eroe ha sbattuto più volte. */
    bump: string;
  };
}

/* Byte, il droide esploratore: corpo circolare con cingoli laterali e un
   occhio-LED al «muso» che rende leggibile il facing anche ruotato. Sprite
   provvisorio «da validare» (l'asset definitivo può sostituirlo qui). */
const byteSprite = (
  <svg viewBox="0 0 48 48" width="100%" height="100%" aria-hidden="true">
    {/* cingoli */}
    <rect
      x="4"
      y="12"
      width="7"
      height="26"
      rx="3.5"
      fill="var(--pq-hero-track)"
    />
    <rect
      x="37"
      y="12"
      width="7"
      height="26"
      rx="3.5"
      fill="var(--pq-hero-track)"
    />
    {/* corpo */}
    <circle cx="24" cy="25" r="14" fill="var(--pq-hero)" />
    {/* muso: indica la direzione di marcia */}
    <path d="M17 15 L24 4 L31 15 Z" fill="var(--pq-hero)" />
    {/* occhio-LED */}
    <circle cx="24" cy="14" r="5" fill="var(--pq-hero-led-ring)" />
    <circle cx="24" cy="14" r="2.6" fill="var(--pq-hero-led)" />
    {/* pannello dorsale */}
    <rect
      x="18"
      y="24"
      width="12"
      height="8"
      rx="2"
      fill="var(--pq-hero-panel)"
    />
  </svg>
);

/* Monty, il pitone col cappello (volume futuro): placeholder minimale, la
   entry esiste solo perché la struttura dati deve esserci già in v1. */
const montySprite = (
  <svg viewBox="0 0 48 48" width="100%" height="100%" aria-hidden="true">
    <circle cx="24" cy="26" r="13" fill="var(--pq-monty)" />
    {/* tesa e calotta del cappello da esploratore */}
    <ellipse cx="24" cy="14" rx="13" ry="4" fill="var(--pq-monty-hat)" />
    <path d="M16 14 Q24 2 32 14 Z" fill="var(--pq-monty-hat)" />
    <circle cx="19" cy="24" r="2" fill="var(--pq-monty-eye)" />
    <circle cx="29" cy="24" r="2" fill="var(--pq-monty-eye)" />
  </svg>
);

export const CHARACTERS: Record<string, CharacterDef> = {
  byte: {
    name: 'Byte',
    sprite: byteSprite,
    flavor: {
      win: 'Obiettivo raggiunto. I miei circuiti esultano — in binario, ovviamente.',
      death:
        'Integrità dello scafo: 0%. Nel mio report scriverò «atterraggio molto ravvicinato su un nemico». Riavviami e riproviamo.',
      stepLimit: (maxSteps) =>
        `${maxSteps + 1} mosse e nessuna uscita: o il labirinto è infinito, o quel \`while\` non si ferma mai. Scommetto sul \`while\`.`,
      bump: 'Hai sbattuto contro un muro. Di nuovo. Aggiorno il mio report assicurativo.',
    },
  },
  monty: {
    name: 'Monty',
    sprite: montySprite,
    flavor: {
      win: 'Missione compiuta. Niente applausi, grazie: mi cadrebbe il cappello.',
      death: 'Sono svenuto nel modo più dignitoso possibile. Riproviamo.',
      stepLimit: (maxSteps) =>
        `${maxSteps} mosse senza arrivare da nessuna parte. Persino io mi sono annoiato, e sono un rettile.`,
      bump: 'Quel muro era lì anche il turno scorso. E anche quello prima.',
    },
  },
};

const CHARACTER_FALLBACK = CHARACTERS.byte;

export function characterDef(id: string): CharacterDef {
  return CHARACTERS[id] ?? CHARACTER_FALLBACK;
}

// --- Nemici e risorse (icone Font Awesome, colori via CSS var) -----------------

export interface Visual {
  icon: IconDefinition;
  /** Colore CSS (token del tema di scena). */
  color: string;
  /** Etichetta accessibile. */
  label: string;
}

const ENEMIES: Record<string, Visual> = {
  bug: { icon: faBug, color: 'var(--pq-enemy)', label: 'bug' },
  ghost: { icon: faGhost, color: 'var(--pq-enemy)', label: 'fantasma' },
  dragon: { icon: faDragon, color: 'var(--pq-enemy)', label: 'drago' },
  spider: { icon: faSpider, color: 'var(--pq-enemy)', label: 'ragno' },
};

/** Kind con uno sprite dedicato (l'editor livelli li offre nei menu). */
export const ENEMY_KINDS = Object.keys(ENEMIES);

const ENEMY_FALLBACK: Visual = {
  icon: faSkull,
  color: 'var(--pq-enemy)',
  label: 'nemico',
};

export function enemyVisual(kind: string): Visual {
  return ENEMIES[kind] ?? ENEMY_FALLBACK;
}

const RESOURCES: Record<string, Visual> = {
  gem: { icon: faGem, color: 'var(--pq-resource)', label: 'gemma' },
  key: { icon: faKey, color: 'var(--pq-resource)', label: 'chiave' },
  coin: { icon: faCoins, color: 'var(--pq-resource)', label: 'moneta' },
  heart: { icon: faHeart, color: 'var(--pq-resource)', label: 'cuore' },
};

/** Kind con uno sprite dedicato (l'editor livelli li offre nei menu). */
export const RESOURCE_KINDS = Object.keys(RESOURCES);

const RESOURCE_FALLBACK: Visual = {
  icon: faStar,
  color: 'var(--pq-resource)',
  label: 'risorsa',
};

export function resourceVisual(kind: string): Visual {
  return RESOURCES[kind] ?? RESOURCE_FALLBACK;
}

// --- Icone di scena non-personaggio -------------------------------------------

export const GOAL_ICON = faFlagCheckered;
export const HP_ICON = faHeart;
