/**
 * AssignedExercises — elenco «Esercizi assegnati» mostrato in fondo a una
 * lezione (Volumi 1–3). È DERIVATO: legge la mappa inversa `byLesson` dal global
 * data del plugin `exercise-graph` per la chiave «<volume>/<docId>» della lezione
 * corrente e renderizza una card per esercizio (riusa <ExerciseLink>).
 *
 * Viene auto-iniettato dallo swizzle DocItem/Footer; le lezioni non vengono
 * mai editate a mano. Render `null` se la lezione non assegna esercizi.
 */
import { type ReactNode } from 'react';
import Heading from '@theme/Heading';
import { usePluginData } from '@docusaurus/useGlobalData';
import { useAllDocsData } from '@docusaurus/plugin-content-docs/client';
import ExerciseLink from '@site/src/components/ExerciseLink';
import {
  resolvePermalink,
  type ExerciseGraphData,
} from '@site/src/lib/docResolve';

import styles from './styles.module.css';

interface AssignedExercisesProps {
  /** Chiave della lezione corrente: «<volume>/<docId>». */
  lessonKey: string;
}

export default function AssignedExercises({
  lessonKey,
}: AssignedExercisesProps): ReactNode {
  const data = usePluginData('exercise-graph') as ExerciseGraphData | undefined;
  const allData = useAllDocsData();
  const items = data?.byLesson?.[lessonKey];
  if (!items || items.length === 0) return null;

  return (
    <section className={styles.section} aria-label="Esercizi assegnati">
      <Heading as="h2" className={styles.heading}>
        Esercizi assegnati
      </Heading>
      <div className={styles.list}>
        {items.map((item) => {
          const to = resolvePermalink(allData, 'apprendista', item.docId);
          if (!to) return null;
          return (
            <ExerciseLink
              key={item.docId}
              to={to}
              difficulty={item.difficulty}
              time={item.time}
            >
              {item.title}
            </ExerciseLink>
          );
        })}
      </div>
    </section>
  );
}
