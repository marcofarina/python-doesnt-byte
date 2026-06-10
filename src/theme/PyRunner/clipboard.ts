/**
 * Copia testo negli appunti con fallback per i browser senza Clipboard API
 * (o in contesti non-secure). Rifiuta la Promise se entrambe le strade
 * falliscono, così il chiamante può mostrare un feedback d'errore reale.
 */
export async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const { default: copy } = await import('copy-text-to-clipboard');
  if (!copy(text)) {
    throw new Error('copy-text-to-clipboard: copia non riuscita');
  }
}
