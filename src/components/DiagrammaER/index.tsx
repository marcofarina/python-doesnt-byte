/**
 * DiagrammaER — diagramma Entità-Associazione in notazione Batini
 * (rettangolo, rombo, lecca-lecca, cardinalità (min,max)) con il tratto di
 * Excalidraw: rough.js per le linee, Excalifont per il testo.
 *
 * Disposizione e disegno stanno in `layout.ts` (nessun DOM: il diagramma è già
 * nell'HTML della build); questo file li rende in SVG. Spec e storia in
 * pm/piano-2026-10-lezione-entita-attributi.md (fasi E0 ed E1).
 */
import React, { useId } from 'react';
import { calcola } from './layout';
import type { DiagrammaERProps } from './types';
import styles from './styles.module.css';

export type {
  Attributo,
  Associazione,
  DiagrammaERProps,
  Entita,
  Generalizzazione,
  Lato,
  Partecipazione,
} from './types';

/** Corpo minimo (px) sotto cui il testo più piccolo, 14 px, non deve scendere. */
const CORPO_MINIMO = 11;
const CORPO_PICCOLO = 14;

export default function DiagrammaER(props: DiagrammaERProps): JSX.Element {
  const { titolo, descrizione } = props;
  const { forme, testi, vb } = calcola(props);
  const idTitolo = `er-${useId().replace(/[^\w-]/g, '')}`;

  return (
    <figure className={styles.figura}>
      <svg
        className={styles.diagramma}
        viewBox={`${vb.x} ${vb.y} ${vb.l} ${vb.a}`}
        style={{
          maxWidth: `${Math.round(vb.l)}px`,
          minWidth: `${Math.round((vb.l * CORPO_MINIMO) / CORPO_PICCOLO)}px`,
        }}
        role="img"
        aria-labelledby={idTitolo}
      >
        <title id={idTitolo}>{titolo}</title>
        {descrizione && <desc>{descrizione}</desc>}
        {forme.map((f, i) => (
          <path
            key={i}
            d={f.d}
            className={`${styles[f.tipo]} ${f.riempimento ? styles.fill : styles.tratto}`}
          />
        ))}
        {testi.map((t, i) => (
          <text
            key={i}
            x={t.x}
            y={t.y}
            fontSize={t.size}
            textAnchor={t.anchor}
            className={styles.testo}
          >
            {t.testo}
          </text>
        ))}
      </svg>
    </figure>
  );
}
