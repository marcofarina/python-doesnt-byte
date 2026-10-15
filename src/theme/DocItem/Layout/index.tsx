/**
 * Swizzle EJECT di @theme/DocItem/Layout (theme-classic 3.10.1).
 *
 * Copia dell'originale più la colonna destra con i pannelli «Archivio» (piano
 * pm/piano-2026-10-archivio.md, fase A2) e «Database» (piano
 * pm/piano-2026-10-pannello-database.md, fase T2), in src/components/Colonna/.
 * Le aggiunte sono marcate «Colonna».
 *
 * Eject e non wrap: i pannelli devono stare DENTRO la colonna dell'indice, che
 * questo componente costruisce; la colonna deve esserci anche nelle pagine
 * senza indice; e con un pannello aperto la colonna si allarga a spese del
 * testo. Un wrapper vede solo il Layout dall'esterno e non può fare nessuna
 * delle tre. Questo è l'unico punto che decide la larghezza delle colonne.
 *
 * Agli upgrade di Docusaurus: riconfrontare con
 * node_modules/@docusaurus/theme-classic/src/theme/DocItem/Layout/index.tsx.
 */
import React, { type ReactNode } from 'react';
import clsx from 'clsx';
import { useWindowSize } from '@docusaurus/theme-common';
import { useDoc } from '@docusaurus/plugin-content-docs/client';
import DocItemPaginator from '@theme/DocItem/Paginator';
import DocVersionBanner from '@theme/DocVersionBanner';
import DocVersionBadge from '@theme/DocVersionBadge';
import DocItemFooter from '@theme/DocItem/Footer';
import DocItemTOCMobile from '@theme/DocItem/TOC/Mobile';
import DocItemTOCDesktop from '@theme/DocItem/TOC/Desktop';
import DocItemContent from '@theme/DocItem/Content';
import DocBreadcrumbs from '@theme/DocBreadcrumbs';
import ContentVisibility from '@theme/ContentVisibility';
import type { Props } from '@theme/DocItem/Layout';

import {
  ColonnaRail,
  ColonnaSheet,
  useColonna,
} from '@site/src/components/Colonna';

import styles from './styles.module.css';

/**
 * Decide if the toc should be rendered, on mobile or desktop viewports
 */
function useDocTOC() {
  const { frontMatter, toc } = useDoc();
  const windowSize = useWindowSize();

  const hidden = frontMatter.hide_table_of_contents;
  const canRender = !hidden && toc.length > 0;

  const mobile = canRender ? <DocItemTOCMobile /> : undefined;

  const desktop =
    canRender && (windowSize === 'desktop' || windowSize === 'ssr') ? (
      <DocItemTOCDesktop />
    ) : undefined;

  return {
    hidden,
    mobile,
    desktop,
  };
}

export default function DocItemLayout({ children }: Props): ReactNode {
  const docTOC = useDocTOC();
  const { metadata } = useDoc();
  // Colonna: su desktop (e in SSR, come l'indice) Archivio e Database stanno
  // nella colonna destra, su telefono in un pannello flottante fuori dalla
  // griglia. Un pannello aperto allarga la colonna.
  const colonna = useColonna();
  const windowSize = useWindowSize();
  const inColonna = colonna !== null && windowSize !== 'mobile';
  const aperta = inColonna && colonna.aperta !== null;
  return (
    <div className="row">
      <div
        className={clsx(
          'col',
          (!docTOC.hidden || inColonna) && styles.docItemCol,
          aperta && styles.docItemColAperta,
        )}
      >
        <ContentVisibility metadata={metadata} />
        <DocVersionBanner />
        <div className={styles.docItemContainer}>
          <article>
            <DocBreadcrumbs />
            <DocVersionBadge />
            {docTOC.mobile}
            <DocItemContent>{children}</DocItemContent>
            <DocItemFooter />
          </article>
          <DocItemPaginator />
        </div>
      </div>
      {inColonna ? (
        <div
          className={clsx(
            'col col--3',
            styles.colonna,
            aperta && styles.colonnaAperta,
          )}
        >
          <ColonnaRail colonna={colonna} toc={docTOC.desktop} />
        </div>
      ) : (
        docTOC.desktop && <div className="col col--3">{docTOC.desktop}</div>
      )}
      {colonna !== null && windowSize === 'mobile' && (
        <ColonnaSheet colonna={colonna} />
      )}
    </div>
  );
}
