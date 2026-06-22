import clsx from 'clsx';
import Link from '@docusaurus/Link';
import { PageMetadata } from '@docusaurus/theme-common';
import type { Props } from '@theme/NotFound/Content';

import styles from './styles.module.css';

// Morte Nera — game-icons.net (CC BY 3.0). Inline come componente così possiamo
// colorarla con currentColor e scalarla in em rispetto alle cifre del 404.
function DeathStar() {
  return (
    <svg
      className={styles.star}
      viewBox="0 0 512 512"
      role="img"
      aria-label="Morte Nera"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M256 32C135.1 32 36.06 127.9 32.12 248.7c136.18 13.8 311.58 13.8 447.78 0-.3-10.6-1.4-21.2-3.3-31.7H352v-18h32v-16h32v-16h45.6c-4.5-10.4-9.8-20.4-15.8-30H368v-18h48v-14h-18.7V89H368V73h-48V55h34.9c-30.8-15.14-64.6-23-98.9-23zm-64.3 64h.3c35.3 0 64 28.7 64 64s-28.7 64-64 64-64-28.7-64-64c0-35.2 28.5-63.83 63.7-64zM32.26 266.7C37.97 386.1 136.4 480 256 480c10.6-1.4 16 0 43.8-7v-18h59c8.1-4.2 16-8.9 23.5-14H368v-16h-32v-18h85.4c8.5-9.3 16.3-19.4 23.1-30H432v-16h-80v-18h16v-16h48v-16h32v-16h28.5c1.7-9.4 2.7-18.8 3.2-28.3-136.8 13.7-310.6 13.7-447.44 0z"
      />
    </svg>
  );
}

export default function NotFoundContent({ className }: Props): JSX.Element {
  return (
    <>
      <PageMetadata title="404 — Pagina non trovata" />
      <main className={clsx(styles.page, className)}>
        <div className="at-stage-light" aria-hidden="true" />
        <div className="at-noise" aria-hidden="true" />

        <section className={`${styles.hero} at-fade-up`}>
          <div
            className={styles.code}
            role="img"
            aria-label="Errore 404: pagina non trovata"
          >
            <span className={`${styles.digit} at-grad-text`} aria-hidden="true">
              4
            </span>
            <span className={styles.starWrap} aria-hidden="true">
              <DeathStar />
            </span>
            <span className={`${styles.digit} at-grad-text`} aria-hidden="true">
              4
            </span>
          </div>

          <p className={styles.quote}>
            &ldquo;Great shot, kid. That was one in a million.&rdquo;
          </p>
          <p className={styles.subtitle}>
            Questa pagina è esplosa come la Morte Nera: di lei non resta che
            polvere stellare. Niente panico, ti rimettiamo su una rotta sicura.
          </p>

          <Link to="/" className={styles.cta}>
            Let&rsquo;s get you home
          </Link>
        </section>
      </main>
    </>
  );
}
