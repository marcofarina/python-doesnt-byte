import React, {
  useEffect,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { QRCodeSVG } from 'qrcode.react';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import Link from '@docusaurus/Link';
import { useColorMode, useWindowSize } from '@docusaurus/theme-common';
import Icon from '@site/src/components/Icon';
import { copyToClipboard } from '@site/src/theme/PyRunner/clipboard';
import {
  getAtmosphericTheme,
  type AtmosphericTheme,
} from '@site/src/lib/atmosphericTheme';
import {
  V4V_GOALS,
  V4V_DONORS,
  V4V_LINKS,
  type Milestone,
} from '@site/src/lib/v4vData';
import { CONTACT_MAILTO } from '@site/src/lib/site';

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

function Pill({ T, children }: { T: AtmosphericTheme; children: ReactNode }) {
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
      <Icon name="heart" size={13} color={T.accentSoft} />
      {children}
    </span>
  );
}

function WayCard({
  T,
  icon,
  kicker,
  title,
  children,
  accent,
  style,
}: {
  T: AtmosphericTheme;
  icon: ReactNode;
  kicker: string;
  title: string;
  children: ReactNode;
  accent?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        background: T.bgSubtle,
        border: `1px solid ${T.border}`,
        borderRadius: 'var(--radius-lg)',
        padding: '24px 24px 26px',
        position: 'relative',
        ...style,
      }}
    >
      <div
        style={{
          width: 46,
          height: 46,
          borderRadius: 'var(--radius-sm)',
          background: T.bgChip,
          border: `1px solid ${T.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: accent || T.accent,
          marginBottom: 18,
        }}
      >
        {icon}
      </div>
      <Kicker T={T} color={accent || T.accent}>
        {kicker}
      </Kicker>
      {/* h3: i tre "modi" (Time/Talent/Treasure) sono sotto-sezioni pari-livello
          dell'h2 "Time, Talent, Treasure". Il pannello Treasure usa già un h3,
          così l'outline resta h1 → h2 → (h3, h3, h3) senza salti. */}
      <Heading
        as="h3"
        style={{
          fontFamily: T.display,
          fontSize: 21,
          fontWeight: 700,
          color: T.fgStrong,
          letterSpacing: '-0.01em',
          lineHeight: 1.2,
          margin: '8px 0 8px',
        }}
      >
        {title}
      </Heading>
      <p
        style={{
          fontFamily: T.body,
          fontSize: 16,
          lineHeight: 1.55,
          color: T.fgBody,
          margin: 0,
        }}
      >
        {children}
      </p>
    </div>
  );
}

/* QR reale generato dalla stringa (qrcode.react → SVG). I moduli sono scuri su
   tessera SEMPRE chiara, anche in dark mode: è la combinazione di contrasto più
   affidabile da scansionare. Il colore "brand" del metodo vive sul bordo, non
   sui moduli. `level` regola la correzione d'errore: per il BOLT12 (stringa
   lunga) usiamo 'L' per tenere il QR meno denso. */
function QRTile({
  value,
  size,
  level = 'M',
}: {
  value: string;
  size: number;
  level?: 'L' | 'M' | 'Q' | 'H';
}) {
  const pad = Math.round(size * 0.07);
  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: 'var(--radius-sm)',
        padding: pad,
        display: 'flex',
        lineHeight: 0,
      }}
    >
      <QRCodeSVG
        value={value}
        size={size}
        level={level}
        bgColor="#ffffff"
        fgColor="#0b0b0e"
      />
    </div>
  );
}

/* Affordance "ingrandisci" (SVG inline, non un glifo unicode). */
function ExpandGlyph({ size = 12, color }: { size?: number; color: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      <path
        d="M2 6V2h4M14 6V2h-4M2 10v4h4M14 10v4h-4"
        stroke={color}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* Anteprima QR cliccabile (nella riga del metodo). Tap/click → apre la modale
   ingrandita. Necessaria perché a ~88px un QR — soprattutto il BOLT12 — è
   troppo piccolo per essere scansionato comodamente da telefono. */
function QRThumb({
  T,
  value,
  level,
  size,
  color,
  onOpen,
  name,
}: {
  T: AtmosphericTheme;
  value: string;
  level?: 'L' | 'M' | 'Q' | 'H';
  size: number;
  color: string;
  onOpen: () => void;
  name: string;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="v4v-press"
      aria-label={`Ingrandisci il QR per donare con ${name}`}
      title="Ingrandisci"
      style={{
        position: 'relative',
        padding: 0,
        border: `1px solid ${T.border}`,
        borderRadius: 'var(--radius-md)',
        background: T.bgChip,
        cursor: 'pointer',
        flexShrink: 0,
        lineHeight: 0,
      }}
    >
      <div style={{ padding: 4 }}>
        <QRTile value={value} size={size} level={level} />
      </div>
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          right: -7,
          bottom: -7,
          width: 24,
          height: 24,
          borderRadius: 'var(--radius-xs)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: color,
          color: '#fff',
          boxShadow: `0 2px 6px ${T.dark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.18)'}`,
        }}
      >
        <ExpandGlyph color="#fff" />
      </span>
    </button>
  );
}

