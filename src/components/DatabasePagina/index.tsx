/**
 * Database — le tabelle come le ha lasciate l'ultimo blocco SQL eseguito dallo
 * studente (piano pm/piano-2026-10-pannello-database.md, fase T2).
 *
 * Una lezione lo chiede nel frontmatter (`database: archivista/registro-punti`,
 * la chiave del dataset come in `dataset=`); la build si ferma se il seed non
 * esiste (plugins/archivio/). Ogni blocco ha il proprio DB: il pannello non
 * cambia il comportamento dei runner, mostra solo la foto che l'ultimo run ha
 * pubblicato nello store di pagina (src/theme/SQLRunner/pageDb.ts), con le
 * righe nuove, modificate e tolte rispetto a prima del run. Prima di ogni run
 * mostra le tabelle del seed, «Stato iniziale».
 *
 * Qui stanno i dati (useDatabasePagina) e il contenuto del pannello
 * (<DatabaseContenuto>). Pulsante e pannelli sono di src/components/Colonna/.
 */
import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import clsx from 'clsx';
import useBaseUrl from '@docusaurus/useBaseUrl';
import { useLocation } from '@docusaurus/router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDatabase,
  faMinus,
  faPen,
  faPlus,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';

import {
  clearPageDb,
  setPageDbActive,
  usePageDb,
  type PageDbEntry,
} from '@site/src/theme/SQLRunner/pageDb';
import { seedSnapshot } from '@site/src/theme/SQLRunner/sqlBridge';
import type {
  DbSnapshot,
  SnapshotRow,
  SnapshotTable,
} from '@site/src/theme/SQLRunner/types';
import colonna from '@site/src/components/Colonna/styles.module.css';

import styles from './styles.module.css';

type Seed =
  | { stato: 'attesa' }
  | { stato: 'pronto'; snapshot: DbSnapshot }
  | { stato: 'errore'; messaggio: string };

export interface DatabasePagina {
  /** Il dataset dichiarato dalla lezione. */
  datasetKey: string;
  /** L'ultima foto pubblicata in questa pagina, null prima del primo run. */
  entry: PageDbEntry | null;
  seed: Seed;
  /** La foto da mostrare: quella dell'ultimo run, altrimenti il seed. */
  snapshot: DbSnapshot | null;
  /** La tabella della scheda attiva. */
  tabella: string | null;
  scegliTabella: (nome: string) => void;
  /** Modifiche dell'ultimo run non ancora viste: il numero sul pallino. */
  daVedere: number;
}

// Le tabelle del seed non cambiano: una richiesta per dataset, per tutta la
// vita della pagina (anche fra una lezione e l'altra).
const seedInCorso = new Map<string, Promise<DbSnapshot>>();

/** Righe nuove, modificate e tolte, più le tabelle create e tolte. */
export function contaModifiche(snapshot: DbSnapshot): number {
  const create = snapshot.tables.filter((t) => t.status === 'created').length;
  return snapshot.changedRows + create + snapshot.droppedTables.length;
}

function modificheTabella(t: SnapshotTable): number {
  return t.rows.filter((r) => r.change).length + t.removedTotal;
}

/**
 * Stato del pannello Database della pagina; `null` se la lezione non dichiara
 * `database:`. Lo chiama la colonna (useColonna), anche a pannello chiuso:
 * così i run fatti prima di aprirlo accendono il pallino.
 */
