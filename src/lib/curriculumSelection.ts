/**
 * Ponte tra selezione di lezioni (chiavi «<volume>/<docId>») e codice
 * testuale, contro il manifest a epoche. Condiviso da CurriculumContext,
 * pagina /percorso e CurriculumIndicator.
 */
import {
  CurriculumCodeError,
  decodeCurriculum,
  encodeCurriculum,
} from './curriculumCode';

export interface EpochManifest {
  version: number;
  currentEpoch: number;
  epochs: Record<string, string[]>;
}

/** Codifica una selezione di chiavi contro l'epoca corrente del manifest. */
export function codeFromKeys(
  keys: ReadonlySet<string>,
  manifest: EpochManifest,
): string {
  const entries = manifest.epochs[String(manifest.currentEpoch)];
  const indices = new Set<number>();
  entries.forEach((key, i) => {
    if (keys.has(key)) indices.add(i);
  });
  return encodeCurriculum(manifest.currentEpoch, entries.length, indices);
}

/**
 * Decodifica un codice nelle chiavi incluse, contro il manifest della SUA
 * epoca. Indici oltre la lunghezza attuale (codice più nuovo del sito) o
 * slot tombstone: bit inerti, ignorati. Epoca sconosciuta →
 * CurriculumCodeError('epoch').
 */
export function keysFromCode(
  raw: string,
  manifest: EpochManifest,
): ReadonlySet<string> {
  const { epoch, indices } = decodeCurriculum(raw);
  const entries = manifest.epochs[String(epoch)];
  if (!entries) {
    throw new CurriculumCodeError(
      'epoch',
      `Il codice appartiene a un'epoca (${epoch}) che questo sito non ` +
        'conosce ancora: ricarica la pagina per aggiornare il sito.',
    );
  }
  const keys = new Set<string>();
  for (const i of indices) {
    if (i < entries.length) keys.add(entries[i]);
  }
  return keys;
}
