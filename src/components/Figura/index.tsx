/**
 * <Figura> — player delle figure animate. Prototipo della fase G0 di
 * pm/piano-2026-10-figure-animate.md: orologio e passi, comandi, didascalia
 * in aria-live, autoplay una volta, «riduci movimento», schermo intero per la
 * LIM, poster nell'HTML e in stampa, accesso per gli script.
 *
 * Il disegno di ogni istante viene da `statoAl(scena, passo, fase)`, funzione
 * pura: il player sposta solo (passo, fase).
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
import { Disegno } from './primitive';
import type { Scena, Tratto, TrattoFigura } from './tipi';
import styles from './styles.module.css';

export type { Scena } from './tipi';

/** Corpo minimo leggibile (px reali) e corpo più piccolo delle scene. */
const CORPO_MINIMO = 12;
const CORPO_PICCOLO = 15;

/** Pausa di lettura dopo un passo, in autoplay: base + per parola. */
const pausaLettura = (didascalia: string) =>
  1200 + 90 * didascalia.split(/\s+/).length;

const SUGGERIMENTO_RIVELA = 'Prova a prevedere, poi premi →';

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

export interface FiguraProps {
  scena: Scena;
  tratto?: TrattoFigura;
  /**
   * Disposizione per gli schermi stretti: stessi oggetti e stessi passi, altre
   * posizioni. Le due stanno entrambe nell'HTML e una container query sceglie.
   */
  stretta?: Scena;
  /** Id DOM e per gli script; di default quello della scena. */
  id?: string;
}

interface TelaProps {
  scena: Scena;
  pos: Posizione;
  tratto: TrattoFigura;
  uid: string;
  classe: string;
  schermoIntero: boolean;
}

/** L'SVG di una disposizione nell'istante `pos`. */
function Tela({ scena, pos, tratto, uid, classe, schermoIntero }: TelaProps) {
  const stati = useMemo(
    () => statoAl(scena, pos.passo, pos.fase),
    [scena, pos.passo, pos.fase],
  );
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
          <Disegno
            key={o.id}
            o={o}
            s={stati[o.id]}
            tratto={trattoDi(o.natura)}
          />
        ))}
      </svg>
    </div>
  );
}

export default function Figura({
  scena,
  stretta,
  tratto = 'ibrido',
  id,
}: FiguraProps): JSX.Element {
  valida(scena);
  if (stretta) {
    valida(stretta);
    const ids = (s: Scena) => s.oggetti.map((o) => o.id).join();
    if (
      ids(stretta) !== ids(scena) ||
      stretta.passi.length !== scena.passi.length
    )
      throw new Error(
        `[Figura] ${scena.id}: la disposizione stretta deve avere gli stessi oggetti e gli stessi passi`,
      );
  }
  const idFigura = id ?? scena.id;
  const totale = scena.passi.length;
  const statica = totale === 1;
  const rivela = indiceRivela(scena);
  const poster = passoPoster(scena);

  const [pos, setPos] = useState<Posizione>({ passo: poster, fase: 1 });
  const [inCorsa, setInCorsa] = useState(false);
  const [schermoIntero, setSchermoIntero] = useState(false);
  const [pronta, setPronta] = useState(false);
  const radice = useRef<HTMLElement>(null);
  const uid = useId().replace(/[^\w-]/g, '');

  // Orologio: stato mutabile fuori da React, React ridisegna a ogni fotogramma.
  const orologio = useRef({
    corsa: false,
    /** Passo su cui l'autoplay si ferma. */
    fermaA: totale - 1,
    /** ms di pausa ancora da attendere dopo la fine del passo. */
    pausa: 0,
    ultimo: 0,
    pos: { passo: poster, fase: 1 } as Posizione,
    raf: 0,
  });

  const imposta = useCallback((p: Posizione) => {
    orologio.current.pos = p;
    setPos(p);
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
        imposta({ passo, fase });
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

  /** Parte da `da`; si ferma a `fermaA`. */
  const avvia = useCallback(
    (da: Posizione, fermaA: number) => {
      const o = orologio.current;
      if (preferisceMenoMovimento()) {
        imposta({ passo: da.passo, fase: 1 });
        return;
      }
      cancelAnimationFrame(o.raf);
      o.corsa = true;
      o.fermaA = fermaA;
      o.ultimo = 0;
      o.pausa = da.fase >= 1 ? 0 : o.pausa;
      imposta(da);
      setInCorsa(true);
      o.raf = requestAnimationFrame(prossimo);
    },
    [imposta, prossimo],
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
        imposta(p);
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
    rivela > 0 && pos.passo === rivela - 1 && pos.fase >= 1 && !inCorsa;
  const didascalia = scena.passi[pos.passo].didascalia;

  return (
    <figure
      ref={radice}
      className={styles.figura}
      data-figura={idFigura}
      data-figura-passo={pos.passo + 1}
      data-figura-fase={Math.round(pos.fase * 1000) / 1000}
      data-figura-pronta={pronta ? '' : undefined}
      data-schermo-intero={schermoIntero ? '' : undefined}
      tabIndex={statica ? undefined : 0}
      onKeyDown={tasti}
      aria-labelledby={`${uid}l-t`}
    >
      <Tela
        scena={scena}
        pos={pos}
        tratto={tratto}
        uid={`${uid}l`}
        classe={stretta ? styles.larga : ''}
        schermoIntero={schermoIntero}
      />
      {stretta && (
        <Tela
          scena={stretta}
          pos={pos}
          tratto={tratto}
          uid={`${uid}s`}
          classe={styles.stretta}
          schermoIntero={schermoIntero}
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
              disabled={pos.passo === 0 && pos.fase >= 1}
            >
              <FontAwesomeIcon icon={faBackwardStep} />
            </button>
            <span className={styles.contatore} aria-hidden>
              {pos.passo + 1} / {totale}
            </span>
            <button
              type="button"
              onClick={avanti}
              aria-label="Passo successivo"
              disabled={pos.passo === totale - 1 && pos.fase >= 1}
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
