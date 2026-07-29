/**
 * Esegue il codice studente contro un livello PyQuest.
 *
 * Compone il preCode (D2/D7): `from pyquest import *` + `_load_level(<json>)` +
 * shadowing di `input`, poi delega a `runPython` (bryBridge). Gli eventi di
 * gioco arrivano via `onCustom` come `{type:'game_event', payload:'<json>'}`
 * (D4): qui il payload viene riparsato in un `GameEvent` tipato.
 *
 * Il JSON del livello iniettato è **spogliato dei campi testuali**
 * (title/hints/starterCode/solution): al motore servono solo grid/hero/goal/
 * enemies/resources/win/maxSteps. Meno quoting, payload più leggero.
 */

import type { BrythonConfig } from '@site/src/pyBoot';
import { runPython, type LogKind } from '@site/src/theme/PyRunner/bryBridge';
import type { GameEvent, LevelDef } from './types';

export const MAX_STEPS_DEFAULT = 500;

/** Sottoinsieme del livello che il motore Python consuma davvero. */
function runtimeLevel(level: LevelDef): Record<string, unknown> {
  const rt: Record<string, unknown> = {
    grid: level.grid,
    hero: level.hero,
    enemies: level.enemies ?? [],
    resources: level.resources ?? [],
    win: level.win,
    maxSteps: level.maxSteps ?? MAX_STEPS_DEFAULT,
  };
  if (level.goal) rt.goal = level.goal;
  return rt;
}

function buildPreCode(level: LevelDef): string {
  const json = JSON.stringify(runtimeLevel(level));
  return [
    'from pyquest import *',
    `_load_level('''${json}''')`,
    "def input(*a): raise RuntimeError('input() non è disponibile nei livelli: usa i sensori!')",
  ].join('\n');
}

export interface RunLevelOptions {
  code: string;
  level: LevelDef;
  codeId: string;
  libUrl: string;
  brython?: BrythonConfig;
  onStart: () => void;
  onEvent: (ev: GameEvent) => void;
  onLog: (kind: LogKind, text: string) => void;
  onDone: (durationMs: number) => void;
  onError?: (err: Error) => void;
}

/** Avvia un run. Ritorna una funzione di cleanup (rimuove il listener). */
export function runLevel(opts: RunLevelOptions): () => void {
  const {
    code,
    level,
    codeId,
    libUrl,
    brython,
    onStart,
    onEvent,
    onLog,
    onDone,
    onError,
  } = opts;

  return runPython(code, {
    codeId,
    preCode: buildPreCode(level),
    libUrl,
    brython,
    onStart,
    onLog,
    onDone,
    onError,
    onCustom: (detail) => {
      if (detail.type !== 'game_event') return;
      const payload = detail.payload;
      if (typeof payload !== 'string') return;
      try {
        onEvent(JSON.parse(payload) as GameEvent);
      } catch {
        // payload malformato: ignora (non deve mai capitare — lo emettiamo noi)
      }
    },
  });
}
