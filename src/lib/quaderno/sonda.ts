/**
 * `window.__quaderno`: l'accesso al quaderno per gli script di verifica
 * (`npm run quaderno:prova`), come `window.__figure` per le figure. Lo monta
 * il Layout delle pagine con l'evidenziatore.
 */
import { useEffect } from 'react';

import { ancora, descrivi } from './ancora';
import { aggiungi, leggiQuaderno, svuota } from './archivio';
import { SELETTORE_RADICE } from './pagine';
import { costruisciTesto, daRange, type TestoPagina } from './testo';
import type { Annotazione, Colore, Quaderno, Selettore } from './tipi';

export interface AccessoQuaderno {
  /** La chiave della pagina aperta. */
  pagina(): string;
  quaderno(): Quaderno;
  /** Annota il testo fra due offset del testo evidenziabile (nota: fase Q2). */
  aggiungi(
    inizio: number,
    fine: number,
    colore: Colore | null,
    nota?: string,
  ): Annotazione;
  /** Annota la selezione del documento (la parte evidenziabile). */
  aggiungiSelezione(colore: Colore | null): Annotazione | null;
  ancora(s: Selettore): { inizio: number; fine: number } | null;
  testo(): string;
  svuota(): void;
}

declare global {
  interface Window {
    __quaderno?: AccessoQuaderno;
  }
}

function testoPagina(): TestoPagina {
  const radice = document.querySelector(SELETTORE_RADICE);
  if (!radice) throw new Error(`[quaderno] manca ${SELETTORE_RADICE}`);
  return costruisciTesto(radice);
}

export function useSondaQuaderno(pagina: string | null): void {
  useEffect(() => {
    if (!pagina) return undefined;
    const accesso: AccessoQuaderno = {
      pagina: () => pagina,
      quaderno: leggiQuaderno,
      aggiungi(inizio, fine, colore, nota) {
        return aggiungi(
          pagina,
          descrivi(testoPagina(), inizio, fine),
          colore,
          nota,
        );
      },
      aggiungiSelezione(colore) {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return null;
        const t = testoPagina();
        const o = daRange(t, sel.getRangeAt(0));
        return o
          ? aggiungi(pagina, descrivi(t, o.inizio, o.fine), colore)
          : null;
      },
      ancora: (s) => ancora(testoPagina(), s),
      testo: () => testoPagina().testo,
      svuota,
    };
    window.__quaderno = accesso;
    return () => {
      if (window.__quaderno === accesso) delete window.__quaderno;
    };
  }, [pagina]);
}
