/**
 * Numero che cambia (arrotondato, cifre tabulari, migliaia col punto come
 * nelle lezioni: 20.018) seguito dall'unità.
 */
import React from 'react';
import type { PropsComuni, PropsContatore } from '../tipi';
import { CORPO, Testo, corpoIn, styles } from './comune';

/** 20018 → «20.018»; a mano, così build e browser scrivono lo stesso testo. */
const migliaia = (n: number): string =>
  String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

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
      testo={`${migliaia(Math.round(valore))} ${unita}`}
      tratto={tratto}
      corpo={corpoIn(corpo, CORPO.grande)}
      ancora="middle"
      progresso={progresso}
      classe={styles.cifre}
    />
  );
}
