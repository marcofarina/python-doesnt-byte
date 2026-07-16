/**
 * OffCurriculumBanner — avviso in cima a una lezione aperta via link diretto
 * quando NON fa parte del percorso attivo (curazione, non censura: la pagina
 * resta leggibile). Offre la rimozione del percorso e il link al
 * configuratore. Sostituisce OffPathBanner (vecchio sistema a sidebar
 * multiple).
 */
import React, { type ReactNode } from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import { useDoc, useDocsVersion } from '@docusaurus/plugin-content-docs/client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  useCurriculum,
  useCurriculumPluginData,
} from '@site/src/contexts/CurriculumContext';

import styles from './styles.module.css';

export default function OffCurriculumBanner(): ReactNode {
  const { metadata } = useDoc();
  const version = useDocsVersion();
  const { included, isIncluded, clear } = useCurriculum();
  const { volumes } = useCurriculumPluginData();
  // Anchor semplice (non <Link>): la pagina /percorso arriva con la fase 4
  // e un <Link> a una rotta inesistente farebbe fallire il check dei broken
  // link in build. Da convertire a <Link> quando la pagina esiste.
  const percorsoUrl = useBaseUrl('/percorso');

  if (!included) return null; // nessun percorso attivo
  if (!volumes.some((v) => v.id === version.pluginId)) return null;
  if (isIncluded(`${version.pluginId}/${metadata.id}`)) return null;

  return (
    <aside
      className={styles.banner}
      role="note"
      aria-label="Avviso sul percorso"
    >
      <FontAwesomeIcon
        icon={['fas', 'circle-info']}
        className={styles.icon}
        aria-hidden="true"
      />
      <p className={styles.message}>
        Questa lezione non fa parte del percorso impostato dal docente.
      </p>
      <span className={styles.actions}>
        <button type="button" className={styles.action} onClick={clear}>
          Vedi tutto il libro
        </button>
        <span className={styles.sep} aria-hidden="true">
          ·
        </span>
        <a className={styles.action} href={percorsoUrl}>
          Gestisci percorso
        </a>
      </span>
    </aside>
  );
}
