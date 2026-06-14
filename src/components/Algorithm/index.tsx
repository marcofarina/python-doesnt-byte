import { useMemo, useState } from 'react';
import { getGenerator } from './generators';
import { mulberry32, shuffledRange } from './prng';
import Player from './Player';
import Icon from './Icon';
import { useAlgoPref } from './usePref';
import type { AlgorithmMode } from './types';
import styles from './styles.module.css';

const SPEED_IDX: Record<NonNullable<AlgorithmProps['speed']>, number> = {
  slow: 0,
  normal: 1,
  fast: 2,
};

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

/** I preset configurano i toggle (codice, spiegazione). Il toggle «codice»
 *  governa anche i controlli avanzati (shuffle, esegui, velocità): in Studio,
 *  con il codice spento, resta solo l'avanzamento passo-passo. Toccare un
 *  toggle a mano «sgancia» il preset (mode → null); ripremerlo li riapplica. */
const PRESETS: Record<AlgorithmMode, { code: boolean; explain: boolean }> = {
  study: { code: false, explain: true },
  lab: { code: true, explain: false },
};

interface AlgorithmProps {
  /** Id del generatore registrato (vedi generators/index.ts). */
  name: string;
  /** Preset di partenza del blocco (regia d'autore). 'study' (default):
   *  spiegazione + codice; 'lab': solo codice. Lo studente può cambiarlo. */
  mode?: AlgorithmMode;
  /** Valori espliciti (interi 1–99, max 12 elementi). */
  data?: number[];
  /** In alternativa a data: n valori casuali (permutazione di 1..n, clamp 4–10). */
  shuffle?: number;
  /** Valore cercato (kind 'search'). */
  target?: number;
  /** Velocità iniziale. */
  speed?: 'slow' | 'normal' | 'fast';
  /** Il blocco espone il pannello pseudocodice (richiede `code` nel generatore). */
  showCode?: boolean;
  /** Il pannello include la colonna statistiche. */
  showStats?: boolean;
  /** Didascalia sotto la card. */
  caption?: string;
}

