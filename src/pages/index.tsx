import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Layout from '@theme/Layout';

import VolumeCard from '@site/src/components/VolumeCard';
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

function DatabaseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v6c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      <path d="M3 11v6c0 1.66 4 3 9 3s9-1.34 9-3v-6" />
    </svg>
  );
}

function FlaskIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 3h6" />
      <path d="M10 3v6L4.5 18.5A2 2 0 0 0 6.3 21.5h11.4a2 2 0 0 0 1.8-3L14 9V3" />
      <path d="M7 14h10" />
    </svg>
  );
}

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
              to="/programmatore"
              kicker="Volume 1"
              title="Manuale del Programmatore"
              desc="Fondamenti del linguaggio: dati, controllo di flusso, funzioni."
              icon={<TerminalIcon />}
              accent="blue"
            />
            <VolumeCard
              to="/artefice"
              kicker="Volume 2"
              title="Manuale dell'Artefice"
              desc="Programmazione ad oggetti: classi, ereditarietà, design pattern."
              icon={<BoxIcon />}
              accent="pink"
            />
            <VolumeCard
              to="/archivista"
              kicker="Volume 3"
              title="Manuale dell'Archivista"
              desc="Dati e persistenza: file, SQLite, ORM, integrazione."
              icon={<DatabaseIcon />}
              accent="amber"
            />
            <VolumeCard
              to="/apprendista"
              kicker="Volume 4"
              title="Biblioteca dell'Apprendista"
              desc="Esercizi, sfide e progetti di laboratorio."
              icon={<FlaskIcon />}
              accent="green"
            />
          </div>
        </section>

        <BentoFeatures />
        <ChapterIndex />
      </main>
    </Layout>
  );
}
