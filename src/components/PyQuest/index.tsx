/**
 * PyQuest — mini-giochi a griglia con Python (spec: PyQuest).
 *
 * ⚠️ VERSIONE HARNESS (step 5). Questa è la prima versione "debug" del
 * componente: editor riusato da PyRunner + bottone Esegui + dump grezzo degli
 * eventi ricevuti dal motore. Niente renderer, niente player: quelli arrivano
 * nella fase 2 (step 10-12), quando questo file verrà riscritto (step 12).
 * Serve solo a validare il motore trace-based end-to-end.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import { usePluginData } from '@docusaurus/useGlobalData';
import { Editor, type EditorHandle } from '@site/src/theme/PyRunner/Editor';
import { ensureBrython, type BrythonConfig } from '@site/src/pyBoot';
import { runLevel } from './runLevel';
import type { GameEvent, LevelDef, LogLine } from './types';

export interface PyQuestProps {
  /** Id del mondo nei global data del plugin `pyquest` (fase 2, step 7). */
  world?: string;
  /** Id del livello dentro il mondo. */
  level?: string;
  /** Livello passato inline (editor/test): bypassa la lookup su world/level. */
  levelData?: LevelDef;
  /** Titolo mostrato sopra l'editor. */
  title?: string;
}

interface PyRunnerGlobalData {
  libUrl: string;
  brython?: BrythonConfig;
}

type RunStatus = 'idle' | 'running' | 'done' | 'error';

// Livello di fallback per l'harness: griglia 5×5, muro a 2 celle davanti a Byte
// così `for _ in range(3): move()` produce move, move, bump.
const DEFAULT_LEVEL: LevelDef = {
  id: 'harness',
  title: 'Harness 5×5',
  grid: {
    legend: { '#': 'wall', '.': 'floor' },
    rows: ['#####', '#...#', '#...#', '#...#', '#####'],
  },
  hero: { x: 1, y: 1, facing: 'east', hp: 3 },
  goal: { x: 3, y: 3 },
  win: [{ type: 'reach' }],
  starterCode:
    '# Muovi Byte. Prova a cambiare il codice ed esegui.\nfor _ in range(3):\n    move()\n',
  hints: [],
  par: 6,
};

// Contatore di modulo per il suffisso del codeId (D12): due istanze dello stesso
// livello sulla stessa pagina devono restare indipendenti.
let idCounter = 0;

function makeCodeId(seed: string, n: number): string {
  let hash = 5381;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 33) ^ seed.charCodeAt(i);
  }
  // Deve soddisfare la guardia /^pyr_[a-z0-9]+$/ di bryBridge (niente separatori).
  return `pyr_${(hash >>> 0).toString(36)}${n.toString(36)}`;
}

