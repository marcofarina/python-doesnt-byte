/**
 * Riduttore di scena PyQuest (pattern Algorithm/applyStep.ts).
 *
 * Il motore Python emette una trace di `GameEvent` (via `runLevel`); la scena a
 * un dato passo è derivata: `events.slice(0, step).reduce(applyGameEvent,
 * initScene(level))`. Riduttore puro → seek, step-back e replay gratis.
 *
 * Il campo `fx` è **transiente**: descrive un'animazione one-shot (bump, colpo,
 * raccolta…) valida solo per il passo che l'ha generata. Ogni `applyGameEvent`
 * lo azzera e lo re-imposta solo se l'evento corrente lo richiede.
 */

import type { GameEvent, LevelDef, SceneState } from './types';

/** Stato di scena al passo 0: derivato dal livello, prima di ogni evento. */
export function initScene(level: LevelDef): SceneState {
  const enemies: SceneState['enemies'] = {};
  for (const e of level.enemies ?? []) {
    enemies[e.id] = { kind: e.kind, x: e.x, y: e.y, hp: e.hp, alive: true };
  }
  const resources: SceneState['resources'] = {};
  for (const r of level.resources ?? []) {
    resources[r.id] = { kind: r.kind, x: r.x, y: r.y, collected: false };
  }
  return {
    hero: {
      x: level.hero.x,
      y: level.hero.y,
      facing: level.hero.facing,
      hp: level.hero.hp,
    },
    enemies,
    resources,
    inventory: {},
    won: false,
    dead: false,
    stepLimit: false,
    fx: null,
  };
}

/** Applica un evento a uno stato, restituendo un nuovo stato (immutabile). */
export function applyGameEvent(prev: SceneState, ev: GameEvent): SceneState {
  // Clona in superficie: `fx` riparte sempre da null (transiente).
  const s: SceneState = {
    ...prev,
    hero: { ...prev.hero },
    enemies: { ...prev.enemies },
    resources: { ...prev.resources },
    inventory: { ...prev.inventory },
    fx: null,
  };

  switch (ev.t) {
    case 'move':
      s.hero.x = ev.x;
      s.hero.y = ev.y;
      s.hero.facing = ev.f;
      break;
    case 'turn':
      s.hero.facing = ev.f;
      break;
    case 'bump':
      s.fx = { kind: 'bump', at: { x: ev.x, y: ev.y } };
      break;
    case 'attack':
      s.fx = { kind: 'attack', at: { x: ev.x, y: ev.y } };
      break;
    case 'enemy_hit': {
      const e = s.enemies[ev.id];
      if (e) s.enemies[ev.id] = { ...e, hp: ev.hp };
      break;
    }
    case 'defeat': {
      const e = s.enemies[ev.id];
      if (e) {
        s.enemies[ev.id] = { ...e, hp: 0, alive: false };
        s.fx = { kind: 'defeat', at: { x: e.x, y: e.y } };
      }
      break;
    }
    case 'enemy_move': {
      const e = s.enemies[ev.id];
      if (e) s.enemies[ev.id] = { ...e, x: ev.x, y: ev.y };
      break;
    }
    case 'hero_hit':
      s.hero.hp = ev.hp;
      s.fx = { kind: 'hero_hit', at: { x: s.hero.x, y: s.hero.y } };
      break;
    case 'collect': {
      const r = s.resources[ev.id];
      if (r) s.resources[ev.id] = { ...r, collected: true };
      s.inventory[ev.kind] = (s.inventory[ev.kind] ?? 0) + 1;
      s.fx = { kind: 'collect', at: { x: s.hero.x, y: s.hero.y } };
      break;
    }
    case 'win':
      s.won = true;
      break;
    case 'death':
      s.dead = true;
      break;
    case 'step_limit':
      s.stepLimit = true;
      break;
    default: {
      // Exhaustive check: se GameEvent cresce, il compilatore segnala qui.
      const _exhaustive: never = ev;
      return _exhaustive;
    }
  }

  return s;
}
