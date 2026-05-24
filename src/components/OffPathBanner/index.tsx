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
import {usePathContext, type VolumeId} from '@site/src/contexts/PathContext';
import {pathLabel} from '@site/src/contexts/pathLabels';

import styles from './styles.module.css';

const VOLUMES: ReadonlySet<string> = new Set([
  'programmatore',
  'artefice',
  'archivista',
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
      <span className={styles.icon} aria-hidden="true">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </span>
      <div className={styles.body}>
        <p className={styles.title}>
          Questa lezione non fa parte del percorso{' '}
          <strong>{pathLabel(chosen)}</strong>.
        </p>
        {availableIn.length > 0 ? (
          <p className={styles.detail}>
            È disponibile in:{' '}
            {availableIn.map((p, i) => (
              <React.Fragment key={p}>
                {i > 0 && ' · '}
                <button
                  type="button"
                  className={styles.switch}
                  onClick={() => setPath(volumeId, p)}>
                  passa a {pathLabel(p)}
                </button>
              </React.Fragment>
            ))}
          </p>
        ) : (
          <p className={styles.detail}>
            Non è inclusa in nessuno degli altri percorsi disponibili.
          </p>
        )}
      </div>
    </aside>
  );
}
