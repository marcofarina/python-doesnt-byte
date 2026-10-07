/**
 * Archivio — i file del volume a portata di mano mentre si legge la lezione
 * (piano pm/piano-2026-10-archivio.md, fase A2).
 *
 * Una lezione dichiara i file nel frontmatter (`archivio: [punti.json, …]`);
 * il testo arriva dal plugin plugins/archivio/ (fonte unica static/archivio/),
 * cioè i file come sono sul disco, non le modifiche fatte dai runner.
 *
 * - Desktop: <ArchivioRail> sta nella colonna dell'indice. Il pulsante
 *   «Archivio» resta in testa; aperto, il pannello prende il posto dell'indice.
 * - Telefono: <ArchivioSheet>, pulsante flottante e pannello che sale dal basso
 *   fino a metà schermo.
 *
 * Lo stato (aperto, file scelto) vive in useArchivio(), chiamato dal Layout
 * del DocItem perché anche la larghezza delle colonne dipende da «aperto».
 * Aperto o chiuso si ricorda fra le pagine in sessionStorage.
 */
import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import CodeBlock from '@theme/CodeBlock';
import Link from '@docusaurus/Link';
import useIsBrowser from '@docusaurus/useIsBrowser';
import { usePluginData } from '@docusaurus/useGlobalData';
import { useDoc } from '@docusaurus/plugin-content-docs/client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowUpRightFromSquare,
  faBoxArchive,
  faChevronDown,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';

import { useMemoria } from '@site/src/lib/memoria';

import styles from './styles.module.css';

interface ArchivioPluginData {
  file: Record<string, string>;
}

export interface Archivio {
  /** I file dichiarati dalla lezione, nell'ordine del frontmatter. */
  files: string[];
  testi: Record<string, string>;
  aperto: boolean;
  attivo: string;
  imposta: (aperto: boolean) => void;
  scegli: (nome: string) => void;
}

const CHIAVE_APERTO = 'pdb.archivio.aperto';
const CHIAVE_FILE = 'pdb.archivio.file';

/** Stato dell'archivio della pagina; `null` se la lezione non ne dichiara. */
export function useArchivio(): Archivio | null {
  const { frontMatter } = useDoc();
  const { file: testi } = usePluginData('archivio') as ArchivioPluginData;
  const dichiarati = (frontMatter as { archivio?: unknown }).archivio;
  // I nomi sbagliati li ferma già la build (plugins/archivio/): qui il filtro
  // evita solo di rompere la pagina in sviluppo, mentre il file si sta scrivendo.
  const files = useMemo(
    () =>
      Array.isArray(dichiarati)
        ? dichiarati.filter(
            (n): n is string => typeof n === 'string' && n in testi,
          )
        : [],
    [dichiarati, testi],
  );

  // Sul server e durante l'hydration: chiuso, nessun file scelto. Il valore
  // ricordato arriva subito dopo (useMemoria).
  const [apertoRicordato, ricordaAperto] = useMemoria('session', CHIAVE_APERTO);
  const [scelto, scegli] = useMemoria('session', CHIAVE_FILE);
  const aperto = apertoRicordato === '1';
  const imposta = useCallback(
    (v: boolean) => ricordaAperto(v ? '1' : '0'),
    [ricordaAperto],
  );

  if (files.length === 0) return null;
  const attivo = scelto !== null && files.includes(scelto) ? scelto : files[0];
  return { files, testi, aperto, attivo, imposta, scegli };
}

/* ─────────────── Contenuto comune: schede, file, link alla LIM ─────────────── */

