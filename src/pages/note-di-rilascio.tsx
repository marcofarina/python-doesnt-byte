/**
 * /note-di-rilascio — pagina "Note di rilascio" (changelog).
 *
 * Modalità timeline (cronologia di versioni + sezioni per categoria), adattata
 * al sistema "atmospheric" del sito: tema da getAtmosphericTheme, icone duotone dal
 * componente <Icon>, raggi dai token --radius-*. Layout responsivo: timeline a
 * due colonne su desktop, impilato (compatto) su mobile.
 *
 * I dati vivono in src/lib/releasesData.ts (al momento segnaposto).
 */
import React, { useMemo, useState, type ReactNode } from 'react';
import Layout from '@theme/Layout';
import { useColorMode, useWindowSize } from '@docusaurus/theme-common';
import Icon, { type IconName } from '@site/src/components/Icon';
import { getAtmosphericTheme, type AtmosphericTheme } from '@site/src/lib/atmosphericTheme';
import {
  RELEASES,
  CAT_ORDER,
  CATEGORY_META,
  type Release,
  type ReleaseCategory,
} from '@site/src/lib/releasesData';

const GITHUB_RELEASES =
  'https://github.com/marcofarina/python-doesnt-byte/releases';
const GITHUB_RELEASES_FEED = `${GITHUB_RELEASES}.atom`;

interface CatStyle {
  label: string;
  icon: IconName;
  c: string;
  bg: string;
  bd: string;
}

/* Colori per categoria (dipendono dal tema). Le etichette/icone arrivano da
   CATEGORY_META; qui si aggiunge solo la terna colore/sfondo/bordo. */
function getCats(T: AtmosphericTheme): Record<ReleaseCategory, CatStyle> {
  const green = T.dark ? '#34d399' : '#059669';
  const greenBg = T.dark ? 'rgba(52,211,153,0.10)' : 'rgba(5,150,105,0.07)';
  const greenBd = T.dark ? 'rgba(52,211,153,0.28)' : 'rgba(5,150,105,0.26)';
  const tone: Record<ReleaseCategory, { c: string; bg: string; bd: string }> = {
    new: { c: T.ln, bg: T.lnBg, bd: T.lnBorder },
    content: { c: T.paypal, bg: T.paypalBg, bd: T.paypalBorder },
    improved: { c: T.accent, bg: T.accentBg, bd: T.accentBorder },
    fixed: { c: T.lightning, bg: T.lightningBg, bd: T.lightningBorder },
    cleanup: { c: green, bg: greenBg, bd: greenBd },
  };
  return CAT_ORDER.reduce(
    (acc, k) => {
      acc[k] = { ...CATEGORY_META[k], ...tone[k] };
      return acc;
    },
    {} as Record<ReleaseCategory, CatStyle>,
  );
}

type Filter = 'all' | ReleaseCategory;

/* Conteggio totale per categoria (per i numeri sui filtri). */
function countByCat(): Record<ReleaseCategory, number> {
  const acc = {} as Record<ReleaseCategory, number>;
  CAT_ORDER.forEach((k) => (acc[k] = 0));
  RELEASES.forEach((r) =>
    CAT_ORDER.forEach((k) => {
      if (r.notes[k]) acc[k] += r.notes[k]!.length;
    }),
  );
  return acc;
}

/* ── Atomi ─────────────────────────────────────────── */
function Kicker({
  T,
  children,
  color,
}: {
  T: AtmosphericTheme;
  children: ReactNode;
  color?: string;
}) {
  return (
    <div
      style={{
        fontFamily: T.mono,
        fontSize: 11.5,
        fontWeight: 600,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: color || T.accent,
      }}
    >
      {children}
    </div>
  );
}

function Pill({
  T,
  icon,
  children,
}: {
  T: AtmosphericTheme;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 13px 6px 11px',
        borderRadius: 'var(--radius-pill)',
        background: T.accentChip,
        border: `1px solid ${T.accentChipBorder}`,
        fontFamily: T.mono,
        fontSize: 11.5,
        letterSpacing: '0.04em',
        color: T.accentSoft,
      }}
    >
      {icon}
      {children}
    </span>
  );
}

function LinkRow({
  T,
  href,
  label,
  icon,
  color,
}: {
  T: AtmosphericTheme;
  href: string;
  label: string;
  icon?: IconName;
  color?: string;
}) {
  const c = color || T.accentSoft;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="v4v-press"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        whiteSpace: 'nowrap',
        textDecoration: 'none',
        fontFamily: T.mono,
        fontSize: 12.5,
        fontWeight: 600,
        letterSpacing: '0.03em',
        color: c,
        border: `1px solid ${T.border}`,
        borderRadius: 'var(--radius-sm)',
        padding: '9px 14px',
        background: T.bgChip,
      }}
    >
      {icon && <Icon name={icon} size={14} color={c} />}
      {label}
      {!icon && <Icon name="arrow-right" size={14} color={c} />}
    </a>
  );
}