/* Modale QR ingrandito. Renderizzata in portale su document.body: il pannello
   donazioni usa backdrop-filter, che crea un containing block e intrapppolerebbe
   un position:fixed reso lì dentro. */
function QRModal({
  T,
  tone,
  value,
  level,
  name,
  caption,
  onClose,
  children,
}: {
  T: AtmosphericTheme;
  tone: 'paypal' | 'satispay' | 'lightning';
  value: string;
  level?: 'L' | 'M' | 'Q' | 'H';
  name: string;
  caption: string;
  onClose: () => void;
  /** azione sotto il QR: LinkRow ("Apri…") o CopyRow ("Copia…") */
  children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const c = T[tone];
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`QR per donare con ${name}`}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        background: 'rgba(8,8,11,0.66)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: 'min(360px, 100%)',
          background: T.dark ? '#161619' : '#ffffff',
          border: `1px solid ${T.border}`,
          borderRadius: 'var(--radius-lg)',
          padding: '30px 26px 26px',
          textAlign: 'center',
          boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Chiudi"
          className="v4v-press"
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            width: 32,
            height: 32,
            borderRadius: 'var(--radius-sm)',
            border: `1px solid ${T.border}`,
            background: T.bgChip,
            color: T.muted,
            cursor: 'pointer',
            fontFamily: T.mono,
            fontSize: 16,
            lineHeight: 1,
          }}
        >
          ×
        </button>
        <div style={{ display: 'inline-flex', marginBottom: 16 }}>
          <div
            style={{
              padding: 8,
              borderRadius: 'var(--radius-lg)',
              border: `1px solid ${T[`${tone}Border`]}`,
              background: T[`${tone}Bg`],
            }}
          >
            <QRTile value={value} size={232} level={level} />
          </div>
        </div>
        <div
          style={{
            fontFamily: T.display,
            fontSize: 21,
            fontWeight: 700,
            color: T.fgStrong,
            marginBottom: 4,
          }}
        >
          {name}
        </div>
        <p
          style={{
            fontFamily: T.body,
            fontSize: 14,
            color: T.muted,
            lineHeight: 1.45,
            margin: '0 auto 18px',
            maxWidth: 280,
          }}
        >
          {caption}
        </p>
        <div
          style={{ display: 'flex', justifyContent: 'center' }}
          /* impedisce che il tap sull'azione chiuda la modale */
        >
          {children}
        </div>
        <div
          style={{
            fontFamily: T.mono,
            fontSize: 10.5,
            letterSpacing: '0.04em',
            color: T.muted,
            marginTop: 14,
          }}
        >
          Inquadra il QR con la fotocamera o l’app{' '}
          <span style={{ color: c }}>{name}</span>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function LinkRow({
  T,
  href,
  label,
  color,
}: {
  T: AtmosphericTheme;
  href: string;
  label: string;
  color?: string;
}) {
  return (
    <Link
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
        color: color || T.accentSoft,
        border: `1px solid ${T.border}`,
        borderRadius: 'var(--radius-sm)',
        padding: '9px 14px',
        background: T.bgChip,
      }}
    >
      {label}
      <Icon name="arrow-right" size={14} color={color || T.accentSoft} />
    </Link>
  );
}

