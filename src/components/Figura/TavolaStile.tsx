/**
 * Tavola di stile delle figure (fase G0): ruoli di colore, spessori, corpi,
 * raggi, punte, i due tratti a confronto, l'effetto «si disegna» e i ritmi.
 * Solo per la sandbox docs/figure-test.mdx.
 */
import React from 'react';
import { curva, DUR } from './motore';
import { CORPO, Forma, Testo } from './primitive/comune';
import { ruvido } from './ruvido';
import type { Ruolo, Tratto } from './tipi';
import styles from './styles.module.css';

const RUOLI: { r: Ruolo; uso: string }[] = [
  { r: 'inchiostro', uso: 'testo e tratti' },
  { r: 'tenue', uso: 'contesto' },
  { r: 'accento', uso: 'ciò che cambia' },
  { r: 'dato', uso: 'file, righe' },
  { r: 'programma', uso: 'codice, esecuzione' },
  { r: 'persona', uso: 'chi agisce' },
  { r: 'errore', uso: 'perso, sbagliato' },
  { r: 'ok', uso: 'corretto' },
];

export function Tavola({
  titolo,
  l,
  a,
  children,
}: {
  titolo: string;
  l: number;
  a: number;
  children: React.ReactNode;
}) {
  return (
    <figure className={styles.figura} data-tavola={titolo}>
      <div className={styles.scorri}>
        <svg
          className={styles.scena}
          viewBox={`0 0 ${l} ${a}`}
          style={{
            maxWidth: `${l}px`,
            minWidth: `${Math.round((l * 12) / 15)}px`,
          }}
          role="img"
          aria-label={titolo}
        >
          {children}
        </svg>
      </div>
      <figcaption className={styles.barra}>
        <p className={styles.didascalia}>{titolo}</p>
      </figcaption>
    </figure>
  );
}

export function TavolaColori(): JSX.Element {
  return (
    <Tavola titolo="Ruoli di colore: tratto, fondo e testo" l={680} a={250}>
      {RUOLI.map(({ r, uso }, i) => {
        const x = (i % 4) * 170;
        const y = Math.floor(i / 4) * 125;
        return (
          <g key={r} style={{ color: `var(--fig-${r})` }}>
            <Forma
              chiave={`colore-${r}`}
              g={{ f: 'rett', x: x + 4, y: y + 4, l: 150, a: 56, pieno: true }}
              tratto="netto"
              progresso={1}
              raggio={10}
              fondo={styles.fondo}
            />
            <Testo
              x={x + 16}
              y={y + 30}
              testo={r}
              tratto="netto"
              corpo={CORPO.normale}
            />
            <Testo
              x={x + 16}
              y={y + 50}
              testo={`--fig-${r}`}
              tratto="netto"
              famiglia="codice"
              corpo={12}
            />
            <g style={{ color: 'var(--fig-tenue)' }}>
              <Testo
                x={x + 4}
                y={y + 86}
                testo={uso}
                tratto="mano"
                corpo={CORPO.piccolo}
              />
            </g>
          </g>
        );
      })}
    </Tavola>
  );
}

