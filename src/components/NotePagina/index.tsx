/**
 * NotePagina — il pannello «Note» della colonna destra (piano
 * pm/piano-2026-11-quaderno.md, fase Q2).
 *
 * Una scheda per annotazione della pagina, nell'ordine del testo: citazione,
 * colore a parole, nota, e le azioni (colore, nota, togli). È anche la vista
 * accessibile delle evidenziazioni, che i lettori di schermo non vedono: per
 * questo ci sono anche le evidenziazioni senza nota.
 *
 * Due forme, scelte dalla Colonna (src/components/Colonna/):
 * - <NoteAllineate>, da 1280 px: le schede scorrono con il testo, ciascuna
 *   all'altezza del suo punto, impilate senza sovrapporsi; la scheda attiva si
 *   allinea esatta e le altre si spostano.
 * - <NoteElenco>, sotto i 1280 px e nel pannello dal basso del telefono: un
 *   elenco in ordine di testo; il clic su una scheda scorre al punto.
 * In fondo, in tutte e due, «Non ritrovo il punto» (le orfane) e l'avviso del
 * quaderno solo locale.
 *
 * Dove sta ogni annotazione lo dice l'Evidenziatore attraverso il ponte
 * (src/lib/quaderno/ponte.ts); dal ponte arrivano anche la bozza (una nota
 * nuova, salvata solo con «Salva») e le richieste di aprire una scheda.
 */
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faPen, faTrashCan } from '@fortawesome/free-solid-svg-icons';

import {
  aggiungi,
  modifica,
  togli,
  useAnnotazioniPagina,
  useQuaderno,
} from '@site/src/lib/quaderno/archivio';
import {
  ID_BOZZA,
  chiudiBozza,
  consumaRichiesta,
  evidenziatoreSupportato,
  usePonte,
  type Posto,
} from '@site/src/lib/quaderno/ponte';
import {
  COLORI,
  MAX_NOTA,
  type Annotazione,
  type Colore,
  type Quaderno,
} from '@site/src/lib/quaderno/tipi';

import styles from './styles.module.css';

/** Da questa larghezza le schede stanno accanto al loro testo. */
export const LARGHEZZA_ALLINEATE = 1280;
/** Spazio fra due schede impilate. */
const SPAZIO = 8;
/** Spazio fra l'ultima scheda e la coda (orfane, avviso). */
const SPAZIO_CODA = 24;
/** Sopra questa lunghezza la nota mostra il conteggio dei caratteri. */
const SOGLIA_CONTEGGIO = MAX_NOTA - 200;
const DURATA_LAMPO = 1100;

const NOMI: Record<Colore, string> = {
  giallo: 'Giallo',
  verde: 'Verde',
  azzurro: 'Azzurro',
  rosa: 'Rosa',
};

const nessunaIscrizione = () => () => undefined;

/** Ogni «mettiti in vista» ha un numero nuovo, anche per la stessa scheda. */
let giri = 0;
const prossimoGiro = () => ++giri;

/* ─────────────── Larghezza ─────────────── */

const QUERY_ALLINEATE = `(min-width: ${LARGHEZZA_ALLINEATE}px)`;

function iscriviLarghezza(f: () => void): () => void {
  const m = window.matchMedia(QUERY_ALLINEATE);
  m.addEventListener('change', f);
  return () => m.removeEventListener('change', f);
}

/** Le schede possono stare accanto al testo? Sul server: no. */
export function useNoteAllineate(): boolean {
  return useSyncExternalStore(
    iscriviLarghezza,
    () => window.matchMedia(QUERY_ALLINEATE).matches,
    () => false,
  );
}

/* ─────────────── Testo della pagina ─────────────── */

function rettangoli(r: Range): DOMRect[] {
  return Array.from(r.getClientRects()).filter(
    (x) => x.width > 0 && x.height > 0,
  );
}

