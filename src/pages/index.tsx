import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Layout from '@theme/Layout';

import VolumeCard from '@site/src/components/VolumeCard';
import CodeWindow from '@site/src/components/CodeWindow';
import BentoFeatures from '@site/src/components/BentoFeatures';
import ChapterIndex from '@site/src/components/ChapterIndex';

import styles from './index.module.css';

function TerminalIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

const HERO_CODE = `# Il tuo primo programma
nome = input("Come ti chiami? ")
print(f"Ciao, {nome}!")
print("Benvenuto in Python.")`;

const HERO_OUTPUT = `Come ti chiami? Marco
Ciao, Marco!
Benvenuto in Python.`;

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  const logoUrl = useBaseUrl('/img/logo.svg');

  return (
    <Layout
      title={siteConfig.title}
      description="Un libro digitale open source su Python per gli indirizzi Informatica e Liceo Scienze Applicate."
    >
      <main className={styles.page}>
        <div className="at-stage-light" aria-hidden="true" />
        <div className="at-noise" aria-hidden="true" />

        {/* HERO */}
        <section className={styles.hero}>
          <div className="at-fade-up">
            <div className={styles.logoWrap}>
              <img
                src={logoUrl}
                alt="Rainbow Bits"
                className={styles.logo}
                width={132}
                height={132}
              />
            </div>
          </div>

          <h1
            className={`${styles.title} at-fade-up`}
            style={{ animationDelay: '0.15s' }}
          >
            <span className="at-grad-text">Python</span>
            <br />
            <span className={`${styles.titleSecondary} at-grad-blue`}>
              doesn't byte.
            </span>
          </h1>

          <p
            className={`${styles.tagline} at-fade-up`}
            style={{ animationDelay: '0.25s' }}
          >
            Scrivi. Esegui. Impara. Un libro digitale per chi sta iniziando,
            scritto per la scuola di oggi.
          </p>

          <div
            className={`${styles.volumes} at-fade-up`}
            style={{ animationDelay: '0.4s' }}
          >
            <VolumeCard
              to="/docs/category/fondamenti-di-python"
              kicker="Volume 1"
              title="Fondamenti di Programmazione"
              desc="Variabili, controllo di flusso, funzioni."
              icon={<TerminalIcon />}
              accent="blue"
            />
            <VolumeCard
              to="/docs/intro"
              kicker="Volume 2"
              title="Programmazione ad Oggetti"
              desc="Classi, ereditarietà, design pattern."
              icon={<BoxIcon />}
              accent="pink"
            />
          </div>
        </section>

        {/* CODE PREVIEW */}
        <section
          className={`${styles.codeSection} at-fade-up`}
          style={{ animationDelay: '0.6s' }}
        >
          <div className={styles.codeHeader}>Read &amp; Run</div>
          <CodeWindow code={HERO_CODE} output={HERO_OUTPUT} />
        </section>

        <BentoFeatures />
        <ChapterIndex />
      </main>
    </Layout>
  );
}
