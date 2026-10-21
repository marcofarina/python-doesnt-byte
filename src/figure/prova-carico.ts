/**
 * Prova di carico (G0): 30 oggetti a mano che si disegnano e si spostano
 * insieme, per misurare i fotogrammi al secondo con la CPU rallentata.
 */
import type {
  Animazione,
  FiguraDef,
  Oggetto,
} from '@site/src/components/Figura/tipi';

const N = 30;
const oggetti: Oggetto[] = Array.from({ length: N }, (_, i) => ({
  id: `r${i}`,
  tipo: 'riquadro' as const,
  natura: 'concetto' as const,
  ruolo: (['dato', 'persona', 'programma'] as const)[i % 3],
  x: (i % 10) * 66 + 6,
  y: Math.floor(i / 10) * 70 + 10,
  l: 54,
  a: 48,
  fondo: true,
  etichetta: String(i + 1),
}));

const anima = (dy: number): Animazione[] =>
  oggetti.flatMap((o, i) => [
    { fai: 'Create' as const, id: o.id, durata: 2000, ritardo: i * 20 },
    { fai: 'MoveTo' as const, id: o.id, dx: 0, dy, durata: 2600 },
    { fai: 'Indicate' as const, id: o.id, durata: 2600 },
  ]);

const figura: FiguraDef = {
  scena: {
    id: 'prova-carico',
    titolo: 'Prova di carico: 30 oggetti',
    descrizione:
      'Trenta riquadri a mano che si disegnano e si spostano insieme.',
    larghezza: 666,
    altezza: 240,
    oggetti,
    passi: [
      {
        didascalia: 'Trenta riquadri si disegnano e scendono.',
        animazioni: anima(20),
      },
      {
        didascalia: 'Trenta riquadri risalgono.',
        animazioni: anima(0).filter((a) => a.fai !== 'Create'),
      },
    ],
  },
};
export default figura;
