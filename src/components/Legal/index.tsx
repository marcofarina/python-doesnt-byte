/**
 * Componenti per le pagine legali (privacy, termini, licenza, note donazioni).
 *
 * Tono pulito e "designed" ma leggibile: header con icona duotone + kicker +
 * titolo display + lead + data di aggiornamento; callout per le note in
 * evidenza; firma geek opzionale a fondo pagina. Theme-aware tramite il tema
 * Value 4 Value (getAtmosphericTheme), così sono coerenti con /support e il footer.
 *
 * Si importano direttamente nelle pagine MDX di src/pages/legale/, non sono
 * registrati globalmente: servono solo lì.
 */
import React, { useState, type ReactNode } from 'react';
import { useColorMode } from '@docusaurus/theme-common';
import Icon, { type IconName } from '@site/src/components/Icon';
import { getAtmosphericTheme } from '@site/src/lib/atmosphericTheme';
import { copyToClipboard } from '@site/src/theme/PyRunner/clipboard';

function useT() {
  const { colorMode } = useColorMode();
  return getAtmosphericTheme(colorMode === 'dark');
}

/* ── Header pagina ─────────────────────────────────────── */
export function LegalHeader({
  icon,
  kicker,
  title,
  updated,
  children,
}: {
  icon: IconName;
  kicker: string;
  title: string;
  /** data "ultimo aggiornamento" già formattata (es. "18 giugno 2026") */
  updated?: string;
  /** lead introduttivo */
  children?: ReactNode;
}) {
  const T = useT();
  return (
    <header style={{ margin: '8px 0 40px', position: 'relative' }}>
      {/* alone ambientale circolare, centrato sull'icona; il gradiente sfuma
          a zero ben dentro i bordi del div, così non si vedono tagli netti */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: -252,
          left: -252,
          width: 560,
          height: 560,
          pointerEvents: 'none',
          opacity: T.dark ? 0.6 : 0.45,
          background: `radial-gradient(circle at center, ${T.accentChip} 0%, transparent 62%)`,
        }}
      />
      <div
        style={{
          position: 'relative',
          width: 56,
          height: 56,
          borderRadius: 'var(--radius-md)',
          background: T.bgChip,
          border: `1px solid ${T.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: T.accent,
          marginBottom: 22,
        }}
      >
        <Icon name={icon} size={28} color={T.accent} />
      </div>
      <div
        style={{
          fontFamily: T.mono,
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: T.accent,
          marginBottom: 10,
        }}
      >
        {kicker}
      </div>
      <h1
        style={{
          fontFamily: T.display,
          fontSize: 'clamp(34px, 5vw, 46px)',
          fontWeight: 700,
          letterSpacing: '-0.025em',
          lineHeight: 1.08,
          color: T.fgStrong,
          margin: '0 0 18px',
        }}
      >
        {title}
      </h1>
      {children && (
        <p
          style={{
            fontFamily: T.body,
            fontSize: 18.5,
            lineHeight: 1.6,
            color: T.fgBody,
            margin: '0 0 16px',
            maxWidth: 640,
          }}
        >
          {children}
        </p>
      )}
      {updated && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            fontFamily: T.mono,
            fontSize: 11.5,
            letterSpacing: '0.04em',
            color: T.muted,
            padding: '5px 12px',
            borderRadius: 'var(--radius-pill)',
            border: `1px solid ${T.border}`,
            background: T.bgChip,
          }}
        >
          <Icon name="clock" size={13} color={T.muted} />
          Ultimo aggiornamento: {updated}
        </div>
      )}
      <hr
        style={{
          border: 'none',
          borderTop: `1px solid ${T.border}`,
          margin: '34px 0 0',
        }}
      />
    </header>
  );
}

/* ── Callout / nota in evidenza ────────────────────────── */
export function LegalNote({
  icon = 'shield-check',
  title,
  tone = 'neutral',
  children,
}: {
  icon?: IconName;
  title?: string;
  /** 'accent' usa il colore brand; 'neutral' resta sobrio (grigio) */
  tone?: 'neutral' | 'accent';
  children: ReactNode;
}) {
  const T = useT();
  const accent = tone === 'accent';
  const c = accent ? T.accent : T.muted;
  return (
    <aside
      style={{
        margin: '28px 0',
        borderRadius: 'var(--radius-lg)',
        border: `1px solid ${accent ? T.accentBorder : T.border}`,
        background: accent ? T.accentBg : T.bgSubtle,
        padding: '22px 24px 24px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: title ? 12 : 0,
        }}
      >
        <div
          style={{
            flexShrink: 0,
            width: 38,
            height: 38,
            borderRadius: 'var(--radius-sm)',
            background: T.bgChip,
            border: `1px solid ${T.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: c,
          }}
        >
          <Icon name={icon} size={19} color={c} />
        </div>
        {title && (
          <div
            style={{
              fontFamily: T.display,
              fontSize: 17.5,
              fontWeight: 700,
              letterSpacing: '-0.01em',
              color: T.fgStrong,
            }}
          >
            {title}
          </div>
        )}
      </div>
      <div
        style={{
          fontFamily: T.body,
          fontSize: 15.5,
          lineHeight: 1.62,
          color: T.fgBody,
        }}
        className="legal-note-body"
      >
        {children}
      </div>
    </aside>
  );
}

/* ── Riga di testo copiabile (es. formula di attribuzione) ── */
export function CopyAttribution({ text }: { text: string }) {
  const T = useT();
  const [copied, setCopied] = useState(false);
  const onCopy = () => {
    copyToClipboard(text)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {});
  };
  const c = copied ? T.accent : T.muted;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'stretch',
        marginTop: 10,
        borderRadius: 'var(--radius-md)',
        border: `1px solid ${T.border}`,
        background: T.bgChip,
        overflow: 'hidden',
      }}
    >
      <code
        style={{
          flex: 1,
          fontFamily: T.mono,
          fontSize: 13.5,
          lineHeight: 1.5,
          color: T.fgStrong,
          padding: '11px 14px',
          background: 'transparent',
          border: 'none',
          wordBreak: 'break-word',
        }}
      >
        {text}
      </code>
      <button
        type="button"
        onClick={onCopy}
        aria-label="Copia il testo di attribuzione"
        style={{
          flexShrink: 0,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 7,
          padding: '0 15px',
          fontFamily: 'var(--font-mono-ui)',
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.02em',
          color: c,
          background: T.bgSubtle,
          border: 'none',
          borderLeft: `1px solid ${T.border}`,
          cursor: 'pointer',
          transition: 'color var(--dur-2) var(--ease-out)',
        }}
      >
        <Icon name={copied ? 'check' : 'copy'} size={14} color={c} />
        {copied ? 'Copiato' : 'Copia'}
      </button>
    </div>
  );
}

/* ── Firma geek a fondo pagina ─────────────────────────── */
export function GeekSignoff({
  icon = 'jedi',
  children,
}: {
  icon?: IconName;
  children: ReactNode;
}) {
  const T = useT();
  return (
    <div
      className="legal-signoff"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        margin: '52px 0 8px',
        fontFamily: 'var(--font-mono-comment)',
        fontSize: 13,
        lineHeight: 1,
        letterSpacing: '0.04em',
        color: T.muted,
        textAlign: 'center',
      }}
    >
      <Icon name={icon} size={17} color={T.accent} />
      <span>{children}</span>
    </div>
  );
}
