/**
 * Evidenziatore — evidenzia la prosa della lezione in quattro colori (piano
 * pm/piano-2026-11-quaderno.md, fase Q1).
 *
 * - Disegno: CSS Custom Highlight API, un `Highlight` per colore
 *   (`pdb-giallo`, …) registrato in `CSS.highlights`, colori in
 *   src/css/custom.css. Mai elementi aggiunti attorno al testo: il DOM
 *   dell'MDX è di React, e avvolgere il testo romperebbe la riconciliazione al primo aggiornamento di
 *   un Quiz o di uno Spoiler.
 * - Ancoraggio: dopo l'hydration costruisce il testo evidenziabile
 *   (`costruisciTesto`) e ritrova le annotazioni della pagina (`ancora`). Lo
 *   rifà quando cambiano le annotazioni e quando cambia il contenuto
 *   (MutationObserver, 200 ms): Tabs, Spoiler, Quiz e runner cambiano il DOM
 *   dopo il caricamento.
 * - Barra dei colori: compare quando la selezione si ferma (`selectionchange`
 *   più 300 ms, `pointerup` col mouse). Col mouse sta sopra la selezione; al
 *   tocco sotto, perché il menu nativo dei telefoni sta sopra. La selezione si
 *   taglia ai bordi del testo evidenziabile: tutta dentro un runner, niente
 *   barra. «Togli» c'è se la selezione cade su un'evidenziazione.
 * - Menu: gli highlight non ricevono eventi, quindi un clic sul testo si
 *   confronta con i rettangoli delle annotazioni (`Range.getClientRects`).
 * - Tastiera: con la barra o il menu aperti, Tab ci entra, le frecce si
 *   spostano fra i pulsanti, Esc chiude.
 * - Note (fase Q2): i posti ancorati vanno al pannello Note attraverso il
 *   ponte (src/lib/quaderno/ponte.ts). «Nota» nella barra apre una bozza nel
 *   pannello; un clic su un testo con nota apre il pannello sulla sua scheda.
 *   Il testo con nota (e quello della bozza) ha la sottolineatura
 *   `pdb-con-nota`.
 *
 * - Orfane e link (fase Q3): a ogni ancoraggio lascia in `orfane.ts` l'elenco
 *   delle annotazioni senza testo, per `/quaderno`; e se l'indirizzo ha
 *   `?annotazione=<id>` (ci portano le voci di `/quaderno`) apre la scheda di
 *   quell'annotazione e scorre al suo testo.
 *
 * Senza `CSS.highlights` (browser vecchi) il componente non fa niente.
 * Lo monta il Layout del DocItem, una volta per pagina (`key` = pagina).
 */
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from '@docusaurus/router';
import clsx from 'clsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheck,
  faEraser,
  faNoteSticky,
} from '@fortawesome/free-solid-svg-icons';

import { ancora, descrivi } from '@site/src/lib/quaderno/ancora';
import {
  aggiungi,
  modifica,
  togli,
  useAnnotazioniPagina,
  useQuaderno,
} from '@site/src/lib/quaderno/archivio';
import { segnaOrfane } from '@site/src/lib/quaderno/orfane';
import { SELETTORE_RADICE } from '@site/src/lib/quaderno/pagine';
import {
  ID_BOZZA,
  azzeraPonte,
  chiediScheda,
  evidenziatoreSupportato,
  iniziaBozza,
  pubblicaPosti,
  usePonte,
  type Posto,
} from '@site/src/lib/quaderno/ponte';
import {
  costruisciTesto,
  daRange,
  intervallo,
  type TestoPagina,
} from '@site/src/lib/quaderno/testo';
import {
  COLORI,
  type Annotazione,
  type Colore,
  type Quaderno,
} from '@site/src/lib/quaderno/tipi';
import { vaiAlTesto } from '@site/src/components/NotePagina';

import styles from './styles.module.css';

const ATTESA_SELEZIONE = 300;
const ATTESA_MUTAZIONI = 200;
/** Spazio fra la barra e il testo; al tocco anche le maniglie della selezione. */
const STACCO = 8;
const STACCO_TOCCO = 28;
/** Sotto questa distanza dal bordo alto la barra va sotto (c'è la navbar). */
const MARGINE_ALTO = 120;
const MARGINE_LATI = 16;
/** Parametro dell'indirizzo che porta a un'annotazione (da `/quaderno`). */
export const PARAMETRO_ANNOTAZIONE = 'annotazione';
/** Quanto si aspetta che il testo si ancori prima di aprire la scheda orfana. */
const ATTESA_ANNOTAZIONE = 2500;
/** Il pannello Note si apre e sposta il testo: si scorre dopo. */
const ATTESA_PANNELLO = 350;

