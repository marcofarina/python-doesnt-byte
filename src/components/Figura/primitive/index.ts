/**
 * Libreria delle primitive di <Figura> (fase G2): componenti SVG puri in
 * coordinate locali. Posizione, opacità e colore del ruolo li mette il player
 * sul gruppo dell'oggetto.
 */
import type React from 'react';
import type { PropsComuni, PropsPrimitive, TipoPrimitiva } from '../tipi';
import Contatore from './Contatore';
import Database from './Database';
import Evidenziatore from './Evidenziatore';
import File from './File';
import Freccia from './Freccia';
import Graffa from './Graffa';
import Memoria from './Memoria';
import Persona from './Persona';
import Programma from './Programma';
import Riga from './Riga';
import Riquadro from './Riquadro';
import Tabella from './Tabella';
import Testo from './Testo';

export {
  Contatore,
  Database,
  Evidenziatore,
  File,
  Freccia,
  Graffa,
  Memoria,
  Persona,
  Programma,
  Riga,
  Riquadro,
  Tabella,
  Testo,
};

/** Tipo dell'oggetto → componente. */
export const PRIMITIVE: {
  [K in TipoPrimitiva]: (
    p: PropsPrimitive[K] & PropsComuni,
  ) => React.JSX.Element | null;
} = {
  riquadro: Riquadro,
  testo: Testo,
  freccia: Freccia,
  file: File,
  database: Database,
  tabella: Tabella,
  riga: Riga,
  memoria: Memoria,
  programma: Programma,
  persona: Persona,
  contatore: Contatore,
  graffa: Graffa,
  evidenziatore: Evidenziatore,
};
