/**
 * /zaino — la sincronizzazione cifrata del sito (piano
 * pm/piano-2026-11-quaderno.md, fase Q5). Lo zaino porta lo stato dello
 * studente (oggi il quaderno, poi i progressi di PyQuest) su ogni dispositivo,
 * senza account: il browser cifra tutto con una chiave derivata dal codice e
 * al servizio arriva solo un blocco illeggibile.
 *
 * - Crea: genera il codice e lo mostra con link e QR; senza il codice lo zaino
 *   è perso, e la pagina lo dice prima di tutto il resto.
 * - Apri: campo per il codice. Un link `#codice=…` lo compila e toglie il
 *   frammento dall'indirizzo; aprire resta un gesto dello studente, così da
 *   poter spuntare «Non è il mio computer» (modalità temporanea: tutto in
 *   `sessionStorage`, sparisce con la scheda).
 * - Con lo zaino collegato: stato, contenuto, codice, cambio codice, uscita,
 *   cancellazione.
 *
 * Solo `src/lib/zaino/sincronizza.ts` parla con il servizio.
 */
import React, {
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';
import clsx from 'clsx';
import Head from '@docusaurus/Head';
import Link from '@docusaurus/Link';
import useIsBrowser from '@docusaurus/useIsBrowser';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBoxArchive,
  faCopy,
  faEye,
  faEyeSlash,
  faRightFromBracket,
  faTrashCan,
} from '@fortawesome/free-solid-svg-icons';
import QRCode from 'qrcode';

import ZainoStato from '@site/src/components/ZainoStato';
import { useQuaderno } from '@site/src/lib/quaderno/archivio';
import { useArea } from '@site/src/lib/zaino/area';
import {
  formattaCodice,
  normalizzaCodice,
  zainoSupportato,
} from '@site/src/lib/zaino/cifra';
import {
  MAX_BLOB,
  apri,
  cambiaCodice,
  cancella,
  crea,
  esci,
  useCodiceZaino,
  useStatoZaino,
  type EsitoApri,
  type EsitoCambia,
} from '@site/src/lib/zaino/sincronizza';

import styles from './zaino.module.css';

type Messaggio = { tipo: 'ok' | 'errore'; testo: string } | null;

const TESTI_APRI: Record<Exclude<EsitoApri, 'aperto'>, string> = {
  'non-supportato':
    'Questo browser non sa aprire lo zaino: serve una connessione https.',
  'gia-collegato': 'Questo browser ha già uno zaino aperto.',
  'codice-non-valido':
    'Il codice non è scritto bene: sono quattro parole, separate da spazi o trattini. Di ogni parola bastano le prime quattro lettere. I codici degli zaini più vecchi sono invece 20 caratteri, fra lettere e numeri.',
  inesistente:
    'Non trovo nessuno zaino con questo codice. Controlla di averlo scritto giusto.',
  offline: 'Non riesco a raggiungere il servizio: controlla la rete.',
  servizio: 'Il servizio dello zaino non risponde. Riprova fra un po’.',
  illeggibile: 'Lo zaino c’è, ma questo codice non lo apre.',
  aggiorna:
    'Questo zaino l’ha scritto una versione più recente del sito: ricarica la pagina e riprova.',
};

const TESTI_CAMBIA: Record<
  Extract<EsitoCambia, { ok: false }>['motivo'],
  string
> = {
  'non-collegato': 'Questo browser non ha uno zaino aperto.',
  'non-sincronizzato':
    'Prima di cambiare il codice le note devono essere tutte nello zaino: aspetta la sincronizzazione e riprova.',
  pieno:
    'Lo zaino è pieno: scarica il quaderno e cancella le annotazioni vecchie.',
  servizio: 'Il servizio dello zaino non risponde. Riprova fra un po’.',
  offline: 'Non riesco a raggiungere il servizio: controlla la rete.',
};

function plurale(n: number, uno: string, molte: string): string {
  return n === 1 ? uno : molte;
}

function chilobyte(byte: number): string {
  return `${(byte / 1024).toLocaleString('it-IT', { maximumFractionDigits: 1 })} KB`;
}

async function copia(testo: string): Promise<boolean> {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(testo);
      return true;
    }
    const { default: copy } = await import('copy-text-to-clipboard');
    return copy(testo);
  } catch {
    return false;
  }
}

