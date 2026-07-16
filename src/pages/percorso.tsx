/**
 * /percorso — configuratore dei percorsi personalizzati.
 *
 * Doppio ruolo sulla stessa pagina:
 *  - Studente: incolla il codice ricevuto dal docente e lo attiva.
 *  - Docente: costruisce la selezione (volume → capitolo tri-state →
 *    lezione), parte da un preset o dal libro intero, e ottiene il codice
 *    deterministico da distribuire (targhetta live + copia codice/link).
 *
 * La selezione codifica solo lezioni: le pagine sempre visibili (intro dei
 * volumi) appaiono spuntate e disabilitate. Spec e semantica:
 * pm/design-percorsi-personalizzati.md.
 */
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import copy from 'copy-text-to-clipboard';

import {
  useCurriculum,
  useCurriculumPluginData,
  type CurriculumTreeItem,
} from '@site/src/contexts/CurriculumContext';
import { CurriculumCodeError } from '@site/src/lib/curriculumCode';
import { codeFromKeys, keysFromCode } from '@site/src/lib/curriculumSelection';

import styles from './percorso.module.css';

// ── Helper puri ─────────────────────────────────────────────────────────────

function collectKeys(
  items: CurriculumTreeItem[],
  out: string[] = [],
): string[] {
  for (const item of items) {
    if (item.type === 'doc') out.push(item.key);
    else collectKeys(item.items, out);
  }
  return out;
}

function copyText(text: string): void {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).catch(() => copy(text));
  } else {
    copy(text);
  }
}

function errorMessage(e: unknown): string {
  if (e instanceof CurriculumCodeError) {
    switch (e.reason) {
      case 'crc':
        return 'Codice non valido: controlla di averlo copiato per intero.';
      case 'version':
      case 'epoch':
        return 'Il codice arriva da una versione più nuova del sito: ricarica la pagina e riprova.';
      default:
        return 'Questo non sembra un codice percorso.';
    }
  }
  return 'Codice non riconosciuto.';
}

// ── Checkbox tri-state ──────────────────────────────────────────────────────

function TriCheckbox({
  checked,
  indeterminate,
  disabled,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
  ariaLabel: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = Boolean(indeterminate);
  }, [indeterminate]);
  return (
    <input
      ref={ref}
      type="checkbox"
      className={styles.checkbox}
      checked={checked}
      disabled={disabled}
      aria-label={ariaLabel}
      onChange={(e) => onChange(e.target.checked)}
    />
  );
}

// ── Albero del configuratore ────────────────────────────────────────────────

function TreeNodes({
  items,
  selection,
  alwaysVisible,
  onToggleDoc,
  onToggleGroup,
}: {
  items: CurriculumTreeItem[];
  selection: ReadonlySet<string>;
  alwaysVisible: ReadonlySet<string>;
  onToggleDoc: (key: string, next: boolean) => void;
  onToggleGroup: (keys: string[], next: boolean) => void;
}) {
  return (
    <ul className={styles.tree}>
      {items.map((item) => {
        if (item.type === 'doc') {
          const forced = alwaysVisible.has(item.key);
          return (
            <li key={item.key} className={styles.leaf}>
              <label className={styles.leafLabel}>
                <TriCheckbox
                  checked={forced || selection.has(item.key)}
                  disabled={forced}
                  ariaLabel={item.title}
                  onChange={(next) => onToggleDoc(item.key, next)}
                />
                <span className={forced ? styles.leafForced : undefined}>
                  {item.title}
                  {forced && (
                    <span className={styles.forcedNote}>
                      {' '}
                      · sempre visibile
                    </span>
                  )}
                </span>
              </label>
            </li>
          );
        }
        const keys = collectKeys(item.items).filter(
          (k) => !alwaysVisible.has(k),
        );
        const chosen = keys.filter((k) => selection.has(k)).length;
        return (
          <li key={item.label} className={styles.branch}>
            <label className={styles.branchLabel}>
              <TriCheckbox
                checked={keys.length > 0 && chosen === keys.length}
                indeterminate={chosen > 0 && chosen < keys.length}
                ariaLabel={`Capitolo: ${item.label}`}
                onChange={(next) => onToggleGroup(keys, next)}
              />
              <span>{item.label}</span>
            </label>
            <TreeNodes
              items={item.items}
              selection={selection}
              alwaysVisible={alwaysVisible}
              onToggleDoc={onToggleDoc}
              onToggleGroup={onToggleGroup}
            />
          </li>
        );
      })}
    </ul>
  );
}