function menoMovimento(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Fa lampeggiare una volta il testo, con riquadri sopra le sue righe. */
function lampeggia(r: Range): void {
  const strato = document.createElement('div');
  strato.setAttribute('aria-hidden', 'true');
  strato.dataset.quadernoLampo = '';
  for (const q of rettangoli(r)) {
    const d = document.createElement('div');
    d.className = styles.lampo;
    d.style.left = `${q.left + window.scrollX - 2}px`;
    d.style.top = `${q.top + window.scrollY - 1}px`;
    d.style.width = `${q.width + 4}px`;
    d.style.height = `${q.height + 2}px`;
    strato.appendChild(d);
  }
  document.body.appendChild(strato);
  setTimeout(() => strato.remove(), DURATA_LAMPO);
}

/**
 * Porta il testo in vista, se non lo è, e lo fa lampeggiare. `da` è la
 * scheda cliccata: se sta in un pannello dal basso, il testo deve finire
 * sopra il pannello.
 */
export function vaiAlTesto(posto: Posto, da: Element): void {
  const [primo] = rettangoli(posto.range);
  if (!primo) return;
  const alto =
    document.querySelector('.navbar')?.getBoundingClientRect().bottom ?? 0;
  const foglio = da.closest('[role="dialog"]');
  const basso = foglio
    ? foglio.getBoundingClientRect().top
    : window.innerHeight;
  const inVista = primo.top >= alto + 8 && primo.bottom <= basso - 8;
  if (!inVista) {
    window.scrollTo({
      top: window.scrollY + primo.top - alto - (basso - alto) * 0.25,
      behavior: menoMovimento() ? 'auto' : 'smooth',
    });
  }
  // Dopo lo scorrimento, così il lampo si vede.
  setTimeout(
    () => lampeggia(posto.range),
    inVista || menoMovimento() ? 0 : 450,
  );
}

/* ─────────────── Stato del pannello ─────────────── */

interface Voce {
  id: string;
  /** null per la bozza. */
  a: Annotazione | null;
  posto: Posto | null;
  /** Il testo citato, anche per la bozza. */
  esatto: string;
}

function useNote(pagina: string) {
  const annotazioni = useAnnotazioniPagina(pagina);
  const quaderno = useQuaderno();
  const { pronto, posti, bozza, richiesta } = usePonte();
  const supportato = useSyncExternalStore(
    nessunaIscrizione,
    evidenziatoreSupportato,
    () => true,
  );
  const [attiva, setAttiva] = useState<string | null>(null);
  const [inModifica, setInModifica] = useState<string | null>(null);
  const [mostra, setMostra] = useState<{ id: string; n: number } | null>(null);

  // Senza highlight non c'è ancoraggio: tutte in elenco, in ordine di arrivo.
  const ancorate: Voce[] = [];
  const orfane: Voce[] = [];
  for (const a of annotazioni) {
    const posto = posti.get(a.id) ?? null;
    const v = { id: a.id, a, posto, esatto: a.selettore.esatto };
    if (posto || !supportato) ancorate.push(v);
    else if (pronto) orfane.push(v);
  }
  const postoBozza = posti.get(ID_BOZZA);
  if (bozza && postoBozza)
    ancorate.push({
      id: ID_BOZZA,
      a: null,
      posto: postoBozza,
      esatto: bozza.esatto,
    });
  if (supportato)
    ancorate.sort(
      (x, y) =>
        (x.posto?.inizio ?? 0) - (y.posto?.inizio ?? 0) ||
        (x.posto?.fine ?? 0) - (y.posto?.fine ?? 0),
    );

  // Una richiesta del ponte: scheda attiva, in modifica se chiesto, in vista.
  // Si applica durante il render (stato che segue un dato esterno), poi si
  // toglie dal ponte.
  const [vista, setVista] = useState(0);
  if (richiesta && richiesta.n !== vista) {
    setVista(richiesta.n);
    setAttiva(richiesta.id);
    setInModifica(richiesta.modifica ? richiesta.id : null);
    setMostra({ id: richiesta.id, n: prossimoGiro() });
  }
  useEffect(() => {
    if (richiesta) consumaRichiesta(richiesta.n);
  }, [richiesta]);

  // Il testo della scheda attiva si vede un po' più scuro.
  const rangeAttivo =
    attiva !== null ? (posti.get(attiva)?.range ?? null) : null;
  useEffect(() => {
    if (!rangeAttivo || !evidenziatoreSupportato()) return undefined;
    const reg = CSS.highlights as unknown as Map<string, Highlight>;
    reg.set('pdb-attiva', new Highlight(rangeAttivo));
    return () => {
      reg.delete('pdb-attiva');
    };
  }, [rangeAttivo]);

  const vive = quaderno.annotazioni.filter((a) => !a.cancellata).length;

  /** Rende attiva una scheda e le dà il fuoco (es. la nota appena salvata). */
  const metti = useCallback((id: string) => {
    setAttiva(id);
    setMostra({ id, n: prossimoGiro() });
  }, []);

  return {
    pagina,
    ancorate,
    orfane,
    supportato,
    legenda: quaderno.legenda,
    vive,
    attiva,
    setAttiva,
    inModifica,
    setInModifica,
    mostra,
    metti,
  };
}

type StatoNote = ReturnType<typeof useNote>;

/* ─────────────── Scheda ─────────────── */

function nomeColore(c: Colore | null, legenda: Quaderno['legenda']): string {
  if (c === null) return 'Senza colore';
  return legenda[c] ? `${NOMI[c]} · ${legenda[c]}` : NOMI[c];
}

interface SchedaProps {
  voce: Voce;
  note: StatoNote;
  /** Le schede accanto al testo non scorrono il pannello per mettersi in vista. */
  accanto: boolean;
}

function Scheda({ voce, note, accanto }: SchedaProps): ReactNode {
  const { a, posto } = voce;
  const bozza = a === null;
  const attiva = note.attiva === voce.id;
  const inModifica = note.inModifica === voce.id;
  const [testo, setTesto] = useState(a?.nota ?? '');
  const [conferma, setConferma] = useState(false);
  const radice = useRef<HTMLElement>(null);
  const areaTesto = useRef<HTMLTextAreaElement>(null);
  const principale = useRef<HTMLButtonElement>(null);
  // La bozza ha il selettore nel ponte.
  const { bozza: selettoreBozza } = usePonte();

  // Ogni volta che si entra in modifica si riparte dalla nota salvata; quando
  // se ne esce con Esc, «Annulla» o «Salva», il fuoco torna alla scheda.
  const focoDopo = useRef(false);
  useEffect(() => {
    if (inModifica) {
      setTesto(a?.nota ?? '');
      areaTesto.current?.focus({ preventScroll: true });
    } else if (focoDopo.current) {
      focoDopo.current = false;
      principale.current?.focus({ preventScroll: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inModifica]);

  useEffect(() => {
    if (!attiva) setConferma(false);
  }, [attiva]);

  // Richiesta del ponte: la scheda si mette in vista e prende il fuoco.
  const n = note.mostra?.id === voce.id ? note.mostra.n : 0;
  useEffect(() => {
    if (!n) return;
    const el = radice.current;
    if (!el) return;
    if (!accanto) el.scrollIntoView({ block: 'nearest' });
    const fuoco = inModifica ? areaTesto.current : principale.current;
    fuoco?.focus({ preventScroll: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n]);

  const chiudiModifica = (ridaiFoco: boolean) => {
    note.setInModifica(null);
    if (bozza) {
      chiudiBozza();
      note.setAttiva(null);
    } else if (ridaiFoco) {
      focoDopo.current = true;
    }
  };

  const salva = () => {
    const t = testo.trim();
    if (bozza) {
      chiudiBozza();
      note.setInModifica(null);
      if (!t) {
        note.setAttiva(null);
        return;
      }
      if (!selettoreBozza) return;
      const nuova = aggiungi(note.pagina, selettoreBozza, null, t);
      note.metti(nuova.id);
      return;
    }
    if (!t && a.colore === null) togli(a.id);
    else if (t !== a.nota) modifica(a.id, { nota: t });
    chiudiModifica(true);
  };

  const onTasto = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      chiudiModifica(true);
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      salva();
    }
  };

  const scegliColore = (c: Colore) => {
    if (!a) return;
    if (a.colore !== c) modifica(a.id, { colore: c });
    // Ripremuto: via il colore; senza nota non resta niente.
    else if (a.nota) modifica(a.id, { colore: null });
    else togli(a.id);
  };

  const togliTutto = () => {
    if (!a) return;
    if (a.nota && !conferma) {
      setConferma(true);
      return;
    }
    togli(a.id);
    note.setAttiva(null);
  };

  const colore = a?.colore ?? null;
  return (
    <article
      ref={radice}
      className={clsx(
        styles.scheda,
        attiva && styles.attiva,
        !posto && note.supportato && styles.orfana,
      )}
      data-nota-id={voce.id}
      aria-label={bozza ? 'Nota nuova' : undefined}
      onFocus={() => note.setAttiva(voce.id)}
    >
      <button
        ref={principale}
        type="button"
        className={styles.principale}
        onClick={(e) => {
          note.setAttiva(voce.id);
          if (posto) vaiAlTesto(posto, e.currentTarget);
        }}
      >
        <span className={styles.riga}>
          <span
            className={clsx(styles.punto, colore && styles[colore])}
            aria-hidden="true"
          />
          {bozza ? 'Nota nuova' : nomeColore(colore, note.legenda)}
          {posto && <span className={styles.nascosto}>, vai al testo</span>}
        </span>
        <span className={styles.citazione}>“{voce.esatto}”</span>
      </button>

      {a?.nota && !inModifica && <p className={styles.testoNota}>{a.nota}</p>}

      {inModifica ? (
        <div className={styles.modifica}>
          <textarea
            ref={areaTesto}
            className={styles.area}
            value={testo}
            maxLength={MAX_NOTA}
            rows={3}
            aria-label="Testo della nota"
            placeholder="Scrivi la nota…"
            onChange={(e) => setTesto(e.target.value)}
            onKeyDown={onTasto}
          />
          <div className={styles.azioni}>
            {testo.length > SOGLIA_CONTEGGIO && (
              <span className={styles.conteggio}>
                {testo.length}/{MAX_NOTA}
              </span>
            )}
            <button
              type="button"
              className={styles.azione}
              onClick={() => chiudiModifica(true)}
            >
              Annulla
            </button>
            <button
              type="button"
              className={clsx(styles.azione, styles.primaria)}
              data-azione="salva"
              onClick={salva}
            >
              Salva
            </button>
          </div>
        </div>
      ) : (
        attiva &&
        a && (
          <div className={styles.azioni}>
            <div className={styles.colori} role="group" aria-label="Colore">
              {COLORI.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={styles.colore}
                  data-colore={c}
                  aria-label={NOMI[c]}
                  aria-pressed={colore === c}
                  title={NOMI[c]}
                  onClick={() => scegliColore(c)}
                >
                  <span className={clsx(styles.pastiglia, styles[c])}>
                    {colore === c && (
                      <FontAwesomeIcon
                        icon={faCheck}
                        className={styles.spunta}
                      />
                    )}
                  </span>
                </button>
              ))}
            </div>
            {conferma ? (
              <span className={styles.conferma}>
                <span>Togliere anche la nota?</span>
                <button
                  type="button"
                  className={clsx(styles.azione, styles.pericolo)}
                  data-azione="conferma-togli"
                  onClick={togliTutto}
                >
                  Togli
                </button>
                <button
                  type="button"
                  className={styles.azione}
                  onClick={() => setConferma(false)}
                >
                  No
                </button>
              </span>
            ) : (
              <>
                <button
                  type="button"
                  className={styles.azione}
                  data-azione="modifica"
                  onClick={() => note.setInModifica(voce.id)}
                >
                  <FontAwesomeIcon icon={faPen} aria-hidden="true" />
                  {a.nota ? 'Modifica' : 'Nota'}
                </button>
                <button
                  type="button"
                  className={styles.azione}
                  data-azione="togli"
                  aria-label="Togli l'annotazione"
                  title="Togli l'annotazione"
                  onClick={togliTutto}
                >
                  <FontAwesomeIcon icon={faTrashCan} aria-hidden="true" />
                </button>
              </>
            )}
          </div>
        )
      )}
    </article>
  );
}

/* ─────────────── Coda: orfane, vuoto, avviso ─────────────── */

function Coda({ note, accanto }: { note: StatoNote; accanto: boolean }) {
  const vuota = note.ancorate.length === 0 && note.orfane.length === 0;
  return (
    <>
      {vuota && (
        <p className={styles.vuoto}>
          Seleziona un pezzo di testo: puoi evidenziarlo con un colore o
          scriverci accanto una nota.
        </p>
      )}
      {!note.supportato && (
        <p className={styles.spiega}>
          Questo browser non sa mostrare le evidenziazioni nel testo: le trovi
          qui.
        </p>
      )}
      {note.orfane.length > 0 && (
        <div className={styles.orfane} data-note-orfane="">
          <Heading as="h3" className={styles.titoletto}>
            Non ritrovo il punto
          </Heading>
          <p className={styles.spiega}>
            La lezione è cambiata e queste annotazioni non ritrovano il loro
            testo. Restano qui finché non le togli.
          </p>
          {note.orfane.map((v) => (
            <Scheda key={v.id} voce={v} note={note} accanto={accanto} />
          ))}
        </div>
      )}
      {note.vive > 0 && (
        <div className={styles.avviso} data-note-avviso="">
          <p>
            {note.vive === 1
              ? '1 annotazione salvata solo in questo browser.'
              : `${note.vive} annotazioni salvate solo in questo browser.`}
          </p>
          <p>
            Se questo computer non è tuo, cancella le note quando hai finito: lo
            fai dal <Link to="/quaderno">quaderno</Link>, dove puoi anche
            scaricarle.
          </p>
        </div>
      )}
    </>
  );
}

/* ─────────────── Elenco (sotto i 1280 px e su telefono) ─────────────── */

export function NoteElenco({ pagina }: { pagina: string }): ReactNode {
  const note = useNote(pagina);
  return (
    <div className={styles.elenco}>
      {note.ancorate.map((v) => (
        <Scheda key={v.id} voce={v} note={note} accanto={false} />
      ))}
      <Coda note={note} accanto={false} />
    </div>
  );
}

/* ─────────────── Accanto al testo (da 1280 px) ─────────────── */

/**
 * Le altezze: ogni scheda vorrebbe stare all'altezza della prima riga del suo
 * testo. In ordine di testo, una scheda che toccherebbe la precedente scende
 * sotto di lei. Con una scheda attiva, quella sta esatta: le successive
 * scendono, le precedenti salgono.
 */
export function impila(
  volute: number[],
  altezze: number[],
  attiva: number,
  minimo: number,
): number[] {
  const n = volute.length;
  const y = volute.map((v) => Math.max(minimo, v));
  if (n === 0) return y;
  const k = attiva >= 0 ? attiva : 0;
  for (let i = k + 1; i < n; i++)
    y[i] = Math.max(y[i], y[i - 1] + altezze[i - 1] + SPAZIO);
  for (let i = k - 1; i >= 0; i--)
    y[i] = Math.min(y[i], y[i + 1] - altezze[i] - SPAZIO);
  // In cima non c'è posto: si riparte dall'alto spingendo in giù.
  if (y[0] < minimo) {
    y[0] = minimo;
    for (let i = 1; i < n; i++)
      y[i] = Math.max(y[i], y[i - 1] + altezze[i - 1] + SPAZIO);
  }
  return y;
}

export function NoteAllineate({ pagina }: { pagina: string }): ReactNode {
  const note = useNote(pagina);
  const strato = useRef<HTMLDivElement>(null);
  const posti = useRef(new Map<string, HTMLDivElement>());
  const coda = useRef<HTMLDivElement>(null);
  const [giro, setGiro] = useState(0);
  const ridisponi = useCallback(() => setGiro((g) => g + 1), []);

  // Il testo cambia altezza (immagini, Tabs, finestra), una scheda cambia
  // altezza (si scrive la nota): si ridispone.
  useEffect(() => {
    const ro = new ResizeObserver(ridisponi);
    const testo = document.querySelector('.theme-doc-markdown');
    if (testo) ro.observe(testo);
    for (const el of posti.current.values()) ro.observe(el);
    if (coda.current) ro.observe(coda.current);
    window.addEventListener('resize', ridisponi);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', ridisponi);
    };
  }, [ridisponi, note.ancorate.length, note.orfane.length]);

  const ids = note.ancorate.map((v) => v.id).join(' ');
  useLayoutEffect(() => {
    const s = strato.current;
    if (!s) return;
    const base = s.getBoundingClientRect().top;
    const voci = note.ancorate.filter((v) => posti.current.has(v.id));
    const volute = voci.map((v) => {
      const [primo] = v.posto ? rettangoli(v.posto.range) : [];
      return primo ? primo.top - base : 0;
    });
    const elementi = voci.map((v) => posti.current.get(v.id)!);
    const altezze = elementi.map((el) => el.offsetHeight);
    const k = voci.findIndex((v) => v.id === note.attiva);
    const y = impila(volute, altezze, k, 0);
    elementi.forEach((el, i) => {
      el.style.top = `${y[i]}px`;
    });
    const fondo = y.length
      ? y[y.length - 1] + altezze[altezze.length - 1] + SPAZIO_CODA
      : 0;
    if (coda.current) coda.current.style.top = `${fondo}px`;
    s.style.height = `${fondo + (coda.current?.offsetHeight ?? 0)}px`;
    // Le transizioni partono dopo la prima disposizione.
    if (!s.dataset.pronto) requestAnimationFrame(() => (s.dataset.pronto = ''));
  }, [note.ancorate, note.attiva, note.inModifica, giro, ids]);

  return (
    <div ref={strato} className={styles.strato}>
      {note.ancorate.map((v) => (
        <div
          key={v.id}
          ref={(el) => {
            if (el) posti.current.set(v.id, el);
            else posti.current.delete(v.id);
          }}
          className={styles.posto}
        >
          <Scheda voce={v} note={note} accanto />
        </div>
      ))}
      <div ref={coda} className={styles.posto}>
        <Coda note={note} accanto />
      </div>
    </div>
  );
}