function Contenuto({ archivio }: { archivio: Archivio }): ReactNode {
  const { files, testi, attivo, scegli } = archivio;
  const base = useId();
  const idScheda = (n: string) => `${base}-scheda-${files.indexOf(n)}`;
  const idFile = `${base}-file`;
  const schede = useRef<Record<string, HTMLButtonElement | null>>({});

  // Frecce, Home e Fine fra le schede, come nel pattern ARIA delle tab.
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = files.indexOf(attivo);
    const dest =
      e.key === 'ArrowRight'
        ? (i + 1) % files.length
        : e.key === 'ArrowLeft'
          ? (i - 1 + files.length) % files.length
          : e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? files.length - 1
              : -1;
    if (dest < 0) return;
    e.preventDefault();
    scegli(files[dest]);
    schede.current[files[dest]]?.focus();
  };

  return (
    <>
      <div
        role="tablist"
        aria-label="File dell'archivio"
        className={styles.schede}
        onKeyDown={onKeyDown}
      >
        {files.map((n) => {
          const sel = n === attivo;
          return (
            <button
              key={n}
              ref={(el) => {
                schede.current[n] = el;
              }}
              type="button"
              role="tab"
              id={idScheda(n)}
              aria-selected={sel}
              aria-controls={idFile}
              tabIndex={sel ? 0 : -1}
              className={clsx(styles.scheda, sel && styles.schedaAttiva)}
              onClick={() => scegli(n)}
            >
              {n}
            </button>
          );
        })}
      </div>
      <div
        role="tabpanel"
        id={idFile}
        aria-labelledby={idScheda(attivo)}
        // Niente tabIndex qui: il <pre> di CodeBlock è già focalizzabile, e col
        // focus lì le frecce scorrono questo contenitore.
        className={styles.file}
      >
        <CodeBlock language="json">{testi[attivo].trimEnd()}</CodeBlock>
      </div>
      <Link
        className={styles.lim}
        to={`/archivio?file=${encodeURIComponent(attivo)}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
        Apri in una nuova scheda
      </Link>
    </>
  );
}

/* ─────────────── Desktop: colonna dell'indice ─────────────── */

interface ArchivioRailProps {
  archivio: Archivio;
  /** L'indice della pagina, mostrato sotto il pulsante quando l'archivio è chiuso. */
  toc?: ReactNode;
}

export function ArchivioRail({ archivio, toc }: ArchivioRailProps): ReactNode {
  const { files, aperto, imposta } = archivio;
  const idPannello = useId();
  const pulsante = useRef<HTMLButtonElement>(null);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Escape' || !aperto) return;
    e.stopPropagation();
    imposta(false);
    pulsante.current?.focus();
  };

  return (
    <div
      data-archivio=""
      className={clsx(styles.rail, aperto && styles.railAperto)}
      onKeyDown={onKeyDown}
    >
      <button
        ref={pulsante}
        type="button"
        className={styles.interruttore}
        aria-expanded={aperto}
        aria-controls={idPannello}
        onClick={() => imposta(!aperto)}
      >
        <FontAwesomeIcon icon={faBoxArchive} className={styles.icona} />
        <span className={styles.etichetta}>Archivio</span>
        <span className={styles.conta}>
          {files.length === 1 ? '1 file' : `${files.length} file`}
        </span>
        <FontAwesomeIcon icon={faChevronDown} className={styles.freccia} />
      </button>
      {aperto ? (
        <section
          id={idPannello}
          aria-label="Archivio"
          className={styles.pannello}
        >
          <Contenuto archivio={archivio} />
        </section>
      ) : (
        <div className={styles.indice}>{toc}</div>
      )}
    </div>
  );
}

/* ─────────────── Telefono: pulsante flottante e pannello dal basso ─────────────── */

export function ArchivioSheet({ archivio }: { archivio: Archivio }): ReactNode {
  const { aperto, imposta } = archivio;
  const idPannello = useId();
  const idTitolo = useId();
  const pulsante = useRef<HTMLButtonElement>(null);
  const pannello = useRef<HTMLDivElement>(null);
  // Il focus si sposta solo se a aprire o chiudere è stato l'utente, non
  // quando il pannello si riapre da solo alla pagina successiva.
  const daUtente = useRef(false);
  const isBrowser = useIsBrowser();

  const chiudi = useCallback(() => {
    daUtente.current = true;
    imposta(false);
  }, [imposta]);

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

  // Portal su <body>: un antenato con transform o filter farebbe da containing
  // block e il `position: fixed` non sarebbe più relativo allo schermo.
  if (!isBrowser) return null;
  return createPortal(
    <div data-archivio="">
      <button
        ref={pulsante}
        type="button"
        className={styles.flottante}
        aria-expanded={aperto}
        aria-controls={idPannello}
        onClick={() => {
          daUtente.current = true;
          imposta(!aperto);
        }}
      >
        <FontAwesomeIcon icon={faBoxArchive} />
        Archivio
      </button>
      <div
        ref={pannello}
        id={idPannello}
        role="dialog"
        aria-modal="false"
        aria-labelledby={idTitolo}
        className={clsx(styles.sheet, aperto && styles.sheetAperto)}
      >
        <div className={styles.testata}>
          <span id={idTitolo} className={styles.titolo}>
            <FontAwesomeIcon icon={faBoxArchive} className={styles.icona} />
            Archivio
          </span>
          <button
            type="button"
            className={styles.chiudi}
            aria-label="Chiudi l'archivio"
            onClick={chiudi}
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
        <Contenuto archivio={archivio} />
      </div>
    </div>,
    document.body,
  );
}