/* ─────────────── Codice, link e QR ─────────────── */

function BloccoCodice({ codice }: { codice: string }): ReactNode {
  const percorso = useBaseUrl('/zaino/');
  const [link, setLink] = useState('');
  const [svg, setSvg] = useState<string | null>(null);
  const [copiato, setCopiato] = useState<'codice' | 'link' | 'no' | null>(null);

  useEffect(() => {
    setLink(`${window.location.origin}${percorso}#codice=${codice}`);
  }, [percorso, codice]);

  useEffect(() => {
    if (!link) return undefined;
    let vivo = true;
    QRCode.toString(link, {
      type: 'svg',
      errorCorrectionLevel: 'M',
      margin: 2,
    }).then((s) => {
      if (vivo) setSvg(s);
    });
    return () => {
      vivo = false;
    };
  }, [link]);

  const copiaCosa = async (cosa: 'codice' | 'link') => {
    const ok = await copia(cosa === 'codice' ? formattaCodice(codice) : link);
    setCopiato(ok ? cosa : 'no');
  };

  return (
    <div className={styles.blocco} data-zaino-blocco="">
      <p className={styles.codice} translate="no" data-zaino-codice="">
        {formattaCodice(codice)}
      </p>
      <div className={styles.azioni}>
        <button
          type="button"
          className={styles.bottone}
          data-azione="copia-codice"
          onClick={() => copiaCosa('codice')}
        >
          <FontAwesomeIcon icon={faCopy} aria-hidden="true" />
          Copia il codice
        </button>
        <button
          type="button"
          className={styles.bottone}
          data-azione="copia-link"
          onClick={() => copiaCosa('link')}
        >
          <FontAwesomeIcon icon={faCopy} aria-hidden="true" />
          Copia il link
        </button>
      </div>
      <p className={styles.messaggio} role="status">
        {copiato === 'codice' && 'Codice copiato.'}
        {copiato === 'link' && 'Link copiato.'}
        {copiato === 'no' && 'Non sono riuscito a copiare: selezionalo a mano.'}
      </p>
      <p className={styles.spiega}>
        Il link apre questa pagina con il codice già scritto. Il QR porta lo
        zaino dal computer al telefono: inquadralo con la fotocamera.
      </p>
      {svg && (
        <div
          className={styles.qr}
          data-zaino-qr=""
          role="img"
          aria-label="QR code del link allo zaino"
          // SVG generato in locale dalla libreria qrcode sul link dello zaino.
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      )}
    </div>
  );
}

/* ─────────────── Zaino scollegato ─────────────── */

function Crea({ onCreato }: { onCreato: (codice: string) => void }): ReactNode {
  const [occupato, setOccupato] = useState(false);
  const [messaggio, setMessaggio] = useState<Messaggio>(null);

  const clic = async () => {
    setOccupato(true);
    setMessaggio(null);
    try {
      onCreato(await crea());
    } catch {
      setMessaggio({
        tipo: 'errore',
        testo: 'Non sono riuscito a creare lo zaino. Riprova fra un po’.',
      });
    } finally {
      setOccupato(false);
    }
  };

  return (
    <section className={styles.scheda} aria-labelledby="zaino-crea">
      <Heading as="h2" className={styles.titoletto} id="zaino-crea">
        Crea il tuo zaino
      </Heading>
      <p className={styles.spiega}>
        Il sito sceglie a caso un codice di quattro parole, per esempio{' '}
        <span translate="no">volpe-faro-miele-trono</span>, e ci mette dentro le
        note che hai già in questo browser. Sugli altri dispositivi apri lo
        zaino con quel codice.
      </p>
      <p className={styles.avvertenza}>
        Il codice non si può recuperare. Se lo perdi su tutti i dispositivi, lo
        zaino è perso: nemmeno chi gestisce il sito può aprirlo.
      </p>
      <div className={styles.azioni}>
        <button
          type="button"
          className={clsx(styles.bottone, styles.primario)}
          data-azione="crea"
          onClick={clic}
          disabled={occupato}
        >
          <FontAwesomeIcon icon={faBoxArchive} aria-hidden="true" />
          {occupato ? 'Creo lo zaino…' : 'Crea lo zaino'}
        </button>
      </div>
      <p
        className={clsx(
          styles.messaggio,
          messaggio?.tipo === 'errore' && styles.errore,
        )}
        role="status"
      >
        {messaggio?.testo ?? ''}
      </p>
    </section>
  );
}

