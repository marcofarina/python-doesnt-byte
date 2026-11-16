/**
 * /quaderno — tutte le annotazioni dello studente, per volume e lezione
 * nell'ordine della TOC (piano pm/piano-2026-11-quaderno.md, fase Q3).
 *
 * - Filtro per colore e legenda: lo studente può dare un nome a ogni colore.
 * - Ogni voce porta alla lezione con `?annotazione=<id>` (lo legge
 *   l'Evidenziatore: scorre al testo e apre la scheda nel pannello Note).
 * - «Non ritrovo il punto»: annotazioni che all'ultima apertura della lezione
 *   non hanno ritrovato il testo (src/lib/quaderno/orfane.ts). «Pagina spostata
 *   o tolta»: annotazioni di pagine che non sono più nella TOC.
 * - Scarica il quaderno (Markdown con i dati in coda), importa un quaderno
 *   (unione, non sostituzione), cancella le note da questo browser.
 *
 * Tutto è locale: finché non c'è lo zaino (fasi Q4–Q5) il quaderno vive solo in
 * questo browser, e la pagina lo dice.
 */
import React, {
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from 'react';
import clsx from 'clsx';
import Head from '@docusaurus/Head';
import Link from '@docusaurus/Link';
import { useAllDocsData } from '@docusaurus/plugin-content-docs/client';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDownload,
  faFileImport,
  faHighlighter,
  faTrashCan,
} from '@fortawesome/free-solid-svg-icons';

import {
  useCurriculumPluginData,
  type CurriculumTreeItem,
} from '@site/src/contexts/CurriculumContext';
import { resolvePermalink } from '@site/src/lib/docResolve';
import {
  importa,
  impostaLegenda,
  leggiQuaderno,
  svuota,
  useQuaderno,
} from '@site/src/lib/quaderno/archivio';
import {
  TITOLO_NON_TROVATA,
  dataLunga,
  leggi,
  nomeFile,
  ordinaPerTesto,
  scrivi,
  type LezioneElenco,
} from '@site/src/lib/quaderno/file';
import { cancellaOrfane, useOrfane } from '@site/src/lib/quaderno/orfane';
import {
  COLORI,
  MAX_NOME_COLORE,
  type Annotazione,
  type Colore,
  type Quaderno,
} from '@site/src/lib/quaderno/tipi';

import styles from './quaderno.module.css';

const NOMI: Record<Colore, string> = {
  giallo: 'Giallo',
  verde: 'Verde',
  azzurro: 'Azzurro',
  rosa: 'Rosa',
};

/** Un file del quaderno pesa centinaia di KB: oltre questo non è il nostro. */
const MAX_FILE = 5 * 1024 * 1024;

function nomeColore(c: Colore, legenda: Quaderno['legenda']): string {
  return legenda[c] ? `${NOMI[c]} · ${legenda[c]}` : NOMI[c];
}

/* ─────────────── Elenco delle lezioni ─────────────── */

function appiattisci(
  volume: string,
  etichetta: string,
  albero: CurriculumTreeItem[],
  out: LezioneElenco[],
): LezioneElenco[] {
  for (const x of albero) {
    if (x.type === 'category') appiattisci(volume, etichetta, x.items, out);
    else out.push({ chiave: x.key, titolo: x.title, volume: etichetta });
  }
  return out;
}

/** Le lezioni di tutti i volumi, nell'ordine della TOC. */
function useLezioni(): LezioneElenco[] {
  const { volumes } = useCurriculumPluginData();
  return useMemo(
    () => volumes.flatMap((v) => appiattisci(v.id, v.label, v.tree, [])),
    [volumes],
  );
}

function usePermalink(): (chiave: string) => string | null {
  const dati = useAllDocsData();
  return (chiave) => {
    const i = chiave.indexOf('/');
    return i < 0
      ? null
      : resolvePermalink(dati, chiave.slice(0, i), chiave.slice(i + 1));
  };
}

/* ─────────────── Una voce ─────────────── */

