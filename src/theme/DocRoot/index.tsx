/**
 * Swizzle DocRoot — con un percorso attivo (CurriculumContext) filtra la
 * sidebar del volume corrente: le lezioni escluse spariscono, le categorie
 * svuotate pure. Il filtro è presentazionale e SSR-safe per costruzione:
 * al primo render `included` è null (libro intero), il percorso arriva
 * dall'effect di idratazione.
 *
 * Quando la lezione corrente NON è nel percorso (link diretto), la sidebar
 * filtrata resta comunque: la lezione si rende senza evidenza in sidebar e
 * OffCurriculumBanner spiega il perché.
 */
import React, { useMemo, type ReactNode } from 'react';
import clsx from 'clsx';
import {
  HtmlClassNameProvider,
  ThemeClassNames,
} from '@docusaurus/theme-common';
import {
  DocsSidebarProvider,
  useDocRootMetadata,
  useDocsVersion,
} from '@docusaurus/plugin-content-docs/client';
import DocRootLayout from '@theme/DocRoot/Layout';
import NotFoundContent from '@theme/NotFound/Content';
import type { Props } from '@theme/DocRoot';
import type { PropSidebar } from '@docusaurus/plugin-content-docs';

import {
  useCurriculum,
  useCurriculumPluginData,
} from '@site/src/contexts/CurriculumContext';
import { filterSidebarItems } from '@site/src/lib/curriculumFilter';

function useFilteredSidebar(
  defaultItems: PropSidebar | undefined,
): PropSidebar | null {
  const version = useDocsVersion();
  const { included, isIncluded } = useCurriculum();
  const { volumes } = useCurriculumPluginData();
  const pluginId = version.pluginId;

  return useMemo(() => {
    // Nessun percorso attivo, pagina docs non-volume o sidebar assente:
    // comportamento standard.
    if (!included || !defaultItems) return null;
    if (!volumes.some((v) => v.id === pluginId)) return null;
    return filterSidebarItems(defaultItems, pluginId, isIncluded);
  }, [included, isIncluded, volumes, pluginId, defaultItems]);
}

export default function DocRoot(props: Props): ReactNode {
  const currentDocRouteMetadata = useDocRootMetadata(props);
  if (!currentDocRouteMetadata) {
    return <NotFoundContent />;
  }
  const { docElement, sidebarName, sidebarItems } = currentDocRouteMetadata;
  return (
    <HtmlClassNameProvider className={clsx(ThemeClassNames.page.docsDocPage)}>
      <DocRootInner
        defaultName={sidebarName}
        defaultItems={sidebarItems}
        docElement={docElement}
      />
    </HtmlClassNameProvider>
  );
}

function DocRootInner({
  defaultName,
  defaultItems,
  docElement,
}: {
  defaultName: string | undefined;
  defaultItems: PropSidebar | undefined;
  docElement: ReactNode;
}) {
  const filtered = useFilteredSidebar(defaultItems);
  return (
    <DocsSidebarProvider name={defaultName} items={filtered ?? defaultItems}>
      <DocRootLayout>{docElement}</DocRootLayout>
    </DocsSidebarProvider>
  );
}
