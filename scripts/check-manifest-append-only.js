#!/usr/bin/env node
/**
 * Guardia CI per curriculum/manifest.json: le posizioni di bit sono la
 * base dei codici percorso distribuiti alle classi, quindi rispetto alla
 * copia su un ref di riferimento (default origin/main) valgono tre regole:
 *
 *  1. le epoche passate sono IMMUTABILI (byte per byte);
 *  2. l'epoca corrente è APPEND-ONLY (la vecchia lista deve esserne un
 *     prefisso);
 *  3. `currentEpoch` può solo restare uguale o avanzare di 1 (apertura di
 *     epoca via scripts/curriculum-new-epoch.js, che congela la precedente).
 *
 * Se il ref non ha il manifest (repo/branch senza il file) il check passa
 * con un avviso: non c'è nulla da proteggere.
 *
 * Uso: node scripts/check-manifest-append-only.js [ref]   (default origin/main)
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const REL = 'curriculum/manifest.json';
const ref = process.argv[2] || 'origin/main';

function fail(msg) {
  console.error(`[manifest-check] VIOLAZIONE: ${msg}`);
  console.error(
    '[manifest-check] I codici percorso distribuiti dipendono dalle posizioni ' +
      'nel manifest: correggi la modifica (le lezioni nuove si APPENDONO in ' +
      'coda; per compattare/riordinare apri una nuova epoca con ' +
      '`npm run curriculum:new-epoch`).',
  );
  process.exit(1);
}

let oldRaw;
try {
  oldRaw = execSync(`git show ${ref}:${REL}`, {
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
} catch {
  console.log(
    `[manifest-check] ${ref}:${REL} non disponibile — nulla da confrontare, check saltato.`,
  );
  process.exit(0);
}

const before = JSON.parse(oldRaw);
const after = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', REL), 'utf-8'),
);

if (after.currentEpoch < before.currentEpoch) {
  fail(`currentEpoch regredito: ${before.currentEpoch} → ${after.currentEpoch}.`);
}
if (after.currentEpoch > before.currentEpoch + 1) {
  fail(
    `currentEpoch avanzato di più di 1 (${before.currentEpoch} → ` +
      `${after.currentEpoch}): le epoche si aprono una alla volta.`,
  );
}

for (const [epoch, entries] of Object.entries(before.epochs)) {
  const now = after.epochs[epoch];
  if (!Array.isArray(now)) {
    fail(`l'epoca ${epoch} è sparita dal manifest.`);
  }
  const isPast =
    Number(epoch) < before.currentEpoch ||
    (Number(epoch) === before.currentEpoch &&
      after.currentEpoch === before.currentEpoch + 1);
  if (isPast) {
    // Epoca congelata: identità totale.
    if (
      now.length !== entries.length ||
      entries.some((k, i) => now[i] !== k)
    ) {
      fail(`l'epoca ${epoch} (congelata) è stata modificata.`);
    }
  } else {
    // Epoca corrente: la vecchia lista deve essere un prefisso della nuova.
    if (now.length < entries.length || entries.some((k, i) => now[i] !== k)) {
      fail(
        `l'epoca corrente ${epoch} non è append-only rispetto a ${ref} ` +
          `(entry riordinate, rimosse o riscritte).`,
      );
    }
  }
}

if (after.currentEpoch === before.currentEpoch + 1) {
  const opened = after.epochs[String(after.currentEpoch)];
  if (!Array.isArray(opened) || opened.length === 0) {
    fail(
      `currentEpoch dichiara l'epoca ${after.currentEpoch} ma la sua lista ` +
        'manca o è vuota.',
    );
  }
}

console.log(
  `[manifest-check] OK rispetto a ${ref} (epoca corrente ${after.currentEpoch}, ` +
    `${after.epochs[String(after.currentEpoch)].length} lezioni).`,
);
