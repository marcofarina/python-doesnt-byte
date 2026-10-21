/**
 * Figura generica (testa e busto) con il nome a destra: nessuna somiglianza
 * con persone o personaggi. L'origine è alla base del busto, sull'asse.
 */
import React from 'react';
import type { PropsComuni, PropsPersona } from '../tipi';
import { CORPO, Forma, Testo, styles } from './comune';

export default function Persona({
  chiave,
  tratto,
  progresso = 1,
  nome,
}: PropsPersona & PropsComuni): JSX.Element {
  return (
    <g>
      <Forma
        chiave={`${chiave}/testa`}
        g={{ f: 'cerchio', x: 0, y: -34, d: 26, pieno: true }}
        tratto={tratto}
        progresso={progresso}
        fondo={styles.fondo}
      />
      <Forma
        chiave={`${chiave}/busto`}
        g={{
          f: 'path',
          d: 'M-24 6C-24 -12 -12 -18 0 -18C12 -18 24 -12 24 6Z',
          pieno: true,
        }}
        tratto={tratto}
        progresso={progresso}
        fondo={styles.fondo}
      />
      <Testo
        x={34}
        y={-12}
        testo={nome}
        tratto={tratto}
        corpo={CORPO.grande}
        progresso={progresso}
      />
    </g>
  );
}
