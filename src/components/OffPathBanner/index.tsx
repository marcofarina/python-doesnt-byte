/**
 * OffPathBanner — avviso mostrato in cima alla pagina di una lezione quando
 * la lezione NON fa parte del percorso correntemente scelto dall'utente.
 * Elenca in quali altri percorsi del volume la lezione è presente e offre
 * un bottone per switchare il percorso (la sidebar si ricostruisce in
 * place senza navigare).
 */
import React, {type ReactNode} from 'react';
import {useDoc, useDocsVersion} from '@docusaurus/plugin-content-docs/client';
import type {PropSidebar, PropSidebarItem} from '@docusaurus/plugin-content-docs';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {usePathContext, type VolumeId} from '@site/src/contexts/PathContext';
import {pathLabel} from '@site/src/contexts/pathLabels';

import styles from './styles.module.css';

const VOLUMES: ReadonlySet<string> = new Set([
  'programmatore',
  'artefice',
  'archivista',
  'apprendista',
]);

function sidebarContainsDoc(items: PropSidebar, docId: string): boolean {
  for (const item of items as PropSidebarItem[]) {
    if (item.type === 'link' && item.docId === docId) return true;
    if (item.type === 'category' && sidebarContainsDoc(item.items, docId))
      return true;
  }
  return false;
}

function useOffPathInfo() {
  const {metadata} = useDoc();
  const version = useDocsVersion();
  const {getPath} = usePathContext();

  if (!VOLUMES.has(version.pluginId)) return null;
  const volumeId = version.pluginId as VolumeId;
  const chosen = getPath(volumeId);
  if (!chosen) return null; // utente non ha mai scelto → niente banner

  const sidebars = version.docsSidebars ?? {};
  const activeSidebar = sidebars[chosen];
  if (!activeSidebar) return null;

  if (sidebarContainsDoc(activeSidebar as PropSidebar, metadata.id)) {
    return null; // la lezione è nel percorso attivo → tutto ok
  }

  const availableIn = Object.entries(sidebars)
    .filter(
      ([name, sb]) =>
        name !== chosen &&
        sidebarContainsDoc(sb as PropSidebar, metadata.id),
    )
    .map(([name]) => name);

  return {volumeId, chosen, availableIn};
}

export default function OffPathBanner(): ReactNode {
  const info = useOffPathInfo();
  const {setPath} = usePathContext();
  if (!info) return null;
  const {volumeId, chosen, availableIn} = info;

  return (
    <aside
      className={styles.banner}
      role="note"
      aria-label="Avviso sul percorso">
      <FontAwesomeIcon
        icon={['fas', 'circle-info']}
        className={styles.icon}
        aria-hidden="true"
      />
      <p className={styles.message}>
        Lezione fuori dal percorso{' '}
        <strong className={styles.tag}>{pathLabel(chosen)}</strong>
        {availableIn.length > 0 ? (
          <>
            <span className={styles.sep} aria-hidden="true">
              ·
            </span>
            Disponibile in{' '}
            {availableIn.map((p, i) => (
              <React.Fragment key={p}>
                {i > 0 && (
                  <span className={styles.minisep} aria-hidden="true">
                    {' '}·{' '}
                  </span>
                )}
                <button
                  type="button"
                  className={styles.switch}
                  onClick={() => setPath(volumeId, p)}>
                  {pathLabel(p)}
                </button>
              </React.Fragment>
            ))}
          </>
        ) : (
          <>
            <span className={styles.sep} aria-hidden="true">
              ·
            </span>
            Non inclusa in nessun altro percorso
          </>
        )}
      </p>
    </aside>
  );
}
