import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import type { ArrayItem, ArraySceneState } from './types';
import styles from './styles.module.css';

const BASE_BAR_W = 44; // larghezza barra a piena dimensione (desktop)
const BASE_GAP = 14; // spazio tra barre a piena dimensione
const MAX_UNIT = BASE_BAR_W + BASE_GAP; // 58 — passo orizzontale desktop
const MIN_UNIT = 36; // passo minimo su mobile (barra ~27 + gap ~9)
const BAR_RATIO = BASE_BAR_W / MAX_UNIT; // quota della barra dentro al passo
const TRACK_H = 170; // altezza zona barre (allineate in basso)
const MIN_H = 40; // altezza barra del valore minimo
const EXTRACT_DY = 58; // quanto scende l'elemento estratto (chiave)
const HEADROOM = 16; // spazio sopra le barre per «lift» e ombra (no clipping)
const EDGE = 6; // margine orizzontale interno: l'anello di selezione (~2.5px)
// delle barre ai bordi non viene tagliato dall'overflow del .sceneWrap.
const BADGE_W = 20;
const BADGE_OFFSET = 22;

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

// useLayoutEffect avverte in SSR: su server cade su useEffect (innocuo, il
// markup parte comunque dal passo MAX_UNIT, identico al primo render client).
const useIsoLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

// stato → variabile CSS dell'anello (colori in styles.module.css)
const RING: Record<string, string> = {
  compare: 'var(--alg-st-compare)',
  swap: 'var(--alg-st-swap)',
  sorted: 'var(--alg-st-sorted)',
  key: 'var(--alg-st-key)',
};

function ringShadow(name: keyof typeof RING): string {
  const c = RING[name];
  return `0 0 0 2.5px ${c}, 0 10px 24px -6px color-mix(in srgb, ${c} 38%, transparent)`;
}

interface ArraySceneProps {
  state: ArraySceneState;
  target?: number;
  label: string;
  /** 'gradient' = tinta per valore (scala ordinabile); 'rainbow' = tinta per
   *  identità, stabile e che segue l'elemento negli spostamenti. */
  colorMode: 'gradient' | 'rainbow';
  /** Altezza della corsia sotto le barre, fissata sull'intera trace. */
  laneH: number;
  /** Pannello codice attivo: l'indicatore di posizione mostra la variabile. */
  showLabels: boolean;
}