export function TavolaMisure(): JSX.Element {
  const raggi = [6, 10, 14, 18];
  return (
    <Tavola titolo="Spessori, corpi, raggi e punte" l={680} a={300}>
      {/* Spessori */}
      <Testo
        x={0}
        y={22}
        testo="spessori"
        tratto="netto"
        corpo={CORPO.piccolo}
        classe={styles.fontCodice}
      />
      <Forma
        chiave="sp1"
        g={{ f: 'linea', x0: 0, y0: 46, x1: 150, y1: 46 }}
        tratto="netto"
        progresso={1}
      />
      <g className={styles.spesso}>
        <Forma
          chiave="sp2"
          g={{ f: 'linea', x0: 0, y0: 70, x1: 150, y1: 70 }}
          tratto="netto"
          progresso={1}
        />
      </g>
      <Forma
        chiave="sp3"
        g={{ f: 'linea', x0: 0, y0: 94, x1: 150, y1: 94 }}
        tratto="mano"
        progresso={1}
      />
      <g className={styles.spesso}>
        <Forma
          chiave="sp4"
          g={{ f: 'linea', x0: 0, y0: 118, x1: 150, y1: 118 }}
          tratto="mano"
          progresso={1}
        />
      </g>

      {/* Corpi */}
      <Testo
        x={200}
        y={22}
        testo="corpi 15 · 17 · 21"
        tratto="netto"
        corpo={CORPO.piccolo}
        classe={styles.fontCodice}
      />
      {(['mano', 'netto'] as Tratto[]).map((t, j) =>
        [CORPO.piccolo, CORPO.normale, CORPO.grande].map((c, i) => (
          <Testo
            key={`${t}${c}`}
            x={200 + j * 150}
            y={54 + i * 30}
            testo={t === 'mano' ? 'Memoria' : 'Memoria'}
            tratto={t}
            corpo={c}
          />
        )),
      )}
      {[CORPO.piccolo, CORPO.normale].map((c, i) => (
        <Testo
          key={c}
          x={500}
          y={54 + i * 30}
          testo="Ron  −5"
          tratto="netto"
          famiglia="codice"
          corpo={c}
        />
      ))}

      {/* Raggi */}
      <Testo
        x={0}
        y={172}
        testo="raggi 6 · 10 · 14 · 18"
        tratto="netto"
        corpo={CORPO.piccolo}
        classe={styles.fontCodice}
      />
      {raggi.map((r, i) => (
        <Forma
          key={r}
          chiave={`r${r}`}
          g={{ f: 'rett', x: i * 80, y: 186, l: 64, a: 48 }}
          tratto="netto"
          progresso={1}
          raggio={r}
        />
      ))}

      {/* Punte */}
      <Testo
        x={360}
        y={172}
        testo="punte"
        tratto="netto"
        corpo={CORPO.piccolo}
        classe={styles.fontCodice}
      />
      {(['mano', 'netto'] as Tratto[]).map((t, i) => (
        <g key={t}>
          <Forma
            chiave={`pu-${t}`}
            g={{
              f: 'path',
              d: `M360 ${210 + i * 40}Q450 ${190 + i * 40} 540 ${210 + i * 40}`,
            }}
            tratto={t}
            progresso={1}
          />
          <Forma
            chiave={`pu-${t}-p`}
            g={{
              f: 'path',
              d: `M530 ${201 + i * 40}L540 ${210 + i * 40}L528 ${215 + i * 40}`,
            }}
            tratto={t}
            progresso={1}
          />
          <Testo
            x={556}
            y={215 + i * 40}
            testo={t}
            tratto={t}
            corpo={CORPO.piccolo}
          />
        </g>
      ))}
    </Tavola>
  );
}

export function TavolaTratti(): JSX.Element {
  return (
    <Tavola
      titolo="I due tratti a confronto: mano (sopra) e netto (sotto)"
      l={680}
      a={250}
    >
      {(['mano', 'netto'] as Tratto[]).map((t, i) => {
        const y = i * 125;
        return (
          <g key={t}>
            <g style={{ color: 'var(--fig-persona)' }}>
              <Forma
                chiave={`tr-${t}-r`}
                g={{ f: 'rett', x: 4, y: y + 10, l: 170, a: 90, pieno: true }}
                tratto={t}
                progresso={1}
                raggio={14}
                fondo={styles.fondo}
              />
              <Testo x={18} y={y + 36} testo="memoria" tratto={t} />
            </g>
            <g style={{ color: 'var(--fig-dato)' }}>
              <Forma
                chiave={`tr-${t}-c`}
                g={{
                  f: 'poligono',
                  punti: [
                    [230, y + 10],
                    [372, y + 10],
                    [390, y + 28],
                    [390, y + 100],
                    [230, y + 100],
                  ],
                  pieno: true,
                }}
                tratto={t}
                progresso={1}
                fondo={styles.fondoCarta}
              />
              <Testo
                x={244}
                y={y + 36}
                testo="punti.json"
                tratto={t}
                famiglia="codice"
                corpo={CORPO.piccolo}
              />
            </g>
            <Forma
              chiave={`tr-${t}-f`}
              g={{ f: 'path', d: `M430 ${y + 55}Q520 ${y + 20} 610 ${y + 55}` }}
              tratto={t}
              progresso={1}
            />
            <Forma
              chiave={`tr-${t}-fp`}
              g={{ f: 'path', d: `M599 ${y + 45}L610 ${y + 55}L596 ${y + 58}` }}
              tratto={t}
              progresso={1}
            />
            <g style={{ color: 'var(--fig-tenue)' }}>
              <Testo
                x={430}
                y={y + 92}
                testo={
                  t === 'mano' ? 'concetti, metafore' : 'memoria, righe, codice'
                }
                tratto={t}
                corpo={CORPO.piccolo}
              />
            </g>
          </g>
        );
      })}
    </Tavola>
  );
}

