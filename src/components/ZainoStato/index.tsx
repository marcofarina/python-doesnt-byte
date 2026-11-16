/**
 * Lo stato dello zaino in una riga di testo, uguale in `/zaino`, in
 * `/quaderno` e nel pannello Note (piano pm/piano-2026-11-quaderno.md, Q5).
 * Con lo zaino scollegato non scrive niente: ci pensa l'avviso «solo in questo
 * browser» di chi lo usa.
 */
import React, { type ReactNode } from 'react';

import {
  useStatoZaino,
  type StatoZaino,
} from '@site/src/lib/zaino/sincronizza';

function ora(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
}

/** Il testo dello stato, o null se lo zaino non è collegato. */
export function testoStato(s: StatoZaino): string | null {
  if (s.fase === 'scollegato') return null;
  if (s.fase === 'in-corso') return 'Sincronizzo lo zaino…';
  if (s.fase === 'offline')
    return 'Sei senza rete: le note restano qui e partono nello zaino appena torna.';
  if (s.fase === 'errore') {
    switch (s.motivo) {
      case 'pieno':
        return 'Lo zaino è pieno: scarica il quaderno e cancella le annotazioni che non ti servono più.';
      case 'cancellato':
        return 'Questo zaino non esiste più sul servizio. Esci dallo zaino, oppure creane uno nuovo da /zaino.';
      case 'aggiorna':
        return 'Lo zaino l’ha scritto una versione più recente del sito: ricarica la pagina.';
      case 'illeggibile':
        return 'Il codice non apre questo zaino. Esci dallo zaino e riprova con il codice giusto.';
      default:
        return 'Il servizio dello zaino non risponde: riprovo tra poco. Le note restano qui.';
    }
  }
  const quando = ora(s.ultima);
  const base = quando
    ? `Zaino sincronizzato alle ${quando}.`
    : 'Zaino collegato.';
  return s.inSospeso ? `${base} Alcune modifiche partono fra poco.` : base;
}

/** Per l'icona della navbar: lo zaino ha bisogno di attenzione. */
export function haProblemi(s: StatoZaino): boolean {
  return s.fase === 'offline' || s.fase === 'errore';
}

export default function ZainoStato(): ReactNode {
  const s = useStatoZaino();
  const testo = testoStato(s);
  if (!testo) return null;
  return (
    <p
      role="status"
      data-zaino-stato={s.fase}
      data-zaino-motivo={s.motivo ?? undefined}
    >
      {testo}
    </p>
  );
}
