import { useMemo, useState } from 'react';
import { getGenerator } from './generators';
import { mulberry32, shuffledRange } from './prng';
import Player from './Player';
import Icon from './Icon';
import type { AlgorithmMode } from './types';
import styles from './styles.module.css';

const SPEED_IDX: Record<NonNullable<AlgorithmProps['speed']>, number> = {
  slow: 0,
  normal: 1,
  fast: 2,
};

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

interface AlgorithmProps {
  /** Id del generatore registrato (vedi generators/index.ts). */
  name: string;
  /** 'study' (default): passo-passo con spiegazioni. 'lab': autoplay e dati casuali. */
  mode?: AlgorithmMode;
  /** Valori espliciti (interi 1–99, max 12 elementi). */
  data?: number[];
  /** In alternativa a data: n valori casuali (permutazione di 1..n, clamp 4–10). */
  shuffle?: number;
  /** Valore cercato (kind 'search'). */
  target?: number;
  /** Velocità iniziale. */
  speed?: 'slow' | 'normal' | 'fast';
  /** Didascalia sotto la card. */
  caption?: string;
}

export default function Algorithm({
  name,
  mode = 'study',
  data,
  shuffle,
  target,
  speed = 'normal',
  caption,
}: AlgorithmProps) {
  // Seed iniziale fisso (1): markup server e client coincidono (hydration).
  const [seed, setSeed] = useState(1);
  const gen = getGenerator(name);

  const trace = useMemo(() => {
    if (!gen) return null;
    const rnd = mulberry32(seed);

    let baseData: number[];
    if (data && data.length) {
      let d = data.map((v) => clamp(Math.round(v), 1, 99));
      if (d.length > 12) {
        // eslint-disable-next-line no-console
        console.warn(
          `[Algorithm] data troncato a 12 elementi (ne aveva ${d.length}).`,
        );
        d = d.slice(0, 12);
      }
      baseData = d;
    } else if (shuffle !== undefined) {
      baseData = shuffledRange(clamp(Math.round(shuffle), 4, 10), rnd);
    } else {
      baseData = gen.defaultData.slice();
    }

    const prepared = gen.prepare ? gen.prepare(baseData) : baseData;

    // Target: prop esplicita, altrimenti pickTarget con lo stesso PRNG
    // (consumato DOPO i dati: ordine fisso per il determinismo SSR).
    let tgt = target;
    if (gen.kind === 'search' && tgt === undefined) {
      tgt = gen.pickTarget ? gen.pickTarget(prepared, rnd) : prepared[0];
    }

    return gen.generate({ data: prepared, target: tgt });
  }, [gen, data, shuffle, target, seed]);

  if (!gen || !trace) {
    // eslint-disable-next-line no-console
    console.error(`[Algorithm] algoritmo "${name}" non registrato.`);
    return (
      <div className={styles.errorBox}>
        Algorithm: algoritmo “{name}” non registrato
      </div>
    );
  }

  // «Rigenera» ha senso solo con dati casuali (shuffle, senza data esplicito).
  const showRegenerate = shuffle !== undefined && !(data && data.length);

  return (
    <>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.trafficLights} aria-hidden="true">
              <span className={`${styles.tlDot} ${styles.tlClose}`} />
              <span className={`${styles.tlDot} ${styles.tlMin}`} />
              <span className={`${styles.tlDot} ${styles.tlMax}`} />
            </span>
            <span className={styles.headerLabel}>{gen.label}</span>
          </div>
          <span className={styles.modeChip}>
            <Icon name={mode === 'study' ? 'book-open' : 'flask'} />
            {mode === 'study' ? 'studio' : 'lab'}
          </span>
        </div>
        <Player
          key={seed}
          trace={trace}
          mode={mode}
          label={gen.label}
          showRegenerate={showRegenerate}
          onRegenerate={() => setSeed((s) => s + 1)}
          initialSpeedIdx={SPEED_IDX[speed]}
        />
      </div>
      {caption && <p className={styles.caption}>{caption}</p>}
    </>
  );
}
