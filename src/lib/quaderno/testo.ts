/**
 * Il testo evidenziabile di una pagina: i nodi di testo dentro
 * `.theme-doc-markdown`, in ordine di documento, senza i sottoalberi esclusi
 * (codice, runner, componenti interattivi, testo coperto). Le annotazioni si
 * ancorano agli offset di questa stringa, mai al DOM: il DOM dell'MDX è di
 * React e non si tocca.
 */

/** Sottoalberi che non sono prosa (tabella «Scelte di default» del piano). */
export const ESCLUSI = [
  '[data-runner]',
  'pre',
  'svg',
  'button',
  'input',
  'textarea',
  '[aria-hidden="true"]',
  '[data-quaderno-escludi]',
  // Il «#» dei titoli di Docusaurus: un carattere invisibile, non prosa.
  '.hash-link',
  'script',
  'style',
].join(',');

export interface TestoPagina {
  /** Concatenazione dei nodi di testo ammessi. */
  testo: string;
  /** In ordine di documento. */
  nodi: { nodo: Text; inizio: number }[];
  /** Titoli h2/h3 con id, con l'offset a cui comincia il loro testo. */
  titoli: { id: string; inizio: number }[];
}

export function costruisciTesto(radice: Element): TestoPagina {
  const nodi: TestoPagina['nodi'] = [];
  const titoli: TestoPagina['titoli'] = [];
  const pezzi: string[] = [];
  let lunghezza = 0;
  const walker = document.createTreeWalker(
    radice,
    NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
    {
      acceptNode(n) {
        if (n.nodeType === Node.TEXT_NODE) return NodeFilter.FILTER_ACCEPT;
        return (n as Element).matches(ESCLUSI)
          ? NodeFilter.FILTER_REJECT
          : NodeFilter.FILTER_SKIP;
      },
    },
  );
  // FILTER_SKIP sugli elementi: il walker ci entra ma non li restituisce, quindi
  // i titoli si riconoscono dal genitore del loro primo nodo di testo.
  let ultimoTitolo: Element | null = null;
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const nodo = n as Text;
    const h = nodo.parentElement?.closest('h2[id], h3[id]');
    if (h && h !== ultimoTitolo && radice.contains(h)) {
      ultimoTitolo = h;
      titoli.push({ id: h.id, inizio: lunghezza });
    }
    if (!nodo.data) continue;
    nodi.push({ nodo, inizio: lunghezza });
    pezzi.push(nodo.data);
    lunghezza += nodo.data.length;
  }
  return { testo: pezzi.join(''), nodi, titoli };
}

/** Indice del nodo che contiene l'offset (ricerca binaria). */
function indiceNodo(t: TestoPagina, offset: number, finale: boolean): number {
  let lo = 0;
  let hi = t.nodi.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    const s = t.nodi[mid].inizio;
    // Un offset di fine sul bordo fra due nodi appartiene al nodo prima.
    if (finale ? s < offset : s <= offset) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

/** Riporta due offset del testo a un Range del DOM. */
export function intervallo(
  t: TestoPagina,
  inizio: number,
  fine: number,
): Range {
  const r = document.createRange();
  if (!t.nodi.length) return r;
  const a = t.nodi[indiceNodo(t, inizio, false)];
  const b = t.nodi[indiceNodo(t, fine, true)];
  r.setStart(a.nodo, Math.min(inizio - a.inizio, a.nodo.data.length));
  r.setEnd(b.nodo, Math.min(fine - b.inizio, b.nodo.data.length));
  return r;
}

/**
 * Il contrario di `intervallo`: gli offset della parte di un Range (una
 * selezione) che cade nel testo evidenziabile. Quello che sta nei sottoalberi
 * esclusi non entra; gli spazi ai bordi si tolgono. null se non resta niente.
 */
export function daRange(
  t: TestoPagina,
  r: Range,
): { inizio: number; fine: number } | null {
  let inizio = -1;
  let fine = -1;
  for (const { nodo, inizio: s } of t.nodi) {
    if (!r.intersectsNode(nodo)) {
      if (inizio >= 0) break;
      continue;
    }
    const da = nodo === r.startContainer ? r.startOffset : 0;
    const a = nodo === r.endContainer ? r.endOffset : nodo.data.length;
    if (inizio < 0) inizio = s + da;
    fine = s + a;
  }
  if (inizio < 0) return null;
  while (inizio < fine && /\s/.test(t.testo[inizio])) inizio++;
  while (fine > inizio && /\s/.test(t.testo[fine - 1])) fine--;
  return fine > inizio ? { inizio, fine } : null;
}

/** Id del titolo h2/h3 che precede l'offset, se c'è. */
export function titoloPrima(t: TestoPagina, offset: number): string | null {
  let id: string | null = null;
  for (const h of t.titoli) {
    if (h.inizio > offset) break;
    id = h.id;
  }
  return id;
}
