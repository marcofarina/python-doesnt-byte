/**
 * Footer swizzle (eject) — footer ridisegnato per Python Doesn't Byte.
 *
 * Sostituisce integralmente il footer del classic preset (la config
 * `themeConfig.footer` non viene più letta): 4 colonne — brand+licenza · il
 * libro (4 volumi) · progetto · sostieni — più la bottom bar con i social.
 * I link dei volumi puntano alle rotte reali; tema light/dark via useColorMode.
 */
import React, { type ReactNode } from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import { useColorMode, useWindowSize } from '@docusaurus/theme-common';
import Icon from '@site/src/components/Icon';
import { getAtmosphericTheme, type AtmosphericTheme } from '@site/src/lib/atmosphericTheme';
import { V4V_LINKS } from '@site/src/lib/v4vData';
import { CONTACT_MAILTO } from '@site/src/lib/site';
import MugSaucer from '@site/src/icons/mug-saucer.svg';

const FOOT_VOLUMES = [
  { n: 'Vol. 1', label: 'Manuale del Programmatore', to: '/programmatore' },
  { n: 'Vol. 2', label: 'Manuale dell’Artefice', to: '/artefice' },
  { n: 'Vol. 3', label: 'Manuale dell’Archivista', to: '/archivista' },
  { n: 'Vol. 4', label: 'Biblioteca dell’Apprendista', to: '/apprendista' },
];

const FOOT_PROJECT = [
  { label: 'Perché Python?', to: '/perche-python' },
  { label: 'Value 4 Value', to: '/support' },
  { label: 'Note di rilascio', to: '/note-di-rilascio' },
  {
    label: 'Codice su GitHub',
    href: 'https://github.com/marcofarina/python-doesnt-byte',
  },
];

const FOOT_LEGAL = [
  { label: 'Privacy', to: '/legale/privacy-policy' },
  { label: 'Termini', to: '/legale/termini-di-servizio' },
  { label: 'Licenza', to: '/legale/licenza' },
  { label: 'Donazioni', to: '/legale/note-legali-donazioni' },
];

function FootLink({
  T,
  to,
  href,
  children,
  n,
}: {
  T: AtmosphericTheme;
  to?: string;
  href?: string;
  children: ReactNode;
  n?: string;
}) {
  const style: React.CSSProperties = {
    display: 'flex',
    alignItems: 'baseline',
    gap: 9,
    textDecoration: 'none',
    color: T.mutedSoft,
    fontFamily: T.body,
    fontSize: 15.5,
    lineHeight: 1.5,
    padding: '3px 0',
  };
  const inner = (
    <>
      {n && (
        <span
          style={{
            fontFamily: T.mono,
            fontSize: 10.5,
            letterSpacing: '0.06em',
            color: T.faint,
            flexShrink: 0,
            minWidth: 34,
          }}
        >
          {n}
        </span>
      )}
      {children}
    </>
  );
  const onEnter = (e: React.MouseEvent<HTMLAnchorElement>) =>
    (e.currentTarget.style.color = T.accent);
  const onLeave = (e: React.MouseEvent<HTMLAnchorElement>) =>
    (e.currentTarget.style.color = T.mutedSoft);

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="v4v-link"
        style={style}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
      >
        {inner}
      </a>
    );
  }
  return (
    <Link
      to={to!}
      className="v4v-link"
      style={style}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      {inner}
    </Link>
  );
}

function FootCol({
  T,
  title,
  children,
}: {
  T: AtmosphericTheme;
  title: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div
        style={{
          fontFamily: T.mono,
          fontSize: 11.5,
          fontWeight: 600,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: T.muted,
          marginBottom: 16,
        }}
      >
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {children}
      </div>
    </div>
  );
}

function SocialBtn({
  T,
  href,
  to,
  label,
  children,
}: {
  T: AtmosphericTheme;
  /** URL esterno (apre in nuova scheda) */
  href?: string;
  /** rotta interna (navigazione SPA, stessa scheda) */
  to?: string;
  label: string;
  children: ReactNode;
}) {
  const style: React.CSSProperties = {
    width: 38,
    height: 38,
    borderRadius: 'var(--radius-sm)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: T.mutedSoft,
    background: T.bgChip,
    border: `1px solid ${T.border}`,
    textDecoration: 'none',
  };
  const onEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.color = T.accent;
    e.currentTarget.style.borderColor = T.accentBorder;
  };
  const onLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.color = T.mutedSoft;
    e.currentTarget.style.borderColor = T.border;
  };

  if (to) {
    return (
      <Link
        to={to}
        aria-label={label}
        title={label}
        className="v4v-press"
        style={style}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
      >
        {children}
      </Link>
    );
  }
  return (
    <a
      href={href}
      aria-label={label}
      title={label}
      target="_blank"
      rel="noreferrer"
      className="v4v-press"
      style={style}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      {children}
    </a>
  );
}