/* ── Sfondo glow ───────────────────────────────────── */
function Stage({ T }: { T: AtmosphericTheme }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: -160,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 1100,
        maxWidth: '120%',
        height: 560,
        pointerEvents: 'none',
        zIndex: 0,
        opacity: T.dark ? 0.9 : 0.55,
        background: T.dark
          ? 'radial-gradient(ellipse at center, rgba(56,189,248,0.16) 0%, rgba(99,102,241,0.07) 32%, transparent 62%)'
          : 'radial-gradient(ellipse at center, rgba(2,132,199,0.13) 0%, rgba(99,102,241,0.05) 32%, transparent 62%)',
      }}
    />
  );
}

/* ── Anteprima a strisce (segnaposto immagine) ─────── */
function RelShot({
  T,
  label,
  color,
}: {
  T: AtmosphericTheme;
  label: string;
  color: string;
}) {
  const stripe = `repeating-linear-gradient(45deg, ${
    T.dark ? 'rgba(255,255,255,0.045)' : 'rgba(0,0,0,0.04)'
  } 0 7px, transparent 7px 14px)`;
  return (
    <div
      style={{
        position: 'relative',
        height: 210,
        borderRadius: 'var(--radius-md)',
        background: T.bgChip,
        border: `1px solid ${T.border}`,
        backgroundImage: stripe,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '4px 0 20px',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(420px circle at 50% 40%, ${
            T.dark ? 'rgba(56,189,248,0.07)' : 'rgba(2,132,199,0.05)'
          }, transparent 70%)`,
        }}
      />
      <span
        style={{
          position: 'relative',
          fontFamily: T.mono,
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.12em',
          color: color || T.muted,
          textTransform: 'uppercase',
          padding: '7px 14px',
          borderRadius: 'var(--radius-sm)',
          background: T.dark ? 'rgba(11,11,14,0.6)' : 'rgba(250,250,249,0.7)',
          border: `1px solid ${T.border}`,
        }}
      >
        Anteprima · {label}
      </span>
    </div>
  );
}

/* ── Gruppo categoria (intestazione icona + elenco voci) ── */
function CatGroup({
  T,
  cat,
  items,
}: {
  T: AtmosphericTheme;
  cat: CatStyle;
  items: string[];
}) {
  return (
    <div style={{ marginTop: 22 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 11,
          marginBottom: 12,
        }}
      >
        <span
          style={{
            width: 30,
            height: 30,
            borderRadius: 'var(--radius-sm)',
            flexShrink: 0,
            background: cat.bg,
            border: `1px solid ${cat.bd}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: cat.c,
          }}
        >
          <Icon name={cat.icon} size={16} color={cat.c} />
        </span>
        <span
          style={{
            fontFamily: T.mono,
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: cat.c,
          }}
        >
          {cat.label}
        </span>
        <span style={{ fontFamily: T.mono, fontSize: 11, color: T.faint }}>
          {items.length}
        </span>
      </div>
      <ul
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 9,
        }}
      >
        {items.map((it, i) => (
          <li
            key={i}
            style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}
          >
            <span
              aria-hidden="true"
              style={{
                flexShrink: 0,
                width: 6,
                height: 6,
                borderRadius: 'var(--radius-pill)',
                marginTop: 8,
                background: cat.c,
                opacity: 0.85,
              }}
            />
            <span
              style={{
                fontFamily: T.body,
                fontSize: 16.5,
                lineHeight: 1.55,
                color: T.fgBody,
                textWrap: 'pretty',
              }}
            >
              {it}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Etichetta versione ────────────────────────────── */
function VersionTag({
  T,
  rel,
  inline,
}: {
  T: AtmosphericTheme;
  rel: Release;
  inline?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: inline ? 'row' : 'column',
        alignItems: inline ? 'baseline' : 'flex-start',
        gap: inline ? 14 : 6,
        flexWrap: 'wrap',
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          fontFamily: T.mono,
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: '0.02em',
          color: T.fgStrong,
          padding: '5px 12px',
          borderRadius: 'var(--radius-pill)',
          background: T.bgChip,
          border: `1px solid ${T.border}`,
        }}
      >
        <Icon name="tag" size={13} color={T.accent} />v{rel.v}
      </span>
      <span
        style={{
          fontFamily: T.mono,
          fontSize: 12,
          color: T.muted,
          letterSpacing: '0.02em',
        }}
      >
        {rel.date}
      </span>
      {rel.latest && (
        <span
          style={{
            fontFamily: T.mono,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: T.dark ? '#86efac' : '#15803d',
            padding: '3px 9px',
            borderRadius: 'var(--radius-pill)',
            background: T.dark
              ? 'rgba(34,197,94,0.12)'
              : 'rgba(22,163,74,0.09)',
            border: `1px solid ${T.dark ? 'rgba(34,197,94,0.3)' : 'rgba(22,163,74,0.28)'}`,
          }}
        >
          Ultima
        </span>
      )}
    </div>
  );
}