function Voce({
  a,
  legenda,
  titolo,
  permalink,
}: {
  a: Annotazione;
  legenda: Quaderno['legenda'];
  /** Il titolo della lezione, quando la voce non sta sotto di lei. */
  titolo?: string;
  permalink: string | null;
}): ReactNode {
  const colore = a.colore;
  return (
    <li className={styles.voce} data-quaderno-voce={a.id}>
      <div className={styles.testata}>
        <span
          className={clsx(styles.pastiglia, colore && styles[colore])}
          aria-hidden="true"
        />
        <span className={styles.colore}>
          {colore ? nomeColore(colore, legenda) : 'Solo nota'}
        </span>
        <span className={styles.data}>{dataLunga(a.creata)}</span>
      </div>
      {titolo && <p className={styles.dove}>{titolo}</p>}
      <blockquote className={styles.citazione}>
        {a.selettore.esatto.replace(/\s+/g, ' ')}
      </blockquote>
      {a.nota && <p className={styles.nota}>{a.nota}</p>}
      {permalink && (
        <Link
          className={styles.vai}
          to={`${permalink}?annotazione=${encodeURIComponent(a.id)}`}
        >
          Vai al testo
        </Link>
      )}
    </li>
  );
}

/* ─────────────── Legenda ─────────────── */

function Legenda({ legenda }: { legenda: Quaderno['legenda'] }): ReactNode {
  const base = useId();
  return (
    <section className={styles.sezione} aria-labelledby={`${base}-t`}>
      <Heading as="h2" className={styles.titoletto} id={`${base}-t`}>
        Legenda dei colori
      </Heading>
      <p className={styles.spiega}>
        Il colore dice qualcosa solo a chi lo sceglie: dai un nome ai tuoi, per
        esempio «da ricordare» o «non ho capito».
      </p>
      <div className={styles.legenda}>
        {COLORI.map((c) => (
          <label key={c} className={styles.campo}>
            <span className={clsx(styles.pastiglia, styles[c])} aria-hidden />
            <span className={styles.nascosto}>
              Nome per il {NOMI[c].toLowerCase()}
            </span>
            <input
              type="text"
              className={styles.input}
              data-legenda={c}
              value={legenda[c]}
              maxLength={MAX_NOME_COLORE}
              placeholder={NOMI[c]}
              onChange={(e) => impostaLegenda(c, e.target.value)}
            />
          </label>
        ))}
      </div>
    </section>
  );
}

/* ─────────────── File e cancellazione ─────────────── */

type Messaggio = { tipo: 'ok' | 'errore'; testo: string } | null;

function plurale(n: number, uno: string, molte: string): string {
  return n === 1 ? uno : molte;
}

