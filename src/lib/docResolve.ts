/**
 * Helper condivisi per risolvere doc id → URL e label di volume, usati dai
 * componenti del grafo esercizi (LessonMeta, AssignedExercises) e dalle briciole.
 *
 * Il permalink NON va ricostruito a mano (regole slug/index/trailingSlash sono
 * fragili): lo risolviamo dai dati che Docusaurus ha già calcolato, esposti via
 * `useAllDocsData()` (vedi src/components/PathSelector per il pattern `current`).
 */
import type { GlobalPluginData } from '@docusaurus/plugin-content-docs/client';

export type AllDocsData = Record<string, GlobalPluginData>;

// ─── Tipi del global data del plugin `exercise-graph` ────────────────────────

export type ExerciseKind = 'rapidi' | 'esercizio' | 'laboratorio';
export type Difficulty = 'facile' | 'medio' | 'difficile';

/** Riferimento a una lezione-sorgente (provenienza o teoria). */
export interface LessonRef {
  volume: string;
  docId: string;
  title: string;
}

/** Record completo di un esercizio (chiave = docId volume-local in apprendista). */
export interface ExerciseRecord {
  docId: string;
  title: string;
  kind: ExerciseKind;
  n?: string;
  lessonId?: string;
  difficulty?: Difficulty;
  time?: string;
  assignedIn: LessonRef;
  theory: LessonRef[];
}

/** Voce dell'elenco «esercizi assegnati» mostrato su una lezione. */
export interface ExerciseListItem {
  docId: string;
  title: string;
  kind: ExerciseKind;
  difficulty?: Difficulty;
  time?: string;
}

export interface ExerciseGraphData {
  exercises: Record<string, ExerciseRecord>;
  byLesson: Record<string, ExerciseListItem[]>;
  lessons: Record<string, { title: string }>;
}

// Nome leggibile del volume per pluginId (= routeBasePath = cartella). Fonte
// unica: importato anche dallo swizzle DocBreadcrumbs.
export const VOLUME_LABELS: Record<string, string> = {
  programmatore: 'Manuale del Programmatore',
  artefice: 'Manuale dell’Artefice',
  archivista: 'Manuale dell’Archivista',
  apprendista: 'Biblioteca dell’Apprendista',
};

export function volumeLabel(volume: string): string {
  return VOLUME_LABELS[volume] ?? volume;
}

/**
 * Risolve il permalink (senza baseUrl, pronto per <Link to>) di un doc dato il
 * suo volume (pluginId) e il suo docId volume-local. `null` se non risolve —
 * la validazione forte dei riferimenti avviene a build-time nel plugin
 * exercise-graph, qui degradiamo con grazia.
 */
export function resolvePermalink(
  allData: AllDocsData,
  volume: string,
  docId: string,
): string | null {
  const version = allData[volume]?.versions?.find((v) => v.name === 'current');
  if (!version) return null;
  return version.docs.find((d) => d.id === docId)?.path ?? null;
}
