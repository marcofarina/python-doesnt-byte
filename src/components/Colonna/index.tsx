/**
 * Colonna — la colonna destra delle lezioni, con i pannelli «Archivio»
 * (pm/piano-2026-10-archivio.md), «Database»
 * (pm/piano-2026-10-pannello-database.md) e «Note»
 * (pm/piano-2026-11-quaderno.md, fase Q2).
 *
 * La colonna compare in tutte le pagine con l'evidenziatore (pannello Note) e
 * nelle lezioni che dichiarano `archivio:` o `database:`. Si apre un pannello
 * alla volta; chiusi tutti torna l'indice.
 *
 * - Desktop: <ColonnaRail> sta nella colonna dell'indice. I pulsanti restano
 *   in testa, nell'ordine Archivio, Database, Note; il pannello aperto prende
 *   il posto dell'indice. Le Note da 1280 px fanno eccezione: niente
 *   pannello, le schede scorrono con il testo accanto al punto a cui si
 *   riferiscono (<NoteAllineate>), e in testa restano solo i pulsanti.
 * - Telefono: <ColonnaSheet>, pulsante flottante e pannello che sale dal basso
 *   fino a metà schermo, con una scheda per pannello se sono più di uno.
 *
 * Lo stato vive in useColonna(), chiamato dal Layout del DocItem perché anche
 * la larghezza delle colonne dipende dal pannello aperto. Il pannello aperto si
 * ricorda fra le pagine in sessionStorage. Una richiesta del ponte del
 * quaderno (clic su un testo con nota, «Nota» nella barra) apre le Note.
 */
import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import useIsBrowser from '@docusaurus/useIsBrowser';
import { useDoc } from '@docusaurus/plugin-content-docs/client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBoxArchive,
  faChevronDown,
  faDatabase,
  faNoteSticky,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';

import { useMemoria } from '@site/src/lib/memoria';
import { useAnnotazioniPagina } from '@site/src/lib/quaderno/archivio';
import { usePonte } from '@site/src/lib/quaderno/ponte';
import {
  NoteAllineate,
  NoteElenco,
  useNoteAllineate,
} from '@site/src/components/NotePagina';
import {
  ArchivioContenuto,
  useArchivio,
  type Archivio,
} from '@site/src/components/Archivio';
import {
  DatabaseContenuto,
  etichettaDaVedere,
  useDatabasePagina,
  type DatabasePagina,
} from '@site/src/components/DatabasePagina';

import styles from './styles.module.css';

export type Sezione = 'archivio' | 'database' | 'note';

export interface NoteColonna {
  /** Chiave della pagina nel quaderno (`src/lib/quaderno/pagine.ts`). */
  pagina: string;
  /** Annotazioni della pagina, per il numero sul pulsante. */
  quante: number;
}

export interface Colonna {
  archivio: Archivio | null;
  database: DatabasePagina | null;
  note: NoteColonna | null;
  /** Il pannello aperto, null se è chiuso (si vede l'indice). */
  aperta: Sezione | null;
  apri: (sezione: Sezione | null) => void;
}

const CHIAVE_APERTA = 'pdb.colonna.aperta';
// Prima del pannello Database l'archivio si ricordava così: letta finché la
// chiave nuova non esiste, chi aveva l'archivio aperto lo ritrova aperto.
const CHIAVE_ARCHIVIO_VECCHIA = 'pdb.archivio.aperto';

/**
 * Stato della colonna della pagina; `null` se la pagina non ha pannelli.
 * `pagina` è la chiave del quaderno, null nelle pagine senza evidenziatore.
 */