/** "#ff3d00" → "255,61,0" (per comporre rgba con alpha variabile). */
function hexToRgb(hex: string): string {
  const h = hex.replace('#', '');
  const n = parseInt(
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h,
    16,
  );
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

function PayLogo({
  T,
  name,
  href,
  to,
  logo,
  logoDark,
  logoHeight = 16,
  tint,
}: {
  T: AtmosphericTheme;
  name: string;
  /** URL esterno (PayPal, Satispay) */
  href?: string;
  /** rotta interna (es. /support per Bitcoin: QR + copia offer) */
  to?: string;
  /** path dell'SVG del logo self-hostato in static/img/pay/. Se assente,
      mostra il testo `name`. */
  logo?: string;
  /** variante per il dark mode (lettering chiaro): usata se T.dark è true.
      Serve per i loghi con testo scuro (PayPal navy, Bitcoin grigio) che
      altrimenti sparirebbero sul footer scuro. */
  logoDark?: string;
  /** altezza del logo in px (la larghezza segue le proporzioni) */
  logoHeight?: number;
  /** colore brand (hex) per intonare sfondo/bordo del pulsante al logo */
  tint?: string;
}) {
  const logoSrc = useBaseUrl((T.dark && logoDark ? logoDark : logo) ?? '');
  const rgb = tint ? hexToRgb(tint) : null;
  // Tinte derivate dal colore brand; fallback ai neutri del tema.
  const bgIdle = rgb ? `rgba(${rgb},0.10)` : T.bgChip;
  const bgHover = rgb ? `rgba(${rgb},0.18)` : T.accentChip;
  const bdIdle = rgb ? `rgba(${rgb},0.34)` : T.border;
  const bdHover = rgb ? `rgba(${rgb},0.6)` : T.accentBorder;
  const fgIdle = rgb ? tint! : T.muted;

  const style: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    minWidth: 66,
    padding: '0 14px',
    borderRadius: 'var(--radius-sm)',
    background: bgIdle,
    border: `1px solid ${bdIdle}`,
    fontFamily: T.mono,
    fontSize: 10.5,
    fontWeight: 600,
    letterSpacing: '0.06em',
    color: fgIdle,
    textTransform: 'uppercase',
    textDecoration: 'none',
  };
  // Per i loghi brand (colori fissi) l'hover anima solo bordo e sfondo; per il
  // testo cambia anche il colore (verso l'accent se non c'è una tinta brand).
  const onEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!logo && !rgb) e.currentTarget.style.color = T.accent;
    e.currentTarget.style.borderColor = bdHover;
    e.currentTarget.style.background = bgHover;
  };
  const onLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!logo && !rgb) e.currentTarget.style.color = T.muted;
    e.currentTarget.style.borderColor = bdIdle;
    e.currentTarget.style.background = bgIdle;
  };

  const content = logo ? (
    <img
      src={logoSrc}
      alt={name}
      style={{ display: 'block', height: logoHeight, width: 'auto' }}
    />
  ) : (
    name
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        title={name}
        className="v4v-press"
        style={style}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
      >
        {content}
      </a>
    );
  }
  return (
    <Link
      to={to!}
      title={name}
      className="v4v-press"
      style={style}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      {content}
    </Link>
  );
}

/* Credito "costruito con": icona + nome, allineati al centro così l'icona non
   balla rispetto al testo mono. Con `href` è un link allo strumento; senza, è
   testo semplice (es. "amore"). L'icona può essere un SVG (img) o un nodo React
   (es. il cuore di Font Awesome). */