export function useDatabasePagina(
  datasetKey: string | null,
  aperto: boolean,
): DatabasePagina | null {
  const { pathname } = useLocation();
  const entry = usePageDb();

  // Il pannello c'è: i runner chiedono la foto al worker. Entrando in una
  // pagina il pannello riparte dallo stato iniziale.
  useEffect(() => {
    if (datasetKey === null) return undefined;
    clearPageDb();
    setPageDbActive(true);
    return () => setPageDbActive(false);
  }, [datasetKey, pathname]);

  // Stato iniziale: le tabelle del seed, chieste solo quando servono (pannello
  // aperto prima di ogni run) per non scaricare il WASM al caricamento.
  const workerUrl = useBaseUrl('/sql-runner/worker.js');
  const glueUrl = useBaseUrl('/sql-runner/sql-wasm.js');
  const wasmUrl = useBaseUrl('/sql-runner/sql-wasm.wasm');
  const datasetUrl = useBaseUrl(`/sql-datasets/${datasetKey ?? ''}.sql`);
  // Il seed ricordato vale solo per il suo dataset: cambiando lezione si
  // riparte dall'attesa.
  const [seedLetto, setSeedLetto] = useState<{ chiave: string; seed: Seed }>({
    chiave: '',
    seed: { stato: 'attesa' },
  });
  const seed: Seed =
    seedLetto.chiave === datasetKey ? seedLetto.seed : { stato: 'attesa' };
  const setSeed = useCallback(
    (nuovo: Seed) => {
      if (datasetKey !== null)
        setSeedLetto({ chiave: datasetKey, seed: nuovo });
    },
    [datasetKey],
  );
  const serveSeed = datasetKey !== null && aperto && entry === null;
  useEffect(() => {
    if (!serveSeed || datasetKey === null || seed.stato !== 'attesa') {
      return undefined;
    }
    let richiesta = seedInCorso.get(datasetKey);
    if (!richiesta) {
      richiesta = seedSnapshot(
        { workerUrl, glueUrl, wasmUrl },
        datasetKey,
        datasetUrl,
      );
      seedInCorso.set(datasetKey, richiesta);
      // Un fallimento (rete, worker) non resta in cache: si riprova alla
      // prossima apertura.
      richiesta.catch(() => seedInCorso.delete(datasetKey));
    }
    let valido = true;
    richiesta.then(
      (snapshot) => valido && setSeed({ stato: 'pronto', snapshot }),
      (err: Error) =>
        valido && setSeed({ stato: 'errore', messaggio: err.message }),
    );
    return () => {
      valido = false;
    };
  }, [
    serveSeed,
    seed.stato,
    datasetKey,
    workerUrl,
    glueUrl,
    wasmUrl,
    datasetUrl,
    setSeed,
  ]);

  // Riaprendo dopo un errore si riprova. (setState durante il render, il
  // modo di React per aggiornare uno stato a partire da un altro.)
  if (!aperto && seed.stato === 'errore') setSeed({ stato: 'attesa' });

  // Modifiche viste: quelle dell'ultima foto, se il pannello è aperto.
  const [vista, setVista] = useState(0);
  if (aperto && entry && entry.seq > vista) setVista(entry.seq);

  // Scheda: quella scelta dallo studente, finché un run non cambia qualcosa;
  // dopo un run che cambia, la prima tabella cambiata.
  const [scelta, setScelta] = useState<{ nome: string; seq: number } | null>(
    null,
  );
  const [mostrata, setMostrata] = useState<string | null>(null);
  const seqCorrente = entry?.seq ?? 0;
  const scegliTabella = useCallback(
    (nome: string) => setScelta({ nome, seq: seqCorrente }),
    [seqCorrente],
  );

  const snapshot =
    entry?.snapshot ?? (seed.stato === 'pronto' ? seed.snapshot : null);

  if (datasetKey === null) return null;

  let tabella: string | null = null;
  if (snapshot && snapshot.tables.length > 0) {
    const nomi = snapshot.tables.map((t) => t.name);
    const cambiata = entry
      ? snapshot.tables.find((t) => t.status !== 'unchanged')?.name
      : undefined;
    const valida = scelta !== null && nomi.includes(scelta.nome);
    if (cambiata && (!valida || scelta.seq < seqCorrente)) tabella = cambiata;
    else if (valida) tabella = scelta.nome;
    // Un run che non cambia niente lascia la scheda che si vedeva.
    else if (mostrata !== null && nomi.includes(mostrata)) tabella = mostrata;
    else tabella = nomi[0];
  }
  if (tabella !== null && tabella !== mostrata) setMostrata(tabella);

  const daVedere =
    !aperto && entry && entry.seq > vista ? contaModifiche(entry.snapshot) : 0;

  return {
    datasetKey,
    entry,
    seed,
    snapshot,
    tabella,
    scegliTabella,
    daVedere,
  };
}

/** Testo del pallino per i lettori di schermo. */
export function etichettaDaVedere(n: number): string {
  return n === 1 ? '1 modifica da vedere' : `${n} modifiche da vedere`;
}

/* ─────────────── Contenuto del pannello ─────────────── */

/** Scorre fino al blocco che ha prodotto la foto e gli dà il focus. */
function vaiAlBlocco(id: string) {
  const blocco = document.getElementById(id);
  if (!blocco) return;
  const ridotto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  blocco.scrollIntoView({
    block: 'center',
    behavior: ridotto ? 'auto' : 'smooth',
  });
  if (!blocco.hasAttribute('tabindex')) blocco.setAttribute('tabindex', '-1');
  blocco.focus({ preventScroll: true });
}

