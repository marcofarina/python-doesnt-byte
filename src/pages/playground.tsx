import { useState } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import PyRunner from '@site/src/theme/PyRunner';
import { decodeCode } from '@site/src/theme/PyRunner/share';
import styles from './playground.module.css';

interface PlaygroundParams {
  src?: string;
  code?: string;
  title?: string;
  error?: string;
}

function parseParams(): PlaygroundParams {
  if (typeof window === 'undefined') return {};
  const q = new URLSearchParams(window.location.search);
  const src = q.get('src') ?? undefined;
  const rawCode = q.get('code');
  const title = q.get('title') ?? undefined;
  try {
    return {
      src,
      code: rawCode ? decodeCode(rawCode) : undefined,
      title,
    };
  } catch {
    return { error: 'Parametri non validi nella URL.' };
  }
}

function PlaygroundInner() {
  // Lazy init: parseParams legge window.location, sicuro qui perché siamo
  // sotto BrowserOnly.
  const [params] = useState<PlaygroundParams>(() => parseParams());

  if (params.error) {
    return <div className={styles.empty}>{params.error}</div>;
  }

  const hasContent = params.src || typeof params.code === 'string';
  if (!hasContent) {
    return (
      <div className={styles.empty}>
        <Heading as="h2">Playground vuoto</Heading>
        <p>
          Apri questa pagina dal bottone <em>Apri a tutto schermo</em> di un
          PyRunner per modificarne il codice qui.
        </p>
      </div>
    );
  }

  // `?src=` punta a un file `.py` whitelisted nel repo (build-time).
  // `?code=` può venire da qualunque link condiviso → potenzialmente non
  // fidato: avvisiamo l'utente prima di lasciarlo eseguire.
  const fromUntrustedUrl = !params.src && typeof params.code === 'string';

  return (
    <>
      {fromUntrustedUrl && (
        <div
          className={styles.untrustedBanner}
          role="alert"
          aria-live="polite"
        >
          <span className={styles.untrustedBannerIcon} aria-hidden="true">
            ⚠️
          </span>
          <div className={styles.untrustedBannerBody}>
            <strong>Codice da un link esterno</strong>
            Questo codice arriva da un URL e non dal manuale. Leggilo prima
            di premere <em>Esegui</em>: gira nel tuo browser e può fare
            tutto quello che il codice Python può fare in una pagina web.
          </div>
        </div>
      )}
      <div className={styles.host}>
        <PyRunner
          src={params.src}
          code={params.code}
          title={params.title}
          embedded
        />
      </div>
    </>
  );
}

export default function Playground(): JSX.Element {
  return (
    <Layout
      title="Playground Python"
      description="Editor Python a tutto schermo per provare il codice del manuale."
      noFooter
    >
      <main className={styles.page}>
        <BrowserOnly
          fallback={<div className={styles.empty}>Caricamento…</div>}
        >
          {() => <PlaygroundInner />}
        </BrowserOnly>
      </main>
    </Layout>
  );
}