function Strumenti({
  vive,
  lezioni,
}: {
  vive: number;
  lezioni: LezioneElenco[];
}): ReactNode {
  const [messaggio, setMessaggio] = useState<Messaggio>(null);
  const [conferma, setConferma] = useState(false);
  const file = useRef<HTMLInputElement>(null);

  const scarica = () => {
    const testo = scrivi(leggiQuaderno(), lezioni, new Date());
    const blob = new Blob([testo], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nomeFile(new Date());
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessaggio({ tipo: 'ok', testo: 'Quaderno scaricato.' });
  };

  const scegli = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (f.size > MAX_FILE) {
      setMessaggio({
        tipo: 'errore',
        testo: 'Questo file è troppo grande per essere un quaderno.',
      });
      return;
    }
    const lettura = leggi(await f.text());
    if (lettura.ok === false) {
      setMessaggio({
        tipo: 'errore',
        testo:
          lettura.motivo === 'nuovo'
            ? 'Questo file l’ha scritto una versione più recente del sito: non lo posso leggere.'
            : 'Questo non sembra un file del quaderno, oppure i dati in fondo al file sono stati modificati.',
      });
      return;
    }
    const e2 = importa(lettura.quaderno);
    const parti: string[] = [];
    if (e2.arrivate === 0) parti.push('Nessuna annotazione nuova');
    else
      parti.push(
        `${e2.arrivate} ${plurale(e2.arrivate, 'annotazione arrivata', 'annotazioni arrivate')}`,
      );
    parti.push(
      e2.presenti === 0
        ? 'nessuna era già nel quaderno'
        : `${e2.presenti} ${plurale(e2.presenti, 'era già nel quaderno', 'erano già nel quaderno')}`,
    );
    if (e2.aggiornate > 0)
      parti.push(
        `${e2.aggiornate} ${plurale(e2.aggiornate, 'aggiornata', 'aggiornate')} con la versione del file`,
      );
    setMessaggio({ tipo: 'ok', testo: `${parti.join(', ')}.` });
  };

  const cancella = () => {
    svuota();
    cancellaOrfane();
    setConferma(false);
    setMessaggio({ tipo: 'ok', testo: 'Note cancellate da questo browser.' });
  };

  return (
    <section className={styles.sezione} aria-label="Scarica, importa, cancella">
      <div className={styles.azioni}>
        <button
          type="button"
          className={styles.bottone}
          data-azione="scarica"
          onClick={scarica}
          disabled={vive === 0}
        >
          <FontAwesomeIcon icon={faDownload} aria-hidden="true" />
          Scarica il quaderno
        </button>
        <button
          type="button"
          className={styles.bottone}
          data-azione="importa"
          onClick={() => file.current?.click()}
        >
          <FontAwesomeIcon icon={faFileImport} aria-hidden="true" />
          Importa un quaderno
        </button>
        <input
          ref={file}
          type="file"
          accept=".md,text/markdown,text/plain"
          className={styles.nascosto}
          data-importa-file=""
          aria-label="File del quaderno da importare"
          tabIndex={-1}
          onChange={scegli}
        />
        {!conferma && (
          <button
            type="button"
            className={clsx(styles.bottone, styles.pericolo)}
            data-azione="cancella"
            onClick={() => setConferma(true)}
            disabled={vive === 0}
          >
            <FontAwesomeIcon icon={faTrashCan} aria-hidden="true" />
            Cancella le note da questo browser
          </button>
        )}
      </div>
      {conferma && (
        <div
          className={styles.conferma}
          role="alertdialog"
          aria-label="Conferma"
        >
          <p>
            Cancello {vive} {plurale(vive, 'annotazione', 'annotazioni')} da
            questo browser? Non si può annullare: se non hai scaricato il
            quaderno, le perdi.
          </p>
          <div className={styles.azioni}>
            <button
              type="button"
              className={clsx(styles.bottone, styles.pericolo)}
              data-azione="conferma-cancella"
              onClick={cancella}
            >
              Cancella
            </button>
            <button
              type="button"
              className={styles.bottone}
              onClick={() => setConferma(false)}
            >
              Annulla
            </button>
          </div>
        </div>
      )}
      <p
        className={clsx(
          styles.messaggio,
          messaggio?.tipo === 'errore' && styles.errore,
        )}
        role="status"
        data-quaderno-messaggio=""
      >
        {messaggio?.testo ?? ''}
      </p>
    </section>
  );
}

/* ─────────────── Pagina ─────────────── */

interface Gruppo {
  chiave: string;
  titolo: string;
  lista: Annotazione[];
}