function ToolCredit({
  T,
  label,
  href,
  icon,
  iconHeight,
  iconNode,
}: {
  T: AtmosphericTheme;
  label: string;
  href?: string;
  icon?: string;
  iconHeight?: number;
  iconNode?: ReactNode;
}) {
  const inner = (
    <>
      {iconNode ?? (
        <img
          src={icon}
          alt=""
          aria-hidden="true"
          style={{ display: 'block', height: iconHeight, width: 'auto' }}
        />
      )}
      {label}
    </>
  );
  const base: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    whiteSpace: 'nowrap',
  };
  if (!href) {
    return <span style={{ ...base, color: T.muted }}>{inner}</span>;
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="v4v-link"
      style={{ ...base, textDecoration: 'none', color: T.mutedSoft }}
      onMouseEnter={(e) => (e.currentTarget.style.color = T.accent)}
      onMouseLeave={(e) => (e.currentTarget.style.color = T.mutedSoft)}
    >
      {inner}
    </a>
  );
}

function FooterInner({ T, mobile }: { T: AtmosphericTheme; mobile: boolean }) {
  const logo = useBaseUrl('/img/logo.svg');
  const docusaurusIcon = useBaseUrl('/img/icons/docusaurus.svg');
  const claudeIcon = useBaseUrl('/img/icons/claudecode.svg');
  return (
    <footer
      style={{
        background: T.dark ? 'rgba(9,9,11,0.6)' : 'rgba(245,245,244,0.6)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: `1px solid ${T.border}`,
        fontFamily: T.body,
      }}
    >
      <div
        style={{
          maxWidth: 1040,
          margin: '0 auto',
          padding: mobile ? '44px 22px 0' : '56px 44px 0',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: mobile
              ? 'repeat(2, 1fr)'
              : '1.3fr 1.25fr 1.1fr 0.85fr',
            gap: mobile ? 28 : 36,
            alignItems: 'start',
          }}
        >
          {/* Brand */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 16,
              }}
            >
              <img
                src={logo}
                alt="Rainbow Bits"
                width={40}
                height={40}
                style={{
                  display: 'block',
                  filter: T.dark
                    ? 'drop-shadow(0 0 16px rgba(56,189,248,0.35))'
                    : 'none',
                }}
              />
              <div style={{ lineHeight: 1.15 }}>
                <div
                  style={{
                    fontFamily: T.display,
                    fontSize: 17,
                    fontWeight: 700,
                    color: T.fgStrong,
                    letterSpacing: '-0.01em',
                  }}
                >
                  Python{' '}
                  <span
                    style={{
                      fontStyle: 'italic',
                      color: T.muted,
                      fontWeight: 600,
                    }}
                  >
                    doesn’t byte
                  </span>
                </div>
                <div
                  style={{
                    fontFamily: T.mono,
                    fontSize: 10.5,
                    letterSpacing: '0.12em',
                    color: T.faint,
                    textTransform: 'uppercase',
                    marginTop: 3,
                  }}
                >
                  by Rainbow Bits
                </div>
              </div>
            </div>
            <p
              style={{
                fontFamily: T.body,
                fontSize: 15,
                lineHeight: 1.55,
                color: T.muted,
                margin: '0 0 16px',
                maxWidth: 280,
              }}
            >
              Il libro di testo, reinventato. Open source, libero e gratuito —
              perché l’informazione vuole essere libera.
            </p>
            <a
              href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
              target="_blank"
              rel="noreferrer"
              className="v4v-press"
              title="Licenza Creative Commons BY-NC-SA 4.0"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                whiteSpace: 'nowrap',
                fontFamily: T.mono,
                fontSize: 10.5,
                letterSpacing: '0.05em',
                color: T.muted,
                textDecoration: 'none',
                padding: '5px 11px',
                borderRadius: 'var(--radius-pill)',
                border: `1px solid ${T.border}`,
                background: T.bgChip,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = T.accent;
                e.currentTarget.style.borderColor = T.accentBorder;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = T.muted;
                e.currentTarget.style.borderColor = T.border;
              }}
            >
              CC BY-NC-SA 4.0
            </a>
          </div>

          {/* Il libro */}
          <FootCol T={T} title="Il libro">
            {FOOT_VOLUMES.map((v) => (
              <FootLink key={v.to} T={T} to={v.to} n={v.n}>
                {v.label}
              </FootLink>
            ))}
          </FootCol>

          {/* Progetto */}
          <FootCol T={T} title="Progetto">
            {FOOT_PROJECT.map((p) => (
              <FootLink key={p.label} T={T} to={p.to} href={p.href}>
                {p.label}
              </FootLink>
            ))}
          </FootCol>

          {/* Sostieni */}
          <div>
            <div
              style={{
                fontFamily: T.mono,
                fontSize: 11.5,
                fontWeight: 600,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: T.muted,
                marginBottom: 16,
              }}
            >
              Sostieni
            </div>
            <p
              style={{
                fontFamily: T.body,
                fontSize: 14,
                lineHeight: 1.5,
                color: T.muted,
                margin: '0 0 14px',
              }}
            >
              Se il libro ti dà valore,{' '}
              <Link
                to="/support"
                className="v4v-link"
                style={{ color: T.accent, textDecoration: 'none' }}
              >
                ricambia come preferisci
              </Link>
              .
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <PayLogo
                T={T}
                name="PayPal"
                href={V4V_LINKS.paypal}
                logo="/img/pay/paypal.svg"
                logoDark="/img/pay/paypal-dark.svg"
                tint="#179BD7"
              />
              <PayLogo
                T={T}
                name="Satispay"
                href={V4V_LINKS.satispay}
                logo="/img/pay/satispay.svg"
                tint="#FF3D00"
              />
              <PayLogo
                T={T}
                name="Bitcoin"
                to="/support"
                logo="/img/pay/bitcoin.svg"
                logoDark="/img/pay/bitcoin-dark.svg"
                tint="#F7931A"
              />
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            marginTop: 44,
            paddingTop: 24,
            paddingBottom: 28,
            borderTop: `1px solid ${T.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 24,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            <p
              style={{
                fontFamily: T.mono,
                fontSize: 11.5,
                lineHeight: 1.6,
                color: T.muted,
                margin: 0,
              }}
            >
              © {new Date().getFullYear()} Rainbow Bits · Contenuti sotto
              licenza{' '}
              <a
                href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
                target="_blank"
                rel="noreferrer"
                className="v4v-link"
                style={{ color: 'inherit', textDecoration: 'underline' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = T.accent)}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'inherit')}
              >
                CC BY-NC-SA 4.0
              </a>
              .
            </p>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                flexWrap: 'wrap',
                fontFamily: T.mono,
                fontSize: 11.5,
                lineHeight: 1.6,
                color: T.muted,
              }}
            >
              <span>Costruito con</span>
              <ToolCredit
                T={T}
                iconNode={<Icon name="heart" size={13} color="#ef4444" />}
                label="amore,"
              />
              <ToolCredit
                T={T}
                icon={docusaurusIcon}
                iconHeight={15}
                label="Docusaurus"
                href="https://docusaurus.io"
              />
              <span>e</span>
              <ToolCredit
                T={T}
                icon={claudeIcon}
                iconHeight={14}
                label="Claude Code."
                href="https://claude.com/claude-code"
              />
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 4,
                marginTop: 2,
              }}
            >
              {FOOT_LEGAL.map((l, i) => (
                <React.Fragment key={l.to}>
                  {i > 0 && (
                    <span
                      aria-hidden="true"
                      style={{ color: T.faint, fontSize: 11 }}
                    >
                      ·
                    </span>
                  )}
                  <Link
                    to={l.to}
                    className="v4v-link"
                    style={{
                      fontFamily: T.mono,
                      fontSize: 11.5,
                      letterSpacing: '0.03em',
                      color: T.muted,
                      textDecoration: 'none',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = T.accent)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = T.muted)
                    }
                  >
                    {l.label}
                  </Link>
                </React.Fragment>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <SocialBtn
              T={T}
              href="https://github.com/marcofarina/"
              label="GitHub"
            >
              <Icon name="github" size={17} color="currentColor" />
            </SocialBtn>
            <SocialBtn T={T} href={CONTACT_MAILTO} label="Email">
              <Icon name="envelope" size={17} color="currentColor" />
            </SocialBtn>
            <SocialBtn T={T} to="/support/" label="Offrimi un caffè">
              <MugSaucer style={{ width: 18, height: 16 }} />
            </SocialBtn>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function Footer(): React.JSX.Element {
  const { colorMode } = useColorMode();
  const mobile = useWindowSize() === 'mobile';
  const T = getAtmosphericTheme(colorMode === 'dark');
  return <FooterInner T={T} mobile={mobile} />;
}
