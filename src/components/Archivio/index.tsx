/**
 * Archivio — i file del volume a portata di mano mentre si legge la lezione
 * (piano pm/piano-2026-10-archivio.md, fase A2).
 *
 * Una lezione dichiara i file nel frontmatter (`archivio: [punti.json, …]`);
 * il testo arriva dal plugin plugins/archivio/ (fonte unica static/archivio/),
 * cioè i file come sono sul disco, non le modifiche fatte dai runner.
 *
 * Qui stanno i dati (useArchivio: file dichiarati, file scelto) e il contenuto
 * del pannello (<ArchivioContenuto>). Pulsante, pannello nella colonna destra
 * e pannello dal basso su telefono sono di src/components/Colonna/, che tiene
 * insieme Archivio e Database e ricorda quale dei due è aperto.
 */
import React, {
  useId,
  useMemo,
  useRef,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import clsx from 'clsx';
import CodeBlock from '@theme/CodeBlock';
import Link from '@docusaurus/Link';
import { usePluginData } from '@docusaurus/useGlobalData';
import { useDoc } from '@docusaurus/plugin-content-docs/client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';

import { useMemoria } from '@site/src/lib/memoria';
import colonna from '@site/src/components/Colonna/styles.module.css';

import styles from './styles.module.css';

interface ArchivioPluginData {
  file: Record<string, string>;
}

export interface Archivio {
  /** I file dichiarati dalla lezione, nell'ordine del frontmatter. */
  files: string[];
  testi: Record<string, string>;
  attivo: string;
  scegli: (nome: string) => void;
}

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

  // Sul server e durante l'hydration nessun file scelto: il valore ricordato
  // arriva subito dopo (useMemoria).
  const [scelto, scegli] = useMemoria('session', CHIAVE_FILE);

  if (files.length === 0) return null;
  const attivo = scelto !== null && files.includes(scelto) ? scelto : files[0];
  return { files, testi, attivo, scegli };
}

/* ─────────────── Contenuto del pannello: schede, file, link alla LIM ─────────────── */

export function ArchivioContenuto({
  archivio,
}: {
  archivio: Archivio;
}): ReactNode {
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
        className={colonna.schede}
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
              className={clsx(colonna.scheda, sel && colonna.schedaAttiva)}
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
