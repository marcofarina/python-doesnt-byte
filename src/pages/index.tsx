import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import Logo from '@site/src/components/Hero/PDBLogo';
import GridBackground from '@site/src/components/Hero/GridBackground';
import Chapters from '@site/src/components/Chapters';

import styles from './index.module.css';

function HomepageHeader() {
    const {siteConfig} = useDocusaurusContext();
    return (
        <header className={clsx('hero hero--primary', styles.heroBanner)}>
            <div className={styles.backgroundContainer}>
                <div className={styles.gridBackground}>
                    <GridBackground/>
                </div>
            </div>
            <div className={clsx('container', styles.container)}>
                <div className={styles.content}>
                    <Logo/>
                    <Heading as="h1" className="hero__title">
                        {siteConfig.title}
                    </Heading>
                    <Heading as="h2" className="hero__subtitle">{siteConfig.tagline}</Heading>
                    <div className={styles.buttons}>
                        <Link
                            className="button button--secondary button--lg"
                            to="/docs/intro">
                            Inizia ora 🚀
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    );
}

export default function Home(): JSX.Element {
    const {siteConfig} = useDocusaurusContext();
    return (
        <Layout
            title={`${siteConfig.title}`}
            description="Un libro digitale open source su Python per gli indirizzi Informatica e Liceo Scienze Applicate per la scuola secondaria di secondo grado">
            <HomepageHeader/>
            <main>
                <Chapters/>
            </main>
        </Layout>
    );
}
