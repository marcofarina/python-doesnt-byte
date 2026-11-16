/**
 * Barra sottile sotto la navbar, in ogni pagina, mentre la scheda è in modalità
 * temporanea (piano pm/piano-2026-11-quaderno.md, Q5): ricorda che le note
 * spariscono con la scheda e tiene «Esci dallo zaino» sempre a portata di
 * clic. Con modifiche non ancora nello zaino la chiusura della scheda chiede
 * conferma (`beforeunload`).
 */
import React, { useEffect, useState, type ReactNode } from 'react';

import { useArea } from '@site/src/lib/zaino/area';
import { esci, useStatoZaino } from '@site/src/lib/zaino/sincronizza';

import styles from './styles.module.css';

export default function BarraTemporanea(): ReactNode {
  const area = useArea();
  const zaino = useStatoZaino();
  const [conferma, setConferma] = useState(false);
  const temporanea = area === 'session';
  const salvo = zaino.fase === 'sincronizzato' && !zaino.inSospeso;

  useEffect(() => {
    if (!temporanea || salvo) return undefined;
    const avvisa = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Alcuni browser vogliono anche un valore di ritorno.
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', avvisa);
    return () => window.removeEventListener('beforeunload', avvisa);
  }, [temporanea, salvo]);

  if (!temporanea) return null;
  // Se nel frattempo tutto è nello zaino, la domanda non serve più.
  const chiedi = conferma && !salvo;

  const clic = () => {
    if (!salvo && !chiedi) {
      setConferma(true);
      return;
    }
    void esci();
  };

  return (
    <div className={styles.barra} role="note" data-barra-temporanea="">
      <p className={styles.testo}>
        {chiedi
          ? 'Alcune modifiche non sono ancora nello zaino: uscendo ora le perdi.'
          : 'Computer non tuo: zaino aperto solo in questa scheda. Chiudendola, le note spariscono da qui.'}
      </p>
      <button
        type="button"
        className={styles.esci}
        data-azione="esci-barra"
        onClick={clic}
      >
        {chiedi ? 'Esci lo stesso' : 'Esci dallo zaino'}
      </button>
      {chiedi && (
        <button
          type="button"
          className={styles.esci}
          onClick={() => setConferma(false)}
        >
          Resto
        </button>
      )}
    </div>
  );
}
