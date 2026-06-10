/**
 * Copia il runtime sql.js (glue JS + WASM) da node_modules a static/sql-runner/.
 *
 * I file copiati vengono COMMITTATI: il sito li serve self-hosted (niente CDN —
 * `importScripts` dentro un Web Worker non supporta SRI, il self-host same-origin
 * elimina il rischio supply-chain a runtime). Rilanciare dopo ogni upgrade di
 * sql.js: `node scripts/sync-sql-wasm.mjs`.
 */
import { copyFileSync, readFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'node_modules', 'sql.js', 'dist');
const dest = join(root, 'static', 'sql-runner');

mkdirSync(dest, { recursive: true });

const { version } = JSON.parse(
  readFileSync(join(root, 'node_modules', 'sql.js', 'package.json'), 'utf8'),
);

for (const file of ['sql-wasm.js', 'sql-wasm.wasm']) {
  copyFileSync(join(dist, file), join(dest, file));
  console.log(`✓ ${file} (sql.js ${version}) → static/sql-runner/`);
}
