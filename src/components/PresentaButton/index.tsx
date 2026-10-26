import type { ReactNode } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPersonChalkboard } from '@fortawesome/free-solid-svg-icons';
import { useDoc, useDocsVersion } from '@docusaurus/plugin-content-docs/client';
import { usePluginData } from '@docusaurus/useGlobalData';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './styles.module.css';

interface Presentazione {
  url: string;
}

interface PresentazioniData {
  presentazioni?: Record<string, Presentazione>;
}

// Gate come CopyPageButton: le briciole compaiono anche nelle pagine category,
// che non hanno DocProvider, e lì useDoc() lancia.
export default function PresentaButton(): ReactNode {
  let id: string;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    id = useDoc().metadata.id;
  } catch {
    return null;
  }
  return <Pulsanti id={id} />;
}

function Pulsanti({ id }: { id: string }): ReactNode {
  const { pluginId } = useDocsVersion();
  const data = usePluginData('presentazioni') as PresentazioniData | undefined;
  const voce = data?.presentazioni?.[`${pluginId}/${id}`];
  const url = useBaseUrl(voce?.url ?? '/');
  if (!voce) return null;
  // Un <a> e non <Link>: le slide sono un'altra applicazione, servita da
  // static/slides/, e il router di Docusaurus non le conosce.
  return (
    // eslint-disable-next-line @docusaurus/no-html-links
    <a
      className={styles.presenta}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title="Apri le slide della lezione (F per lo schermo intero)"
    >
      <FontAwesomeIcon icon={faPersonChalkboard} className={styles.icona} />
      <span>Presenta</span>
    </a>
  );
}
