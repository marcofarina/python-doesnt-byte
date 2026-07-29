/**
 * CurriculumIndicator — chip in navbar (slot center) quando un percorso è
 * attivo: mostra la label del preset se il codice coincide con uno dei
 * preset (confronto stringa sulla forma canonica), altrimenti «Percorso
 * attivo». Link al configuratore, «×» per rimuovere. Sostituisce
 * PathSelector del vecchio sistema a sidebar multiple.
 */
import React, { useMemo, type ReactNode } from 'react';
import Link from '@docusaurus/Link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  useCurriculum,
  useCurriculumPluginData,
} from '@site/src/contexts/CurriculumContext';
import { codeFromKeys } from '@site/src/lib/curriculumSelection';

import styles from './styles.module.css';

export default function CurriculumIndicator(): ReactNode {
  const { code, clear } = useCurriculum();
  const { manifest, presets } = useCurriculumPluginData();

  const presetLabel = useMemo(() => {
    if (!code) return null;
    const match = presets.find(
      (p) => codeFromKeys(new Set(p.keys), manifest) === code,
    );
    return match?.label ?? null;
  }, [code, presets, manifest]);

  if (!code) return null;

  return (
    <div className={styles.wrap}>
      <Link
        to="/percorso"
        className={styles.label}
        title="Gestisci percorso"
        aria-label={`Percorso attivo${presetLabel ? `: ${presetLabel}` : ''} — gestisci`}
      >
        <FontAwesomeIcon
          icon={['fas', 'route']}
          className={styles.icon}
          aria-hidden="true"
        />
        {presetLabel ?? 'Percorso attivo'}
      </Link>
      <button
        type="button"
        className={styles.close}
        aria-label="Rimuovi percorso"
        title="Rimuovi percorso"
        onClick={clear}
      >
        <FontAwesomeIcon icon={['fas', 'xmark']} aria-hidden="true" />
      </button>
    </div>
  );
}
