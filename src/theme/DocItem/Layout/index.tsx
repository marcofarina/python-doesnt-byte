/**
 * Swizzle EJECT di @theme/DocItem/Layout (theme-classic 3.10.1).
 *
 * Copia dell'originale più il pannello «Archivio» (piano
 * pm/piano-2026-10-archivio.md, fase A2). Le aggiunte sono marcate «Archivio».
 *
 * Eject e non wrap: il pannello deve stare DENTRO la colonna dell'indice, che
 * questo componente costruisce; la colonna deve esserci anche nelle pagine
 * senza indice; e aperto, il pannello allarga la colonna a spese del testo.
 * Un wrapper vede solo il Layout dall'esterno e non può fare nessuna delle tre.
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
  ArchivioRail,
  ArchivioSheet,
  useArchivio,
} from '@site/src/components/Archivio';

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
  // Archivio: su desktop (e in SSR, come l'indice) sta nella colonna destra,
  // su telefono è un pannello flottante fuori dalla griglia.
  const archivio = useArchivio();
  const windowSize = useWindowSize();
  const archivioInColonna = archivio !== null && windowSize !== 'mobile';
  const archivioAperto = archivioInColonna && archivio.aperto;
  return (
    <div className="row">
      <div
        className={clsx(
          'col',
          (!docTOC.hidden || archivioInColonna) && styles.docItemCol,
          archivioAperto && styles.docItemColArchivio,
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
      {archivioInColonna ? (
        <div
          className={clsx(
            'col col--3',
            styles.colonna,
            archivioAperto && styles.colonnaAperta,
          )}
        >
          <ArchivioRail archivio={archivio} toc={docTOC.desktop} />
        </div>
      ) : (
        docTOC.desktop && <div className="col col--3">{docTOC.desktop}</div>
      )}
      {archivio !== null && windowSize === 'mobile' && (
        <ArchivioSheet archivio={archivio} />
      )}
    </div>
  );
}