export default function ArrayScene({
  state,
  target,
  label,
  colorMode,
  laneH,
  showLabels,
}: ArraySceneProps) {
  const n = state.items.length;

  // Larghezza disponibile = clientWidth di .sceneWrap (il genitore, che ha
  // overflow-x: auto e già sconta il padding del .body). La misuro e seguo i
  // resize/rotazioni con un ResizeObserver, restando dentro ArrayScene.
  const sceneRef = useRef<HTMLDivElement>(null);
  const [availW, setAvailW] = useState(0);
  useIsoLayoutEffect(() => {
    const wrap = sceneRef.current?.parentElement;
    if (!wrap) return undefined;
    const measure = () => setAvailW(wrap.clientWidth);
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  // Passo adattivo: pieno (MAX_UNIT) finché c'è spazio, poi si stringe fino a
  // MIN_UNIT; sotto, lo scroll orizzontale del .sceneWrap fa da rete (fallback).
  // sceneWidth = n*unit − gap, quindi divido per (n − quota gap) per far stare
  // l'intero array nello spazio disponibile quando possibile.
  // Lo spazio per le barre è quello disponibile meno i due margini EDGE.
  const unit =
    availW > 0 && n > 0
      ? clamp((availW - 2 * EDGE) / (n - 1 + BAR_RATIO), MIN_UNIT, MAX_UNIT)
      : MAX_UNIT;
  const barW = unit * BAR_RATIO;
  const gap = unit - barW;
  // Il valore in cifre non entra in barre molto strette: scalo il font solo
  // verso il basso (mai oltre la dimensione desktop).
  const valueScale = Math.min(1, barW / BASE_BAR_W);

  // Le barre partono da EDGE (non da 0): così l'anello della prima e dell'ultima
  // ha spazio a sinistra/destra e non viene clippato.
  const x = (i: number) => EDGE + i * unit;
  const slotCenter = (i: number) => x(i) + barW / 2;

  const contentWidth = Math.max(n * unit - gap, barW);
  const sceneWidth = contentWidth + 2 * EDGE;
  const base = HEADROOM + TRACK_H; // baseline (base delle barre)

  // L'insieme dei valori è costante (items + eventuale estratto): min/max fissi.
  const values = state.items
    .filter((it): it is ArrayItem => it !== null)
    .map((it) => it.value);
  if (state.extracted) values.push(state.extracted.item.value);
  const minValue = Math.min(...values, 1);
  const maxValue = Math.max(...values, 1);
  const norm = (v: number) =>
    maxValue === minValue ? 0.6 : (v - minValue) / (maxValue - minValue);
  const barHeight = (v: number) => MIN_H + norm(v) * (TRACK_H - MIN_H);
  // Tinta della barra: per valore (gradiente ciano→magenta, si ordina in scala)
  // oppure per identità (arcobaleno stabile, ogni elemento tiene il suo colore).
  const hueOf = (item: ArrayItem) =>
    colorMode === 'rainbow'
      ? (item.id / Math.max(n, 1)) * 320
      : 196 + norm(item.value) * 128;

  // Confronto in corso.
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
  const swappingSet = new Set(state.swapping);
  const minSlots = new Set(
    state.pointers.filter((p) => p.name === 'min').map((p) => p.i),
  );
  const inRange = (slot: number) =>
    !state.range || (slot >= state.range.lo && slot <= state.range.hi);
  const foundSlot =
    state.outcome && state.outcome.found ? state.outcome.i : null;

  // Tutti gli item per identità (slot dagli items, più l'eventuale estratto).
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

    // anello semantico (priorità crescente: vince l'ultimo)
    let ring: keyof typeof RING | null = null;
    let lift = 0;
    if (isExtracted) {
      ring = 'key';
    } else {
      if (sortedSet.has(slot)) ring = 'sorted';
      if (minSlots.has(slot)) ring = 'compare';
      if (comparingSlots.has(slot)) {
        ring = 'compare';
        lift = 8;
      }
      if (swappingSet.has(slot)) ring = 'swap';
      if (foundSlot === slot) ring = 'sorted';
    }
    if (isExtracted && comparingExtracted) lift = 0; // resta in basso

    const tx = x(slot);
    const ty = (isExtracted ? base - h + EXTRACT_DY : base - h) - lift;

    const style: CSSProperties & Record<'--alg-hue', string> = {
      transform: `translate(${tx}px, ${ty}px)`,
      height: h,
      width: barW,
      color: 'var(--alg-bar-text)',
      '--alg-hue': String(Math.round(hueOf(item))),
    };
    if (ring) style.boxShadow = ringShadow(ring);
    if (!isExtracted && (fadedSet.has(slot) || !inRange(slot))) {
      style.opacity = 0.32;
    }
    return style;
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
      badges.push({ key: name, left: start + k * BADGE_OFFSET, name });
    });
  }

  return (
    <div
      ref={sceneRef}
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
        style={{ width: sceneWidth, height: base + laneH }}
      >
        <div className={styles.baseline} style={{ top: base }} />

        {entries.map((entry) => (
          <div
            key={entry.item.id}
            className={styles.bar}
            style={barStyle(entry)}
          >
            {entry.isExtracted && <span className={styles.keyTag}>KEY</span>}
            <span
              className={styles.barValue}
              style={
                valueScale < 1
                  ? { fontSize: `${valueScale * 0.9}rem` }
                  : undefined
              }
            >
              {entry.item.value}
            </span>
          </div>
        ))}

        {badges.map((b) => (
          <div
            key={b.key}
            className={styles.badge}
            style={{ left: b.left, top: base + 18 }}
          >
            {b.name}
          </div>
        ))}

        {state.cursor && state.cursor.i >= 0 && (
          <div
            className={styles.cursor}
            style={{ left: slotCenter(state.cursor.i), top: base + 3 }}
          >
            <span className={styles.cursorCaret} />
            {showLabels && state.cursor.label && (
              <span className={styles.cursorLabel}>{state.cursor.label}</span>
            )}
          </div>
        )}

        {state.range && (
          <>
            <div
              className={styles.range}
              style={{
                top: base + 46,
                left: x(state.range.lo),
                width: x(state.range.hi) + barW - x(state.range.lo),
              }}
            />
            {state.range.label && (
              <div
                className={styles.rangeLabel}
                style={{
                  top: base + 58,
                  left: x(state.range.lo),
                  width: x(state.range.hi) + barW - x(state.range.lo),
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