/** «Si disegna»: sottotratti scoperti in ordine contro una path unica. */
export function TavolaDisegna(): JSX.Element {
  const prog = [0.25, 0.5, 0.75, 1];
  const g = { f: 'rett' as const, x: 0, y: 0, l: 120, a: 70 };
  return (
    <Tavola
      titolo="«Si disegna» al 25, 50, 75 e 100%: sottotratti in ordine (sopra), path unica con stroke-dashoffset (sotto)"
      l={680}
      a={230}
    >
      {prog.map((p, i) => (
        <g key={p} transform={`translate(${i * 170 + 4} 10)`}>
          <Forma chiave="dis" g={g} tratto="mano" progresso={p} />
          <Testo
            x={60}
            y={96}
            testo={`${p * 100}%`}
            tratto="netto"
            corpo={CORPO.piccolo}
            ancora="middle"
          />
          <path
            transform="translate(0 116)"
            d={ruvido('dis', g).intera}
            className={styles.tratto}
            pathLength={1}
            strokeDasharray="1 1"
            strokeDashoffset={1 - p}
          />
        </g>
      ))}
    </Tavola>
  );
}

/** Curve e durate: i token di custom.css e i multipli usati dal vocabolario. */
export function TavolaRitmi(): JSX.Element {
  const curve = ['smooth', 'out', 'spring'] as const;
  return (
    <Tavola
      titolo="Ritmi: curve dei token --ease-* e durate in multipli di --dur-slow"
      l={680}
      a={220}
    >
      {curve.map((c, i) => {
        const x = i * 170;
        const pts = Array.from({ length: 41 }, (_, k) => {
          const u = k / 40;
          return `${x + u * 130},${150 - curva(c, u) * 110}`;
        }).join(' ');
        return (
          <g key={c}>
            <path
              d={`M${x} 150H${x + 130}M${x} 150V30`}
              className={styles.tratto}
              style={{ color: 'var(--fig-tenue)', opacity: 0.6 }}
            />
            <polyline
              points={pts}
              className={styles.tratto}
              style={{ color: 'var(--fig-accento)' }}
            />
            <Testo
              x={x}
              y={180}
              testo={`--ease-${c}`}
              tratto="netto"
              famiglia="codice"
              corpo={13}
            />
          </g>
        );
      })}
      <g>
        {[
          ['breve', 2 * DUR.slow, 'FadeIn, Write, Indicate'],
          ['lunga', 3 * DUR.slow, 'Create, MoveTo, Count'],
        ].map(([n, ms, uso], i) => (
          <g key={n as string}>
            <Testo
              x={520}
              y={50 + i * 60}
              testo={`${n} ${ms} ms`}
              tratto="netto"
              famiglia="codice"
              corpo={13}
            />
            <Testo
              x={520}
              y={72 + i * 60}
              testo={uso as string}
              tratto="netto"
              corpo={13}
              classe={styles.fontNetto}
            />
          </g>
        ))}
      </g>
    </Tavola>
  );
}
