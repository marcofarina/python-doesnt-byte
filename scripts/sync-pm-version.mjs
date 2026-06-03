#!/usr/bin/env node
// Propaga la versione di package.json al PM privato (pm/board.json → meta.version)
// e rigenera ROADMAP.md. Agganciato al lifecycle `npm version` (gira dopo il bump
// di package.json, prima del commit).
//
//   npm version patch|minor|major   → bump + sync automatico del PM
//   node scripts/sync-pm-version.mjs → sync manuale (usa la versione corrente)
//
// È una comodità per lo sviluppo locale: il repo pubblico e pm/ sono due git
// separati, qui li teniamo allineati. Se pm/ non esiste (CI, clone fresco) lo
// script non fa nulla ed esce con successo — non deve mai rompere `npm version`.

import { readFile, writeFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PM_DIR = join(ROOT, 'pm');
const BOARD = join(PM_DIR, 'board.json');
const ROADMAP = join(PM_DIR, 'ROADMAP.md');
const PORT = Number(process.env.PM_PORT) || 4178;

const log = (msg) => console.log(`[sync-pm] ${msg}`);

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function getVersion() {
  // npm espone la nuova versione qui durante il lifecycle `version`.
  if (process.env.npm_package_version) return process.env.npm_package_version;
  const pkg = JSON.parse(await readFile(join(ROOT, 'package.json'), 'utf-8'));
  return pkg.version;
}

// Via preferita: il portale è già attivo → PUT, così è il server a rigenerare
// ROADMAP.md (singola sorgente del generatore). Ritorna true se ha aggiornato.
async function syncViaPortal(version) {
  let board;
  try {
    const res = await fetch(`http://localhost:${PORT}/api/board`, { cache: 'no-store' });
    if (!res.ok) return false;
    board = await res.json();
  } catch {
    return false; // portale spento: si passa al fallback su filesystem
  }
  board.meta = board.meta ?? {};
  if (board.meta.version === version) {
    log(`portale già a ${version}, niente da fare.`);
    return true;
  }
  board.meta.version = version;
  const put = await fetch(`http://localhost:${PORT}/api/board`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(board),
  });
  if (!put.ok) return false;
  log(`board.json → meta.version ${version} (via portale, ROADMAP rigenerato).`);
  return true;
}

// Fallback: portale spento → scrivo board.json e rigenero ROADMAP.md con lo
// stesso generatore del server (modulo condiviso pm/roadmap.mjs).
async function syncViaFilesystem(version) {
  const board = JSON.parse(await readFile(BOARD, 'utf-8'));
  board.meta = board.meta ?? {};
  if (board.meta.version === version) {
    log(`board.json già a ${version}, niente da fare.`);
    return;
  }
  board.meta.version = version;
  board.meta.updatedAt = new Date().toISOString().slice(0, 10);
  const { renderRoadmap } = await import(join(PM_DIR, 'roadmap.mjs'));
  await writeFile(BOARD, JSON.stringify(board, null, 2) + '\n', 'utf-8');
  await writeFile(ROADMAP, renderRoadmap(board) + '\n', 'utf-8');
  log(`board.json → meta.version ${version} (via filesystem, ROADMAP rigenerato).`);
}

async function main() {
  if (!(await exists(BOARD))) {
    log('pm/board.json assente — skip (probabile CI o clone senza PM).');
    return;
  }
  const version = await getVersion();
  if (await syncViaPortal(version)) return;
  await syncViaFilesystem(version);
}

main().catch((err) => {
  // Non bloccare mai `npm version`: avvisa e prosegui.
  console.warn(`[sync-pm] sync non riuscito (ignorato): ${err.message}`);
});
