/**
 * Galleria delle primitive (fase G2): ogni primitiva nei due tratti, a metà
 * del «si disegna» e intera. A progresso 0 una primitiva non disegna nulla.
 * Solo per la sandbox docs/figure-test.mdx.
 */
import React from 'react';
import { coloreRuolo, Contenuto } from './contenuto';
import { Testo } from './primitive/comune';
import { Tavola } from './TavolaStile';
import type { Oggetto, Tratto } from './tipi';

const CELLA = 200;
const COLONNE: { tratto: Tratto; progresso: number }[] = [
  { tratto: 'mano', progresso: 0.5 },
  { tratto: 'mano', progresso: 1 },
  { tratto: 'netto', progresso: 0.5 },
  { tratto: 'netto', progresso: 1 },
];
const TESTATA = 30;

type Campione = { titolo: string; a: number; o: Oggetto; valore?: number };

const base = { natura: 'concetto' as const, x: 20, y: 20 };

const CAMPIONI: Campione[] = [
  {
    titolo: 'Riquadro',
    a: 120,
    o: {
      ...base,
      id: 'g-riquadro',
      tipo: 'riquadro',
      ruolo: 'programma',
      l: 160,
      a: 90,
      etichetta: 'memoria',
      fondo: true,
    },
  },
  {
    titolo: 'Testo (va a capo)',
    a: 100,
    o: {
      ...base,
      id: 'g-testo',
      tipo: 'testo',
      y: 36,
      testo: 'Il file resta sul disco finché non lo riscrivi',
      larghezzaMax: 160,
    },
  },
  {
    titolo: 'Freccia (dritta e curva)',
    a: 100,
    o: {
      ...base,
      id: 'g-freccia',
      tipo: 'freccia',
      ruolo: 'persona',
      y: 66,
      dx: 150,
      dy: 0,
      curva: -22,
      etichetta: 'legge',
    },
  },
  {
    titolo: 'File',
    a: 120,
    o: {
      ...base,
      id: 'g-file',
      tipo: 'file',
      natura: 'dato',
      ruolo: 'dato',
      x: 40,
      l: 120,
      a: 90,
      nome: 'voti.csv',
    },
  },
  {
    titolo: 'Database',
    a: 130,
    o: {
      ...base,
      id: 'g-database',
      tipo: 'database',
      natura: 'dato',
      ruolo: 'dato',
      x: 40,
      l: 120,
      a: 100,
      nome: 'scuola.db',
    },
  },
  {
    titolo: 'Tabella',
    a: 120,
    o: {
      ...base,
      id: 'g-tabella',
      tipo: 'tabella',
      natura: 'dato',
      ruolo: 'dato',
      colonne: ['nome', 'voto'],
      righe: [
        ['Ada', '8'],
        ['Bruno', '6'],
      ],
    },
  },
  {
    titolo: 'Riga (nuova)',
    a: 70,
    o: {
      ...base,
      id: 'g-riga',
      tipo: 'riga',
      natura: 'dato',
      ruolo: 'dato',
      l: 160,
      celle: ['Ada', '8'],
      larghezze: [110, 50],
      segno: 'nuova',
    },
  },
  {
    titolo: 'Memoria',
    a: 120,
    o: {
      ...base,
      id: 'g-memoria',
      tipo: 'memoria',
      ruolo: 'programma',
      l: 160,
      a: 90,
      variabili: [
        { nome: 'x', valore: '3' },
        { nome: 'nome', valore: "'Ada'" },
      ],
    },
  },
  {
    titolo: 'Programma',
    a: 130,
    o: {
      ...base,
      id: 'g-programma',
      tipo: 'programma',
      ruolo: 'programma',
      x: 15,
      l: 170,
      titolo: 'conta.py',
      righe: ['x = leggi()', 'x = x + 1', 'scrivi(x)'],
      attiva: 1,
    },
  },
  {
    titolo: 'Persona',
    a: 110,
    o: {
      ...base,
      id: 'g-persona',
      tipo: 'persona',
      ruolo: 'persona',
      x: 50,
      y: 92,
      nome: 'Ada',
    },
  },
  {
    titolo: 'Contatore',
    a: 70,
    o: {
      ...base,
      id: 'g-contatore',
      tipo: 'contatore',
      x: 100,
      ruolo: 'accento',
      y: 44,
      unita: 'assegnazioni',
    },
    valore: 3,
  },
  {
    titolo: 'Graffa',
    a: 120,
    o: {
      ...base,
      id: 'g-graffa',
      tipo: 'graffa',
      ruolo: 'tenue',
      x: 30,
      lunghezza: 80,
      verso: 'destra',
      etichetta: 'stesso file',
    },
  },
  {
    titolo: 'Evidenziatore',
    a: 70,
    o: {
      ...base,
      id: 'g-evidenziatore',
      tipo: 'evidenziatore',
      y: 24,
      l: 150,
      a: 26,
    },
  },
];

function Campione({ c }: { c: Campione }): JSX.Element {
  const ruolo = c.o.ruolo ?? 'inchiostro';
  return (
    <Tavola
      titolo={`${c.titolo}: a mano e netto, a metà e intera`}
      l={CELLA * COLONNE.length}
      a={c.a + TESTATA}
    >
      {COLONNE.map((k, i) => (
        <g key={i} transform={`translate(${i * CELLA} 0)`}>
          <g style={{ color: 'var(--fig-tenue)' }}>
            <Testo
              x={20}
              y={20}
              testo={`${k.tratto === 'mano' ? 'a mano' : 'netto'} ${k.progresso * 100}%`}
              tratto="netto"
              corpo={15}
            />
          </g>
          <g
            transform={`translate(${c.o.x} ${c.o.y + TESTATA})`}
            style={{ color: coloreRuolo(ruolo, 0) }}
          >
            <Contenuto
              o={c.o}
              s={{ progresso: k.progresso, barrato: 0, valore: c.valore ?? 0 }}
              tratto={k.tratto}
            />
          </g>
        </g>
      ))}
    </Tavola>
  );
}

export default function Galleria(): JSX.Element {
  return (
    <>
      {CAMPIONI.map((c) => (
        <Campione key={c.o.id} c={c} />
      ))}
    </>
  );
}
