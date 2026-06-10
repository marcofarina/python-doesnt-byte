/**
 * Swizzle Navbar/Logo — title two-tone ispirato al design Atmospheric:
 *   "Python" in colore fg-strong + "doesn't byte" in muted italic.
 * Lascia il link e l'immagine del logo come da configurazione standard.
 */
import React, { type ReactNode } from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import { useThemeConfig } from '@docusaurus/theme-common';
import ThemedImage from '@theme/ThemedImage';

import styles from './styles.module.css';

export default function NavbarLogo(): ReactNode {
  const {
    navbar: { logo },
  } = useThemeConfig();
  const logoLink = useBaseUrl(logo?.href ?? '/');
  const logoSrc = useBaseUrl(logo?.src);
  const logoDarkSrc = useBaseUrl(logo?.srcDark ?? logo?.src);

  return (
    <Link to={logoLink} className="navbar__brand">
      {logo && (
        <div className="navbar__logo">
          <ThemedImage
            sources={{ light: logoSrc, dark: logoDarkSrc }}
            alt={logo.alt ?? ''}
            height={logo.height}
            width={logo.width}
          />
        </div>
      )}
      <b className={`navbar__title text--truncate ${styles.title}`}>
        <span className={styles.brand}>Python</span>{' '}
        <span className={styles.tagline}>doesn’t byte</span>
      </b>
    </Link>
  );
}