const NOMI: Record<Colore, string> = {
  giallo: 'Giallo',
  verde: 'Verde',
  azzurro: 'Azzurro',
  rosa: 'Rosa',
};

interface Ancorata {
  a: Annotazione;
  inizio: number;
  fine: number;
  range: Range;
}

interface Stato {
  t: TestoPagina;
  ancorate: Ancorata[];
}

interface Posizione {
  x: number;
  y: number;
  sotto: boolean;
}

type Aperto =
  | ({
      tipo: 'barra';
      inizio: number;
      fine: number;
      /** Le evidenziazioni toccate dalla selezione. */
      sopra: Annotazione[];
      /** L'evidenziazione che coincide con la selezione, se c'è. */
      esatta: Annotazione | null;
    } & Posizione)
  | ({ tipo: 'menu'; annotazione: Annotazione } & Posizione);

function nomeHighlight(c: Colore): string {
  return `pdb-${c}`;
}

/** La sottolineatura del testo con nota (src/css/custom.css). */
const CON_NOTA = 'pdb-con-nota';

/** `CSS.highlights` è un Map; i tipi del DOM lo dicono solo con DOM.Iterable. */
function registro(): Map<string, Highlight> {
  return CSS.highlights as unknown as Map<string, Highlight>;
}

const nessunaIscrizione = () => () => undefined;

function etichetta(c: Colore, legenda: Quaderno['legenda']): string {
  return legenda[c] ? `${NOMI[c]} (${legenda[c]})` : NOMI[c];
}

/** Rettangoli visibili di un Range (quelli vuoti sono gli a capo). */
function rettangoli(r: Range): DOMRect[] {
  return Array.from(r.getClientRects()).filter(
    (x) => x.width > 0 && x.height > 0,
  );
}

/** Dove mettere la barra: sopra la prima riga col mouse, sotto l'ultima al tocco. */
function posiziona(rects: DOMRect[], tocco: boolean): Posizione | null {
  if (!rects.length) return null;
  const primo = rects[0];
  const ultimo = rects[rects.length - 1];
  if (!tocco && primo.top > MARGINE_ALTO) {
    return {
      x: (primo.left + primo.right) / 2 + window.scrollX,
      y: primo.top - STACCO + window.scrollY,
      sotto: false,
    };
  }
  return {
    x: (ultimo.left + ultimo.right) / 2 + window.scrollX,
    y: ultimo.bottom + (tocco ? STACCO_TOCCO : STACCO) + window.scrollY,
    sotto: true,
  };
}

/** Il clic è caduto su un elemento che ha già un suo comportamento? */
function interattivo(el: Element): boolean {
  return !!el.closest(
    'a, button, input, textarea, select, label, summary, [role="button"], [data-runner], [data-quaderno-escludi]',
  );
}

/**
 * Toglie l'evidenziazione. Se l'annotazione ha una nota (fase Q2) la nota
 * resta, senza colore.
 */
function togliEvidenziazione(a: Annotazione): void {
  if (a.nota) modifica(a.id, { colore: null });
  else togli(a.id);
}

export default function Evidenziatore({
  pagina,
}: {
  pagina: string;
}): ReactNode {
  // Sul server e durante l'hydration: spento.
  const attivo = useSyncExternalStore(
    nessunaIscrizione,
    evidenziatoreSupportato,
    () => false,
  );
  return attivo ? <EvidenziatoreAttivo pagina={pagina} /> : null;
}

