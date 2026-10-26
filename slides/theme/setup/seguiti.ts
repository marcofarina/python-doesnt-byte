/**
 * Le slide «risultato», generate da sole.
 *
 * Un blocco eseguibile con l'attributo `seguito`
 *
 *     <SqlRun dataset="archivista/registro-punti" seguito>
 *
 * riceve subito dopo la sua slide una slide in più, con lo stesso blocco in
 * modalità `risultato`: niente codice, solo l'esito, eseguito da solo (anche
 * nel PDF). Il titolo è quello della slide del codice seguito da
 * «: il risultato». Serve quando sotto il codice non c'è posto per leggere
 * l'output: chi scrive il mazzo non copia niente, aggiunge una parola.
 *
 * Lavora sulle righe grezze del mazzo, prima che Slidev le divida in slide:
 * la usano il preparser del tema (setup/preparser.ts) e scripts/slides.mjs,
 * che deve contare le stesse slide che conta Slidev.
 */

const APERTURA = /^\s*<(PyRun|SqlRun)\b[^>]*\bseguito\b[^>]*>\s*$/;

/** Righe che chiudono una slide e ne aprono un'altra. */
const separatore = (riga: string) => riga.trim() === '---';

export function aggiungiSeguiti(righe: string[]): void {
  for (let i = 0; i < righe.length; i++) {
    const apertura = APERTURA.exec(righe[i]);
    if (!apertura) continue;
    const tag = apertura[1];
    const chiusura = righe.findIndex((r, k) => k > i && r.trim() === `</${tag}>`);
    if (chiusura < 0) continue;

    // Il titolo della slide: l'ultimo «# …» prima del blocco, fino al
    // separatore che apre la slide.
    let titolo = 'Il risultato';
    for (let k = i - 1; k >= 0 && !separatore(righe[k]); k--) {
      const m = /^#\s+(.+)$/.exec(righe[k]);
      if (m) {
        titolo = `${m[1].replace(/[?.:!]+$/, '')}: il risultato`;
        break;
      }
    }

    // Il blocco della slide nuova: stesso codice, modalità risultato, tutta
    // la larghezza (senza `uscita`). Gli altri attributi restano, `errore`
    // compreso: è lo stesso blocco.
    const blocco = righe.slice(i, chiusura + 1);
    blocco[0] = blocco[0]
      .replace(/\s+seguito\b/, ' risultato')
      .replace(/\s+uscita="[^"]*"/, '');
    // Nella slide del codice `seguito` resta: «Esegui» porta alla slide dopo.

    // La fine della slide: il primo separatore dopo il blocco (o la fine del
    // file). Lì comincia la slide successiva, con o senza frontmatter.
    let fine = righe.findIndex((r, k) => k > chiusura && separatore(r));
    if (fine < 0) fine = righe.length;

    const nuova = ['---', '', `# ${titolo}`, '', ...blocco, ''];
    righe.splice(fine, 0, ...nuova);
    i = fine + nuova.length - 1;
  }
}