/* Pulsante "copia indirizzo" — per i metodi senza link (es. BOLT12) che si
   usano scansionando il QR o copiando la stringa. Stesso look di LinkRow. */
function CopyRow({
  T,
  value,
  label,
  color,
}: {
  T: AtmosphericTheme;
  value: string;
  label: string;
  color?: string;
}) {
  const [copied, setCopied] = useState(false);
  const c = color || T.accentSoft;
  const onCopy = () => {
    copyToClipboard(value)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => undefined);
  };
  return (
    <button
      type="button"
      onClick={onCopy}
      className="v4v-press"
      aria-label={copied ? 'Indirizzo copiato' : label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        whiteSpace: 'nowrap',
        cursor: 'pointer',
        textAlign: 'left',
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
      {copied ? 'Copiato!' : label}
      <Icon name={copied ? 'check' : 'copy'} size={14} color={c} />
    </button>
  );
}

/* ── Pannello donazioni (Treasure) ─────────────────── */
function PayRow({
  T,
  tone,
  icon,
  name,
  caption,
  href,
  link,
  copyValue,
  qrValue,
  qrLevel,
}: {
  T: AtmosphericTheme;
  tone: 'paypal' | 'satispay' | 'lightning';
  icon: ReactNode;
  name: string;
  caption: string;
  /** link "Apri …" per i metodi web (PayPal, Satispay) */
  href?: string;
  link?: string;
  /** stringa da copiare per i metodi senza link (es. offer BOLT12) */
  copyValue?: string;
  /** stringa REALE codificata nel QR (URL per PayPal/Satispay, URI BIP21 per
      Lightning). Può differire da `copyValue`: il QR usa l'URI tappabile, il
      bottone copia la forma nuda. */
  qrValue: string;
  qrLevel?: 'L' | 'M' | 'Q' | 'H';
}) {
  const [open, setOpen] = useState(false);
  const bg = T[`${tone}Bg`];
  const bd = T[`${tone}Border`];
  const c = T[tone];

  // L'azione (copia / apri) è identica nella riga e nella modale.
  const action = copyValue ? (
    <CopyRow
      T={T}
      value={copyValue}
      label={link || 'Copia indirizzo'}
      color={c}
    />
  ) : href && link ? (
    <LinkRow T={T} href={href} label={link} color={c} />
  ) : null;

  return (
    <div
      style={{
        display: 'flex',
        gap: 14,
        padding: 14,
        borderRadius: 'var(--radius-md)',
        background: bg,
        border: `1px solid ${bd}`,
      }}
    >
      <QRThumb
        T={T}
        value={qrValue}
        level={qrLevel}
        size={88}
        color={c}
        name={name}
        onOpen={() => setOpen(true)}
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 7,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {icon}
          <span
            style={{
              fontFamily: T.display,
              fontSize: 16.5,
              fontWeight: 700,
              color: T.fgStrong,
            }}
          >
            {name}
          </span>
        </div>
        <span
          style={{
            fontFamily: T.body,
            fontSize: 13.5,
            color: T.muted,
            lineHeight: 1.4,
          }}
        >
          {caption}
        </span>
        {action}
      </div>
      {open && (
        <QRModal
          T={T}
          tone={tone}
          value={qrValue}
          level={qrLevel}
          name={name}
          caption={caption}
          onClose={() => setOpen(false)}
        >
          {action}
        </QRModal>
      )}
    </div>
  );
}

