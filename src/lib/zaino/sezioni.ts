/**
 * Registro delle sezioni dello zaino e unione di due contenuti (piano
 * pm/piano-2026-11-quaderno.md, «Zaino a sezioni» e «Sezioni che il client non
 * conosce»).
 *
 * - Una sezione registrata si unisce con la sua regola (`TipoSezione.unisci`).
 * - Una sezione che questo client non conosce, o che ha un `formato` più alto
 *   di quello che sa leggere, si conserva intatta: fra due versioni vince il
 *   formato più alto, poi la `modificata` più recente. Così una scheda rimasta
 *   aperta con il sito vecchio non cancella i dati scritti da un sito nuovo.
 *
 * `unisciContenuti` è pura, commutativa e idempotente, come le regole delle
 * sezioni; la potatura che dipende dall'ora (`pota`) la fa chi sincronizza.
 */
import type { ContenutoZaino, Sezione, TipoSezione } from './tipi';

const registro = new Map<string, TipoSezione<unknown>>();

export function registraSezione<T>(tipo: TipoSezione<T>): void {
  registro.set(tipo.nome, tipo as TipoSezione<unknown>);
}

export function sezioniRegistrate(): TipoSezione<unknown>[] {
  return [...registro.values()];
}

export function tipoSezione(nome: string): TipoSezione<unknown> | undefined {
  return registro.get(nome);
}

/** JSON con le chiavi in ordine: due valori uguali danno lo stesso testo. */
export function canonico(x: unknown): string {
  return JSON.stringify(x, (_k, v: unknown) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.fromEntries(
          Object.entries(v as Record<string, unknown>).sort(([a], [b]) =>
            a < b ? -1 : a > b ? 1 : 0,
          ),
        )
      : v,
  );
}

function ora(iso: string): number {
  const t = Date.parse(iso);
  return Number.isNaN(t) ? -Infinity : t;
}

function piuRecente(a: string, b: string): string {
  const d = ora(a) - ora(b);
  if (d !== 0) return d > 0 ? a : b;
  return a >= b ? a : b;
}

const EPOCA = new Date(0).toISOString();

/** > 0 se vince a: formato più alto, poi modificata più recente, poi il JSON. */
function confrontaIntatte(a: Sezione, b: Sezione): number {
  if (a.formato !== b.formato) return a.formato - b.formato;
  const d = ora(a.modificata) - ora(b.modificata);
  if (d !== 0) return d;
  const ca = canonico(a);
  const cb = canonico(b);
  return ca < cb ? -1 : ca > cb ? 1 : 0;
}

function eSezione(x: unknown): x is Sezione {
  const s = x as Sezione;
  return (
    typeof s === 'object' &&
    s !== null &&
    typeof s.formato === 'number' &&
    typeof s.modificata === 'string' &&
    'dati' in s
  );
}

function unisciSezione(
  nome: string,
  a: Sezione | undefined,
  b: Sezione | undefined,
): Sezione | undefined {
  if (!a || !b) {
    const sola = a ?? b;
    if (!sola) return undefined;
    // Una sola parte: si unisce con il vuoto, così il risultato è normalizzato.
    a = sola;
    b = undefined;
  }
  const tipo = registro.get(nome);
  const troppoNuova = (s?: Sezione) =>
    !!s && !!tipo && s.formato > tipo.formato;
  if (!tipo || troppoNuova(a) || troppoNuova(b)) {
    // Sezione intatta: non la si riscrive, si sceglie una delle due versioni.
    const candidate = [a, b].filter((s): s is Sezione => !!s);
    const intatte = tipo
      ? candidate.filter((s) => s.formato > tipo.formato)
      : candidate;
    return intatte.reduce((x, y) => (confrontaIntatte(x, y) >= 0 ? x : y));
  }
  const vuota = tipo.vuota();
  const da = (a && tipo.valida(a.dati)) ?? vuota;
  const db = (b && tipo.valida(b.dati)) ?? vuota;
  const ma = a?.modificata ?? EPOCA;
  const mb = b?.modificata ?? EPOCA;
  const dati = tipo.unisci(da, db);
  // Se l'unione non aggiunge niente a una parte, la data resta quella di
  // quella parte: senza modifiche nuove la sezione non cambia.
  const cm = canonico(dati);
  const ca = canonico(tipo.unisci(da, da));
  const cb = canonico(tipo.unisci(db, db));
  let modificata: string;
  if (cm === ca && cm !== cb) modificata = ma;
  else if (cm === cb && cm !== ca) modificata = mb;
  else modificata = piuRecente(ma, mb);
  return { formato: tipo.formato, modificata, dati };
}

/** Pura, commutativa, idempotente: la stessa per ogni dispositivo. */
export function unisciContenuti(
  a: ContenutoZaino,
  b: ContenutoZaino,
): ContenutoZaino {
  const nomi = [
    ...new Set([...Object.keys(a.sezioni), ...Object.keys(b.sezioni)]),
  ].sort();
  const sezioni: Record<string, Sezione> = {};
  for (const nome of nomi) {
    const sa = a.sezioni[nome];
    const sb = b.sezioni[nome];
    const s = unisciSezione(
      nome,
      eSezione(sa) ? sa : undefined,
      eSezione(sb) ? sb : undefined,
    );
    if (s) sezioni[nome] = s;
  }
  return { formato: 1, sezioni };
}

/** Da un oggetto qualunque a un contenuto; null se non ha la forma attesa. */
export function validaContenuto(x: unknown): ContenutoZaino | null {
  const c = x as ContenutoZaino;
  if (typeof c !== 'object' || c === null) return null;
  if (c.formato !== 1) return null;
  if (typeof c.sezioni !== 'object' || c.sezioni === null) return null;
  const sezioni: Record<string, Sezione> = {};
  for (const [nome, s] of Object.entries(c.sezioni))
    if (eSezione(s)) sezioni[nome] = s;
  return { formato: 1, sezioni };
}
