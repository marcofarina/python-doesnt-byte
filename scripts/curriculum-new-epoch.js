#!/usr/bin/env node
/**
 * Apertura di una nuova epoca del manifest percorsi (rito annuale, di norma
 * a inizio anno scolastico). Vedi pm/design-percorsi-personalizzati.md.
 *
 * Rigenera l'elenco delle lezioni dalla TOC (curriculum/toc/*.js) in ordine
 * curricolare, senza tombstone, lo salva come epoca `currentEpoch + 1` e
 * aggiorna `currentEpoch`. L'epoca precedente resta nel file, congelata:
 * i codici già distribuiti continuano a decodificare contro di essa.
 *
 * Se l'epoca corrente coincide già con la TOC (niente tombstone, niente
 * riordino) non c'è nulla da compattare: lo script non tocca il file,
 * a meno di `--force`.
 *
 * Uso: npm run curriculum:new-epoch [-- --force]
 */
const path = require('path');
const fs = require('fs');

const { VOLUMES, flattenTocDocIds } = require('../plugins/curriculum');

const ROOT = path.join(__dirname, '..');
const MANIFEST = path.join(ROOT, 'curriculum', 'manifest.json');
const force = process.argv.includes('--force');

const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf-8'));
const epochKey = String(manifest.currentEpoch);
const current = manifest.epochs[epochKey];
if (!Array.isArray(current)) {
  console.error(`[new-epoch] Manifest malformato: epochs["${epochKey}"] assente.`);
  process.exit(1);
}

// Elenco fresco in ordine curricolare, dalla TOC.
const fresh = [];
for (const { id: volumeId } of VOLUMES) {
  const tocPath = path.join(ROOT, 'curriculum', 'toc', `${volumeId}.js`);
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const tree = require(tocPath);
  for (const docId of flattenTocDocIds(tree, tocPath)) {
    fresh.push(`${volumeId}/${docId}`);
  }
}

const identical =
  fresh.length === current.length && fresh.every((k, i) => k === current[i]);
if (identical && !force) {
  console.log(
    `[new-epoch] L'epoca ${epochKey} coincide già con la TOC ` +
      `(${current.length} lezioni, nessun tombstone, ordine curricolare): ` +
      `nulla da compattare. Usa --force per aprire comunque una nuova epoca.`,
  );
  process.exit(0);
}

const next = manifest.currentEpoch + 1;
if (next > 255) {
  console.error('[new-epoch] Epoca massima (255) raggiunta: serve un formato v2.');
  process.exit(1);
}

const tombstones = current.filter((k) => !fresh.includes(k));
manifest.epochs[String(next)] = fresh;
manifest.currentEpoch = next;
fs.writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(`[new-epoch] Aperta l'epoca ${next}:`);
console.log(`  - lezioni: ${fresh.length} (erano ${current.length})`);
console.log(`  - tombstone eliminati: ${tombstones.length}${tombstones.length ? ` (${tombstones.join(', ')})` : ''}`);
console.log(
  `  - l'epoca ${epochKey} resta congelata nel manifest: i codici già ` +
    `distribuiti continuano a funzionare.`,
);
console.log(
  '  - da ora il configuratore genera codici della nuova epoca. ' +
    'Committa curriculum/manifest.json.',
);