export function useColonna(pagina: string | null): Colonna | null {
  const { frontMatter } = useDoc();
  const archivio = useArchivio();
  const dichiarato = (frontMatter as { database?: unknown }).database;
  const datasetKey =
    typeof dichiarato === 'string' && dichiarato !== '' ? dichiarato : null;

  // Sul server e durante l'hydration: chiusa. Il valore ricordato arriva
  // subito dopo (useMemoria).
  const [ricordata, ricorda] = useMemoria('session', CHIAVE_APERTA);
  const [vecchia] = useMemoria('session', CHIAVE_ARCHIVIO_VECCHIA);
  const voluta = ricordata ?? (vecchia === '1' ? 'archivio' : null);
  // Un pannello che questa lezione non ha resta chiuso, ma ricordato: la
  // lezione dopo può averlo.
  const aperta: Sezione | null =
    voluta === 'archivio' && archivio !== null
      ? 'archivio'
      : voluta === 'database' && datasetKey !== null
        ? 'database'
        : voluta === 'note' && pagina !== null
          ? 'note'
          : null;

  const database = useDatabasePagina(datasetKey, aperta === 'database');
  const apri = useCallback(
    (sezione: Sezione | null) => ricorda(sezione ?? ''),
    [ricorda],
  );

  // Il ponte chiede una scheda: si aprono le Note (la scheda la cerca il
  // pannello stesso).
  const quante = useAnnotazioniPagina(pagina ?? '').length;
  const { richiesta } = usePonte();
  const nRichiesta = richiesta?.n ?? 0;
  useEffect(() => {
    if (nRichiesta > 0 && pagina !== null) apri('note');
  }, [nRichiesta, pagina, apri]);

  const note = useMemo(
    () => (pagina === null ? null : { pagina, quante }),
    [pagina, quante],
  );
  if (archivio === null && database === null && note === null) return null;
  return { archivio, database, note, aperta, apri };
}

function Pallino({ n }: { n: number }): ReactNode {
  if (n <= 0) return null;
  return (
    <span className={styles.pallino} aria-hidden>
      {n > 99 ? '99+' : n}
    </span>
  );
}

/* ─────────────── Desktop: colonna dell'indice ─────────────── */

interface ColonnaRailProps {
  colonna: Colonna;
  /** L'indice della pagina, mostrato sotto i pulsanti a pannelli chiusi. */
  toc?: ReactNode;
}

export function ColonnaRail({ colonna, toc }: ColonnaRailProps): ReactNode {
  const { archivio, database, note, aperta, apri } = colonna;
  const idPannello = useId();
  const pulsanti = useRef<Record<Sezione, HTMLButtonElement | null>>({
    archivio: null,
    database: null,
    note: null,
  });
  // Da 1280 px le Note non hanno pannello: schede accanto al testo.
  const allineate = useNoteAllineate();
  const noteAccanto = aperta === 'note' && note !== null && allineate;

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Escape' || aperta === null) return;
    e.stopPropagation();
    pulsanti.current[aperta]?.focus();
    apri(null);
  };

  const interruttore = (
    sezione: Sezione,
    icona: typeof faBoxArchive,
    etichetta: string,
    conta: string,
    daVedere = 0,
  ) => (
    <button
      ref={(el) => {
        pulsanti.current[sezione] = el;
      }}
      type="button"
      className={styles.interruttore}
      aria-expanded={aperta === sezione}
      aria-controls={aperta === sezione ? idPannello : undefined}
      aria-label={
        daVedere > 0
          ? `${etichetta}: ${etichettaDaVedere(daVedere)}`
          : undefined
      }
      onClick={() => apri(aperta === sezione ? null : sezione)}
    >
      <FontAwesomeIcon icon={icona} className={styles.icona} />
      <span className={styles.etichetta}>{etichetta}</span>
      <span className={styles.conta}>{conta}</span>
      <Pallino n={daVedere} />
      <FontAwesomeIcon icon={faChevronDown} className={styles.freccia} />
    </button>
  );

  return (
    <>
      <div
        data-colonna=""
        className={clsx(
          styles.rail,
          aperta !== null && !noteAccanto && styles.railAperto,
          noteAccanto && styles.railNote,
        )}
        onKeyDown={onKeyDown}
      >
        <div className={styles.pulsanti}>
          {archivio &&
            interruttore(
              'archivio',
              faBoxArchive,
              'Archivio',
              archivio.files.length === 1
                ? '1 file'
                : `${archivio.files.length} file`,
            )}
          {database &&
            interruttore(
              'database',
              faDatabase,
              'Database',
              database.datasetKey.split('/').pop() ?? '',
              database.daVedere,
            )}
          {note &&
            interruttore(
              'note',
              faNoteSticky,
              'Note',
              note.quante > 0 ? String(note.quante) : '',
            )}
        </div>
        {aperta === 'archivio' && archivio ? (
          <section
            id={idPannello}
            aria-label="Archivio"
            data-archivio=""
            className={styles.pannello}
          >
            <ArchivioContenuto archivio={archivio} />
          </section>
        ) : aperta === 'database' && database ? (
          <section
            id={idPannello}
            aria-label="Database"
            className={styles.pannello}
          >
            <DatabaseContenuto db={database} />
          </section>
        ) : aperta === 'note' && note ? (
          !noteAccanto && (
            <section
              id={idPannello}
              aria-label="Note"
              data-note=""
              className={styles.pannello}
            >
              <NoteElenco pagina={note.pagina} />
            </section>
          )
        ) : (
          <div className={styles.indice}>{toc}</div>
        )}
      </div>
      {noteAccanto && (
        <section id={idPannello} aria-label="Note" data-note="">
          <NoteAllineate pagina={note.pagina} />
        </section>
      )}
    </>
  );
}

