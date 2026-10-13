/**
 * FileArchivio — stampa in lezione un file dell'archivio del volume, letto
 * dalla fonte unica static/archivio/<dataset>/ tramite il plugin
 * plugins/archivio/. Sostituisce i blocchi ```json copiati a mano: il testo è
 * quello del file sul disco, lo stesso che i runner leggono con leggi_file().
 *
 *   <FileArchivio nome="punti.json" />
 */
import React, { type ReactNode } from 'react';
import CodeBlock from '@theme/CodeBlock';
import { usePluginData } from '@docusaurus/useGlobalData';

interface ArchivioPluginData {
  file: Record<string, string>;
}

interface FileArchivioProps {
  /** Nome del file, come nel frontmatter `archivio:`. Es. `punti.json`. */
  nome: string;
}

export default function FileArchivio({ nome }: FileArchivioProps): ReactNode {
  const { file } = usePluginData('archivio') as ArchivioPluginData;
  const testo = file[nome];
  // Un nome sbagliato deve fermare la build, non stampare un blocco vuoto.
  if (testo === undefined) {
    throw new Error(
      `<FileArchivio nome="${nome}">: nessun file con questo nome in static/archivio/.`,
    );
  }
  return (
    <CodeBlock language="json" title={nome}>
      {testo.trimEnd()}
    </CodeBlock>
  );
}
