/**
 * Swizzle DocRoot — sostituisce la sidebar default scelta da Docusaurus
 * con quella corrispondente al "percorso" attualmente scelto dall'utente
 * per il volume corrente, leggendo da PathContext.
 *
 * Se l'utente non ha scelto nulla, oppure la sidebar selezionata non esiste
 * per questo volume, ricade sul default (`sidebarName` ricavato dal doc).
 *
 * Quando la lezione corrente NON è dentro la sidebar attiva (es. utente sul
 * percorso "Liceo" ma è arrivato a una lezione che vive solo in "IT"),
 * mostriamo comunque la sidebar attiva: la lezione si rende a tutto schermo
 * senza essere evidenziata in sidebar (banner off-path: prossimo step).
 */
import React, {type ReactNode} from 'react';
import clsx from 'clsx';
import {HtmlClassNameProvider, ThemeClassNames} from '@docusaurus/theme-common';
import {
  DocsSidebarProvider,
  useDocRootMetadata,
  useDocsVersion,
} from '@docusaurus/plugin-content-docs/client';
import DocRootLayout from '@theme/DocRoot/Layout';
import NotFoundContent from '@theme/NotFound/Content';
import type {Props} from '@theme/DocRoot';
import type {PropSidebar} from '@docusaurus/plugin-content-docs';

import {usePathContext, type VolumeId} from '@site/src/contexts/PathContext';

const VOLUMES: ReadonlySet<string> = new Set([
  'programmatore',
  'artefice',
  'archivista',
]);

function useResolvedSidebar(defaultName: string | undefined) {
  const version = useDocsVersion();
  const {getPath} = usePathContext();
  const pluginId = version.pluginId;

  if (!VOLUMES.has(pluginId)) {
    // Pagine docs non-volume: comportamento standard.
    return null;
  }
  const chosen = getPath(pluginId as VolumeId);
  if (!chosen) return null;
  const sidebars = version.docsSidebars;
  if (!sidebars || !(chosen in sidebars)) return null;
  if (chosen === defaultName) return null;
  return {name: chosen, items: sidebars[chosen]!};
}

export default function DocRoot(props: Props): ReactNode {
  const currentDocRouteMetadata = useDocRootMetadata(props);
  if (!currentDocRouteMetadata) {
    return <NotFoundContent />;
  }
  const {docElement, sidebarName, sidebarItems} = currentDocRouteMetadata;
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
  const resolved = useResolvedSidebar(defaultName);
  const name = resolved?.name ?? defaultName;
  const items = resolved?.items ?? defaultItems;
  return (
    <DocsSidebarProvider name={name} items={items}>
      <DocRootLayout>{docElement}</DocRootLayout>
    </DocsSidebarProvider>
  );
}
