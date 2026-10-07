/**
 * /archivio?file=punti.json — un file dell'archivio a tutto schermo, da
 * proiettare alla LIM (piano pm/piano-2026-10-archivio.md, fase A2). Ci si
 * arriva dal link «Apri in una nuova scheda» del pannello Archivio.
 *
 * Senza `?file=` mostra l'elenco dei file; con un nome sconosciuto lo dice e
 * rimanda all'elenco. Il testo si ingrandisce con A− / A+ (o con i tasti - e +)
 * e la dimensione scelta resta in localStorage per questo browser.
 */
import React, { useCallback, useEffect, type ReactNode } from 'react';
import Head from '@docusaurus/Head';
import Link from '@docusaurus/Link';
import useIsBrowser from '@docusaurus/useIsBrowser';
import { useLocation } from '@docusaurus/router';
import { usePluginData } from '@docusaurus/useGlobalData';
import Layout from '@theme/Layout';
import CodeBlock from '@theme/CodeBlock';
import Heading from '@theme/Heading';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBoxArchive } from '@fortawesome/free-solid-svg-icons';

import { useMemoria } from '@site/src/lib/memoria';

import styles from './archivio.module.css';

interface ArchivioPluginData {
  file: Record<string, string>;
}

/** Dimensioni del testo in px: si parte da una che si legge dal fondo dell'aula. */
const DIMENSIONI = [16, 20, 24, 28, 32, 40, 48, 56];
const DIMENSIONE_INIZIALE = 3;
const CHIAVE_DIMENSIONE = 'pdb.archivio.lim.dimensione';

function useDimensione(): [number, (passo: number) => void] {
  const [ricordato, ricorda] = useMemoria('local', CHIAVE_DIMENSIONE);
  // Senza valore ricordato (o con uno fuori scala) vale la dimensione iniziale.
  const n = ricordato === null ? NaN : Number(ricordato);
  const indice =
    Number.isInteger(n) && n >= 0 && n < DIMENSIONI.length
      ? n
      : DIMENSIONE_INIZIALE;
  const cambia = useCallback(
    (passo: number) => {
      const nuovo = Math.min(
        DIMENSIONI.length - 1,
        Math.max(0, indice + passo),
      );
      ricorda(String(nuovo));
    },
    [indice, ricorda],
  );
  return [indice, cambia];
}

function Elenco({ nomi }: { nomi: string[] }): ReactNode {
  return (
    <>
      <Heading as="h1" className={styles.titolo}>
        <FontAwesomeIcon icon={faBoxArchive} className={styles.icona} />
        Archivio
      </Heading>
      <p className={styles.testo}>
        I file che le lezioni usano come dati. Scegline uno per vederlo a tutto
        schermo.
      </p>
      <ul className={styles.elenco}>
        {nomi.map((n) => (
          <li key={n}>
            <Link to={`/archivio?file=${encodeURIComponent(n)}`}>{n}</Link>
          </li>
        ))}
      </ul>
    </>
  );
}

function Vista({ nome, testo }: { nome: string; testo: string }): ReactNode {
  const [indice, cambia] = useDimensione();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === '+' || e.key === '=') cambia(1);
      else if (e.key === '-') cambia(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cambia]);

  return (
    <>
      <div className={styles.barra}>
        <Heading as="h1" className={styles.titolo}>
          <FontAwesomeIcon icon={faBoxArchive} className={styles.icona} />
          {nome}
        </Heading>
        <div
          className={styles.controlli}
          role="group"
          aria-label="Dimensione del testo"
        >
          <button
            type="button"
            className={styles.controllo}
            onClick={() => cambia(-1)}
            disabled={indice === 0}
            aria-label="Rimpicciolisci il testo"
          >
            A−
          </button>
          <span className={styles.misura} aria-live="polite">
            {DIMENSIONI[indice]} px
          </span>
          <button
            type="button"
            className={styles.controllo}
            onClick={() => cambia(1)}
            disabled={indice === DIMENSIONI.length - 1}
            aria-label="Ingrandisci il testo"
          >
            A+
          </button>
        </div>
      </div>
      <div
        className={styles.file}
        style={
          {
            '--ifm-code-font-size': `${DIMENSIONI[indice]}px`,
          } as React.CSSProperties
        }
      >
        <CodeBlock language="json">{testo.trimEnd()}</CodeBlock>
      </div>
      <Link className={styles.tutti} to="/archivio">
        Tutti i file dell’archivio
      </Link>
    </>
  );
}

export default function PaginaArchivio(): ReactNode {
  const { file } = usePluginData('archivio') as ArchivioPluginData;
  const { search } = useLocation();
  // La pagina è generata senza query string: `?file=` si legge solo dopo
  // l'hydration, altrimenti il markup del server e quello del client
  // divergerebbero.
  const isBrowser = useIsBrowser();
  const nome = isBrowser ? new URLSearchParams(search).get('file') : null;

  let contenuto: ReactNode = null;
  if (isBrowser) {
    if (nome === null) {
      contenuto = <Elenco nomi={Object.keys(file)} />;
    } else if (nome in file) {
      contenuto = <Vista nome={nome} testo={file[nome]} />;
    } else {
      contenuto = (
        <>
          <Heading as="h1" className={styles.titolo}>
            File non trovato
          </Heading>
          <p className={styles.testo}>
            Nell’archivio non c’è nessun file chiamato «{nome}».
          </p>
          <Link className={styles.tutti} to="/archivio">
            Vedi l’elenco dei file
          </Link>
        </>
      );
    }
  }

  return (
    <Layout
      title={nome && nome in file ? `${nome} · Archivio` : 'Archivio'}
      description="I file dell'archivio dei volumi, da proiettare alla LIM."
      noFooter
    >
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <main className={styles.pagina}>{contenuto}</main>
    </Layout>
  );
}
