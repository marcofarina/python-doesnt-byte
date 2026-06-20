// Token "atmospheric" del sito in forma JS — il tema trasversale, NON solo
// delle donazioni. Importato da: footer globale (quindi ogni pagina), pagine
// legali (via src/components/Legal), /support (Value 4 Value) e note di rilascio.
//
// Riprende i token "atmospheric" del sito (Crimson Pro serif + Monaspace mono,
// accent ciano→indaco→viola) già definiti in src/css/custom.css come variabili
// `--at-*`. Qui sono raccolti in un oggetto JS perché questi componenti sono
// guidati da stili inline dipendenti dal tema (light/dark), che non possono
// leggere comodamente le media-query light/dark.
//
// I font puntano alle variabili CSS del sito (niente CDN esterni).

export interface AtmosphericTheme {
  dark: boolean;
  serif: string;
  display: string;
  body: string;
  mono: string;
  bg: string;
  bgPanel: string;
  bgSubtle: string;
  bgChip: string;
  fg: string;
  fgStrong: string;
  fgBody: string;
  muted: string;
  mutedSoft: string;
  faint: string;
  border: string;
  borderStrong: string;
  accent: string;
  accentSoft: string;
  accentBg: string;
  accentBorder: string;
  accentChip: string;
  accentChipBorder: string;
  gradAccent: string;
  gradText: string;
  track: string;
  // toni "brand" dei metodi di donazione (stessa famiglia, hue diverse)
  paypal: string;
  paypalBg: string;
  paypalBorder: string;
  satispay: string;
  satispayBg: string;
  satispayBorder: string;
  lightning: string;
  lightningBg: string;
  lightningBorder: string;
  ln: string;
  lnBg: string;
  lnBorder: string;
}

export function getAtmosphericTheme(dark: boolean): AtmosphericTheme {
  // Token CONDIVISI col resto del sito: puntano alle `--at-*` di custom.css, che
  // si rimappano da sole su light/dark via `html[data-theme]`. Fonte unica →
  // niente drift JS↔CSS, e un cambio di colore/contrasto si fa in un posto solo.
  // (Funzionano anche passati a <Icon color>, che applica `color` + currentColor.)
  const shared = {
    serif: 'var(--font-body)',
    display: 'var(--font-body)',
    body: 'var(--font-body)',
    mono: 'var(--font-mono-ui)',
    bg: 'var(--at-bg)',
    bgPanel: 'var(--at-bg-panel)',
    bgSubtle: 'var(--at-bg-subtle)',
    bgChip: 'var(--at-bg-chip)',
    fg: 'var(--at-fg)',
    fgStrong: 'var(--at-fg-strong)',
    fgBody: 'var(--at-fg-body)',
    muted: 'var(--at-muted)',
    mutedSoft: 'var(--at-muted-soft)',
    faint: 'var(--at-faint)',
    border: 'var(--at-border)',
    borderStrong: 'var(--at-border-strong)',
    accent: 'var(--at-accent)',
    accentSoft: 'var(--at-accent-soft)',
    accentBg: 'var(--at-accent-bg)',
    accentChip: 'var(--at-accent-chip)',
    accentChipBorder: 'var(--at-accent-chip-border)',
    gradAccent: 'var(--at-grad-accent)',
    gradText: 'var(--at-grad-text)',
  };

  // Token SOLO-donazioni (toni "brand" PayPal/Satispay/Lightning/Bitcoin) +
  // track/accentBorder: non hanno un gemello `--at-*` e li usa solo V4V/Footer,
  // quindi niente rischio di drift → restano letterali, distinti per tema.
  // Il `dark` booleano serve ai branch JS dei componenti (ombre, blur, opacità).
  if (dark) {
    return {
      ...shared,
      dark: true,
      accentBorder: 'rgba(56,189,248,0.28)',
      track: 'rgba(255,255,255,0.07)',
      ln: '#c4b5fd',
      lnBg: 'rgba(167,139,250,0.10)',
      lnBorder: 'rgba(167,139,250,0.30)',
      paypal: '#60a5fa',
      paypalBg: 'rgba(59,130,246,0.10)',
      paypalBorder: 'rgba(59,130,246,0.32)',
      satispay: '#f87171',
      satispayBg: 'rgba(239,68,68,0.10)',
      satispayBorder: 'rgba(239,68,68,0.32)',
      lightning: '#fbbf24',
      lightningBg: 'rgba(247,147,26,0.10)',
      lightningBorder: 'rgba(247,147,26,0.32)',
    };
  }

  return {
    ...shared,
    dark: false,
    accentBorder: 'rgba(2,132,199,0.26)',
    track: 'rgba(0,0,0,0.07)',
    ln: '#7c3aed',
    lnBg: 'rgba(124,58,237,0.07)',
    lnBorder: 'rgba(124,58,237,0.28)',
    paypal: '#0070ba',
    paypalBg: 'rgba(0,112,186,0.07)',
    paypalBorder: 'rgba(0,112,186,0.28)',
    satispay: '#e30613',
    satispayBg: 'rgba(227,6,19,0.07)',
    satispayBorder: 'rgba(227,6,19,0.28)',
    // lightning scurito (#f7931a "brand" → #a85607) per restare ≥ 4.5:1 come
    // testo ("Copia offer") sul fondo chiaro. WCAG 1.4.3.
    lightning: '#a85607',
    lightningBg: 'rgba(247,147,26,0.08)',
    lightningBorder: 'rgba(247,147,26,0.34)',
  };
}