function Testa({ db }: { db: DatabasePagina }): ReactNode {
  const { entry } = db;
  const dataset = entry ? entry.datasetKey : db.datasetKey;
  // «blocco 3» è già un nome; un titolo va fra virgolette.
  const senzaTitolo = entry !== null && /^blocco \d+$/.test(entry.blockLabel);
  return (
    <div className={styles.testa}>
      <p className={styles.stato}>
        {entry === null ? (
          'Stato iniziale'
        ) : (
          <>
            {senzaTitolo ? 'Dopo il ' : 'Dopo '}
            <button
              type="button"
              className={styles.blocco}
              title="Vai al blocco"
              onClick={() => vaiAlBlocco(entry.blockElementId)}
            >
              {senzaTitolo ? entry.blockLabel : `“${entry.blockLabel}”`}
            </button>
          </>
        )}
      </p>
      <p className={styles.meta}>
        <FontAwesomeIcon icon={faDatabase} className={styles.metaIcona} />
        <span className={styles.dataset}>
          {dataset ?? 'database vuoto, senza dataset'}
        </span>
        {entry?.failed && (
          <span className={styles.fallito}>
            <FontAwesomeIcon icon={faTriangleExclamation} />
            finito con un errore
          </span>
        )}
      </p>
    </div>
  );
}

const SEGNO = {
  added: { icona: faPlus, testo: 'riga nuova', legenda: 'nuova' },
  modified: { icona: faPen, testo: 'riga modificata', legenda: 'modificata' },
  removed: { icona: faMinus, testo: 'riga tolta', legenda: 'tolta' },
} as const;

type Diff = keyof typeof SEGNO;

function Cella({ v }: { v: SnapshotRow['values'][number] }): ReactNode {
  return v === null ? <span className={styles.nullo}>NULL</span> : String(v);
}

function Riga({
  riga,
  diff,
  segni,
}: {
  riga: SnapshotRow;
  diff: Diff | undefined;
  segni: boolean;
}): ReactNode {
  const cambiate = new Set(riga.changedCells ?? []);
  return (
    <tr data-diff={diff}>
      {segni && (
        <td className={styles.segno}>
          {diff && (
            <>
              <FontAwesomeIcon icon={SEGNO[diff].icona} aria-hidden />
              <span className={styles.srOnly}>{SEGNO[diff].testo}</span>
            </>
          )}
        </td>
      )}
      {riga.values.map((v, i) => (
        <td key={i} data-cambiata={cambiate.has(i) ? '' : undefined}>
          <Cella v={v} />
        </td>
      ))}
    </tr>
  );
}