function EvidenziatoreAttivo({ pagina }: { pagina: string }): ReactNode {
  const annotazioni = useAnnotazioniPagina(pagina);
  const { legenda } = useQuaderno();
  const { bozza, posti } = usePonte();
  const { search } = useLocation();
  const [aperto, setAperto] = useState<Aperto | null>(null);
  const [annuncio, setAnnuncio] = useState('');
  const stato = useRef<Stato | null>(null);
  const fluttuante = useRef<HTMLDivElement>(null);
  const tocco = useRef(
    window.matchMedia('(hover: none) and (pointer: coarse)').matches,
  );
  const puntatoreGiu = useRef(false);
  const focoPrima = useRef<HTMLElement | null>(null);

  // --- ancoraggio e disegno -------------------------------------------------

  const ricostruisci = useCallback(() => {
    const radice = document.querySelector(SELETTORE_RADICE);
    if (!radice) return;
    const t = costruisciTesto(radice);
    const ancorate: Ancorata[] = [];
    const posti = new Map<string, Posto>();
    for (const a of annotazioni) {
      const p = ancora(t, a.selettore);
      if (!p) continue;
      const x = { a, ...p, range: intervallo(t, p.inizio, p.fine) };
      ancorate.push(x);
      posti.set(a.id, { inizio: x.inizio, fine: x.fine, range: x.range });
    }
    const pb = bozza && ancora(t, bozza);
    if (pb)
      posti.set(ID_BOZZA, { ...pb, range: intervallo(t, pb.inizio, pb.fine) });
    stato.current = { t, ancorate };
    for (const c of COLORI) {
      const ranges = ancorate
        .filter((x) => x.a.colore === c)
        .map((x) => x.range);
      registro().set(nomeHighlight(c), new Highlight(...ranges));
    }
    const conNota = ancorate.filter((x) => x.a.nota).map((x) => x.range);
    const rb = posti.get(ID_BOZZA)?.range;
    registro().set(
      CON_NOTA,
      new Highlight(...(rb ? [...conNota, rb] : conNota)),
    );
    pubblicaPosti(posti);
    segnaOrfane(
      pagina,
      annotazioni.filter((a) => !posti.has(a.id)).map((a) => a.id),
    );
  }, [annotazioni, bozza, pagina]);

  useEffect(() => {
    ricostruisci();
  }, [ricostruisci]);

  useEffect(() => {
    const radice = document.querySelector(SELETTORE_RADICE);
    if (!radice) return undefined;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const osservatore = new MutationObserver(() => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(ricostruisci, ATTESA_MUTAZIONI);
    });
    osservatore.observe(radice, {
      childList: true,
      subtree: true,
      characterData: true,
      // Lo Spoiler scoperto toglie `aria-hidden`: il testo diventa evidenziabile.
      attributes: true,
      attributeFilter: ['aria-hidden'],
    });
    return () => {
      osservatore.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [ricostruisci]);

  useEffect(
    () => () => {
      for (const c of COLORI) registro().delete(nomeHighlight(c));
      registro().delete(CON_NOTA);
      azzeraPonte();
    },
    [],
  );

  // --- ?annotazione=<id>: apri la scheda e scorri al testo -------------------

  const portata = useRef<string | null>(null);
  const idVoluto = new URLSearchParams(search).get(PARAMETRO_ANNOTAZIONE);
  useEffect(() => {
    if (!idVoluto || portata.current === idVoluto) return undefined;
    if (!annotazioni.some((a) => a.id === idVoluto)) return undefined;
    const posto = posti.get(idVoluto);
    // Il testo può ancorarsi dopo: Tabs, Spoiler e Quiz cambiano il DOM. Se
    // non si ancora entro l'attesa, l'annotazione è orfana e si apre lo stesso
    // la sua scheda, in «Non ritrovo il punto».
    const apri = () => {
      portata.current = idVoluto;
      chiediScheda(idVoluto);
      if (posto)
        setTimeout(() => vaiAlTesto(posto, document.body), ATTESA_PANNELLO);
    };
    if (posto) {
      apri();
      return undefined;
    }
    const timer = setTimeout(apri, ATTESA_ANNOTAZIONE);
    return () => clearTimeout(timer);
  }, [idVoluto, annotazioni, posti]);

  // --- selezione → barra ----------------------------------------------------

  const chiudi = useCallback((ridaiFoco = false) => {
    setAperto(null);
    if (ridaiFoco && focoPrima.current?.isConnected) focoPrima.current.focus();
    focoPrima.current = null;
  }, []);

  const valuta = useCallback(() => {
    const sel = window.getSelection();
    const st = stato.current;
    const radice = document.querySelector(SELETTORE_RADICE);
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed || !st || !radice) {
      setAperto((x) => (x?.tipo === 'barra' ? null : x));
      return;
    }
    const r = sel.getRangeAt(0);
    const o = r.intersectsNode(radice) ? daRange(st.t, r) : null;
    const pos =
      o &&
      posiziona(rettangoli(intervallo(st.t, o.inizio, o.fine)), tocco.current);
    if (!o || !pos) {
      setAperto((x) => (x?.tipo === 'barra' ? null : x));
      return;
    }
    const sopra = st.ancorate.filter(
      (x) => x.a.colore !== null && x.inizio < o.fine && x.fine > o.inizio,
    );
    // Anche una nota senza colore: «Nota» la riapre, un colore glielo dà.
    const esatta =
      st.ancorate.find((x) => x.inizio === o.inizio && x.fine === o.fine)?.a ??
      null;
    setAperto({
      tipo: 'barra',
      ...o,
      ...pos,
      sopra: sopra.map((x) => x.a),
      esatta,
    });
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const suSelezione = () => {
      if (timer) clearTimeout(timer);
      setAperto((x) => (x?.tipo === 'barra' ? null : x));
      // Col mouse premuto la selezione non è finita: aspetta il pointerup.
      if (puntatoreGiu.current) return;
      timer = setTimeout(valuta, ATTESA_SELEZIONE);
    };
    const suGiu = (e: PointerEvent) => {
      tocco.current = e.pointerType !== 'mouse';
      puntatoreGiu.current = e.pointerType === 'mouse';
      const f = fluttuante.current;
      if (f && e.target instanceof Node && !f.contains(e.target)) chiudi();
    };
    const suSu = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || !puntatoreGiu.current) return;
      puntatoreGiu.current = false;
      if (timer) clearTimeout(timer);
      // Un giro dopo: il browser finisce di aggiornare la selezione.
      timer = setTimeout(valuta, 0);
    };
    const suRidimensiona = () => chiudi();
    document.addEventListener('selectionchange', suSelezione);
    document.addEventListener('pointerdown', suGiu, true);
    document.addEventListener('pointerup', suSu, true);
    window.addEventListener('resize', suRidimensiona);
    return () => {
      if (timer) clearTimeout(timer);
      document.removeEventListener('selectionchange', suSelezione);
      document.removeEventListener('pointerdown', suGiu, true);
      document.removeEventListener('pointerup', suSu, true);
      window.removeEventListener('resize', suRidimensiona);
    };
  }, [valuta, chiudi]);

  // --- clic su un'evidenziazione → menu -------------------------------------

  useEffect(() => {
    const suClic = (e: MouseEvent) => {
      const radice = document.querySelector(SELETTORE_RADICE);
      const st = stato.current;
      if (!radice || !st || !(e.target instanceof Element)) return;
      if (!radice.contains(e.target) || interattivo(e.target)) return;
      const sel = window.getSelection();
      if (sel && !sel.isCollapsed) return;
      // Fra più evidenziazioni sovrapposte vince la più corta.
      let scelta: { x: Ancorata; rect: DOMRect } | null = null;
      for (const x of st.ancorate) {
        const rect = rettangoli(x.range).find(
          (q) =>
            e.clientX >= q.left &&
            e.clientX <= q.right &&
            e.clientY >= q.top &&
            e.clientY <= q.bottom,
        );
        if (
          rect &&
          (!scelta || x.fine - x.inizio < scelta.x.fine - scelta.x.inizio)
        )
          scelta = { x, rect };
      }
      if (!scelta) return;
      // Con una nota si apre il pannello sulla sua scheda. `preventDefault`
      // dice al pannello dal basso del telefono di non chiudersi per questo clic.
      if (scelta.x.a.nota) {
        e.preventDefault();
        setAperto(null);
        chiediScheda(scelta.x.a.id);
        return;
      }
      const pos = posiziona([scelta.rect], tocco.current);
      if (pos) setAperto({ tipo: 'menu', annotazione: scelta.x.a, ...pos });
    };
    document.addEventListener('click', suClic);
    return () => document.removeEventListener('click', suClic);
  }, []);

  // --- tastiera -------------------------------------------------------------

  useEffect(() => {
    if (!aperto) return undefined;
    const suTasto = (e: KeyboardEvent) => {
      const f = fluttuante.current;
      if (!f) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        chiudi(f.contains(document.activeElement));
      } else if (
        e.key === 'Tab' &&
        !e.shiftKey &&
        !f.contains(document.activeElement)
      ) {
        e.preventDefault();
        focoPrima.current =
          document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;
        f.querySelector<HTMLButtonElement>('button')?.focus();
      }
    };
    document.addEventListener('keydown', suTasto);
    return () => document.removeEventListener('keydown', suTasto);
  }, [aperto, chiudi]);

  const frecce = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const bottoni = Array.from(
      e.currentTarget.querySelectorAll<HTMLButtonElement>('button'),
    );
    const i = bottoni.indexOf(document.activeElement as HTMLButtonElement);
    let j: number | null = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = i + 1;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = i - 1;
    else if (e.key === 'Home') j = 0;
    else if (e.key === 'End') j = bottoni.length - 1;
    if (j === null) return;
    e.preventDefault();
    bottoni[(j + bottoni.length) % bottoni.length]?.focus();
  };

  // La barra non deve uscire dallo schermo: si misura e si sposta.
  useLayoutEffect(() => {
    const f = fluttuante.current;
    if (!f || !aperto) return;
    const meta = f.offsetWidth / 2;
    const min = window.scrollX + MARGINE_LATI + meta;
    const max =
      window.scrollX +
      document.documentElement.clientWidth -
      MARGINE_LATI -
      meta;
    f.style.left = `${Math.max(min, Math.min(max, aperto.x))}px`;
  }, [aperto]);

  // --- azioni ---------------------------------------------------------------

  const finito = (messaggio: string) => {
    window.getSelection()?.removeAllRanges();
    setAnnuncio(messaggio);
    chiudi(!!fluttuante.current?.contains(document.activeElement));
  };

  const scegli = (c: Colore) => {
    if (!aperto) return;
    if (aperto.tipo === 'menu') {
      modifica(aperto.annotazione.id, { colore: c });
    } else if (aperto.esatta) {
      modifica(aperto.esatta.id, { colore: c });
    } else {
      const st = stato.current;
      if (!st) return;
      aggiungi(pagina, descrivi(st.t, aperto.inizio, aperto.fine), c);
    }
    finito(`Evidenziato in ${NOMI[c].toLowerCase()}.`);
  };

  const nota = () => {
    if (!aperto) return;
    const esistente =
      aperto.tipo === 'menu' ? aperto.annotazione : aperto.esatta;
    if (esistente) {
      chiediScheda(esistente.id, true);
    } else if (aperto.tipo === 'barra') {
      const st = stato.current;
      if (!st) return;
      iniziaBozza(descrivi(st.t, aperto.inizio, aperto.fine));
    }
    // Il fuoco lo prende la scheda nel pannello.
    window.getSelection()?.removeAllRanges();
    setAnnuncio('Scrivi la nota nel pannello Note.');
    setAperto(null);
    focoPrima.current = null;
  };

  const togliTutto = () => {
    if (!aperto) return;
    const via = aperto.tipo === 'menu' ? [aperto.annotazione] : aperto.sopra;
    via.forEach(togliEvidenziazione);
    finito(
      via.length === 1
        ? 'Evidenziazione tolta.'
        : `${via.length} evidenziazioni tolte.`,
    );
  };

  const colorePremuto =
    aperto?.tipo === 'menu'
      ? aperto.annotazione.colore
      : aperto?.tipo === 'barra'
        ? (aperto.esatta?.colore ?? null)
        : null;
  const togliVisibile =
    aperto?.tipo === 'menu' ||
    (aperto?.tipo === 'barra' && aperto.sopra.length > 0);

  return createPortal(
    <>
      {aperto && (
        <div
          ref={fluttuante}
          role="toolbar"
          aria-label={
            aperto.tipo === 'menu' ? 'Evidenziazione' : 'Evidenzia la selezione'
          }
          data-quaderno-barra={aperto.tipo === 'barra' ? '' : undefined}
          data-quaderno-menu={aperto.tipo === 'menu' ? '' : undefined}
          className={clsx(styles.fluttuante, aperto.sotto && styles.sotto)}
          style={{ top: aperto.y, left: aperto.x }}
          // Il clic sulla barra non deve togliere la selezione né il fuoco.
          onPointerDown={(e) => e.preventDefault()}
          onKeyDown={frecce}
        >
          {COLORI.map((c) => (
            <button
              key={c}
              type="button"
              className={styles.colore}
              data-colore={c}
              aria-label={etichetta(c, legenda)}
              aria-pressed={colorePremuto === c}
              title={etichetta(c, legenda)}
              onClick={() => scegli(c)}
            >
              <span className={clsx(styles.pastiglia, styles[c])}>
                {colorePremuto === c && (
                  <FontAwesomeIcon icon={faCheck} className={styles.spunta} />
                )}
              </span>
            </button>
          ))}
          <span className={styles.divisore} aria-hidden="true" />
          <button
            type="button"
            className={styles.togli}
            data-azione="nota"
            onClick={nota}
          >
            <FontAwesomeIcon icon={faNoteSticky} aria-hidden="true" />
            Nota
          </button>
          {togliVisibile && (
            <>
              <button
                type="button"
                className={styles.togli}
                data-azione="togli"
                onClick={togliTutto}
              >
                <FontAwesomeIcon icon={faEraser} aria-hidden="true" />
                Togli
              </button>
            </>
          )}
        </div>
      )}
      <div className={styles.nascosto} role="status" aria-live="polite">
        {annuncio}
      </div>
    </>,
    document.body,
  );
}
