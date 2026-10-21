/**
 * <Figura> — player delle figure statiche e animate. Spec: sezione G1 di
 * pm/piano-2026-10-figure-animate.md.
 *
 * Il disegno di ogni istante viene da `statoAl(scena, passo, fase)`, funzione
 * pura: il player sposta solo (passo, fase). L'SSR rende con React il poster;
 * durante l'animazione posizione, opacità e colore di ogni oggetto si
 * applicano via ref, e React ridisegna una primitiva solo quando cambiano
 * `progresso`, `barrato` o `valore` (misure di G0).
 */
import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBackwardStep,
  faCompress,
  faExpand,
  faForwardStep,
  faPause,
  faPlay,
  faRotateLeft,
} from '@fortawesome/free-solid-svg-icons';
import {
  durataPasso,
  indiceRivela,
  passoPoster,
  statoAl,
  valida,
} from './motore';
import { coloreRuolo, Contenuto, type Interno } from './primitive';
import type {
  FiguraDef,
  Oggetto,
  Scena,
  Stato,
  Tratto,
  TrattoFigura,
} from './tipi';
import styles from './styles.module.css';

export type { FiguraDef, Scena } from './tipi';

/** Corpo minimo leggibile (px reali) e corpo più piccolo delle scene. */
const CORPO_MINIMO = 12;
const CORPO_PICCOLO = 15;

/** Pausa di lettura dopo un passo, in autoplay: base + per parola. */
const pausaLettura = (didascalia: string) =>
  1200 + 90 * didascalia.split(/\s+/).length;

const SUGGERIMENTO_RIVELA = 'Prova a prevedere, poi premi →';

/** Passo di `progresso` e `barrato` sotto cui non si ridisegna. */
const QUANTO = 1 / 240;
const quantizza = (v: number) =>
  v >= 1 ? 1 : v <= 0 ? 0 : Math.round(v / QUANTO) * QUANTO;

interface Posizione {
  passo: number;
  fase: number;
}

/** Contratto per gli script (foto di verifica, export). */
interface AccessoFigure {
  vai: (id: string, passo: number, fase?: number) => boolean;
  elenco: () => { id: string; passi: number }[];
}

declare global {
  interface Window {
    __figure?: AccessoFigure;
  }
}

const registro = new Map<
  string,
  { passi: number; vai: (p: Posizione) => void }
>();

const installaAccesso = () => {
  if (typeof window === 'undefined' || window.__figure) return;
  window.__figure = {
    // `passo` da 1, come il contatore; `fase` 0…1, di default 1 (fine passo).
    vai: (id, passo, fase = 1) => {
      const f = registro.get(id);
      if (!f) return false;
      f.vai({ passo: passo - 1, fase });
      return true;
    },
    elenco: () =>
      [...registro.entries()].map(([id, f]) => ({ id, passi: f.passi })),
  };
};

const preferisceMenoMovimento = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const r2 = (n: number) => Math.round(n * 100) / 100;
const trasformazione = (o: Oggetto, s: Stato) =>
  `translate(${r2(o.x + s.dx)} ${r2(o.y + s.dy)})`;
const interno = (s: Stato): Interno => ({
  progresso: quantizza(s.progresso),
  barrato: quantizza(s.barrato),
  valore: Math.round(s.valore),
});

type Applica = (s: Stato) => void;

interface OggettoProps {
  o: Oggetto;
  iniziale: Stato;
  tratto: Tratto;
  registra: (id: string, f: Applica | null) => void;
}

/** Il gruppo di un oggetto: il player lo muove via ref. */
function OggettoFigura({ o, iniziale, tratto, registra }: OggettoProps) {
  const ref = useRef<SVGGElement>(null);
  const [s, setS] = useState<Interno>(() => interno(iniziale));
  const ultimo = useRef(s);
  const ruolo = o.ruolo ?? 'inchiostro';

  useEffect(() => {
    registra(o.id, (st) => {
      const g = ref.current;
      if (!g) return;
      const visibile = st.opacita > 0.001;
      g.style.display = visibile ? '' : 'none';
      if (!visibile) return;
      g.setAttribute('transform', trasformazione(o, st));
      g.style.opacity = st.opacita < 1 ? String(r2(st.opacita)) : '';
      g.style.color = coloreRuolo(ruolo, st.enfasi);
      const n = interno(st);
      const u = ultimo.current;
      if (
        n.progresso !== u.progresso ||
        n.barrato !== u.barrato ||
        n.valore !== u.valore
      ) {
        ultimo.current = n;
        setS(n);
      }
    });
    return () => registra(o.id, null);
  }, [o, ruolo, registra]);

  const visibile = iniziale.opacita > 0.001;
  return (
    <g
      ref={ref}
      data-oggetto={o.id}
      transform={trasformazione(o, iniziale)}
      style={{
        display: visibile ? undefined : 'none',
        opacity:
          visibile && iniziale.opacita < 1 ? r2(iniziale.opacita) : undefined,
        color: coloreRuolo(ruolo, iniziale.enfasi),
      }}
    >
      <Contenuto o={o} s={s} tratto={tratto} />
    </g>
  );
}

