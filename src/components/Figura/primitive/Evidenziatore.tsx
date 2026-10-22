/**
 * Evidenziatore: fondo d'accento traslucido da mettere dietro al testo. Si
 * stende da sinistra a destra con il progresso; a mano è un tratto di
 * pennarello.
 */
import React from 'react';
import type { PropsComuni, PropsEvidenziatore } from '../tipi';
import { RAGGIO, r2, styles } from './comune';
import { ruvido } from '../ruvido';

export default function Evidenziatore({
  chiave,
  tratto,
  progresso = 1,
  l,
  a,
}: PropsEvidenziatore & PropsComuni): JSX.Element | null {
  if (progresso <= 0) return null;
  const stendi = progresso < 1 ? `scale(${r2(progresso)} 1)` : undefined;
  if (tratto === 'netto')
    return (
      <rect
        width={l}
        height={a}
        rx={RAGGIO.xs}
        transform={stendi}
        className={styles.evidenza}
      />
    );
  const { fondo } = ruvido(chiave, {
    f: 'rett',
    x: 0,
    y: 0,
    l,
    a,
    pieno: true,
  });
  return <path d={fondo} transform={stendi} className={styles.evidenza} />;
}
