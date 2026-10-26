<script setup lang="ts">
/**
 * Le tabelle di una foto del database (DbSnapshot del worker SQL, la stessa
 * del pannello «Database» del libro): righe nuove in verde, celle modificate
 * in ambra, righe tolte barrate in rosso. La usano <SqlRun database> e
 * <StatoDb>.
 *
 * `tabelle`: i nomi da mostrare, separati da virgole. Senza, quelle cambiate
 * dall'esecuzione; se non è cambiato niente, tutte.
 */
import { computed } from 'vue';
import type { DbSnapshot, SnapshotRow } from '@site/src/theme/SQLRunner/types';

const props = defineProps<{
  foto: DbSnapshot;
  tabelle?: string;
  /** Righe mostrate per tabella prima di «… altre N». */
  massimo?: number;
}>();

const scelte = computed(() => {
  const tutte = props.foto.tables;
  if (props.tabelle) {
    const nomi = props.tabelle.split(',').map((n) => n.trim().toLowerCase());
    return tutte.filter((t) => nomi.includes(t.name.toLowerCase()));
  }
  const cambiate = tutte.filter((t) => t.status !== 'unchanged');
  return cambiate.length ? cambiate : tutte;
});

const limite = computed(() => props.massimo ?? 8);

/** Prima le righe cambiate, poi le altre, fino al limite. */
function righe(t: DbSnapshot['tables'][number]): SnapshotRow[] {
  const cambiate = t.rows.filter((r) => r.change);
  const altre = t.rows.filter((r) => !r.change);
  const scelte = [...cambiate, ...altre].slice(0, Math.max(limite.value, cambiate.length));
  return scelte.sort((a, b) => (a.rowid ?? 0) - (b.rowid ?? 0));
}

const mostra = (v: unknown) => (v === null ? 'NULL' : String(v));
</script>

<template>
  <div class="pdb-db">
    <div v-for="t in scelte" :key="t.name" class="pdb-db__tabella">
      <div class="pdb-db__nome">
        <span>{{ t.name }}</span>
        <span v-if="t.status === 'created'" class="pdb-db__marca pdb-db__marca--nuova">nuova</span>
        <span class="pdb-db__conta">{{ t.totalRows }} {{ t.totalRows === 1 ? 'riga' : 'righe' }}</span>
      </div>
      <table>
        <thead>
          <tr><th v-for="c in t.columns" :key="c">{{ c }}</th></tr>
        </thead>
        <tbody>
          <tr v-for="(r, i) in righe(t)" :key="`r${i}`" :class="r.change && `pdb-db__riga--${r.change}`">
            <td v-for="(v, k) in r.values" :key="k" :class="{ 'pdb-db__cella--cambiata': r.changedCells?.includes(k) }">{{ mostra(v) }}</td>
          </tr>
          <tr v-for="(r, i) in t.removed" :key="`x${i}`" class="pdb-db__riga--removed">
            <td v-for="(v, k) in r.values" :key="k">{{ mostra(v) }}</td>
          </tr>
        </tbody>
      </table>
      <div v-if="t.totalRows > righe(t).length" class="pdb-db__altre">… altre {{ t.totalRows - righe(t).length }} righe</div>
    </div>
    <p v-for="nome in foto.droppedTables" :key="nome" class="pdb-db__tolta">Tabella <code>{{ nome }}</code> eliminata.</p>
  </div>
</template>

<style>
.pdb-db {
  display: grid;
  /* Le tabelle si affiancano quando c'è posto (slide «risultato»), si
     impilano in una colonna stretta. */
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 12px 18px;
  align-items: start;
}

.pdb-db__nome {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 5px;
  font-family: var(--font-mono);
  font-size: 13.5px;
  font-weight: 500;
  color: var(--at-accent);
}

.pdb-db__conta {
  margin-left: auto;
  font-family: var(--font-mono-ui);
  font-size: 11px;
  font-weight: 400;
  color: var(--at-muted);
}

.pdb-db__marca {
  padding: 1px 7px;
  border-radius: 999px;
  font-family: var(--font-mono-ui);
  font-size: 10.5px;
}

.pdb-db__marca--nuova {
  color: var(--ok);
  background: var(--ok-bg);
}

.slidev-layout.pdb .pdb-db table {
  width: 100%;
  font-family: var(--font-mono);
  font-size: 13px;
}

.slidev-layout.pdb .pdb-db th {
  padding: 5px 10px;
  font-size: 11.5px;
}

.slidev-layout.pdb .pdb-db td {
  padding: 4px 10px;
  white-space: nowrap;
}

.pdb-db__riga--added td {
  background: rgba(18, 117, 56, 0.1);
  color: var(--ok);
}

.pdb-db__riga--added td:first-child {
  box-shadow: inset 3px 0 0 var(--ok);
}

.pdb-db__cella--cambiata {
  background: rgba(245, 158, 11, 0.18);
  color: #92400e;
  font-weight: 500;
}

.pdb-db__riga--modified td:first-child {
  box-shadow: inset 3px 0 0 #d97706;
}

.pdb-db__riga--removed td {
  background: var(--ko-bg);
  color: var(--ko);
  text-decoration: line-through;
}

.pdb-db__riga--removed td:first-child {
  box-shadow: inset 3px 0 0 var(--ko);
}

.pdb-db__altre,
.pdb-db__tolta {
  margin: 4px 0 0;
  font-family: var(--font-mono-ui);
  font-size: 11.5px;
  color: var(--at-muted);
}
</style>
