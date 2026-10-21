/**
 * Misure del testo senza React né CSS: le usano le primitive (attraverso
 * `primitive/comune`) e le scene di src/figure/, che il plugin «Copia pagina»
 * carica con jiti fuori dalla build, dove un import di CSS fallirebbe.
 */
import excalifont from '../DiagrammaER/larghezze-excalifont.json';
import larghezze from './larghezze-testo.json';
import type { Tratto } from './tipi';

const GLIFI_MANO = excalifont.glifi as Record<string, number>;
const GLIFI_NETTO = larghezze.netto as Record<string, number>;
const GLIFI_GRASSETTO = larghezze.nettoGrassetto as Record<string, number>;

/** Larghezza di un testo in unità del viewBox, dalle tabelle dei glifi. */
export function larghezzaTesto(
  testo: string,
  corpo: number,
  tratto: Tratto,
  famiglia: 'testo' | 'codice' = 'testo',
  grassetto = false,
): number {
  if (famiglia === 'codice')
    return [...testo].length * larghezze.codice * corpo;
  const glifi =
    tratto === 'mano' ? GLIFI_MANO : grassetto ? GLIFI_GRASSETTO : GLIFI_NETTO;
  let em = 0;
  for (const c of testo) em += glifi[c] ?? 0.55;
  return em * corpo;
}
