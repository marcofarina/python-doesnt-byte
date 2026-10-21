/**
 * La copertura della generalizzazione persona → studente, professore: figura
 * animata, 2 passi. Sezione «La copertura» di
 * volumes/archivista/generalizzazioni.mdx, dopo il riquadro di definizione.
 *
 * Passo 1, un anno scolastico: i due insiemi delle figlie stanno dentro
 * `persona`, separati; Harry è studente, Piton professore, Hagrid fuori da
 * tutti e due, `(p,e)`. Passo 2, l'archivio di tutti gli anni: i due insiemi
 * si sovrappongono e Piton e Hagrid passano nell'intersezione, `(p,o)`.
 * Gazza, il custode, resta fuori in tutti e due i passi: nell'archivio è lui
 * a tenere la copertura parziale, e senza di lui la figura mostrerebbe una
 * copertura totale.
 *
 * Gli insiemi e i nomi si spostano con `MoveTo` dalla posizione dichiarata,
 * che è quella del passo 1. `larga`: figlie affiancate; `stretta`: figlie
 * una sopra l'altra.
 */
import { larghezzaTesto } from '@site/src/components/Figura/misure';
import type {
  FiguraDef,
  Oggetto,
  Scena,
} from '@site/src/components/Figura/tipi';

type Rett = [number, number, number, number];
type Spostamento = [number, number];

interface Disposizione {
  larghezza: number;
  altezza: number;
  persona: Rett;
  studente: Rett;
  professore: Rett;
  /** Di quanto si spostano gli insiemi delle figlie al passo 2. */
  versoStudente: Spostamento;
  versoProfessore: Spostamento;
  /** Nomi: posizione al passo 1 e, per chi si sposta, arrivo al passo 2. */
  harry: [number, number];
  piton: [number, number];
  pitonDopo: [number, number];
  hagrid: [number, number];
  hagridDopo: [number, number];
  gazza: [number, number];
  /** Dove sta il nome di `professore`: sotto, se sopra toccherebbe Harry. */
  latoProfessore: 'sopra' | 'sotto';
}

const LARGA: Disposizione = {
  larghezza: 740,
  altezza: 380,
  persona: [10, 66, 720, 306],
  studente: [90, 125, 230, 170],
  professore: [420, 125, 230, 170],
  versoStudente: [100, 0],
  versoProfessore: [-100, 0],
  harry: [180, 215],
  piton: [535, 215],
  pitonDopo: [370, 200],
  hagrid: [370, 330],
  hagridDopo: [370, 234],
  gazza: [610, 315],
  latoProfessore: 'sopra',
};

const STRETTA: Disposizione = {
  larghezza: 380,
  altezza: 480,
  persona: [5, 72, 370, 400],
  studente: [95, 116, 190, 120],
  professore: [95, 284, 190, 120],
  versoStudente: [0, 58],
  versoProfessore: [0, -58],
  harry: [190, 161],
  piton: [190, 349],
  pitonDopo: [160, 265],
  hagrid: [55, 265],
  hagridDopo: [224, 265],
  gazza: [322, 277],
  latoProfessore: 'sotto',
};

const visibile = { opacita: 1, progresso: 1 };

function crea(d: Disposizione): Scena {
  const insieme = (
    id: string,
    [x, y, l, a]: Rett,
    etichetta: string,
    latoEtichetta: 'sopra' | 'sotto' = 'sopra',
  ) =>
    ({
      id,
      tipo: 'insieme',
      natura: 'concetto',
      ruolo: id === 'persona' ? 'tenue' : 'persona',
      x,
      y,
      l,
      a,
      etichetta,
      latoEtichetta,
      iniziale: visibile,
    }) satisfies Oggetto;

  const nome = (id: string, [x, y]: [number, number], testo: string) =>
    ({
      id,
      tipo: 'testo',
      natura: 'dato',
      ruolo: 'dato',
      x,
      y,
      testo,
      corpo: 'normale',
      ancora: 'middle',
      iniziale: visibile,
    }) satisfies Oggetto;

  const [px, py, pl] = d.persona;
  const copertura = (id: string, testo: string): Oggetto => ({
    id,
    tipo: 'testo',
    natura: 'concetto',
    ruolo: 'inchiostro',
    x: px + pl / 2 + larghezzaTesto('persona', 17, 'mano') / 2 + 12,
    y: py - 16,
    testo,
    corpo: 'normale',
    iniziale: id === 'pe' ? visibile : undefined,
  });

  const verso = (a: [number, number], b: [number, number]) => ({
    dx: b[0] - a[0],
    dy: b[1] - a[1],
  });

  return {
    id: 'copertura-persone',
    titolo: 'La copertura: (p,e) in un anno, (p,o) nell’archivio',
    descrizione:
      'Dentro l’insieme persona stanno gli insiemi studente e professore. ' +
      'In un anno scolastico sono separati: Harry è studente, Piton ' +
      'professore, Hagrid e Gazza fuori da tutti e due; la copertura è (p,e). ' +
      'Nell’archivio di tutti gli anni i due insiemi si sovrappongono, e ' +
      'Piton e Hagrid stanno in tutti e due; Gazza resta fuori, e la ' +
      'copertura è (p,o).',
    larghezza: d.larghezza,
    altezza: d.altezza,
    oggetti: [
      insieme('persona', d.persona, 'persona'),
      insieme('studente', d.studente, 'studente'),
      insieme('professore', d.professore, 'professore', d.latoProfessore),
      nome('harry', d.harry, 'Harry'),
      nome('piton', d.piton, 'Piton'),
      nome('hagrid', d.hagrid, 'Hagrid'),
      nome('gazza', d.gazza, 'Gazza'),
      copertura('pe', '(p,e)'),
      copertura('po', '(p,o)'),
    ],
    passi: [
      {
        didascalia:
          'In un anno scolastico nessuno è studente e professore insieme, e Hagrid non è nessuno dei due.',
        animazioni: [],
      },
      {
        didascalia:
          'Nell’archivio di tutti gli anni Piton e Hagrid sono stati studenti e poi professori: gli insiemi si sovrappongono.',
        animazioni: [
          {
            fai: 'MoveTo',
            id: 'studente',
            dx: d.versoStudente[0],
            dy: d.versoStudente[1],
          },
          {
            fai: 'MoveTo',
            id: 'harry',
            dx: d.versoStudente[0],
            dy: d.versoStudente[1],
          },
          {
            fai: 'MoveTo',
            id: 'professore',
            dx: d.versoProfessore[0],
            dy: d.versoProfessore[1],
          },
          {
            fai: 'MoveTo',
            id: 'piton',
            ...verso(d.piton, d.pitonDopo),
            ritardo: 280,
          },
          {
            fai: 'MoveTo',
            id: 'hagrid',
            ...verso(d.hagrid, d.hagridDopo),
            ritardo: 280,
          },
          { fai: 'Indicate', id: 'piton', ritardo: 840 },
          { fai: 'Indicate', id: 'hagrid', ritardo: 840 },
          { fai: 'Transform', da: 'pe', a: 'po', ritardo: 840 },
        ],
      },
    ],
  };
}

const figura: FiguraDef = { scena: crea(LARGA), stretta: crea(STRETTA) };
export default figura;