function DonationPanel({ T, ring }: { T: AtmosphericTheme; ring?: boolean }) {
  return (
    <div
      className={ring ? 'v4v-ring' : 'v4v-beam'}
      style={{
        borderRadius: 'var(--radius-lg)',
        padding: ring ? 1.6 : 1.4,
        background: T.bgSubtle,
        ...(ring
          ? {}
          : ({ '--bop': T.dark ? '0.85' : '0.6' } as CSSProperties)),
      }}
    >
      <div
        style={{
          borderRadius: 'calc(var(--radius-lg) - 1.4px)',
          background: T.bgPanel,
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          padding: '24px 22px 24px',
        }}
      >
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 'var(--radius-sm)',
            background: T.bgChip,
            border: `1px solid ${T.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: T.lightning,
            marginBottom: 18,
          }}
        >
          <Icon name="treasure-chest" size={24} color={T.lightning} />
        </div>
        <Kicker T={T} color={T.satispay}>
          Treasure
        </Kicker>
        <Heading
          as="h3"
          style={{
            fontFamily: T.display,
            fontSize: 23,
            fontWeight: 700,
            color: T.fgStrong,
            letterSpacing: '-0.02em',
            margin: '8px 0 4px',
          }}
        >
          Sostieni in 30 secondi
        </Heading>
        <p
          style={{
            fontFamily: T.body,
            fontSize: 14.5,
            color: T.muted,
            lineHeight: 1.45,
            margin: '0 0 18px',
          }}
        >
          Tre modi, stesso risultato. Scegli quello che preferisci.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <PayRow
            T={T}
            tone="paypal"
            icon={<Icon name="credit-card" size={17} color={T.paypal} />}
            name="PayPal"
            caption="Carta o conto, anche senza account."
            href={V4V_LINKS.paypal}
            link="Apri PayPal"
            qrValue={V4V_LINKS.paypal}
          />
          <PayRow
            T={T}
            tone="satispay"
            icon={<Icon name="mobile" size={17} color={T.satispay} />}
            name="Satispay"
            caption="Dall’app, in due tap. Nessuna commissione."
            href={V4V_LINKS.satispay}
            link="Apri Satispay"
            qrValue={V4V_LINKS.satispay}
          />
          <PayRow
            T={T}
            tone="lightning"
            icon={<Icon name="circle-bitcoin" size={17} color={T.lightning} />}
            name="Bitcoin Lightning"
            caption="Scansiona il QR o copia l’offer BOLT12."
            copyValue={V4V_LINKS.lightning.offer}
            link="Copia offer"
            qrValue={V4V_LINKS.lightning.uri}
            qrLevel="L"
          />
        </div>
      </div>
    </div>
  );
}

/* ── Obiettivi / Trasparenza (Kickstarter-style) ────── */
function GoalBar({
  T,
  raised,
  max,
  milestones,
  height = 12,
}: {
  T: AtmosphericTheme;
  raised: number;
  max: number;
  milestones: Milestone[];
  height?: number;
}) {
  const pct = Math.min(100, (raised / max) * 100);
  return (
    <div style={{ position: 'relative', paddingTop: 4 }}>
      <div
        style={{
          position: 'relative',
          height,
          borderRadius: 'var(--radius-pill)',
          background: T.track,
          overflow: 'visible',
        }}
      >
        <div
          className="v4v-fill"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${pct}%`,
            borderRadius: 'var(--radius-pill)',
            background: `linear-gradient(90deg, ${T.accent}, #818cf8, ${T.accent})`,
          }}
        />
        {milestones.map((m) => {
          const left = Math.min(100, (m.amount / max) * 100);
          const hit = raised >= m.amount;
          return (
            <div
              key={m.amount}
              style={{
                position: 'absolute',
                left: `${left}%`,
                top: '50%',
                transform: 'translate(-50%,-50%)',
                width: height + 6,
                height: height + 6,
                borderRadius: 'var(--radius-pill)',
                background: hit ? T.accent : T.bg,
                border: `2px solid ${hit ? T.accent : T.borderStrong}`,
                boxShadow: hit ? `0 0 0 3px ${T.accentChip}` : 'none',
              }}
            />
          );
        })}
      </div>
      {/* Etichette posizionate in assoluto SOTTO il rispettivo pallino (stessa
          percentuale `left`), non con space-between: altrimenti la prima finiva
          a 0% mentre il suo pallino è al 20%. Le estremità si ancorano al bordo
          per non sforare il contenitore. */}
      <div style={{ position: 'relative', height: 15, marginTop: 10 }}>
        {milestones.map((m) => {
          const left = Math.min(100, (m.amount / max) * 100);
          const transform =
            left <= 0
              ? 'translateX(0)'
              : left >= 100
                ? 'translateX(-100%)'
                : 'translateX(-50%)';
          return (
            <span
              key={m.amount}
              style={{
                position: 'absolute',
                left: `${left}%`,
                transform,
                whiteSpace: 'nowrap',
                fontFamily: T.mono,
                fontSize: 11,
                color: raised >= m.amount ? T.accentSoft : T.muted,
                fontWeight: raised >= m.amount ? 600 : 400,
              }}
            >
              {V4V_GOALS.currency}
              {m.amount}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function DonorChip({
  T,
  name,
  hue,
  top,
}: {
  T: AtmosphericTheme;
  name: string;
  hue: number;
  top: boolean;
}) {
  const initial = name === 'Anonimo' ? '?' : name[0];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '4px 13px 4px 4px',
        borderRadius: 'var(--radius-pill)',
        background: T.bgChip,
        border: `1px solid ${T.border}`,
        fontFamily: T.body,
        fontSize: 14.5,
        color: T.fgBody,
      }}
    >
      <span
        style={{
          flexShrink: 0,
          width: 25,
          height: 25,
          borderRadius: 'var(--radius-pill)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: T.mono,
          fontSize: 11,
          fontWeight: 600,
          color: '#fff',
          background: `oklch(0.62 0.15 ${hue})`,
        }}
      >
        {initial}
      </span>
      {name}
      {top && <Icon name="heart" size={12} color={T.satispay} />}
    </span>
  );
}

function GoalsBlock({
  T,
  raised,
  donors,
  mobile,
}: {
  T: AtmosphericTheme;
  raised?: number;
  donors?: boolean;
  mobile?: boolean;
}) {
  const g = V4V_GOALS;
  const r = raised == null ? g.raised : raised;
  const max = g.milestones[g.milestones.length - 1].amount;
  const pct = Math.round((r / max) * 100);
  return (
    <div
      style={{
        background: T.bgPanel,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: `1px solid ${T.border}`,
        borderRadius: 'var(--radius-lg)',
        padding: mobile ? '22px 20px 24px' : '28px 30px 30px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
          marginBottom: 6,
        }}
      >
        <Kicker T={T}>Obiettivi {g.year}</Kicker>
        <span style={{ fontFamily: T.mono, fontSize: 12, color: T.muted }}>
          {pct}% del traguardo
        </span>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 10,
          marginBottom: 18,
        }}
      >
        <span
          style={{
            fontFamily: T.display,
            fontSize: 40,
            fontWeight: 700,
            color: T.fgStrong,
            letterSpacing: '-0.02em',
            lineHeight: 1,
          }}
        >
          {g.currency}
          {r}
        </span>
        <span style={{ fontFamily: T.body, fontSize: 16, color: T.muted }}>
          raccolti su {g.currency}
          {max}
        </span>
      </div>
      <GoalBar T={T} raised={r} max={max} milestones={g.milestones} />
      <p
        style={{
          fontFamily: T.body,
          fontSize: 14.5,
          lineHeight: 1.55,
          color: T.fgBody,
          margin: '20px 0 0',
        }}
      >
        {g.costNote}
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: mobile ? '1fr' : '1fr 1fr 1fr',
          gap: 12,
          marginTop: 20,
        }}
      >
        {g.milestones.map((m) => {
          const hit = r >= m.amount;
          return (
            <div
              key={m.amount}
              style={{
                display: 'flex',
                gap: 14,
                alignItems: 'flex-start',
                padding: '14px 16px',
                borderRadius: 'var(--radius-md)',
                background: hit ? T.accentBg : T.bgSubtle,
                border: `1px solid ${hit ? T.accentBorder : T.border}`,
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  flexShrink: 0,
                  width: 34,
                  height: 34,
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: hit ? T.accent : T.bgChip,
                  color: hit ? '#fff' : T.muted,
                  border: hit ? 'none' : `1px solid ${T.border}`,
                }}
              >
                {hit ? (
                  <Icon name="check" size={17} color="#fff" />
                ) : (
                  <Icon name={m.icon} size={16} color={T.muted} />
                )}
              </div>
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 8,
                    marginBottom: 3,
                  }}
                >
                  <span
                    style={{
                      fontFamily: T.mono,
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: hit ? T.accentSoft : T.fg,
                    }}
                  >
                    {g.currency}
                    {m.amount}
                  </span>
                  {hit && (
                    <span
                      style={{
                        fontFamily: T.mono,
                        fontSize: 9.5,
                        letterSpacing: '0.1em',
                        color: T.dark ? '#86efac' : '#15803d',
                        textTransform: 'uppercase',
                      }}
                    >
                      ✓ Raggiunto
                    </span>
                  )}
                </div>
                <div
                  style={{
                    fontFamily: T.display,
                    fontSize: 16.5,
                    fontWeight: 700,
                    color: T.fgStrong,
                    marginBottom: 3,
                  }}
                >
                  {m.title}
                </div>
                <div
                  style={{
                    fontFamily: T.body,
                    fontSize: 14,
                    lineHeight: 1.45,
                    color: T.muted,
                  }}
                >
                  {m.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {donors && (
        <div
          style={{
            marginTop: 24,
            paddingTop: 22,
            borderTop: `1px solid ${T.border}`,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: 12,
              marginBottom: 14,
            }}
          >
            <Kicker T={T}>I sostenitori</Kicker>
            <span
              style={{ fontFamily: T.mono, fontSize: 11.5, color: T.muted }}
            >
              grazie a chi c’è già · {V4V_DONORS.length}
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
            {V4V_DONORS.map((d, i) => (
              <DonorChip
                key={i}
                T={T}
                name={d.name}
                hue={(i * 47) % 360}
                top={d.tier >= 3}
              />
            ))}
            <Link
              to="/support"
              className="v4v-press"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '5px 15px',
                borderRadius: 'var(--radius-pill)',
                background: T.accentChip,
                border: `1px solid ${T.accentChipBorder}`,
                fontFamily: T.body,
                fontSize: 14.5,
                color: T.accentSoft,
                textDecoration: 'none',
              }}
            >
              <Icon name="heart" size={13} color={T.accentSoft} />
              Il prossimo sei tu
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Glow di sfondo ────────────────────────────────── */
function Stage({ T }: { T: AtmosphericTheme }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: -140,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 1100,
        maxWidth: '120%',
        height: 560,
        pointerEvents: 'none',
        zIndex: 0,
        opacity: T.dark ? 0.9 : 0.6,
        background: T.dark
          ? 'radial-gradient(ellipse at center, rgba(56,189,248,0.16) 0%, rgba(99,102,241,0.07) 32%, transparent 62%)'
          : 'radial-gradient(ellipse at center, rgba(2,132,199,0.14) 0%, rgba(99,102,241,0.06) 32%, transparent 62%)',
      }}
    />
  );
}