interface TelaProps {
  scena: Scena;
  poster: Posizione;
  tratto: TrattoFigura;
  uid: string;
  classe: string;
  schermoIntero: boolean;
  /** Registra la funzione che porta questa disposizione a una posizione. */
  registraTela: (f: ((p: Posizione) => void) | null) => void;
}

/** L'SVG di una disposizione. */
function Tela({
  scena,
  poster,
  tratto,
  uid,
  classe,
  schermoIntero,
  registraTela,
}: TelaProps) {
  const iniziali = useMemo(
    () => statoAl(scena, poster.passo, poster.fase),
    [scena, poster.passo, poster.fase],
  );
  const applicatori = useRef(new Map<string, Applica>());
  const registra = useCallback((id: string, f: Applica | null) => {
    if (f) applicatori.current.set(id, f);
    else applicatori.current.delete(id);
  }, []);

  useEffect(() => {
    registraTela((p) => {
      const stati = statoAl(scena, p.passo, p.fase);
      for (const [id, f] of applicatori.current) f(stati[id]);
    });
    return () => registraTela(null);
  }, [scena, registraTela]);

  const trattoDi = (natura: 'concetto' | 'dato'): Tratto =>
    tratto === 'ibrido' ? (natura === 'concetto' ? 'mano' : 'netto') : tratto;

  return (
    <div className={`${styles.scorri} ${classe}`}>
      <svg
        className={styles.scena}
        viewBox={`0 0 ${scena.larghezza} ${scena.altezza}`}
        style={{
          maxWidth: schermoIntero ? undefined : `${scena.larghezza}px`,
          minWidth: `${Math.round((scena.larghezza * CORPO_MINIMO) / CORPO_PICCOLO)}px`,
        }}
        role="img"
        aria-labelledby={`${uid}-t ${uid}-d`}
      >
        <title id={`${uid}-t`}>{scena.titolo}</title>
        <desc id={`${uid}-d`}>{scena.descrizione}</desc>
        {scena.oggetti.map((o) => (
          <OggettoFigura
            key={o.id}
            o={o}
            iniziale={iniziali[o.id]}
            tratto={trattoDi(o.natura)}
            registra={registra}
          />
        ))}
      </svg>
    </div>
  );
}

export interface FiguraProps {
  /** Il modulo della figura, da `src/figure/<id>.ts`. */
  figura: FiguraDef;
  /** Le lezioni usano il default; `mano` e `netto` servono alla sandbox. */
  tratto?: TrattoFigura;
  /** Id DOM e per gli script; di default quello della scena. */
  id?: string;
}

/** Controlla la figura: ferma la build con `[Figura] <id>: …`. */
const controlla = ({ scena, stretta }: FiguraDef) => {
  valida(scena);
  if (!stretta) return;
  valida(stretta);
  const ids = (s: Scena) => s.oggetti.map((o) => o.id).join();
  if (
    ids(stretta) !== ids(scena) ||
    stretta.passi.length !== scena.passi.length
  )
    throw new Error(
      `[Figura] ${scena.id}: la disposizione stretta deve avere gli stessi oggetti e gli stessi passi`,
    );
};