export default function Algorithm({
  name,
  mode: initialMode = 'study',
  data,
  shuffle,
  target,
  speed = 'normal',
  showCode,
  showStats,
  caption,
}: AlgorithmProps) {
  // Seed iniziale fisso (1): markup server e client coincidono (hydration).
  const [seed] = useState(1);
  // Permutazione casuale impostata da «Mescola» (azione client).
  const [override, setOverride] = useState<number[] | null>(null);
  // Preset attivo (null = configurazione «custom» dopo un toggle manuale) e i
  // due toggle che esso governa: stato locale del blocco, NON persistito, così
  // ogni blocco riparte dal default scelto dall'autore. Il colore invece è una
  // preferenza globale (estetica, non didattica): condivisa e persistita.
  const [mode, setMode] = useState<AlgorithmMode | null>(initialMode);
  const [panelOpen, setPanelOpen] = useState(PRESETS[initialMode].code);
  const [explainOpen, setExplainOpen] = useState(PRESETS[initialMode].explain);
  const [colorMode, setColorMode] = useAlgoPref<'gradient' | 'rainbow'>(
    'color',
    'gradient',
  );
  const gen = getGenerator(name);

  function applyPreset(p: AlgorithmMode) {
    setMode(p);
    setPanelOpen(PRESETS[p].code);
    setExplainOpen(PRESETS[p].explain);
  }
  function toggleCode() {
    setPanelOpen((v) => !v);
    setMode(null);
  }
  function toggleExplain() {
    setExplainOpen((v) => !v);
    setMode(null);
  }

  const trace = useMemo(() => {
    if (!gen) return null;
    const rnd = mulberry32(seed);

    let baseData: number[];
    if (override) {
      baseData = override;
    } else if (data && data.length) {
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
  }, [gen, data, shuffle, target, seed, override]);

  if (!gen || !trace) {
    // eslint-disable-next-line no-console
    console.error(`[Algorithm] algoritmo "${name}" non registrato.`);
    return (
      <div className={styles.errorBox}>
        Algorithm: algoritmo “{name}” non registrato
      </div>
    );
  }

  // Il blocco ha un pannello se il generatore porta pseudocodice e l'autore
  // non lo disabilita; la sua visibilità è poi governata dal toggle (panelPref).
  const hasPanel = (showCode ?? true) && !!gen.code;
  const statsOn = showStats ?? true;

  // Lunghezza attiva → «Mescola» genera una nuova permutazione di 1..n.
  const activeLen =
    override?.length ??
    (data && data.length
      ? Math.min(data.length, 12)
      : shuffle !== undefined
        ? clamp(Math.round(shuffle), 4, 10)
        : gen.defaultData.length);

  function mescola() {
    const arr = Array.from({ length: activeLen }, (_, k) => k + 1);
    for (let k = arr.length - 1; k > 0; k--) {
      const r = Math.floor(Math.random() * (k + 1));
      [arr[k], arr[r]] = [arr[r], arr[k]];
    }
    setOverride(arr);
  }

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
            <span className={styles.fileName}>{gen.file ?? gen.label}</span>

            <div
              className={styles.segmented}
              role="group"
              aria-label="Modalità"
            >
              <button
                type="button"
                className={`${styles.segBtn} ${mode === 'study' ? styles.segBtnOn : ''}`}
                onClick={() => applyPreset('study')}
                aria-pressed={mode === 'study'}
                title="Studio: spiegazione passo-passo"
              >
                <Icon name="book-open" className={styles.segGlyph} />
                <span>Studio</span>
              </button>
              <button
                type="button"
                className={`${styles.segBtn} ${mode === 'lab' ? styles.segBtnOn : ''}`}
                onClick={() => applyPreset('lab')}
                aria-pressed={mode === 'lab'}
                title="Lab: sperimenta senza spiegazioni"
              >
                <Icon name="flask" className={styles.segGlyph} />
                <span>Lab</span>
              </button>
            </div>
          </div>

          <div className={styles.headerRight}>
            {hasPanel && (
              <button
                type="button"
                className={`${styles.toggleBtn} ${panelOpen ? styles.toggleBtnOn : ''}`}
                onClick={toggleCode}
                aria-pressed={panelOpen}
                title={
                  panelOpen
                    ? 'Nascondi pseudocodice e statistiche'
                    : 'Mostra pseudocodice e statistiche'
                }
              >
                <Icon name="code" className={styles.btnGlyph} />
              </button>
            )}
            <button
              type="button"
              className={`${styles.toggleBtn} ${explainOpen ? styles.toggleBtnOn : ''}`}
              onClick={toggleExplain}
              aria-pressed={explainOpen}
              title={
                explainOpen
                  ? 'Nascondi le spiegazioni'
                  : 'Mostra le spiegazioni'
              }
            >
              <Icon name="comment-lines" className={styles.btnGlyph} />
            </button>
            <button
              type="button"
              className={`${styles.toggleBtn} ${colorMode === 'rainbow' ? styles.toggleBtnOn : ''}`}
              onClick={() =>
                setColorMode(colorMode === 'gradient' ? 'rainbow' : 'gradient')
              }
              aria-pressed={colorMode === 'rainbow'}
              title={
                colorMode === 'gradient'
                  ? 'Colori arcobaleno (uno per elemento)'
                  : 'Colori a gradiente (per valore)'
              }
            >
              <Icon name="palette" className={styles.btnGlyph} />
            </button>
            {gen.complexity && (
              <>
                <span className={styles.headerDivider} />
                <span className={styles.complexity}>{gen.complexity}</span>
              </>
            )}
          </div>
        </div>

        {/* Sotto-header: nome algoritmo + descrizione */}
        <div className={styles.subHeader}>
          <span className={styles.algoName}>{gen.label}</span>
          {gen.blurb && (
            <>
              <span className={styles.subDivider} />
              <span className={styles.blurb}>{gen.blurb}</span>
            </>
          )}
        </div>

        <Player
          trace={trace}
          gen={gen}
          showExplain={explainOpen}
          colorMode={colorMode}
          showCode={hasPanel && panelOpen}
          advanced={panelOpen}
          showStats={statsOn}
          onShuffle={mescola}
          initialSpeedIdx={SPEED_IDX[speed]}
        />
      </div>
      {caption && <p className={styles.caption}>{caption}</p>}
    </>
  );
}