/* ── Pagina ────────────────────────────────────────── */
function V4VPage({ T, mobile }: { T: AtmosphericTheme; mobile: boolean }) {
  const secTitle: CSSProperties = {
    fontFamily: T.display,
    fontSize: 28,
    fontWeight: 700,
    color: T.fgStrong,
    letterSpacing: '-0.02em',
    margin: 0,
  };
  const lead: CSSProperties = {
    fontFamily: T.body,
    fontSize: 19,
    lineHeight: 1.6,
    color: T.fgBody,
  };

  return (
    <div
      style={{
        background: T.bg,
        color: T.fg,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Stage T={T} />
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 1080,
          margin: '0 auto',
          padding: mobile ? '40px 20px 64px' : '60px 44px 84px',
        }}
      >
        {/* HERO */}
        <div style={{ textAlign: 'center', maxWidth: 760, margin: '0 auto' }}>
          <Pill T={T}>Value for value</Pill>
          <Heading
            as="h1"
            style={{
              fontFamily: T.display,
              fontWeight: 700,
              color: T.fgStrong,
              letterSpacing: '-0.03em',
              lineHeight: 1.04,
              fontSize: mobile ? 38 : 56,
              margin: '20px 0 22px',
            }}
          >
            Se il libro ti dà valore,
            <br />
            {/* Testo a gradiente: usa la classe globale .at-grad-blue (clip su
                entrambi i prefissi, var --at-grad-accent per tema). L'inline
                `background-clip: text` di React viene scartato dal DOM in dark,
                quindi NON affidarsi agli stili inline per il clipping. */}
            <span className="at-grad-blue" style={{ fontStyle: 'italic' }}>
              restituiscine un po’.
            </span>
          </Heading>
          <p style={{ ...lead, margin: '0 auto 14px', maxWidth: 640 }}>
            <em>Python doesn’t byte</em> è gratis, libero e open source — e
            resterà così. Ma scriverlo costa tempo e tenerlo online costa
            denaro.
          </p>
          <p
            style={{
              ...lead,
              fontSize: 16.5,
              color: T.muted,
              margin: '0 auto',
              maxWidth: 600,
            }}
          >
            Se per te ha un valore, ricambia come preferisci. È la filosofia del{' '}
            <Link
              href="https://value4value.info/"
              target="_blank"
              rel="noreferrer"
              style={{
                color: T.accent,
                textDecoration: 'underline',
                textUnderlineOffset: '0.18em',
              }}
            >
              Value 4 Value
            </Link>
            : tre modi, nessun obbligo.
          </p>
        </div>

        {/* TRE MODI */}
        <div style={{ textAlign: 'center', margin: '58px 0 26px' }}>
          <Kicker T={T}>Tre modi</Kicker>
          <Heading as="h2" style={{ ...secTitle, marginTop: 8 }}>
            Time, Talent, Treasure
          </Heading>
          <p
            style={{
              fontFamily: T.body,
              fontSize: 17,
              color: T.muted,
              margin: '10px auto 0',
              maxWidth: 600,
            }}
          >
            Tempo, competenze o un contributo: scegli come ricambiare.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: mobile ? '1fr' : '1.08fr 0.92fr',
            gap: 34,
            alignItems: 'stretch',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <WayCard
              T={T}
              icon={<Icon name="clock" size={22} />}
              kicker="Time"
              title="Donami un po’ di tempo"
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              Fai conoscere il progetto: parlane ad altri studenti, alle loro
              famiglie o ai docenti di altre scuole — il passaparola è il modo
              più semplice per farlo crescere. Oppure, se trovi un errore o un
              passaggio poco chiaro,{' '}
              <Link
                href={CONTACT_MAILTO}
                style={{
                  color: T.accent,
                  fontWeight: 700,
                  textDecoration: 'underline',
                  textUnderlineOffset: '0.18em',
                }}
              >
                segnalamelo
              </Link>
              : ogni correzione rende il libro migliore per chi verrà dopo di
              te.
            </WayCard>
            <WayCard
              T={T}
              icon={<Icon name="sparkles" size={22} />}
              kicker="Talent"
              title="Metti in gioco le tue competenze"
              accent={T.ln}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              Sai programmare, fare design o comunicazione? Apri una{' '}
              <strong style={{ color: T.fgStrong }}>pull request</strong>,
              proponi un nuovo capitolo, un esercizio o una revisione, oppure{' '}
              <Link
                href={CONTACT_MAILTO}
                style={{
                  color: T.ln,
                  textDecoration: 'underline',
                  textUnderlineOffset: '0.18em',
                }}
              >
                scrivimi
              </Link>{' '}
              e basta: il codice è su GitHub e c’è sempre spazio per migliorare,
              qualunque sia la tua competenza.
            </WayCard>
          </div>
          <DonationPanel T={T} ring />
        </div>

        {/* CAMPAGNA */}
        <div style={{ margin: '60px 0 0' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 14,
              marginBottom: 20,
              flexWrap: 'wrap',
            }}
          >
            <Heading as="h2" style={secTitle}>
              La campagna {V4V_GOALS.year}
            </Heading>
            <span style={{ fontFamily: T.body, fontSize: 16, color: T.muted }}>
              — dove vanno i contributi
            </span>
          </div>
          <GoalsBlock T={T} donors mobile={mobile} />
          <p
            style={{
              fontFamily: T.body,
              fontStyle: 'italic',
              fontSize: 17,
              color: T.muted,
              textAlign: 'center',
              margin: '34px 0 0',
            }}
          >
            Grazie, davvero. — Marco
          </p>
        </div>

        {/* NOTA LEGALE */}
        <div
          style={{
            margin: '44px 0 0',
            borderRadius: 'var(--radius-lg)',
            border: `1px solid ${T.border}`,
            background: T.bgSubtle,
            padding: '26px 30px 28px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                flexShrink: 0,
                width: 40,
                height: 40,
                borderRadius: 'var(--radius-sm)',
                background: T.bgChip,
                border: `1px solid ${T.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: T.muted,
              }}
            >
              <Icon name="shield-check" size={20} color={T.muted} />
            </div>
            <div>
              <Kicker T={T} color={T.muted}>
                Nota legale
              </Kicker>
              <div
                style={{
                  fontFamily: T.display,
                  fontSize: 18.5,
                  fontWeight: 700,
                  color: T.fgStrong,
                  letterSpacing: '-0.01em',
                  marginTop: 2,
                }}
              >
                Natura delle donazioni
              </div>
            </div>
          </div>
          <p
            style={{
              fontFamily: T.body,
              fontSize: 13.5,
              lineHeight: 1.64,
              color: T.muted,
              margin: 0,
              textAlign: 'justify',
              hyphens: 'auto',
            }}
          >
            Questo progetto è stato ideato e realizzato integralmente a titolo
            personale, al di fuori delle funzioni d’ufficio e senza alcun
            coinvolgimento, finanziamento, patrocinio o approvazione della
            scuola, dell’Amministrazione pubblica o del Ministero
            dell’Istruzione e del Merito. Le somme eventualmente ricevute
            tramite questa pagina hanno natura di erogazioni liberali volontarie
            e non costituiscono in alcun modo corrispettivo, prezzo, quota di
            iscrizione o contributo obbligatorio per l’accesso ai contenuti. Il
            libro, i materiali e le eventuali nuove versioni del progetto
            restano integralmente gratuiti, pubblici e liberamente accessibili a
            tutti, indipendentemente da qualsiasi donazione. I contributi
            servono esclusivamente a sostenere in modo volontario i costi di
            sviluppo, manutenzione, aggiornamento e diffusione del progetto,
            senza alcuna controprestazione individuale, vantaggio riservato o
            servizio dedicato ai donatori. La donazione è quindi un gesto libero
            di sostegno al progetto e non comporta alcun obbligo né alcuna
            condizione economica per la fruizione del materiale.
          </p>
          <Link
            to="/legale/note-legali-donazioni"
            className="v4v-press"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              marginTop: 18,
              fontFamily: T.mono,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '0.03em',
              color: T.accentSoft,
              textDecoration: 'none',
              padding: '8px 14px',
              borderRadius: 'var(--radius-sm)',
              border: `1px solid ${T.border}`,
              background: T.bgChip,
            }}
          >
            Leggi le note legali complete
            <Icon name="arrow-right" size={14} color={T.accentSoft} />
          </Link>
        </div>
      </div>
    </div>
  );
}

function V4VContent() {
  const { colorMode } = useColorMode();
  const mobile = useWindowSize() === 'mobile';
  const T = getAtmosphericTheme(colorMode === 'dark');
  return <V4VPage T={T} mobile={mobile} />;
}

export default function Support(): React.JSX.Element {
  return (
    <Layout
      title="Value for value"
      description="Python doesn’t byte è gratis, libero e open source. Se ti dà valore, ecco come ricambiare: tempo, competenze o un contributo."
    >
      <V4VContent />
    </Layout>
  );
}
