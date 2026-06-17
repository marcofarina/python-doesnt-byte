// Tema per la pagina Value 4 Value e il footer.
//
// Riprende i token "atmospheric" del sito (Crimson Pro serif + Monaspace mono,
// accent ciano→indaco→viola) già definiti in src/css/custom.css come variabili
// `--at-*`. Qui sono raccolti in un oggetto JS perché i componenti della pagina
// e del footer sono guidati da stili inline dipendenti dal tema (light/dark).
//
// I font puntano alle variabili CSS del sito (niente CDN esterni).

export interface V4VTheme {
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

export function getV4VTheme(dark: boolean): V4VTheme {
  const serif = 'var(--font-body)';
  const mono = 'var(--font-mono-ui)';
  const common = { serif, display: serif, body: serif, mono };

  if (dark) {
    return {
      ...common,
      dark: true,
      bg: '#0b0b0e',
      bgPanel: 'rgba(24,24,27,0.55)',
      bgSubtle: 'rgba(255,255,255,0.028)',
      bgChip: 'rgba(255,255,255,0.05)',
      fg: '#e4e4e7',
      fgStrong: '#fafafa',
      fgBody: '#c6c6cb',
      muted: '#8b8b93',
      mutedSoft: '#a1a1aa',
      faint: '#5b5b63',
      border: 'rgba(255,255,255,0.09)',
      borderStrong: 'rgba(255,255,255,0.14)',
      accent: '#38bdf8',
      accentSoft: '#7dd3fc',
      accentBg: 'rgba(56,189,248,0.09)',
      accentBorder: 'rgba(56,189,248,0.28)',
      accentChip: 'rgba(56,189,248,0.12)',
      accentChipBorder: 'rgba(56,189,248,0.24)',
      gradAccent: 'linear-gradient(135deg,#38bdf8 0%,#818cf8 50%,#c084fc 100%)',
      gradText: 'linear-gradient(180deg,#ffffff 0%,#a1a1aa 100%)',
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
    ...common,
    dark: false,
    bg: '#fafaf9',
    bgPanel: 'rgba(255,255,255,0.72)',
    bgSubtle: 'rgba(0,0,0,0.025)',
    bgChip: 'rgba(0,0,0,0.045)',
    fg: '#27272a',
    fgStrong: '#0c0c0f',
    fgBody: '#3f3f46',
    muted: '#6b6b73',
    mutedSoft: '#52525b',
    faint: '#a1a1aa',
    border: 'rgba(0,0,0,0.09)',
    borderStrong: 'rgba(0,0,0,0.13)',
    accent: '#0284c7',
    accentSoft: '#0369a1',
    accentBg: 'rgba(2,132,199,0.06)',
    accentBorder: 'rgba(2,132,199,0.26)',
    accentChip: 'rgba(2,132,199,0.08)',
    accentChipBorder: 'rgba(2,132,199,0.22)',
    gradAccent: 'linear-gradient(135deg,#0284c7 0%,#6366f1 50%,#a855f7 100%)',
    gradText: 'linear-gradient(180deg,#0c0c0f 0%,#52525b 100%)',
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
    lightning: '#c2620a',
    lightningBg: 'rgba(247,147,26,0.08)',
    lightningBorder: 'rgba(247,147,26,0.34)',
  };
}
