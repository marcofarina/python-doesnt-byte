/**
 * PathSelector — segmented control nella navbar per scegliere il percorso
 * (IT / Liceo / ITS ecc.) del volume correntemente visitato. Visibile solo
 * quando l'utente è dentro un volume; nascosto altrove.
 *
 * I percorsi disponibili sono dedotti dalle sidebar dichiarate per il
 * plugin-content-docs instance del volume attivo: ogni "sidebar name"
 * = un percorso.
 */
import React, {type ReactNode} from 'react';
import {
  useActivePlugin,
  useAllDocsData,
} from '@docusaurus/plugin-content-docs/client';
import {usePathContext, type VolumeId} from '@site/src/contexts/PathContext';

import styles from './styles.module.css';

const VOLUMES: ReadonlySet<string> = new Set([
  'programmatore',
  'artefice',
  'archivista',
]);

// Etichetta umana del percorso, mostrata nel toggle.
const PATH_LABEL: Record<string, string> = {
  it: 'IT',
  liceo: 'Liceo',
  its: 'ITS',
};

function labelFor(pathId: string): string {
  return PATH_LABEL[pathId] ?? pathId;
}

export default function PathSelector(): ReactNode {
  const activePlugin = useActivePlugin();
  const allData = useAllDocsData();
  const {getPath, setPath} = usePathContext();

  if (!activePlugin || !VOLUMES.has(activePlugin.pluginId)) {
    return null;
  }
  const volumeId = activePlugin.pluginId as VolumeId;

  // Ricavo i nomi delle sidebar (= percorsi) dichiarate per questa istanza
  // leggendo i metadata della versione "current".
  const pluginData = allData[volumeId];
  const version = pluginData?.versions?.find((v) => v.name === 'current');
  if (!version) return null;
  const pathIds = Object.keys(version.sidebars ?? {});
  if (pathIds.length <= 1) return null;

  // Default: primo percorso dichiarato per il volume. Se l'utente non ha
  // ancora scelto nulla, non scriviamo nulla in localStorage — solo evidenza
  // visiva.
  const stored = getPath(volumeId);
  const active = stored ?? pathIds[0];

  return (
    <div className={styles.wrap} role="group" aria-label="Percorso didattico">
      {pathIds.map((id) => (
        <button
          key={id}
          type="button"
          className={`${styles.btn} ${id === active ? styles.active : ''}`}
          aria-pressed={id === active}
          onClick={() => setPath(volumeId, id)}>
          {labelFor(id)}
        </button>
      ))}
    </div>
  );
}

