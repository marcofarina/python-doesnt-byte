/**
 * Colonna — la colonna destra delle lezioni del Volume 3, con i pannelli
 * «Archivio» (pm/piano-2026-10-archivio.md) e «Database»
 * (pm/piano-2026-10-pannello-database.md).
 *
 * La colonna compare se la lezione dichiara `archivio:`, `database:` o
 * entrambi. Si apre un pannello alla volta; chiusi entrambi torna l'indice.
 *
 * - Desktop: <ColonnaRail> sta nella colonna dell'indice. I pulsanti restano
 *   in testa, «Archivio» sopra e «Database» sotto; il pannello aperto prende
 *   il posto dell'indice.
 * - Telefono: <ColonnaSheet>, pulsante flottante e pannello che sale dal basso
 *   fino a metà schermo, con una scheda per pannello se sono due.
 *
 * Lo stato vive in useColonna(), chiamato dal Layout del DocItem perché anche
 * la larghezza delle colonne dipende dal pannello aperto. Il pannello aperto si
 * ricorda fra le pagine in sessionStorage.
 */
import React, {
  useCallback,
  useEffect,
  useId,
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
  faXmark,
} from '@fortawesome/free-solid-svg-icons';

import { useMemoria } from '@site/src/lib/memoria';
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

export type Sezione = 'archivio' | 'database';

export interface Colonna {
  archivio: Archivio | null;
  database: DatabasePagina | null;
  /** Il pannello aperto, null se è chiuso (si vede l'indice). */
  aperta: Sezione | null;
  apri: (sezione: Sezione | null) => void;
}

const CHIAVE_APERTA = 'pdb.colonna.aperta';
// Prima del pannello Database l'archivio si ricordava così: letta finché la
// chiave nuova non esiste, chi aveva l'archivio aperto lo ritrova aperto.
const CHIAVE_ARCHIVIO_VECCHIA = 'pdb.archivio.aperto';

/** Stato della colonna della pagina; `null` se la lezione non ha pannelli. */
export function useColonna(): Colonna | null {
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
        : null;

  const database = useDatabasePagina(datasetKey, aperta === 'database');
  const apri = useCallback(
    (sezione: Sezione | null) => ricorda(sezione ?? ''),
    [ricorda],
  );

  if (archivio === null && database === null) return null;
  return { archivio, database, aperta, apri };
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
  const { archivio, database, aperta, apri } = colonna;
  const idPannello = useId();
  const pulsanti = useRef<Record<Sezione, HTMLButtonElement | null>>({
    archivio: null,
    database: null,
  });

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
    <div
      data-colonna=""
      className={clsx(styles.rail, aperta !== null && styles.railAperto)}
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
      ) : (
        <div className={styles.indice}>{toc}</div>
      )}
    </div>
  );
}

/* ─────────────── Telefono: pulsante flottante e pannello dal basso ─────────────── */

const SEZIONI: Record<Sezione, { icona: typeof faBoxArchive; nome: string }> = {
  archivio: { icona: faBoxArchive, nome: 'Archivio' },
  database: { icona: faDatabase, nome: 'Database' },
};

export function ColonnaSheet({ colonna }: { colonna: Colonna }): ReactNode {
  const { archivio, database, aperta, apri } = colonna;
  const sezioni: Sezione[] = [
    ...(archivio ? (['archivio'] as const) : []),
    ...(database ? (['database'] as const) : []),
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

  const nomePulsante = sezioni.map((s) => SEZIONI[s].nome).join(' · ');

  // Portal su <body>: un antenato con transform o filter farebbe da containing
  // block e il `position: fixed` non sarebbe più relativo allo schermo.
  if (!isBrowser) return null;
  return createPortal(
    <div data-colonna="">
      <button
        ref={pulsante}
        type="button"
        className={styles.flottante}
        aria-expanded={aperto}
        aria-controls={idPannello}
        aria-label={
          daVedere > 0
            ? `${nomePulsante}: ${etichettaDaVedere(daVedere)}`
            : undefined
        }
        onClick={apriDaPulsante}
      >
        {sezioni.map((s) => (
          <FontAwesomeIcon key={s} icon={SEZIONI[s].icona} />
        ))}
        {nomePulsante}
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
              aria-label="Archivio e database"
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
                : `Chiudi ${sezioni[0] === 'archivio' ? "l'archivio" : 'il database'}`
            }
            onClick={chiudi}
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
        <div className={styles.sheetCorpo}>
          {(aperta ?? ultima ?? sezioni[0]) === 'database' && database ? (
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