/* ── Una voce di rilascio ──────────────────────────── */
function ReleaseEntry({
  T,
  rel,
  cats,
  filter,
  compact,
  last,
}: {
  T: AtmosphericTheme;
  rel: Release;
  cats: Record<ReleaseCategory, CatStyle>;
  filter: Filter;
  compact: boolean;
  last: boolean;
}) {
  const keys = CAT_ORDER.filter(
    (k) => rel.notes[k] && (filter === 'all' || filter === k),
  );
  // Con un filtro attivo, nascondi le voci che non hanno quella categoria.
  if (keys.length === 0 && filter !== 'all') return null;
  const showFeature = !!rel.feature && filter === 'all';
  const featColor = rel.feature ? cats.new.c : T.accent;

  const content = (
    <div>
      {showFeature && rel.feature && (
        <div style={{ marginBottom: 6 }}>
          {rel.feature.shot && (
            <RelShot T={T} label={rel.feature.shot} color={featColor} />
          )}
          <h3
            style={{
              fontFamily: T.display,
              fontSize: 23,
              fontWeight: 700,
              color: T.fgStrong,
              letterSpacing: '-0.02em',
              margin: '0 0 8px',
              lineHeight: 1.2,
            }}
          >
            {rel.feature.title}
          </h3>
          <p
            style={{
              fontFamily: T.body,
              fontSize: 17,
              lineHeight: 1.6,
              color: T.fgBody,
              margin: 0,
              textWrap: 'pretty',
            }}
          >
            {rel.feature.body}
          </p>
        </div>
      )}
      {keys.map((k) => (
        <CatGroup key={k} T={T} cat={cats[k]} items={rel.notes[k]!} />
      ))}
    </div>
  );

  if (compact) {
    return (
      <article
        style={{ padding: '26px 0', borderTop: `1px solid ${T.border}` }}
      >
        <div style={{ marginBottom: 16 }}>
          <VersionTag T={T} rel={rel} inline />
        </div>
        {content}
      </article>
    );
  }

  // Timeline (desktop)
  return (
    <article
      style={{
        display: 'grid',
        gridTemplateColumns: '190px 1fr',
        gap: 36,
        position: 'relative',
        paddingBottom: last ? 0 : 44,
      }}
    >
      {/* nodo sulla linea */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 190,
          top: 7,
          transform: 'translateX(-50%)',
          width: 13,
          height: 13,
          borderRadius: 'var(--radius-pill)',
          background: rel.latest ? T.accent : T.bg,
          border: `2px solid ${rel.latest ? T.accent : T.borderStrong}`,
          boxShadow: rel.latest ? `0 0 0 4px ${T.accentChip}` : 'none',
          zIndex: 2,
        }}
      />
      <div
        style={{
          position: 'sticky',
          top: 'calc(var(--ifm-navbar-height, 60px) + 80px)',
          alignSelf: 'start',
          paddingRight: 28,
          height: 'fit-content',
        }}
      >
        <VersionTag T={T} rel={rel} />
      </div>
      <div style={{ paddingLeft: 8, minWidth: 0 }}>{content}</div>
    </article>
  );
}

/* ── Barra filtri ──────────────────────────────────── */
function FilterChip({
  T,
  active,
  label,
  n,
  color,
  onClick,
}: {
  T: AtmosphericTheme;
  active: boolean;
  label: string;
  n: number;
  color?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="v4v-press"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '7px 14px',
        borderRadius: 'var(--radius-pill)',
        cursor: 'pointer',
        fontFamily: T.mono,
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: '0.04em',
        background: active ? color || T.accent : T.bgChip,
        color: active ? '#fff' : T.mutedSoft,
        border: `1px solid ${active ? color || T.accent : T.border}`,
      }}
    >
      {label}
      <span
        style={{
          fontFamily: T.mono,
          fontSize: 11,
          opacity: active ? 0.85 : 0.6,
        }}
      >
        {n}
      </span>
    </button>
  );
}

