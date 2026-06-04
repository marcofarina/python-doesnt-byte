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
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20 12a8 8 0 1 0-3.5 6.6L20 20z" />
            </svg>
            {author}
          </figcaption>
        )}
      </div>
    </figure>
  );
}
