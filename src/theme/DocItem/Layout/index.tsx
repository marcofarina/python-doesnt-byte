/**
 * Swizzle EJECT di @theme/DocItem/Layout (theme-classic 3.10.1).
 *
 * Copia dell'originale più la colonna destra con i pannelli «Archivio» (piano
 * pm/piano-2026-10-archivio.md, fase A2), «Database» (piano
 * pm/piano-2026-10-pannello-database.md, fase T2) e «Note» (piano
 * pm/piano-2026-11-quaderno.md, fase Q2), in src/components/Colonna/.
 * Le aggiunte sono marcate «Colonna».
 *
 * Quaderno (piano pm/piano-2026-11-quaderno.md, fasi Q0–Q2): nelle pagine
 * con l'evidenziatore (`chiavePagina`) monta <Evidenziatore>
 * (src/components/Evidenziatore/), uno per pagina, e `window.__quaderno` per
 * gli script di verifica; in quelle pagine la colonna destra c'è sempre, per
 * il pannello Note. Le aggiunte sono marcate «Quaderno».
 *
 * Eject e non wrap: i pannelli devono stare DENTRO la colonna dell'indice, che
 * questo componente costruisce; la colonna deve esserci anche nelle pagine
 * senza indice; e con un pannello aperto la colonna si allarga a spese del
 * testo. Un wrapper vede solo il Layout dall'esterno e non può fare nessuna
 * delle tre. Questo è l'unico punto che decide la larghezza delle colonne
 * (regole in styles.module.css: Archivio e Database aperti 45%, Note 36%,
 * Note accanto al testo da 1280 px 30%).
 *
 * Agli upgrade di Docusaurus: riconfrontare con
 * node_modules/@docusaurus/theme-classic/src/theme/DocItem/Layout/index.tsx.
 */
import React, { type ReactNode } from 'react';
import clsx from 'clsx';
import { useWindowSize } from '@docusaurus/theme-common';
import { useDoc, useDocsVersion } from '@docusaurus/plugin-content-docs/client';
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
import Evidenziatore from '@site/src/components/Evidenziatore';
import { chiavePagina } from '@site/src/lib/quaderno/pagine';
import { useSondaQuaderno } from '@site/src/lib/quaderno/sonda';

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
  // Quaderno: la chiave della pagina, null se non ha l'evidenziatore.
  const { pluginId } = useDocsVersion();
  const pagina = chiavePagina(pluginId, metadata.id);
  useSondaQuaderno(pagina);
  // Colonna: su desktop (e in SSR, come l'indice) i pannelli stanno nella
  // colonna destra, su telefono in un pannello flottante fuori dalla griglia.
  // Un pannello aperto allarga la colonna; le Note meno degli altri.
  const colonna = useColonna(pagina);
  const windowSize = useWindowSize();
  const inColonna = colonna !== null && windowSize !== 'mobile';
  const aperta = inColonna && colonna.aperta !== null;
  const note = aperta && colonna.aperta === 'note';
  return (
    <div className="row">
      <div
        className={clsx(
          'col',
          (!docTOC.hidden || inColonna) && styles.docItemCol,
          aperta && styles.docItemColAperta,
          note && styles.docItemColNote,
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
            note && styles.colonnaNote,
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
      {pagina && <Evidenziatore key={pagina} pagina={pagina} />}
    </div>
  );
}
