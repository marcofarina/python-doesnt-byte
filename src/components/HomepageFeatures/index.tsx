import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: JSX.Element;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Facile da usare',
    Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
    description: (
      <>
        Python Doesn't Byte è progettato per essere facile da usare. Basato su Docusaurus, un framework React open source, è consultabile online da qualsiasi dispositivo e in qualsiasi momento.
      </>
    ),
  },
  {
    title: 'Concentrati sulle cose importanti',
    Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
    description: (
      <>
        Python Doesn't Byte è un libro pensato per essere un riferimento per tutti gli studenti delle scuole superiori che voglio imparare Python, senza i fronzoli di un libro di testo tradizionale.
      </>
    ),
  },
  {
    title: 'Come un libro dovrebbe essere',
    Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    description: (
      <>
        I libri di testo cartacei non sono adatti all'insegnamento della programmazione nell'era digitale. Python Doesn't Byte è un libro digitale, con esempi interattivi e codice eseguibile.
      </>
    ),
  },
];

function Feature({title, Svg, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