function PyQuestInner(props: PyQuestProps) {
  const data = usePluginData('pyrunner') as PyRunnerGlobalData | undefined;
  const libUrl = data?.libUrl ?? '';
  const brython = data?.brython;

  const level = props.levelData ?? DEFAULT_LEVEL;
  const seed =
    props.world && props.level
      ? `${props.world}/${props.level}`
      : JSON.stringify(level);

  const instanceN = useRef<number>(-1);
  if (instanceN.current < 0) instanceN.current = idCounter++;
  const codeId = useMemo(() => makeCodeId(seed, instanceN.current), [seed]);

  const [events, setEvents] = useState<GameEvent[]>([]);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [status, setStatus] = useState<RunStatus>('idle');

  const editorRef = useRef<EditorHandle | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Precarica Brython quando l'harness entra nel viewport (pattern PyRunner).
  useEffect(() => {
    const el = rootRef.current;
    const preload = () => {
      ensureBrython(libUrl, brython).catch(() => {
        /* l'errore riemerge al primo run via onError */
      });
    };
    if (!el || typeof IntersectionObserver === 'undefined') {
      preload();
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          preload();
        }
      },
      { rootMargin: '200px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [libUrl, brython]);

  useEffect(() => () => cleanupRef.current?.(), []);

  const handleRun = useCallback(() => {
    const code = editorRef.current?.getCode() ?? level.starterCode;
    setStatus('running');
    setEvents([]);
    setLogs([]);
    const collected: GameEvent[] = [];
    cleanupRef.current?.();
    cleanupRef.current = runLevel({
      code,
      level,
      codeId,
      libUrl,
      brython,
      onStart: () => {
        collected.length = 0;
        setEvents([]);
        setLogs([]);
      },
      onEvent: (ev) => {
        collected.push(ev);
        setEvents([...collected]);
      },
      onLog: (kind, text) => {
        setLogs((prev) => [...prev, { kind, text, atStep: collected.length }]);
        if (kind === 'stderr') setStatus('error');
      },
      onDone: () => setStatus((s) => (s === 'error' ? s : 'done')),
      onError: (err) => {
        setStatus('error');
        setLogs((prev) => [
          ...prev,
          {
            kind: 'stderr',
            text: `[PyQuest] ${err.message}\n`,
            atStep: collected.length,
          },
        ]);
      },
    });
  }, [level, codeId, libUrl, brython]);

  if (!libUrl) {
    return (
      <div style={{ padding: 12, border: '1px solid var(--at-border)' }}>
        PyQuest (harness): plugin <code>pyrunner</code> non registrato — libUrl
        mancante.
      </div>
    );
  }

  const boxStyle: React.CSSProperties = {
    border: '1px solid var(--at-border)',
    borderRadius: 'var(--radius-m, 10px)',
    padding: 8,
    margin: '8px 0',
    background: 'var(--at-bg-subtle)',
    fontFamily: '"Monaspace Neon", ui-monospace, monospace',
    fontSize: '0.85rem',
    whiteSpace: 'pre-wrap',
    maxHeight: 240,
    overflow: 'auto',
  };

  return (
    <div ref={rootRef} data-pagefind-ignore style={{ margin: '1.5rem 0' }}>
      <div style={{ marginBottom: 6, fontWeight: 600 }}>
        {props.title ?? level.title}{' '}
        <span style={{ opacity: 0.6, fontWeight: 400 }}>
          — harness ({status})
        </span>
      </div>
      <div
        style={{
          border: '1px solid var(--at-border)',
          borderRadius: 'var(--radius-m, 10px)',
          overflow: 'hidden',
        }}
      >
        <Editor
          ref={editorRef}
          initialCode={level.starterCode}
          showLineNumbers
          onRun={handleRun}
        />
      </div>
      <button
        type="button"
        onClick={handleRun}
        disabled={status === 'running'}
        style={{
          marginTop: 8,
          padding: '6px 14px',
          borderRadius: 'var(--radius-s, 6px)',
          border: '1px solid var(--at-border)',
          background: 'var(--at-accent)',
          color: '#fff',
          cursor: status === 'running' ? 'default' : 'pointer',
        }}
      >
        Esegui
      </button>
      <div style={{ marginTop: 8, fontWeight: 600, fontSize: '0.8rem' }}>
        Eventi ({events.length})
      </div>
      <div style={boxStyle}>
        {events.map((ev, i) => `${i}: ${JSON.stringify(ev)}`).join('\n') || '—'}
      </div>
      {logs.length > 0 && (
        <>
          <div style={{ marginTop: 8, fontWeight: 600, fontSize: '0.8rem' }}>
            Console
          </div>
          <div style={boxStyle}>
            {logs.map((l) => `[${l.kind}@${l.atStep}] ${l.text}`).join('')}
          </div>
        </>
      )}
    </div>
  );
}

export default function PyQuest(props: PyQuestProps) {
  return (
    <BrowserOnly fallback={<div>PyQuest…</div>}>
      {() => <PyQuestInner {...props} />}
    </BrowserOnly>
  );
}