export default function Figura({
  figura,
  tratto = 'ibrido',
  id,
}: FiguraProps): JSX.Element {
  controlla(figura);
  const { scena, stretta } = figura;
  const idFigura = id ?? scena.id;
  const totale = scena.passi.length;
  const statica = totale === 1;
  const rivela = indiceRivela(scena);
  const poster = useMemo(
    () => ({ passo: passoPoster(scena), fase: 1 }),
    [scena],
  );

  // Stato React: solo ciò che cambia l'interfaccia, non ogni fotogramma.
  const [ui, setUi] = useState({ passo: poster.passo, completo: true });
  const [inCorsa, setInCorsa] = useState(false);
  const [schermoIntero, setSchermoIntero] = useState(false);
  const [pronta, setPronta] = useState(false);
  const radice = useRef<HTMLElement>(null);
  const uid = useId().replace(/[^\w-]/g, '');

  const tele = useRef<{
    larga: ((p: Posizione) => void) | null;
    stretta: ((p: Posizione) => void) | null;
  }>({ larga: null, stretta: null });
  const registraLarga = useCallback((f: ((p: Posizione) => void) | null) => {
    tele.current.larga = f;
  }, []);
  const registraStretta = useCallback((f: ((p: Posizione) => void) | null) => {
    tele.current.stretta = f;
  }, []);

  // Orologio: stato mutabile fuori da React.
  const orologio = useRef({
    corsa: false,
    /** Passo su cui l'autoplay si ferma. */
    fermaA: totale - 1,
    /** ms di pausa ancora da attendere dopo la fine del passo. */
    pausa: 0,
    ultimo: 0,
    pos: poster as Posizione,
    raf: 0,
  });

  /** Porta la figura a `p`: disegno via ref, interfaccia solo se cambia. */
  const imposta = useCallback((p: Posizione) => {
    orologio.current.pos = p;
    tele.current.larga?.(p);
    tele.current.stretta?.(p);
    const el = radice.current;
    if (el) {
      el.dataset.figuraPasso = String(p.passo + 1);
      el.dataset.figuraFase = String(Math.round(p.fase * 1000) / 1000);
    }
    const completo = p.fase >= 1;
    setUi((u) =>
      u.passo === p.passo && u.completo === completo
        ? u
        : { passo: p.passo, completo },
    );
  }, []);

  const ferma = useCallback(() => {
    const o = orologio.current;
    o.corsa = false;
    cancelAnimationFrame(o.raf);
    setInCorsa(false);
  }, []);

  // Il fotogramma successivo passa da una funzione stabile che chiama l'ultimo
  // `tick`: un useCallback non può richiamare sé stesso.
  const tickRef = useRef<(ora: number) => void>(() => {});
  const prossimo = useCallback((ora: number) => tickRef.current(ora), []);

  const tick = useCallback(
    (ora: number) => {
      const o = orologio.current;
      if (!o.corsa) return;
      const dt = Math.min(64, ora - (o.ultimo || ora));
      o.ultimo = ora;
      let { passo, fase } = o.pos;
      if (fase < 1) {
        const d = durataPasso(scena.passi[passo]) || 1;
        fase = Math.min(1, fase + dt / d);
        if (fase >= 1) o.pausa = pausaLettura(scena.passi[passo].didascalia);
      } else if (passo >= o.fermaA) {
        ferma();
        return;
      } else {
        o.pausa -= dt;
        if (o.pausa <= 0) {
          passo += 1;
          fase = 0;
        }
      }
      imposta({ passo, fase });
      o.raf = requestAnimationFrame(prossimo);
    },
    [scena, imposta, ferma, prossimo],
  );

  useEffect(() => {
    tickRef.current = tick;
  }, [tick]);

  /** Parte da `da`; si ferma alla fine del passo `fermaA`. */
  const avvia = useCallback(
    (da: Posizione, fermaA: number) => {
      const o = orologio.current;
      if (preferisceMenoMovimento()) {
        ferma();
        imposta({ passo: Math.min(da.passo, fermaA), fase: 1 });
        return;
      }
      cancelAnimationFrame(o.raf);
      o.corsa = true;
      o.fermaA = fermaA;
      o.ultimo = 0;
      o.pausa = 0;
      imposta(da);
      setInCorsa(true);
      o.raf = requestAnimationFrame(prossimo);
    },
    [imposta, ferma, prossimo],
  );

  const fermataAutoplay = rivela > 0 ? rivela - 1 : totale - 1;

  // Autoplay una volta, quando metà della figura è in vista.
  useEffect(() => {
    const el = radice.current;
    if (!el || statica || preferisceMenoMovimento()) return;
    if (new URLSearchParams(window.location.search).has('figure-ferme')) return;
    const io = new IntersectionObserver(
      (voci) => {
        if (voci.some((v) => v.intersectionRatio >= 0.5)) {
          io.disconnect();
          avvia({ passo: 0, fase: 0 }, fermataAutoplay);
        }
      },
      { threshold: [0.5] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [avvia, statica, fermataAutoplay]);

  // Contratto per gli script e segnale «pronta» quando i font sono caricati.
  useEffect(() => {
    installaAccesso();
    registro.set(idFigura, {
      passi: totale,
      vai: (p) => {
        ferma();
        imposta({
          passo: Math.max(0, Math.min(totale - 1, p.passo)),
          fase: Math.max(0, Math.min(1, p.fase)),
        });
      },
    });
    let vivo = true;
    void document.fonts.ready.then(() => vivo && setPronta(true));
    return () => {
      vivo = false;
      registro.delete(idFigura);
    };
  }, [idFigura, totale, ferma, imposta]);

  useEffect(() => {
    const cambio = () =>
      setSchermoIntero(document.fullscreenElement === radice.current);
    document.addEventListener('fullscreenchange', cambio);
    return () => document.removeEventListener('fullscreenchange', cambio);
  }, []);

  useEffect(() => {
    const o = orologio.current;
    return () => cancelAnimationFrame(o.raf);
  }, []);

  const playPausa = () => {
    if (inCorsa) return ferma();
    const { passo, fase } = orologio.current.pos;
    if (passo >= totale - 1 && fase >= 1)
      avvia({ passo: 0, fase: 0 }, totale - 1);
    else avvia({ passo, fase }, totale - 1);
  };
  const riavvia = () => avvia({ passo: 0, fase: 0 }, fermataAutoplay);
  const avanti = () => {
    const { passo, fase } = orologio.current.pos;
    if (fase < 1) {
      ferma();
      imposta({ passo, fase: 1 });
    } else if (passo < totale - 1) {
      avvia({ passo: passo + 1, fase: 0 }, passo + 1);
    }
  };
  const indietro = () => {
    ferma();
    const { passo, fase } = orologio.current.pos;
    imposta({ passo: fase < 1 ? passo : Math.max(0, passo - 1), fase: 1 });
  };
  const alternaSchermo = () => {
    const el = radice.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.();
  };

  const tasti = (e: React.KeyboardEvent) => {
    if (statica) return;
    const azioni: Record<string, () => void> = {
      ' ': playPausa,
      ArrowRight: avanti,
      ArrowLeft: indietro,
      Home: riavvia,
    };
    const a = azioni[e.key];
    if (!a) return;
    // Fuori dallo schermo intero i tasti valgono solo con il focus sulla figura
    // e non sui pulsanti, che hanno i loro.
    if (!schermoIntero && (e.target as HTMLElement).tagName === 'BUTTON')
      return;
    e.preventDefault();
    a();
  };

  const fermoPrimaDiRivela =
    rivela > 0 && ui.passo === rivela - 1 && ui.completo && !inCorsa;
  const didascalia = scena.passi[ui.passo].didascalia;

  return (
    <figure
      ref={radice}
      className={styles.figura}
      data-figura={idFigura}
      data-figura-passo={poster.passo + 1}
      data-figura-fase={poster.fase}
      data-figura-pronta={pronta ? '' : undefined}
      data-schermo-intero={schermoIntero ? '' : undefined}
      tabIndex={statica ? undefined : 0}
      onKeyDown={tasti}
      aria-labelledby={`${uid}l-t`}
    >
      <Tela
        scena={scena}
        poster={poster}
        tratto={tratto}
        uid={`${uid}l`}
        classe={stretta ? styles.larga : ''}
        schermoIntero={schermoIntero}
        registraTela={registraLarga}
      />
      {stretta && (
        <Tela
          scena={stretta}
          poster={poster}
          tratto={tratto}
          uid={`${uid}s`}
          classe={styles.stretta}
          schermoIntero={schermoIntero}
          registraTela={registraStretta}
        />
      )}

      <figcaption className={styles.barra}>
        <p className={styles.didascalia} aria-live="polite">
          {fermoPrimaDiRivela ? (
            <>
              {didascalia} <em>{SUGGERIMENTO_RIVELA}</em>
            </>
          ) : (
            didascalia
          )}
        </p>
        {!statica && (
          <div className={styles.comandi}>
            <button
              type="button"
              onClick={playPausa}
              aria-label={inCorsa ? 'Pausa' : 'Riproduci'}
            >
              <FontAwesomeIcon icon={inCorsa ? faPause : faPlay} />
            </button>
            <button type="button" onClick={riavvia} aria-label="Ricomincia">
              <FontAwesomeIcon icon={faRotateLeft} />
            </button>
            <button
              type="button"
              onClick={indietro}
              aria-label="Passo precedente"
              disabled={ui.passo === 0 && ui.completo}
            >
              <FontAwesomeIcon icon={faBackwardStep} />
            </button>
            <span className={styles.contatore} aria-hidden>
              {ui.passo + 1} / {totale}
            </span>
            <button
              type="button"
              onClick={avanti}
              aria-label="Passo successivo"
              disabled={ui.passo === totale - 1 && ui.completo}
            >
              <FontAwesomeIcon icon={faForwardStep} />
            </button>
            <button
              type="button"
              onClick={alternaSchermo}
              aria-label={
                schermoIntero ? 'Esci dallo schermo intero' : 'Schermo intero'
              }
              className={styles.lim}
            >
              <FontAwesomeIcon icon={schermoIntero ? faCompress : faExpand} />
            </button>
          </div>
        )}
      </figcaption>

      {/* I passi come testo: screen reader, Pagefind e stampa. */}
      {!statica && (
        <ol className={styles.passiTesto}>
          {scena.passi.map((p, i) => (
            <li key={i}>{p.didascalia}</li>
          ))}
        </ol>
      )}
    </figure>
  );
}