/* ─────────────── Telefono: pulsante flottante e pannello dal basso ─────────────── */

const SEZIONI: Record<
  Sezione,
  { icona: typeof faBoxArchive; nome: string; chiudi: string }
> = {
  archivio: {
    icona: faBoxArchive,
    nome: 'Archivio',
    chiudi: "Chiudi l'archivio",
  },
  database: {
    icona: faDatabase,
    nome: 'Database',
    chiudi: 'Chiudi il database',
  },
  note: { icona: faNoteSticky, nome: 'Note', chiudi: 'Chiudi le note' },
};

export function ColonnaSheet({ colonna }: { colonna: Colonna }): ReactNode {
  const { archivio, database, note, aperta, apri } = colonna;
  const sezioni: Sezione[] = [
    ...(archivio ? (['archivio'] as const) : []),
    ...(database ? (['database'] as const) : []),
    ...(note ? (['note'] as const) : []),
  ];
  const aperto = aperta !== null;
  const idPannello = useId();
  const idTitolo = useId();
  const idSezioni = useId();
  const pulsante = useRef<HTMLButtonElement>(null);
  const pannello = useRef<HTMLDivElement>(null);
  const linguette = useRef<Record<Sezione, HTMLButtonElement | null>>({
    archivio: null,
    database: null,
    note: null,
  });
  // L'ultimo pannello guardato: il pulsante flottante riapre quello.
  const [ultima, setUltima] = useState<Sezione | null>(null);
  if (aperta !== null && aperta !== ultima) setUltima(aperta);
  // Il focus si sposta solo se a aprire o chiudere è stato l'utente, non
  // quando il pannello si riapre da solo alla pagina successiva.
  const daUtente = useRef(false);
  const isBrowser = useIsBrowser();
  const daVedere = database?.daVedere ?? 0;

  const chiudi = useCallback(() => {
    daUtente.current = true;
    apri(null);
  }, [apri]);

  useEffect(() => {
    if (!daUtente.current) return;
    daUtente.current = false;
    if (aperto) {
      pannello.current
        ?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')
        ?.focus();
    } else {
      pulsante.current?.focus();
    }
  }, [aperto]);

  // Esc e clic fuori chiudono. `click`, non `pointerdown`: un dito che scorre
  // il testo sopra il pannello non genera click e lascia il pannello aperto.
  useEffect(() => {
    if (!aperto) return undefined;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape' && !e.defaultPrevented) chiudi();
    };
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (pannello.current?.contains(t) || pulsante.current?.contains(t))
        return;
      // Un clic su un testo con nota (l'Evidenziatore lo segna con
      // preventDefault) o sulla barra dei colori apre le Note: non chiudere.
      if (
        e.defaultPrevented ||
        (t instanceof Element &&
          t.closest('[data-quaderno-barra], [data-quaderno-menu]'))
      )
        return;
      chiudi();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('click', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('click', onClick);
    };
  }, [aperto, chiudi]);

  const apriDaPulsante = () => {
    daUtente.current = true;
    if (aperto) {
      apri(null);
      return;
    }
    // Modifiche da vedere: si apre sul Database. Altrimenti l'ultimo pannello
    // guardato, o il primo.
    const preferita =
      daVedere > 0
        ? 'database'
        : ultima !== null && sezioni.includes(ultima)
          ? ultima
          : sezioni[0];
    apri(preferita);
  };

  const onKeyDownSezioni = (e: KeyboardEvent<HTMLDivElement>) => {
    if (aperta === null) return;
    const i = sezioni.indexOf(aperta);
    const n = sezioni.length;
    const dest =
      e.key === 'ArrowRight'
        ? (i + 1) % n
        : e.key === 'ArrowLeft'
          ? (i - 1 + n) % n
          : e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? n - 1
              : -1;
    if (dest < 0) return;
    e.preventDefault();
    apri(sezioni[dest]);
    linguette.current[sezioni[dest]]?.focus();
  };

  const nomi = sezioni.map((s) => SEZIONI[s].nome);
  const soloIcone = sezioni.length > 2;
  const nomePulsante = soloIcone
    ? `${nomi.slice(0, -1).join(', ')} e ${nomi[nomi.length - 1]}`
    : nomi.join(' · ');
  const corrente = aperta ?? ultima ?? sezioni[0];

  // Portal su <body>: un antenato con transform o filter farebbe da containing
  // block e il `position: fixed` non sarebbe più relativo allo schermo.
  if (!isBrowser) return null;
  return createPortal(
    <div data-colonna="">
      <button
        ref={pulsante}
        type="button"
        className={clsx(styles.flottante, soloIcone && styles.flottanteIcone)}
        aria-expanded={aperto}
        aria-controls={idPannello}
        aria-label={
          daVedere > 0
            ? `${nomePulsante}: ${etichettaDaVedere(daVedere)}`
            : soloIcone
              ? nomePulsante
              : undefined
        }
        onClick={apriDaPulsante}
      >
        {sezioni.map((s) => (
          <FontAwesomeIcon key={s} icon={SEZIONI[s].icona} />
        ))}
        {!soloIcone && nomePulsante}
        <Pallino n={daVedere} />
      </button>
      <div
        ref={pannello}
        id={idPannello}
        role="dialog"
        aria-modal="false"
        aria-labelledby={sezioni.length > 1 ? idSezioni : idTitolo}
        className={clsx(styles.sheet, aperto && styles.sheetAperto)}
      >
        <div className={styles.testata}>
          {sezioni.length > 1 ? (
            <div
              role="tablist"
              id={idSezioni}
              aria-label="Pannelli della lezione"
              className={clsx(styles.schede, styles.sezioni)}
              onKeyDown={onKeyDownSezioni}
            >
              {sezioni.map((s) => {
                const sel = s === aperta;
                return (
                  <button
                    key={s}
                    ref={(el) => {
                      linguette.current[s] = el;
                    }}
                    type="button"
                    role="tab"
                    aria-selected={sel}
                    tabIndex={sel ? 0 : -1}
                    className={clsx(styles.scheda, sel && styles.schedaAttiva)}
                    onClick={() => apri(s)}
                  >
                    <FontAwesomeIcon icon={SEZIONI[s].icona} />
                    {SEZIONI[s].nome}
                  </button>
                );
              })}
            </div>
          ) : (
            <span id={idTitolo} className={styles.titolo}>
              <FontAwesomeIcon
                icon={SEZIONI[sezioni[0]].icona}
                className={styles.icona}
              />
              {SEZIONI[sezioni[0]].nome}
            </span>
          )}
          <button
            type="button"
            className={styles.chiudi}
            aria-label={
              sezioni.length > 1
                ? 'Chiudi il pannello'
                : SEZIONI[sezioni[0]].chiudi
            }
            onClick={chiudi}
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
        <div className={styles.sheetCorpo}>
          {corrente === 'note' && note ? (
            <div data-note="" className={styles.sheetCorpo}>
              <NoteElenco pagina={note.pagina} />
            </div>
          ) : corrente === 'database' && database ? (
            <DatabaseContenuto db={database} />
          ) : (
            archivio && (
              <div data-archivio="" className={styles.sheetCorpo}>
                <ArchivioContenuto archivio={archivio} />
              </div>
            )
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
