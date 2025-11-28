import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';

import ThemeImage from './ThemeImage';
import Section from './Section';
import SectionTitle from './SectionTitle';

import styles from './styles.module.css';

function Chapters() {
  return (
    <Section>
      <SectionTitle
        title="Cosa vuoi imparare oggi?"
        description={<>Ogni capitolo del libro, a portata di mano.</>}
      />
      <div className={styles.cardContainer}>
        <Link to="/docs/category/fondamenti-di-python" className={styles.card}>
          <ThemeImage
            lightSrc="/python-doesnt-byte/img/homepage/IDE.svg"
            darkSrc="/python-doesnt-byte/img/homepage/IDE.svg"
            className={styles.cardImage}
            alt="Icon of a terminal window with input and output"
          />
          <div className={styles.cardContent}>
            <Heading as="h4" className={styles.cardTitle}>
              Fondamenti di Python
            </Heading>
            <p className={styles.cardDescription}>
              Come installare e usare Python, cos&apos;è un IDE, come si scrive
              e si esegue un programma.
            </p>
          </div>
        </Link>
        <Link
          to="/docs/basi-del-linguaggio"
          className={styles.card}
        >
          <ThemeImage
            lightSrc="/python-doesnt-byte/img/homepage/input-output_dark.svg"
            darkSrc="/python-doesnt-byte/img/homepage/input-output_dark.svg"
            className={styles.cardImage}
            alt=""
          />
          <div className={styles.cardContent}>
            <Heading as="h4" className={styles.cardTitle}>
              Le basi del linguaggio
            </Heading>
            <p className={styles.cardDescription}>
              Input e output, le variabili, i tipi di dati, le operazioni
              aritmetiche e le espressioni.
            </p>
          </div>
        </Link>
      </div>
    </Section>
  );
}

export default Chapters;