function Apri({ scrittoIniziale }: { scrittoIniziale: string }): ReactNode {
  const [scritto, setScritto] = useState(scrittoIniziale);
  const [temporaneo, setTemporaneo] = useState(false);
  const [occupato, setOccupato] = useState(false);
  const [messaggio, setMessaggio] = useState<Messaggio>(null);

  const invia = async (e: FormEvent) => {
    e.preventDefault();
    setOccupato(true);
    setMessaggio(null);
    try {
      const esito = await apri(scritto, { temporaneo });
      if (esito !== 'aperto')
        setMessaggio({ tipo: 'errore', testo: TESTI_APRI[esito] });
    } finally {
      setOccupato(false);
    }
  };

  return (
    <section className={styles.scheda} aria-labelledby="zaino-apri">
      <Heading as="h2" className={styles.titoletto} id="zaino-apri">
        Apri il tuo zaino qui
      </Heading>
      <p className={styles.spiega}>
        Scrivi le quattro parole del codice che hai ricevuto quando hai creato
        lo zaino, oppure apri da qui il link o il QR che ti sei mandato. Di ogni
        parola bastano le prime quattro lettere; maiuscole e accenti non
        contano.
      </p>
      <form onSubmit={invia} className={styles.modulo}>
        <label className={styles.etichetta} htmlFor="zaino-codice">
          Codice dello zaino
        </label>
        <input
          id="zaino-codice"
          type="text"
          className={clsx(styles.input, styles.inputCodice)}
          data-zaino-input=""
          value={scritto}
          onChange={(e) => setScritto(e.target.value)}
          placeholder="parola parola parola parola"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          translate="no"
        />
        <label className={styles.casella}>
          <input
            type="checkbox"
            data-zaino-temporaneo=""
            checked={temporaneo}
            onChange={(e) => setTemporaneo(e.target.checked)}
          />
          <span>
            Non è il mio computer
            <span className={styles.spiegaPiccola}>
              Lo zaino resta aperto solo in questa scheda e sparisce quando la
              chiudi. Le note già salvate in questo browser non si toccano.
            </span>
          </span>
        </label>
        <div className={styles.azioni}>
          <button
            type="submit"
            className={clsx(styles.bottone, styles.primario)}
            data-azione="apri"
            disabled={occupato || scritto.trim() === ''}
          >
            {occupato ? 'Apro lo zaino…' : 'Apri lo zaino'}
          </button>
        </div>
      </form>
      <p
        className={clsx(
          styles.messaggio,
          messaggio?.tipo === 'errore' && styles.errore,
        )}
        role="status"
        data-zaino-messaggio=""
      >
        {messaggio?.testo ?? ''}
      </p>
    </section>
  );
}

/* ─────────────── Zaino collegato ─────────────── */

function Contenuto(): ReactNode {
  const stato = useStatoZaino();
  const q = useQuaderno();
  const vive = q.annotazioni.filter((a) => !a.cancellata).length;
  const usato = stato.byte;
  const perCento = usato === null ? 0 : Math.min(100, (usato / MAX_BLOB) * 100);

  return (
    <section className={styles.scheda} aria-labelledby="zaino-dentro">
      <Heading as="h2" className={styles.titoletto} id="zaino-dentro">
        Che cosa c’è nello zaino
      </Heading>
      <ul className={styles.righe} data-zaino-contenuto="">
        <li>
          Quaderno: {vive} {plurale(vive, 'annotazione', 'annotazioni')}
        </li>
      </ul>
      {usato !== null && (
        <>
          <div
            className={styles.misura}
            role="meter"
            aria-label="Spazio usato nello zaino"
            aria-valuemin={0}
            aria-valuemax={MAX_BLOB}
            aria-valuenow={usato}
          >
            <span
              className={clsx(
                styles.riempi,
                perCento > 85 && styles.quasiPieno,
              )}
              style={{ width: `${perCento}%` }}
            />
          </div>
          <p className={styles.spiegaPiccola} data-zaino-spazio="">
            {chilobyte(usato)} usati su {chilobyte(MAX_BLOB)}.
          </p>
        </>
      )}
    </section>
  );
}

