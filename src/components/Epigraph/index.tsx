import type { ReactNode } from 'react';
import styles from './styles.module.css';

interface EpigraphProps {
  /** Attribuzione mostrata nel chip mono (es. "Grace Hopper"). */
  author?: ReactNode;
  /**
   * Testo della citazione. Accetta markdown/JSX: usa `**grassetto**` per
   * evidenziare la frase chiave (rendering in colore "strong").
   */
  children: ReactNode;
}

/**
 * Epigrafe — citazione d'apertura capitolo in stile "beam card":
 * bordo a fascio di luce animato, watermark a virgolette e attribuzione
 * come chip mono. Theme-aware tramite le variabili --at-* del tema
 * Atmospheric. Va inserita subito dopo l'`# H1` del capitolo.
 */
export default function Epigraph({ author, children }: EpigraphProps) {
  return (
    <figure className={styles.figure}>
      <div className={styles.inner}>
        <span className={styles.mark} aria-hidden="true">
          “
        </span>

        <blockquote className={styles.quote}>{children}</blockquote>

        {author && (
          <figcaption className={styles.author}>
            <svg
              className={styles.authorIcon}
              width="13"
              height="13"
              viewBox="0 0 512 512"
              aria-hidden="true"
            >
              <path
                opacity=".4"
                fill="currentColor"
                d="M3.8 445.8c-2.9 8.7-1.9 18.2 2.5 26L161.7 316.4c-1.1-4-1.6-8.1-1.6-12.4 0-26.5 21.5-48 48-48s48 21.5 48 48-21.5 48-48 48c-4.3 0-8.5-.6-12.4-1.6L40.3 505.7c7.8 4.4 17.2 5.4 26 2.5l264.3-88.6c19.7-6.6 35-22.4 41-42.3 15.9-53.1 31.8-106.2 47.8-159.3-41.8-41.8-83.5-83.5-125.3-125.3L134.7 140.6c-19.9 6-35.7 21.2-42.3 41L3.8 445.8z"
              />
              <path
                fill="currentColor"
                d="M368.5 18.3c21.9-21.9 57.3-21.9 79.2 0l46.1 46.1c21.9 21.9 21.9 57.3 0 79.2L419.2 218.1 294 92.8 368.5 18.3z"
              />
            </svg>
            {author}
          </figcaption>
        )}
      </div>
    </figure>
  );
}
