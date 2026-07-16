/**
 * Swizzle-wrapper di DocPaginator — con un percorso attivo ricalcola
 * prev/next dalla sidebar filtrata (useDocsSidebar è già l'albero filtrato
 * grazie al DocRoot swizzlato), così la paginazione salta le lezioni
 * escluse. Senza percorso: passthrough puro.
 *
 * Se la pagina corrente non compare nella sidebar filtrata (lezione esclusa
 * aperta via link diretto) non renderizza nulla: il contesto lo spiega
 * OffCurriculumBanner in cima alla pagina.
 */
import React, { type ReactNode } from 'react';
import DocPaginator from '@theme-original/DocPaginator';
import type { Props } from '@theme/DocPaginator';
import {
  useDocsSidebar,
  useDocsVersion,
} from '@docusaurus/plugin-content-docs/client';
import { useLocation } from '@docusaurus/router';

import {
  useCurriculum,
  useCurriculumPluginData,
} from '@site/src/contexts/CurriculumContext';
import { flattenSidebarLinks } from '@site/src/lib/curriculumFilter';

function normalizePath(p: string): string {
  return p.length > 1 && p.endsWith('/') ? p.slice(0, -1) : p;
}

export default function DocPaginatorWrapper(props: Props): ReactNode {
  const { included } = useCurriculum();
  const { volumes } = useCurriculumPluginData();
  const version = useDocsVersion();
  const sidebar = useDocsSidebar();
  const location = useLocation();

  const isVolume = volumes.some((v) => v.id === version.pluginId);
  if (!included || !isVolume || !sidebar) {
    return <DocPaginator {...props} />;
  }

  const links = flattenSidebarLinks(sidebar.items);
  const current = normalizePath(location.pathname);
  const index = links.findIndex((l) => normalizePath(l.href) === current);
  if (index === -1) return null; // pagina fuori percorso: niente prev/next

  const toNav = (l?: { href: string; label: string }) =>
    l ? { permalink: l.href, title: l.label } : undefined;

  return (
    <DocPaginator
      {...props}
      previous={toNav(links[index - 1])}
      next={toNav(links[index + 1])}
    />
  );
}
