/**
 * Encoding base64url (URL-safe, niente padding) per il codice condiviso
 * tra PyRunner e la pagina /playground.
 * Gestisce UTF-8 tramite TextEncoder/TextDecoder così accentate italiane,
 * emoji nei commenti, ecc. sopravvivono al round-trip.
 */

export function encodeCode(code: string): string {
  const bytes = new TextEncoder().encode(code);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeCode(b64url: string): string {
  const std = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const pad = std.length % 4 === 0 ? '' : '='.repeat(4 - (std.length % 4));
  const bin = atob(std + pad);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export const DEFAULT_EXPLAIN_PROMPT = `Sto studiando Python da un manuale scolastico in italiano. Spiegami questo codice in modo semplice, come se avessi 15 anni e fossi alle prime armi. Concentrati sul "perché" più che sul "come". Se ci sono concetti chiave (variabili, cicli, funzioni, ecc.) nominali esplicitamente. Rispondi in italiano.

Contesto della lezione: {contextTitle}

Codice:
\`\`\`python
{code}
\`\`\`
`;

export function buildExplainText(
  template: string,
  code: string,
  contextTitle: string,
): string {
  return template
    .replace(/\{code\}/g, code)
    .replace(/\{contextTitle\}/g, contextTitle);
}
