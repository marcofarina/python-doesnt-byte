import React from 'react';
import Icon from '@site/src/components/Icon';
import styles from './styles.module.css';

interface EsitoProps {
  /** true = giusto (default), false = sbagliato */
  ok?: boolean;
}

/**
 * Segno di esito per i confronti di codice nei callout: sostituisce ❌/✅.
 * `<Esito />` giusto, `<Esito ok={false} />` sbagliato.
 */
export default function Esito({ ok = true }: EsitoProps): React.JSX.Element {
  return (
    <span className={ok ? styles.ok : styles.no}>
      <Icon
        name={ok ? 'circle-check' : 'circle-xmark'}
        size={16}
        title={ok ? 'Giusto' : 'Sbagliato'}
      />
    </span>
  );
}
