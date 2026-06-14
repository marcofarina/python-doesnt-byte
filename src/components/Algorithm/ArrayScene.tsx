import { type CSSProperties } from 'react';
import type { ArrayItem, ArraySceneState } from './types';
import styles from './styles.module.css';

const BAR_W = 38; // larghezza barra
const GAP = 8; // spazio tra barre
const UNIT = BAR_W + GAP;
const TRACK_H = 150; // altezza zona barre (allineate in basso)
const EXTRACT_DY = 52; // quanto scende l'elemento estratto
const LANE_H = 96; // zona sotto la track: badge/graffa/estratto
const BADGE_W = 20;
const BADGE_OFFSET = 22;

const x = (i: number) => i * UNIT;
const slotCenter = (i: number) => x(i) + BAR_W / 2;

interface ArraySceneProps {
  state: ArraySceneState;
  target?: number;
  label: string;
}

export default function ArrayScene({ state, target, label }: ArraySceneProps) {
  const n = state.items.length;
  const sceneWidth = Math.max(n * UNIT - GAP, BAR_W);

  // maxValue = max(initial): l'insieme dei valori è costante (items + estratto).
  const values = state.items
    .filter((it): it is ArrayItem => it !== null)
    .map((it) => it.value);
  if (state.extracted) values.push(state.extracted.item.value);
  const maxValue = Math.max(...values, 1);
  const barHeight = (value: number) =>
    28 + Math.round((value / maxValue) * 110);

  // Analisi del confronto in corso.
  const comparingSlots = new Set<number>();
  let comparingExtracted = false;
  let comparingTarget = false;
  if (state.comparing) {
    for (const ref of [state.comparing.a, state.comparing.b]) {
      if (ref.kind === 'item') comparingSlots.add(ref.i);
      else if (ref.kind === 'extracted') comparingExtracted = true;
      else comparingTarget = true;
    }
  }

  const sortedSet = new Set(state.sorted);
  const fadedSet = new Set(state.faded);
  const inRange = (slot: number) =>
    !state.range || (slot >= state.range.lo && slot <= state.range.hi);

  // Tutti gli item, per identità (slot dagli items, più l'eventuale estratto).
  type Entry = { item: ArrayItem; slot: number; isExtracted: boolean };
  const entries: Entry[] = [];
  state.items.forEach((it, slot) => {
    if (it) entries.push({ item: it, slot, isExtracted: false });
  });
  if (state.extracted) {
    entries.push({
      item: state.extracted.item,
      slot: state.extracted.overIndex,
      isExtracted: true,
    });
  }
  entries.sort((p, q) => p.item.id - q.item.id);

  function barStyle({ item, slot, isExtracted }: Entry): CSSProperties {
    const h = barHeight(item.value);
    const tx = x(slot);
    const ty = isExtracted ? TRACK_H - h + EXTRACT_DY : TRACK_H - h;
    // `--alg-bar` = tinta dell'elemento; il gradiente moderno è composto in CSS.
    const style: CSSProperties & Record<'--alg-bar', string> = {
      transform: `translate(${tx}px, ${ty}px)`,
      height: h,
      width: BAR_W,
      '--alg-bar': `var(--alg-item-${item.id % 10})`,
    };

    const isSorted = !isExtracted && sortedSet.has(slot);
    if (isSorted) {
      style['--alg-bar'] = 'var(--alg-sorted)';
      style.color = 'var(--alg-sorted-text)';
    } else {
      style.color = 'var(--alg-bar-text)';
    }

    if (!isExtracted && (fadedSet.has(slot) || !inRange(slot))) {
      style.opacity = 0.35;
    }

    return style;
  }

  // Stato di evidenziazione → classe (anello animato gestito in CSS).
  function barClass({ slot, isExtracted }: Entry): string {
    const isFound =
      !isExtracted &&
      state.outcome !== null &&
      state.outcome.found &&
      state.outcome.i === slot;
    if (isFound) return `${styles.bar} ${styles.barFound}`;
    const isComparing = isExtracted
      ? comparingExtracted
      : comparingSlots.has(slot);
    if (isComparing) return `${styles.bar} ${styles.barComparing}`;
    return styles.bar;
  }

  // Badge pointer raggruppati per slot.
  const bySlot = new Map<number, string[]>();
  for (const p of state.pointers) {
    const list = bySlot.get(p.i) ?? [];
    list.push(p.name);
    bySlot.set(p.i, list);
  }
  const badges: { key: string; left: number; name: string }[] = [];
  for (const [slot, names] of bySlot) {
    const ordered = names.slice().sort((a, b) => a.localeCompare(b));
    const groupW = BADGE_W + (ordered.length - 1) * BADGE_OFFSET;
    const start = slotCenter(slot) - groupW / 2;
    ordered.forEach((name, k) => {
      // key stabile per nome: il badge slitta (transizione su `left`)
      // quando il puntatore cambia slot, invece di rimontare.
      badges.push({ key: name, left: start + k * BADGE_OFFSET, name });
    });
  }

  return (
    <div
      className={styles.scene}
      role="img"
      aria-label={`Animazione passo-passo: ${label}`}
    >
      {target !== undefined && (
        <div className={styles.chipRow} style={{ width: sceneWidth }}>
          <div
            className={`${styles.targetChip} ${
              comparingTarget ? styles.targetChipActive : ''
            }`}
          >
            cerco: {target}
          </div>
        </div>
      )}

      <div
        className={styles.stage}
        style={{ width: sceneWidth, height: TRACK_H + LANE_H }}
      >
        {entries.map((entry) => (
          <div
            key={entry.item.id}
            className={barClass(entry)}
            style={barStyle(entry)}
          >
            <span className={styles.barValue}>{entry.item.value}</span>
          </div>
        ))}

        {badges.map((b) => (
          <div key={b.key} className={styles.badge} style={{ left: b.left }}>
            {b.name}
          </div>
        ))}

        {state.range && (
          <>
            <div
              className={styles.range}
              style={{
                left: x(state.range.lo),
                width: x(state.range.hi) + BAR_W - x(state.range.lo),
              }}
            />
            {state.range.label && (
              <div
                className={styles.rangeLabel}
                style={{
                  left: x(state.range.lo),
                  width: x(state.range.hi) + BAR_W - x(state.range.lo),
                }}
              >
                {state.range.label}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
