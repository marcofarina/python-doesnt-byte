/**
 * Finestra di un programma: barra del titolo e righe di codice in Monaspace,
 * alte 22; la riga in esecuzione ha il fondo d'accento.
 */
import React from 'react';
import type { PropsComuni, PropsProgramma } from '../tipi';
import { CORPO, Forma, RAGGIO, Testo, styles } from './comune';

export const RIGA_CODICE = 22;
const BARRA = 30;

/** Altezza della finestra con `n` righe. */
export const altezzaProgramma = (n: number) => BARRA + 10 + n * RIGA_CODICE + 8;

export default function Programma({
  chiave,
  tratto,
  progresso = 1,
  l,
  righe,
  attiva,
  titolo,
}: PropsProgramma & PropsComuni): JSX.Element {
  const a = altezzaProgramma(righe.length);
  const y0 = BARRA + 10;
  return (
    <g>
      <Forma
        chiave={chiave}
        g={{ f: 'rett', x: 0, y: 0, l, a, pieno: true }}
        tratto={tratto}
        progresso={progresso}
        raggio={RAGGIO.sm}
        fondo={styles.fondoCarta}
      />
      <Forma
        chiave={`${chiave}/barra`}
        g={{ f: 'linea', x0: 0, y0: BARRA, x1: l, y1: BARRA }}
        tratto={tratto}
        progresso={progresso}
      />
      {titolo && (
        <Testo
          x={14}
          y={21}
          testo={titolo}
          tratto={tratto}
          famiglia="codice"
          corpo={CORPO.piccolo}
          progresso={progresso}
        />
      )}
      {attiva !== undefined && attiva >= 0 && attiva < righe.length && (
        <rect
          x={4}
          y={y0 + attiva * RIGA_CODICE}
          width={l - 8}
          height={RIGA_CODICE}
          rx={RAGGIO.xs}
          className={styles.evidenza}
          style={{ opacity: progresso }}
        />
      )}
      {righe.map((r, i) => (
        <Testo
          key={i}
          x={14}
          y={y0 + i * RIGA_CODICE + 16}
          testo={r}
          tratto={tratto}
          famiglia="codice"
          corpo={CORPO.piccolo}
          progresso={progresso}
          classe={styles.spazi}
        />
      ))}
    </g>
  );
}
