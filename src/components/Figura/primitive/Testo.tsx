/**
 * Testo libero: Excalifont a mano, Crimson Pro netto, Monaspace per il codice.
 * L'origine è sulla linea di base della prima riga.
 */
import React from 'react';
import type { PropsComuni, PropsTesto } from '../tipi';
import { corpoIn, Testo as TestoBase } from './comune';

export default function Testo({
  tratto,
  progresso = 1,
  testo,
  corpo,
  ancora,
  famiglia,
  larghezzaMax,
}: PropsTesto & PropsComuni): JSX.Element | null {
  return (
    <TestoBase
      x={0}
      y={0}
      testo={testo}
      tratto={tratto}
      corpo={corpoIn(corpo)}
      ancora={ancora}
      famiglia={famiglia}
      larghezzaMax={larghezzaMax}
      progresso={progresso}
    />
  );
}