// ── Sezione studente ────────────────────────────────────────────────────────

function StudentCard({
  presetLabelOf,
}: {
  presetLabelOf: (code: string) => string | null;
}) {
  const { code, setCode, clear } = useCurriculum();
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const startUrl = useBaseUrl('/programmatore');

  const activate = () => {
    try {
      setCode(draft);
      setDraft('');
      setError(null);
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  if (code) {
    const presetLabel = presetLabelOf(code);
    return (
      <section className={styles.studentCard} aria-label="Percorso attivo">
        <div className={styles.studentActive}>
          <FontAwesomeIcon
            icon={['fas', 'circle-check']}
            className={styles.activeIcon}
            aria-hidden="true"
          />
          <div className={styles.studentActiveBody}>
            <p className={styles.studentTitle}>
              Percorso attivo{presetLabel ? `: ${presetLabel}` : ''}
            </p>
            <p className={styles.codePlate} translate="no">
              {code}
            </p>
          </div>
          <span className={styles.studentActions}>
            <Link className={styles.primaryBtn} to={startUrl}>
              Inizia a studiare
            </Link>
            <button type="button" className={styles.ghostBtn} onClick={clear}>
              Rimuovi percorso
            </button>
          </span>
        </div>
      </section>
    );
  }

  return (
    <section
      className={styles.studentCard}
      aria-label="Attiva un codice percorso"
    >
      <p className={styles.studentTitle}>Hai ricevuto un codice dal docente?</p>
      <form
        className={styles.studentForm}
        onSubmit={(e) => {
          e.preventDefault();
          activate();
        }}
      >
        <input
          type="text"
          className={styles.codeInput}
          value={draft}
          placeholder="PDB1-…"
          spellCheck={false}
          autoComplete="off"
          aria-label="Codice percorso"
          onChange={(e) => {
            setDraft(e.target.value);
            setError(null);
          }}
        />
        <button
          type="submit"
          className={styles.primaryBtn}
          disabled={draft.trim().length === 0}
        >
          Attiva
        </button>
      </form>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </section>
  );
}

// ── Pagina ──────────────────────────────────────────────────────────────────

export default function PercorsoPage(): ReactNode {
  const data = useCurriculumPluginData();
  const { code } = useCurriculum();
  const { siteConfig } = useDocusaurusContext();
  const percorsoUrl = useBaseUrl('/percorso');

  const allKeys = useMemo(
    () => data.volumes.flatMap((v) => collectKeys(v.tree)),
    [data],
  );
  const alwaysVisibleSet = useMemo(() => new Set(data.alwaysVisible), [data]);

  // Selezione del docente: parte dal libro intero. Le sempre-visibili sono
  // tenute DENTRO la selezione (il codice canonico dei preset le include).
  const [selection, setSelection] = useState<ReadonlySet<string>>(
    () => new Set(allKeys),
  );
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const copiedTimer = useRef<ReturnType<typeof setTimeout>>();

  const liveCode = useMemo(
    () => codeFromKeys(selection, data.manifest),
    [selection, data],
  );

  // Codici canonici dei preset (deterministici → confronto stringa).
  const presetCodes = useMemo(
    () =>
      data.presets.map((p) => ({
        ...p,
        code: codeFromKeys(new Set(p.keys), data.manifest),
      })),
    [data],
  );
  const presetLabelOf = useCallback(
    (c: string) => presetCodes.find((p) => p.code === c)?.label ?? null,
    [presetCodes],
  );

  const shareLink = `${siteConfig.url}${percorsoUrl}?percorso=${liveCode}`;
  const lessonCount = allKeys.filter(
    (k) => selection.has(k) && !alwaysVisibleSet.has(k),
  ).length;
  const lessonTotal = allKeys.filter((k) => !alwaysVisibleSet.has(k)).length;

  const toggleDoc = useCallback((key: string, next: boolean) => {
    setSelection((prev) => {
      const out = new Set(prev);
      if (next) out.add(key);
      else out.delete(key);
      return out;
    });
  }, []);

  const toggleGroup = useCallback((keys: string[], next: boolean) => {
    setSelection((prev) => {
      const out = new Set(prev);
      for (const k of keys) {
        if (next) out.add(k);
        else out.delete(k);
      }
      return out;
    });
  }, []);

  const applyImport = useCallback(
    (raw: string) => {
      try {
        const imported = keysFromCode(raw, data.manifest);
        setSelection(new Set([...imported, ...data.alwaysVisible]));
        setImportError(null);
      } catch (e) {
        setImportError(errorMessage(e));
      }
    },
    [data],
  );

  const markCopied = (what: 'code' | 'link') => {
    setCopied(what);
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Layout
      title="Percorso"
      description="Configura un percorso personalizzato: scegli le lezioni e ottieni un codice da condividere con la classe."
    >
      <main className={styles.page}>
        <header className={styles.header}>
          <p className={styles.kicker}>Percorsi personalizzati</p>
          <Heading as="h1" className={styles.title}>
            Il libro, su misura
          </Heading>
          <p className={styles.lede}>
            Il docente sceglie le lezioni e ottiene un codice. Chi lo inserisce
            vede il libro esattamente come è stato pensato per la sua classe —
            tutto il resto rimane a portata di link.
          </p>
        </header>

        <StudentCard presetLabelOf={presetLabelOf} />

        <section className={styles.teacher} aria-label="Costruisci un percorso">
          <div className={styles.teacherHead}>
            <Heading as="h2" className={styles.teacherTitle}>
              Costruisci un percorso
            </Heading>
            <p className={styles.teacherLede}>
              Parti da un preset o dal libro intero, poi togli e aggiungi
              lezioni. Il codice qui accanto si aggiorna da solo.
            </p>
            <div className={styles.presets} role="group" aria-label="Preset">
              {presetCodes.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`${styles.presetBtn} ${
                    p.code === liveCode ? styles.presetActive : ''
                  }`}
                  aria-pressed={p.code === liveCode}
                  onClick={() => applyImport(p.code)}
                >
                  {p.label}
                </button>
              ))}
              <button
                type="button"
                className={`${styles.presetBtn} ${
                  selection.size === allKeys.length ? styles.presetActive : ''
                }`}
                aria-pressed={selection.size === allKeys.length}
                onClick={() => setSelection(new Set(allKeys))}
              >
                Libro intero
              </button>
              {code && code !== liveCode && (
                <button
                  type="button"
                  className={styles.presetBtn}
                  onClick={() => applyImport(code)}
                >
                  Importa il codice attivo
                </button>
              )}
            </div>
            {importError && (
              <p className={styles.error} role="alert">
                {importError}
              </p>
            )}
          </div>

          <div className={styles.workbench}>
            <div className={styles.volumes}>
              {data.volumes.map((volume) => {
                const keys = collectKeys(volume.tree).filter(
                  (k) => !alwaysVisibleSet.has(k),
                );
                const chosen = keys.filter((k) => selection.has(k)).length;
                return (
                  <section key={volume.id} className={styles.volume}>
                    <label className={styles.volumeLabel}>
                      <TriCheckbox
                        checked={keys.length > 0 && chosen === keys.length}
                        indeterminate={chosen > 0 && chosen < keys.length}
                        ariaLabel={`Volume: ${volume.label}`}
                        onChange={(next) => toggleGroup(keys, next)}
                      />
                      <span className={styles.volumeName}>{volume.label}</span>
                    </label>
                    <TreeNodes
                      items={volume.tree}
                      selection={selection}
                      alwaysVisible={alwaysVisibleSet}
                      onToggleDoc={toggleDoc}
                      onToggleGroup={toggleGroup}
                    />
                  </section>
                );
              })}
            </div>

            <aside className={styles.codePanel} aria-label="Codice percorso">
              <p className={styles.codeCount}>
                {lessonCount} lezioni su {lessonTotal}
                {presetLabelOf(liveCode) && (
                  <span className={styles.codePreset}>
                    {' '}
                    · preset {presetLabelOf(liveCode)}
                  </span>
                )}
              </p>
              <p className={styles.codePlateLive} translate="no">
                {liveCode}
              </p>
              <div className={styles.codeActions}>
                <button
                  type="button"
                  className={styles.primaryBtn}
                  onClick={() => {
                    copyText(liveCode);
                    markCopied('code');
                  }}
                >
                  {copied === 'code' ? 'Copiato' : 'Copia codice'}
                </button>
                <button
                  type="button"
                  className={styles.ghostBtn}
                  onClick={() => {
                    copyText(shareLink);
                    markCopied('link');
                  }}
                >
                  {copied === 'link' ? 'Copiato' : 'Copia link'}
                </button>
              </div>
              <p className={styles.codeHint}>
                Gli studenti lo inseriscono qui sopra, oppure aprono il link e
                trovano il percorso già attivo.
              </p>
            </aside>
          </div>
        </section>
      </main>
    </Layout>
  );
}
