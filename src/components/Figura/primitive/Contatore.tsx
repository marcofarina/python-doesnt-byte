/** Numero che cambia (arrotondato, cifre tabulari) seguito dall'unità. */
import React from 'react';
import type { PropsComuni, PropsContatore } from '../tipi';
import { CORPO, Testo, corpoIn, styles } from './comune';

export default function Contatore({
  tratto,
  progresso = 1,
  valore = 0,
  unita,
  corpo,
}: PropsContatore & PropsComuni): JSX.Element {
  return (
    <Testo
      x={0}
      y={0}
      testo={`${Math.round(valore)} ${unita}`}
      tratto={tratto}
      corpo={corpoIn(corpo, CORPO.grande)}
      ancora="middle"
      progresso={progresso}
      classe={styles.cifre}
    />
  );
}
