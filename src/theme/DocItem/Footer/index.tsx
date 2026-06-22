/**
 * Swizzle WRAPPER di @theme/DocItem/Footer.
 *
 * Renderizza il footer originale (tag, edit link, last-updated) e, dopo di esso
 * — quindi FUORI dal corpo markdown `.markdown` — appende l'elenco «Esercizi
 * assegnati» della lezione corrente. Così le lezioni dei Volumi 1–3 non vanno
 * mai editate a mano: il backlink si genera dal grafo (plugin exercise-graph).
 *
 * Wrapper (non eject): delega tutto l'originale, aggiunge solo in coda →
 * minore superficie da ricontrollare agli upgrade di Docusaurus.
 */
import React, { type ReactNode } from 'react';
import Footer from '@theme-original/DocItem/Footer';
import type FooterType from '@theme/DocItem/Footer';
import type { WrapperProps } from '@docusaurus/types';
import { useDoc, useDocsVersion } from '@docusaurus/plugin-content-docs/client';

import AssignedExercises from '@site/src/components/AssignedExercises';

type Props = WrapperProps<typeof FooterType>;

export default function FooterWrapper(props: Props): ReactNode {
  const { metadata } = useDoc();
  const { pluginId } = useDocsVersion();
  const lessonKey = `${pluginId}/${metadata.id}`;
  return (
    <>
      <Footer {...props} />
      <AssignedExercises lessonKey={lessonKey} />
    </>
  );
}