function Collegato({
  codice,
  temporanea,
  codiceNuovo,
  onFinito,
}: {
  codice: string;
  temporanea: boolean;
  /** Il codice appena creato o cambiato: si mostra finché non si lascia la pagina. */
  codiceNuovo: { codice: string; titolo: string } | null;
  onFinito: () => void;
}): ReactNode {
  const stato = useStatoZaino();
  const [mostra, setMostra] = useState(false);
  const [confermaCosa, setConfermaCosa] = useState<
    'esci' | 'cancella' | 'cambia' | null
  >(null);
  const [occupato, setOccupato] = useState(false);
  const [messaggio, setMessaggio] = useState<Messaggio>(null);
  const [cambiato, setCambiato] = useState<{
    codice: string;
    vecchioCancellato: boolean;
  } | null>(null);

  const codiceVisibile = cambiato?.codice ?? codiceNuovo?.codice ?? null;
  const salvo = stato.fase === 'sincronizzato' && !stato.inSospeso;

  const faiEsci = async () => {
    setOccupato(true);
    await esci();
    setOccupato(false);
    onFinito();
  };

  const faiCancella = async () => {
    setOccupato(true);
    const fatto = await cancella();
    setOccupato(false);
    setConfermaCosa(null);
    if (fatto) onFinito();
    else
      setMessaggio({
        tipo: 'errore',
        testo: 'Non sono riuscito a cancellare lo zaino: riprova fra un po’.',
      });
  };

  const faiCambia = async () => {
    setOccupato(true);
    setMessaggio(null);
    const esito = await cambiaCodice();
    setOccupato(false);
    setConfermaCosa(null);
    if ('motivo' in esito) {
      setMessaggio({ tipo: 'errore', testo: TESTI_CAMBIA[esito.motivo] });
    } else {
      setCambiato({
        codice: esito.codice,
        vecchioCancellato: esito.vecchioCancellato,
      });
    }
  };

  return (
    <>
      {codiceVisibile && (
        <section
          className={clsx(styles.scheda, styles.evidenza)}
          aria-labelledby="zaino-nuovo"
          data-zaino-nuovo=""
        >
          <Heading as="h2" className={styles.titoletto} id="zaino-nuovo">
            {cambiato
              ? 'Il tuo codice nuovo'
              : (codiceNuovo?.titolo ?? 'Zaino creato')}
          </Heading>
          <p className={styles.avvertenza}>
            Salva il codice adesso. Senza di lui lo zaino è perso, e non c’è
            modo di recuperarlo: mandati il link per email, scrivi le parole sul
            diario o imparale a memoria.
          </p>
          {cambiato && (
            <p className={styles.spiega} data-zaino-cambiato="">
              {cambiato.vecchioCancellato
                ? 'Il codice vecchio non apre più niente.'
                : 'Lo zaino vecchio non sono riuscito a cancellarlo: il suo codice è ancora valido. Cancellalo più tardi da «Cancella lo zaino» con il codice vecchio.'}{' '}
              Sugli altri dispositivi riapri lo zaino con il codice nuovo.
            </p>
          )}
          <BloccoCodice codice={codiceVisibile} />
        </section>
      )}

      <section className={styles.scheda} aria-labelledby="zaino-stato">
        <Heading as="h2" className={styles.titoletto} id="zaino-stato">
          {temporanea ? 'Zaino aperto in questa scheda' : 'Zaino collegato'}
        </Heading>
        {temporanea && (
          <p className={styles.spiega}>
            Computer non tuo: il codice non è salvato in questo browser e le
            note spariscono con la scheda. Per riaprire lo zaino ti serve il
            codice.
          </p>
        )}
        <div className={styles.stato}>
          <ZainoStato />
        </div>
      </section>

      <Contenuto />

      {!temporanea && !codiceVisibile && (
        <section className={styles.scheda} aria-labelledby="zaino-mostra">
          <Heading as="h2" className={styles.titoletto} id="zaino-mostra">
            Il codice
          </Heading>
          <p className={styles.spiega}>
            Ti serve per aprire lo zaino su un altro dispositivo. Mostralo solo
            quando nessuno guarda lo schermo.
          </p>
          <div className={styles.azioni}>
            <button
              type="button"
              className={styles.bottone}
              data-azione="mostra-codice"
              aria-expanded={mostra}
              onClick={() => setMostra((m) => !m)}
            >
              <FontAwesomeIcon
                icon={mostra ? faEyeSlash : faEye}
                aria-hidden="true"
              />
              {mostra ? 'Nascondi il codice' : 'Mostra il codice'}
            </button>
          </div>
          {mostra && <BloccoCodice codice={codice} />}
        </section>
      )}

      <section className={styles.scheda} aria-labelledby="zaino-gestisci">
        <Heading as="h2" className={styles.titoletto} id="zaino-gestisci">
          Gestisci lo zaino
        </Heading>

        <div className={styles.gestione}>
          <div>
            <p className={styles.nomeAzione}>Cambia codice</p>
            <p className={styles.spiega}>
              Se il codice è finito a qualcuno che non deve averlo, cambialo: il
              sito crea uno zaino nuovo con le stesse note e cancella quello
              vecchio. Il codice nuovo è di quattro parole, anche se quello
              vecchio era di 20 caratteri. Sugli altri dispositivi riapri lo
              zaino con il codice nuovo.
            </p>
            {confermaCosa === 'cambia' ? (
              <div
                className={styles.conferma}
                role="alertdialog"
                aria-label="Conferma"
              >
                <p>Creo uno zaino nuovo e cancello quello vecchio?</p>
                <div className={styles.azioni}>
                  <button
                    type="button"
                    className={clsx(styles.bottone, styles.primario)}
                    data-azione="conferma-cambia"
                    onClick={faiCambia}
                    disabled={occupato}
                  >
                    {occupato ? 'Cambio il codice…' : 'Cambia codice'}
                  </button>
                  <button
                    type="button"
                    className={styles.bottone}
                    onClick={() => setConfermaCosa(null)}
                  >
                    Annulla
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.azioni}>
                <button
                  type="button"
                  className={styles.bottone}
                  data-azione="cambia"
                  onClick={() => setConfermaCosa('cambia')}
                >
                  Cambia codice
                </button>
              </div>
            )}
          </div>

          <div>
            <p className={styles.nomeAzione}>Esci dallo zaino</p>
            <p className={styles.spiega}>
              Toglie da questo browser il codice e le note. Lo zaino resta com’è
              e lo riapri con il codice.
            </p>
            {confermaCosa === 'esci' ? (
              <div
                className={styles.conferma}
                role="alertdialog"
                aria-label="Conferma"
              >
                <p>
                  {salvo
                    ? 'Esco dallo zaino e tolgo le note da questo browser?'
                    : 'Alcune modifiche non sono ancora nello zaino: uscendo ora le perdi. Esco lo stesso?'}
                </p>
                <div className={styles.azioni}>
                  <button
                    type="button"
                    className={clsx(styles.bottone, styles.pericolo)}
                    data-azione="conferma-esci"
                    onClick={faiEsci}
                    disabled={occupato}
                  >
                    Esci
                  </button>
                  <button
                    type="button"
                    className={styles.bottone}
                    onClick={() => setConfermaCosa(null)}
                  >
                    Annulla
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.azioni}>
                <button
                  type="button"
                  className={styles.bottone}
                  data-azione="esci"
                  onClick={() => setConfermaCosa('esci')}
                >
                  <FontAwesomeIcon
                    icon={faRightFromBracket}
                    aria-hidden="true"
                  />
                  Esci dallo zaino
                </button>
              </div>
            )}
          </div>

          <div>
            <p className={styles.nomeAzione}>Cancella lo zaino</p>
            <p className={styles.spiega}>
              Cancella lo zaino dal servizio, per sempre: gli altri dispositivi
              non lo troveranno più.{' '}
              {temporanea
                ? 'Su questo computer le note spariscono insieme allo zaino: scarica prima il quaderno.'
                : 'Su questo browser le note restano.'}
            </p>
            {confermaCosa === 'cancella' ? (
              <div
                className={styles.conferma}
                role="alertdialog"
                aria-label="Conferma"
              >
                <p>
                  Cancello lo zaino dal servizio? Non si può annullare.
                  {temporanea && ' Le note di questa scheda spariranno.'}
                </p>
                <div className={styles.azioni}>
                  <button
                    type="button"
                    className={clsx(styles.bottone, styles.pericolo)}
                    data-azione="conferma-cancella-zaino"
                    onClick={faiCancella}
                    disabled={occupato}
                  >
                    <FontAwesomeIcon icon={faTrashCan} aria-hidden="true" />
                    Cancella lo zaino
                  </button>
                  <button
                    type="button"
                    className={styles.bottone}
                    onClick={() => setConfermaCosa(null)}
                  >
                    Annulla
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.azioni}>
                <button
                  type="button"
                  className={clsx(styles.bottone, styles.pericolo)}
                  data-azione="cancella-zaino"
                  onClick={() => setConfermaCosa('cancella')}
                >
                  <FontAwesomeIcon icon={faTrashCan} aria-hidden="true" />
                  Cancella lo zaino
                </button>
              </div>
            )}
          </div>
        </div>
        <p
          className={clsx(
            styles.messaggio,
            messaggio?.tipo === 'errore' && styles.errore,
          )}
          role="status"
          data-zaino-messaggio=""
        >
          {messaggio?.testo ?? ''}
        </p>
      </section>
    </>
  );
}

