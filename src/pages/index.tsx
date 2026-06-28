import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import VolumeCard from '@site/src/components/VolumeCard';
import BentoFeatures from '@site/src/components/BentoFeatures';
import ChapterIndex from '@site/src/components/ChapterIndex';
import {
  BracketsCurlyIcon,
  CompassDraftingIcon,
  DatabaseIcon,
  BookOpenCoverIcon,
} from '@site/src/components/VolumeIcons';

import styles from './index.module.css';

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

          <Heading
            as="h1"
            className={`${styles.title} at-fade-up`}
            style={{ animationDelay: '0.15s' }}
          >
            <span className="at-grad-text">Python</span>
            <br />
            <span className={`${styles.titleSecondary} at-grad-blue`}>
              doesn’t byte.
            </span>
          </Heading>

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
              to="/programmatore/"
              kicker="Volume 1"
              title="Manuale del Programmatore"
              desc="Fondamenti del linguaggio: dati, controllo di flusso, funzioni."
              icon={<BracketsCurlyIcon />}
              accent="blue"
            />
            <VolumeCard
              to="/artefice/"
              kicker="Volume 2"
              title="Manuale dell’Artefice"
              desc="Programmazione ad oggetti: classi, ereditarietà, design pattern."
              icon={<CompassDraftingIcon />}
              accent="pink"
            />
            <VolumeCard
              to="/archivista/"
              kicker="Volume 3"
              title="Manuale dell’Archivista"
              desc="Dati e persistenza: file, SQLite, ORM, integrazione."
              icon={<DatabaseIcon />}
              accent="amber"
            />
            <VolumeCard
              to="/apprendista/"
              kicker="Volume 4"
              title="Biblioteca dell’Apprendista"
              desc="Esercizi, sfide e progetti di laboratorio."
              icon={<BookOpenCoverIcon />}
              accent="green"
            />
          </div>

          <p
            className={`${styles.whyPython} at-fade-up`}
            style={{ animationDelay: '0.55s' }}
          >
            Lento? Da principianti? Poco serio? I pregiudizi su Python sono più
            miti che realtà.{' '}
            <Link to="/perche-python" className={styles.whyPythonLink}>
              Perché Python? →
            </Link>
          </p>
        </section>

        <BentoFeatures />
        <ChapterIndex />
      </main>
    </Layout>
  );
}
