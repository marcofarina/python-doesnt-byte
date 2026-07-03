/**
 * GameScene — renderer DOM+CSS di uno stato di scena PyQuest (spec D5).
 *
 * Puro e derivato: riceve un `SceneState` (già ridotto dalla trace da
 * applyEvent) e lo disegna. Nessuna logica di gioco, nessun timer: le
 * animazioni sono transizioni CSS sulle posizioni (durata `--pq-dur`, iniettata
 * dal player in base alla velocità) più effetti one-shot legati a `scene.fx`.
 *
 * Identità DOM stabile: nemici morti e risorse raccolte NON vengono smontati —
 * restano nel DOM con le classi `dead`/`collected` (dissolvenza CSS), così le
 * transizioni e lo scrubbing all'indietro funzionano senza remount.
 *
 * `fxKey` cambia a ogni passo del player: è la `key` degli elementi effetto,
 * così due fx consecutivi dello stesso tipo rimontano il nodo e la keyframe
 * riparte.
 */

import { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import clsx from 'clsx';
import type { CSSProperties } from 'react';
import {
  characterDef,
  enemyVisual,
  resourceVisual,
  GOAL_ICON,
  HP_ICON,
} from './characters';
import type { Facing, LevelDef, SceneState } from './types';
import styles from './GameScene.module.css';

/** Lato massimo di una cella (px); sotto, la griglia scala col contenitore. */
const MAX_CELL_PX = 48;

// Gradi di rotazione dello sprite per facing (disegnato rivolto a nord).
// Esportato: anche l'editor livelli orienta l'eroe con la stessa tabella.
export const FACING_DEG: Record<Facing, number> = {
  north: 0,
  east: 90,
  south: 180,
  west: 270,
};

interface CellStyle extends CSSProperties {
  '--pq-x'?: number;
  '--pq-y'?: number;
}

function cellVars(x: number, y: number): CellStyle {
  return { '--pq-x': x, '--pq-y': y };
}

export interface GameSceneProps {
  level: LevelDef;
  character: string;
  scene: SceneState;
  /** Cambia a ogni passo: fa ripartire le animazioni one-shot. */
  fxKey: number;
}

export default function GameScene({
  level,
  character,
  scene,
  fxKey,
}: GameSceneProps) {
  const rows = level.grid.rows;
  const height = rows.length;
  const width = rows.length > 0 ? rows[0].length : 0;
  const legend = level.grid.legend;
  const char = characterDef(character);

  // --pq-cell = min(48px, larghezza contenitore / colonne) via ResizeObserver.
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [cellPx, setCellPx] = useState(MAX_CELL_PX);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      if (w > 0 && width > 0) {
        setCellPx(Math.min(MAX_CELL_PX, Math.floor(w / width)));
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);

  const boardStyle = {
    '--pq-cols': width,
    '--pq-rows': height,
    '--pq-cell': `${cellPx}px`,
  } as CSSProperties as CellStyle;

  const heroFx =
    scene.fx?.kind === 'bump' || scene.fx?.kind === 'hero_hit'
      ? scene.fx.kind
      : null;

  return (
    <div ref={wrapRef} className={styles.scene}>
      <div
        className={styles.board}
        style={boardStyle}
        role="img"
        aria-label={`Griglia ${width}×${height}, ${char.name} in (${scene.hero.x}, ${scene.hero.y})`}
      >
        {/* Griglia di celle (pavimento/muro). */}
        {rows.map((row, y) =>
          Array.from(row).map((ch, x) => {
            const wall = legend[ch] === 'wall';
            return (
              <div
                key={`${x},${y}`}
                className={wall ? styles.wall : styles.floor}
                style={cellVars(x, y)}
              />
            );
          }),
        )}

        {/* Goal (sotto le entità: l'eroe ci sale sopra). */}
        {level.goal && (
          <div
            className={styles.goal}
            style={cellVars(level.goal.x, level.goal.y)}
          >
            <FontAwesomeIcon icon={GOAL_ICON} />
          </div>
        )}

        {/* Risorse: sempre montate; da raccolte restano con la classe
            `collected` (dissolvenza), mai smontate. */}
        {Object.entries(scene.resources).map(([id, r]) => {
          const v = resourceVisual(r.kind);
          return (
            <div
              key={id}
              className={clsx(styles.resource, r.collected && styles.collected)}
              style={{ ...cellVars(r.x, r.y), color: v.color }}
              aria-label={r.collected ? undefined : v.label}
              aria-hidden={r.collected || undefined}
            >
              <FontAwesomeIcon icon={v.icon} />
            </div>
          );
        })}

        {/* Nemici: sempre montati; da morti restano con la classe `dead`. */}
        {Object.entries(scene.enemies).map(([id, e]) => {
          const v = enemyVisual(e.kind);
          return (
            <div
              key={id}
              className={clsx(styles.enemy, !e.alive && styles.dead)}
              style={{ ...cellVars(e.x, e.y), color: v.color }}
              aria-label={e.alive ? `${v.label}, ${e.hp} PV` : undefined}
              aria-hidden={!e.alive || undefined}
            >
              <FontAwesomeIcon icon={v.icon} />
              {e.alive && e.hp > 0 && (
                <span className={styles.enemyPips} aria-hidden="true">
                  {Array.from({ length: e.hp }).map((_, i) => (
                    <span key={i} className={styles.pip} />
                  ))}
                </span>
              )}
            </div>
          );
        })}

        {/* Eroe: il div esterno anima la posizione (transition su transform),
            il wrapper interno porta gli effetti one-shot (key cangiante),
            lo sprite interno ruota col facing. */}
        <div
          className={styles.hero}
          style={cellVars(scene.hero.x, scene.hero.y)}
        >
          <span
            key={heroFx ? `fx-${fxKey}` : 'idle'}
            className={clsx(
              styles.heroFxWrap,
              heroFx === 'bump' && styles.bump,
              heroFx === 'hero_hit' && styles.heroHit,
            )}
          >
            <span
              className={styles.sprite}
              style={{
                transform: `rotate(${FACING_DEG[scene.hero.facing]}deg)`,
              }}
            >
              {char.sprite}
            </span>
          </span>
        </div>

        {/* Effetto one-shot posizionale (attacco/raccolta/sconfitta). */}
        {scene.fx && scene.fx.at && !heroFx && (
          <div
            key={`fx-${fxKey}`}
            className={clsx(styles.fx, styles[`fx_${scene.fx.kind}`])}
            style={cellVars(scene.fx.at.x, scene.fx.at.y)}
          />
        )}
      </div>

      {/* HUD di scena: PV, inventario, esito (precedenza won > failed). */}
      <div className={styles.hud}>
        <div className={styles.hp} aria-label={`${scene.hero.hp} punti vita`}>
          {Array.from({ length: Math.max(scene.hero.hp, 0) }).map((_, i) => (
            <FontAwesomeIcon key={i} icon={HP_ICON} className={styles.hpPip} />
          ))}
        </div>
        <div className={styles.inventory}>
          {Object.entries(scene.inventory).map(([kind, n]) => {
            const v = resourceVisual(kind);
            return (
              <span key={kind} className={styles.invChip}>
                <FontAwesomeIcon icon={v.icon} /> {n}
              </span>
            );
          })}
        </div>
        {scene.won ? (
          <span className={clsx(styles.badge, styles.badgeWin)}>Vittoria!</span>
        ) : scene.dead ? (
          <span className={clsx(styles.badge, styles.badgeFail)}>
            {char.name} è caduto
          </span>
        ) : scene.stepLimit ? (
          <span className={clsx(styles.badge, styles.badgeFail)}>
            Troppe mosse
          </span>
        ) : null}
      </div>
    </div>
  );
}