/* ── Pagina ────────────────────────────────────────── */
function ReleasesPage({ T, mobile }: { T: AtmosphericTheme; mobile: boolean }) {
  const cats = useMemo(() => getCats(T), [T]);
  const counts = useMemo(() => countByCat(), []);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const [filter, setFilter] = useState<Filter>('all');
  const latest = RELEASES.find((r) => r.latest) || RELEASES[0];
  const compact = mobile;

  return (
    <div
      style={{
        background: T.bg,
        color: T.fg,
        minHeight: '100%',
        fontFamily: T.body,
      }}
    >
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <Stage T={T} />
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            maxWidth: 940,
            margin: '0 auto',
            padding: mobile ? '40px 20px 72px' : '62px 40px 88px',
          }}
        >
          {/* HEADER */}
          <header style={{ marginBottom: 36 }}>
            <Kicker T={T}>Changelog</Kicker>
            <h1
              style={{
                fontFamily: T.display,
                fontWeight: 700,
                color: T.fgStrong,
                letterSpacing: '-0.03em',
                lineHeight: 1.05,
                fontSize: mobile ? 38 : 50,
                margin: '12px 0 18px',
              }}
            >
              Note di rilascio
            </h1>
            <p
              style={{
                fontFamily: T.body,
                fontSize: 19,
                lineHeight: 1.6,
                color: T.fgBody,
                maxWidth: 640,
                margin: '0 0 22px',
                textWrap: 'pretty',
              }}
            >
              <em>Python doesn’t byte</em> è in continuo sviluppo. Qui trovi la
              cronologia degli aggiornamenti — capitoli nuovi, miglioramenti e
              correzioni — per sapere sempre cosa è cambiato.
            </p>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 12,
              }}
            >
              {latest && (
                <Pill
                  T={T}
                  icon={<Icon name="sparkles" size={13} color={T.accentSoft} />}
                >
                  Ultima · v{latest.v} — {latest.date}
                </Pill>
              )}
              <LinkRow T={T} href={GITHUB_RELEASES} label="Rilasci su GitHub" />
              <LinkRow
                T={T}
                href={GITHUB_RELEASES_FEED}
                label="RSS"
                icon="rss"
              />
            </div>
          </header>

          {/* FILTRI */}
          <div
            style={{
              position: 'sticky',
              top: 'var(--ifm-navbar-height, 60px)',
              zIndex: 20,
              margin: mobile ? '0 -20px 32px' : '0 -40px 38px',
              padding: mobile ? '14px 20px' : '16px 40px',
              background: T.dark
                ? 'rgba(11,11,14,0.7)'
                : 'rgba(250,250,249,0.78)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              borderBottom: `1px solid ${T.border}`,
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              <FilterChip
                T={T}
                active={filter === 'all'}
                label="Tutte"
                n={total}
                onClick={() => setFilter('all')}
              />
              {CAT_ORDER.map((k) => (
                <FilterChip
                  key={k}
                  T={T}
                  active={filter === k}
                  label={cats[k].label}
                  n={counts[k]}
                  color={cats[k].c}
                  onClick={() => setFilter(k)}
                />
              ))}
            </div>
          </div>

          {/* TIMELINE / ELENCO */}
          <div style={{ position: 'relative' }}>
            {!compact && (
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  left: 190,
                  top: 7,
                  bottom: 7,
                  width: 1,
                  background: `linear-gradient(180deg, ${T.borderStrong}, ${T.border} 12%, ${T.border} 88%, transparent)`,
                  transform: 'translateX(-50%)',
                }}
              />
            )}
            {RELEASES.map((rel, i) => (
              <ReleaseEntry
                key={rel.v}
                T={T}
                rel={rel}
                cats={cats}
                filter={filter}
                compact={compact}
                last={i === RELEASES.length - 1}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReleasesContent() {
  const { colorMode } = useColorMode();
  const mobile = useWindowSize() === 'mobile';
  const T = getAtmosphericTheme(colorMode === 'dark');
  return <ReleasesPage T={T} mobile={mobile} />;
}

export default function NoteDiRilascio(): React.JSX.Element {
  return (
    <Layout
      title="Note di rilascio"
      description="La cronologia degli aggiornamenti di Python doesn’t byte: capitoli nuovi, miglioramenti e correzioni, versione per versione."
    >
      <ReleasesContent />
    </Layout>
  );
}