function Tabella({ t, seq }: { t: SnapshotTable; seq: number }): ReactNode {
  // Dopo un run (o cambiando scheda) la prima riga cambiata si vede anche se
  // sta in fondo: scorre la tabella, non la pagina.
  const scorri = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const box = scorri.current;
    const riga = box?.querySelector<HTMLElement>('tr[data-diff]');
    if (!box || !riga) return;
    const sotto =
      riga.getBoundingClientRect().top - box.getBoundingClientRect().top;
    const testa = box.querySelector('thead')?.offsetHeight ?? 0;
    if (sotto >= testa && sotto + riga.offsetHeight <= box.clientHeight) return;
    box.scrollTop += sotto - box.clientHeight / 2;
  }, [t.name, seq]);

  const tipi = new Set<Diff>();
  for (const r of t.rows) if (r.change) tipi.add(r.change);
  if (t.removedTotal > 0) tipi.add('removed');
  const segni = tipi.size > 0;
  const nascoste = t.totalRows - t.rows.length;
  const nascosteTolte = t.removedTotal - t.removed.length;
  const senzaRowid = t.rows.some((r) => r.rowid === null);

  return (
    <>
      <div ref={scorri} className={styles.scorri}>
        <table className={styles.tabella}>
          <thead>
            <tr>
              {segni && (
                <th className={styles.segno}>
                  <span className={styles.srOnly}>Modifica</span>
                </th>
              )}
              {t.columns.map((c) => (
                <th key={c}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {t.rows.map((r, i) => (
              <Riga
                key={r.rowid ?? `i${i}`}
                riga={r}
                diff={r.change}
                segni={segni}
              />
            ))}
            {t.removed.map((r, i) => (
              <Riga
                key={`tolta-${r.rowid ?? i}`}
                riga={r}
                diff="removed"
                segni={segni}
              />
            ))}
          </tbody>
        </table>
        {t.totalRows === 0 && t.removedTotal === 0 && (
          <p className={styles.vuota}>La tabella è vuota.</p>
        )}
      </div>
      <div className={styles.piede}>
        <span>
          {t.totalRows === 1 ? '1 riga' : `${t.totalRows} righe`}
          {nascoste > 0 && `, ${nascoste} non mostrate`}
          {nascosteTolte > 0 && `, altre ${nascosteTolte} tolte`}
        </span>
        {segni && (
          <span className={styles.legenda}>
            {(['added', 'modified', 'removed'] as const)
              .filter((d) => tipi.has(d))
              .map((d) => (
                <span key={d} data-diff={d} className={styles.voce}>
                  <FontAwesomeIcon icon={SEGNO[d].icona} aria-hidden />
                  {SEGNO[d].legenda}
                </span>
              ))}
          </span>
        )}
      </div>
      {t.diffSkipped && (
        <p className={styles.avviso}>
          {senzaRowid
            ? 'Tabella senza rowid: le modifiche non sono evidenziate.'
            : 'Più di 2.000 righe: le modifiche non sono evidenziate.'}
        </p>
      )}
    </>
  );
}

function Schede({
  db,
  tabelle,
}: {
  db: DatabasePagina;
  tabelle: SnapshotTable[];
}): ReactNode {
  const { tabella, scegliTabella } = db;
  const base = useId();
  const schede = useRef<Record<string, HTMLButtonElement | null>>({});
  const nomi = tabelle.map((t) => t.name);
  const idScheda = (n: string) => `${base}-scheda-${nomi.indexOf(n)}`;
  const idTabella = `${base}-tabella`;
  const attiva = tabelle.find((t) => t.name === tabella) ?? tabelle[0];

  // Frecce, Home e Fine fra le schede, come nel pattern ARIA delle tab.
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = nomi.indexOf(attiva.name);
    const dest =
      e.key === 'ArrowRight'
        ? (i + 1) % nomi.length
        : e.key === 'ArrowLeft'
          ? (i - 1 + nomi.length) % nomi.length
          : e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? nomi.length - 1
              : -1;
    if (dest < 0) return;
    e.preventDefault();
    scegliTabella(nomi[dest]);
    schede.current[nomi[dest]]?.focus();
  };

  return (
    <>
      <div
        role="tablist"
        aria-label="Tabelle del database"
        className={colonna.schede}
        onKeyDown={onKeyDown}
      >
        {tabelle.map((t) => {
          const sel = t === attiva;
          const n = modificheTabella(t);
          return (
            <button
              key={t.name}
              ref={(el) => {
                schede.current[t.name] = el;
              }}
              type="button"
              role="tab"
              id={idScheda(t.name)}
              aria-selected={sel}
              aria-controls={idTabella}
              tabIndex={sel ? 0 : -1}
              className={clsx(colonna.scheda, sel && colonna.schedaAttiva)}
              onClick={() => scegliTabella(t.name)}
            >
              {t.name}
              {t.status === 'created' ? (
                <span className={styles.marca}>nuova</span>
              ) : (
                n > 0 && (
                  <span className={styles.marca}>
                    {n}
                    <span className={styles.srOnly}>
                      {n === 1 ? ' modifica' : ' modifiche'}
                    </span>
                  </span>
                )
              )}
            </button>
          );
        })}
      </div>
      <div
        role="tabpanel"
        id={idTabella}
        aria-labelledby={idScheda(attiva.name)}
        className={styles.corpo}
      >
        <Tabella t={attiva} seq={db.entry?.seq ?? 0} />
      </div>
    </>
  );
}

export function DatabaseContenuto({ db }: { db: DatabasePagina }): ReactNode {
  const { snapshot, seed, entry } = db;
  const tabelle = useMemo(() => snapshot?.tables ?? [], [snapshot]);
  const tolte = snapshot?.droppedTables ?? [];

  let corpo: ReactNode;
  if (snapshot === null) {
    corpo =
      seed.stato === 'errore' ? (
        <p className={styles.avviso}>
          Non riesco a leggere il database: {seed.messaggio}
        </p>
      ) : (
        <p className={styles.attesa}>Leggo le tabelle…</p>
      );
  } else if (tabelle.length === 0) {
    corpo = <p className={styles.attesa}>Il database non ha tabelle.</p>;
  } else {
    corpo = <Schede db={db} tabelle={tabelle} />;
  }

  return (
    <div
      data-pannello-db=""
      data-stato={entry ? 'dopo-run' : 'iniziale'}
      className={styles.pannello}
    >
      <Testa db={db} />
      {tolte.length > 0 && (
        <p className={styles.tolte} data-diff="removed">
          <FontAwesomeIcon icon={faMinus} aria-hidden />
          {tolte.length === 1 ? 'Tabella tolta: ' : 'Tabelle tolte: '}
          {tolte.join(', ')}
        </p>
      )}
      {corpo}
    </div>
  );
}
