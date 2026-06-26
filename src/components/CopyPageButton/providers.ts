import type { IconName } from '@site/src/components/Icon';

/**
 * Assistenti AI offerti dal dropdown «Copia pagina». Ogni `url` è il template a
 * cui appendere `encodeURIComponent(prompt)`: l'AI riceve solo un prompt corto
 * che cita l'URL del `.md` ripulito e fa lei il fetch della pagina (vedi la
 * nota reference-copy-page-llm-button). Nessun contenuto utente arbitrario
 * passa per l'URL.
 */
export interface AiProvider {
  id: string;
  label: string;
  icon: IconName;
  url: string;
}

export const AI_PROVIDERS: readonly AiProvider[] = [
  // NB: Gemini è escluso di proposito. L'app web (gemini.google.com/app) NON
  // supporta nativamente il prefill via URL (`?q=` / `?prompt=`): funziona solo
  // con un'estensione Chrome di terze parti, quindi per i nostri utenti sarebbe
  // un link che apre Gemini vuoto. Riconsiderare se Google aggiunge il supporto.
  {
    id: 'claude',
    label: 'Claude',
    icon: 'claude',
    url: 'https://claude.ai/new?q=',
  },
  { id: 'grok', label: 'Grok', icon: 'grok', url: 'https://grok.com/?q=' },
  {
    id: 'chatgpt',
    label: 'ChatGPT',
    icon: 'openai',
    url: 'https://chatgpt.com/?q=',
  },
  {
    id: 'perplexity',
    label: 'Perplexity',
    icon: 'perplexity',
    url: 'https://www.perplexity.ai/search?q=',
  },
] as const;

/**
 * Prompt italiano coerente col tono di `DEFAULT_EXPLAIN_PROMPT` del PyRunner.
 * Cita l'URL del `.md` e chiede una spiegazione adatta a uno studente.
 */
export function buildAiPrompt(mdUrl: string): string {
  return (
    'Sto studiando dal manuale scolastico «Python Doesn’t Byte». ' +
    'Leggi questa pagina e spiegamela in modo semplice, come a uno studente di ' +
    '15 anni alle prime armi: dammi un riassunto chiaro e nomina i concetti ' +
    'chiave. Rispondi in italiano.\n\n' +
    mdUrl
  );
}