function Contenuto(): ReactNode {
  const q = useQuaderno();
  const orfane = useOrfane();
  const lezioni = useLezioni();
  const permalink = usePermalink();
  const [filtro, setFiltro] = useState<Colore | null>(null);

  const vive = q.annotazioni.filter((a) => !a.cancellata);
  const visibili = filtro ? vive.filter((a) => a.colore === filtro) : vive;

  const perLezione = (() => {
    const m = new Map(lezioni.map((l) => [l.chiave, l]));
    const principali = new Map<string, Annotazione[]>();
    const perse: Annotazione[] = [];
    const tolte: Annotazione[] = [];
    for (const a of visibili) {
      if (!m.has(a.pagina)) tolte.push(a);
      else if (orfane.has(a.id)) perse.push(a);
      else principali.set(a.pagina, [...(principali.get(a.pagina) ?? []), a]);
    }
    // Per volume, poi per lezione nell'ordine della TOC.
    const volumi: { volume: string; gruppi: Gruppo[] }[] = [];
    for (const l of lezioni) {
      const lista = principali.get(l.chiave);
      if (!lista) continue;
      let v = volumi[volumi.length - 1];
      if (!v || v.volume !== l.volume) {
        v = { volume: l.volume, gruppi: [] };
        volumi.push(v);
      }
      v.gruppi.push({
        chiave: l.chiave,
        titolo: l.titolo,
        lista: ordinaPerTesto(lista),
      });
    }
    return {
      volumi,
      perse: ordinaPerTesto(perse),
      tolte: ordinaPerTesto(tolte),
      titoli: m,
    };
  })();

  const conteggio = (c: Colore) => vive.filter((a) => a.colore === c).length;

  return (
    <>
      <div className={styles.avviso} data-quaderno-avviso="" role="note">
        <p>
          {vive.length === 1
            ? '1 annotazione salvata solo in questo browser.'
            : `${vive.length} annotazioni salvate solo in questo browser.`}{' '}
          Se cambi computer, o il browser cancella i suoi dati, non le ritrovi:
          scarica il quaderno e tienilo da parte.
        </p>
        <p>Se questo computer non è tuo, cancella le note quando hai finito.</p>
      </div>

      <Strumenti vive={vive.length} lezioni={lezioni} />
      <Legenda legenda={q.legenda} />

      <section className={styles.sezione} aria-label="Annotazioni">
        <div
          className={styles.filtro}
          role="group"
          aria-label="Filtra per colore"
        >
          <button
            type="button"
            className={styles.chip}
            aria-pressed={filtro === null}
            data-filtro="tutti"
            onClick={() => setFiltro(null)}
          >
            Tutti <span className={styles.conto}>{vive.length}</span>
          </button>
          {COLORI.map((c) => (
            <button
              key={c}
              type="button"
              className={styles.chip}
              aria-pressed={filtro === c}
              data-filtro={c}
              onClick={() => setFiltro(filtro === c ? null : c)}
            >
              <span className={clsx(styles.pastiglia, styles[c])} aria-hidden />
              {nomeColore(c, q.legenda)}{' '}
              <span className={styles.conto}>{conteggio(c)}</span>
            </button>
          ))}
        </div>

        {vive.length === 0 && (
          <p className={styles.vuoto}>
            Nessuna annotazione, per ora. Apri una lezione, seleziona un pezzo
            di testo e scegli un colore, oppure scrivici accanto una nota.
          </p>
        )}
        {vive.length > 0 && visibili.length === 0 && (
          <p className={styles.vuoto}>Nessuna annotazione di questo colore.</p>
        )}

        {perLezione.volumi.map((v) => (
          <div key={v.volume} className={styles.volume}>
            <Heading as="h2" className={styles.titoloVolume}>
              {v.volume}
            </Heading>
            {v.gruppi.map((g) => (
              <div key={g.chiave} className={styles.lezione}>
                <Heading as="h3" className={styles.titoloLezione}>
                  {permalink(g.chiave) ? (
                    <Link to={permalink(g.chiave)!}>{g.titolo}</Link>
                  ) : (
                    g.titolo
                  )}
                </Heading>
                <ul className={styles.elenco}>
                  {g.lista.map((a) => (
                    <Voce
                      key={a.id}
                      a={a}
                      legenda={q.legenda}
                      permalink={permalink(g.chiave)}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ))}

        {perLezione.perse.length > 0 && (
          <div className={styles.volume} data-quaderno-orfane="">
            <Heading as="h2" className={styles.titoloVolume}>
              Non ritrovo il punto
            </Heading>
            <p className={styles.spiega}>
              L’ultima volta che hai aperto la lezione, queste annotazioni non
              hanno ritrovato il loro testo: la lezione è stata corretta.
              Restano qui finché non le togli.
            </p>
            <ul className={styles.elenco}>
              {perLezione.perse.map((a) => (
                <Voce
                  key={a.id}
                  a={a}
                  legenda={q.legenda}
                  titolo={perLezione.titoli.get(a.pagina)?.titolo}
                  permalink={permalink(a.pagina)}
                />
              ))}
            </ul>
          </div>
        )}

        {perLezione.tolte.length > 0 && (
          <div className={styles.volume} data-quaderno-tolte="">
            <Heading as="h2" className={styles.titoloVolume}>
              {TITOLO_NON_TROVATA}
            </Heading>
            <p className={styles.spiega}>
              Queste annotazioni stanno in pagine che non sono più nel libro, o
              che sono cambiate di posto. Le citazioni restano qui.
            </p>
            <ul className={styles.elenco}>
              {perLezione.tolte.map((a) => (
                <Voce
                  key={a.id}
                  a={a}
                  legenda={q.legenda}
                  titolo={a.pagina}
                  permalink={permalink(a.pagina)}
                />
              ))}
            </ul>
          </div>
        )}
      </section>
    </>
  );
}

export default function PaginaQuaderno(): ReactNode {
  return (
    <Layout
      title="Quaderno"
      description="Le tue evidenziazioni e le tue note, lezione per lezione."
    >
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <main className={styles.pagina}>
        <Heading as="h1" className={styles.titolo}>
          <FontAwesomeIcon icon={faHighlighter} className={styles.icona} />
          Il tuo quaderno
        </Heading>
        <p className={styles.intro}>
          Qui ritrovi le evidenziazioni e le note che hai preso nelle lezioni.
        </p>
        <Contenuto />
      </main>
    </Layout>
  );
}
