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
  explainPrompt?: string;
  error?: string;
}

function parseParams(): PlaygroundParams {
  if (typeof window === 'undefined') return {};
  const q = new URLSearchParams(window.location.search);
  const src = q.get('src') ?? undefined;
  const rawCode = q.get('code');
  const rawPrompt = q.get('p');
  const title = q.get('title') ?? undefined;
  try {
    return {
      src,
      code: rawCode ? decodeCode(rawCode) : undefined,
      explainPrompt: rawPrompt ? decodeCode(rawPrompt) : undefined,
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

  return (
    <div className={styles.host}>
      <PyRunner
        src={params.src}
        code={params.code}
        title={params.title}
        explainPrompt={params.explainPrompt}
        embedded
      />
    </div>
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