/* ─────────────── Pagina ─────────────── */

/** Il codice di un link `#codice=…`, già nella forma a gruppi; '' se non c'è. */
function codiceDaLink(): string {
  if (typeof window === 'undefined') return '';
  const m = /[#&]codice=([^&]+)/.exec(window.location.hash);
  if (!m) return '';
  let letto = m[1];
  try {
    letto = decodeURIComponent(letto);
  } catch {
    /* resta com'è */
  }
  const norm = normalizzaCodice(letto);
  return norm ? formattaCodice(norm) : letto;
}

function Corpo(): ReactNode {
  const browser = useIsBrowser();
  const area = useArea();
  const codice = useCodiceZaino();
  const [daLink] = useState(codiceDaLink);
  const [nuovo, setNuovo] = useState<{ codice: string; titolo: string } | null>(
    null,
  );

  // Il frammento `#codice=…` non deve restare nell'indirizzo.
  useEffect(() => {
    if (/[#&]codice=/.test(window.location.hash))
      window.history.replaceState(
        null,
        '',
        window.location.pathname + window.location.search,
      );
  }, []);

  if (!browser) return null;

  if (!zainoSupportato()) {
    return (
      <p className={styles.avviso} data-zaino-non-supportato="">
        Lo zaino funziona solo su una connessione https, o su localhost: da
        questo indirizzo il browser non lascia cifrare. Intanto puoi scaricare
        il quaderno da <Link to="/quaderno">/quaderno</Link> e tenerlo da parte.
      </p>
    );
  }

  if (codice) {
    return (
      <Collegato
        codice={codice}
        temporanea={area === 'session'}
        codiceNuovo={nuovo}
        onFinito={() => setNuovo(null)}
      />
    );
  }

  return (
    <div className={styles.due}>
      <Crea onCreato={(c) => setNuovo({ codice: c, titolo: 'Zaino creato' })} />
      <Apri scrittoIniziale={daLink} />
    </div>
  );
}

export default function PaginaZaino(): ReactNode {
  return (
    <Layout
      title="Zaino"
      description="Porta il tuo quaderno su ogni dispositivo, senza account."
    >
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <main className={styles.pagina}>
        <Heading as="h1" className={styles.titolo}>
          <FontAwesomeIcon icon={faBoxArchive} className={styles.icona} />
          Il tuo zaino
        </Heading>
        <p className={styles.intro}>
          Lo zaino porta le tue note su ogni dispositivo che usi, senza account.
          Prima di partire dal browser il contenuto viene cifrato con una chiave
          ricavata dal tuo codice: il servizio conserva un blocco illeggibile,
          che si apre solo con quel codice. Intanto le note restano anche{' '}
          <Link to="/quaderno">nel tuo quaderno</Link>, che puoi sempre
          scaricare.
        </p>
        <Corpo />
      </main>
    </Layout>
  );
}
