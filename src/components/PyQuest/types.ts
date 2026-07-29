/**
 * Tipi di PyQuest: la trace di eventi emessi dal motore Python
 * (`static/bry-libs/pyquest.py`), lo stato di scena derivato consumato dal
 * renderer, e i tipi dei dati livello/mondo speculari allo schema world.json.
 */

export type Facing = 'north' | 'east' | 'south' | 'west';

/** Un evento della trace. Il campo discriminante è `t`. */
export type GameEvent =
  | { t: 'move'; x: number; y: number; f: Facing }
  | { t: 'turn'; f: Facing }
  | { t: 'bump'; x: number; y: number }
  | { t: 'attack'; x: number; y: number; hit: boolean }
  | { t: 'enemy_hit'; id: string; hp: number }
  | { t: 'defeat'; id: string }
  | { t: 'enemy_move'; id: string; x: number; y: number }
  | { t: 'hero_hit'; hp: number; by: string }
  | { t: 'collect'; id: string; kind: string }
  | { t: 'win' }
  | { t: 'death' }
  | { t: 'step_limit' };

/** Riga di console associata al passo della trace in cui è stata emessa. */
export interface LogLine {
  kind: 'stdout' | 'stderr';
  text: string;
  atStep: number;
}

/** Stato di scena a un dato passo: derivato riducendo la trace. */
export interface SceneState {
  hero: { x: number; y: number; facing: Facing; hp: number };
  enemies: Record<
    string,
    { kind: string; x: number; y: number; hp: number; alive: boolean }
  >;
  resources: Record<
    string,
    { kind: string; x: number; y: number; collected: boolean }
  >;
  inventory: Record<string, number>;
  won: boolean;
  dead: boolean;
  stepLimit: boolean;
  /** Transiente: valido solo per lo step corrente (animazioni one-shot). */
  fx: {
    kind: 'bump' | 'attack' | 'hero_hit' | 'collect' | 'defeat';
    at?: { x: number; y: number };
  } | null;
}

// --- Schema dati (speculare a static/pyquest/<world>/world.json) -------------

export interface GridDef {
  legend: Record<string, string>;
  rows: string[];
}

export interface HeroDef {
  x: number;
  y: number;
  facing: Facing;
  hp: number;
}

export interface PointDef {
  x: number;
  y: number;
}

export type EnemyBehavior = 'static' | 'melee';

export interface EnemyDef {
  id: string;
  kind: string;
  x: number;
  y: number;
  hp: number;
  behavior: EnemyBehavior;
}

export interface ResourceDef {
  id: string;
  kind: string;
  x: number;
  y: number;
}

export type WinCond =
  | { type: 'reach' }
  | { type: 'collect'; kind: string; qty: number }
  | { type: 'defeat'; kind?: string; count?: number };

export interface LevelDef {
  id: string;
  title: string;
  grid: GridDef;
  hero: HeroDef;
  goal?: PointDef;
  enemies?: EnemyDef[];
  resources?: ResourceDef[];
  win: WinCond[];
  starterCode: string;
  /** Solo per l'autore (calibrazione del `par`); non usato a runtime. */
  solution?: string;
  hints: string[];
  par: number;
  maxSteps?: number;
}

export interface WorldDef {
  schemaVersion: number;
  id: string;
  title: string;
  description: string;
  character: string;
  volume: string;
  levels: LevelDef[];
}
