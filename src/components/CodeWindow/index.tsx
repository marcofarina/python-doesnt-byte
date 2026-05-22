import { useState, type ReactNode } from 'react';
import styles from './styles.module.css';

interface CodeWindowProps {
  code: string;
  output?: string;
  filename?: string;
  runnable?: boolean;
}

const KEYWORDS = new Set([
  'def', 'return', 'if', 'else', 'elif', 'for', 'while', 'in',
  'import', 'from', 'print', 'input', 'True', 'False', 'None',
  'and', 'or', 'not', 'class', 'range', 'int', 'str', 'float',
]);

function highlight(line: string): ReactNode[] {
  const out: ReactNode[] = [];
  let rest = line;
  let i = 0;
  while (rest.length > 0) {
    if (rest[0] === '#') {
      out.push(
        <span key={i++} className={styles.tokCmt}>
          {rest}
        </span>,
      );
      break;
    }
    const sm = rest.match(/^(["'])(.*?)\1/);
    if (sm) {
      out.push(
        <span key={i++} className={styles.tokStr}>
          {sm[0]}
        </span>,
      );
      rest = rest.slice(sm[0].length);
      continue;
    }
    const nm = rest.match(/^(\d+\.?\d*)/);
    if (nm) {
      out.push(
        <span key={i++} className={styles.tokNum}>
          {nm[0]}
        </span>,
      );
      rest = rest.slice(nm[0].length);
      continue;
    }
    const wm = rest.match(/^([a-zA-Z_]\w*)/);
    if (wm) {
      const w = wm[0];
      out.push(
        <span
          key={i++}
          className={KEYWORDS.has(w) ? styles.tokKw : styles.tokId}
        >
          {w}
        </span>,
      );
      rest = rest.slice(w.length);
      continue;
    }
    out.push(<span key={i++}>{rest[0]}</span>);
    rest = rest.slice(1);
  }
  return out;
}

export default function CodeWindow({
  code,
  output,
  filename = 'main.py',
  runnable = true,
}: CodeWindowProps) {
  const [shown, setShown] = useState<string | null>(output ?? null);
  const [running, setRunning] = useState(false);
  const lines = code.replace(/\n+$/, '').split('\n');

  function run() {
    if (running) return;
    setRunning(true);
    window.setTimeout(() => {
      setShown(output ?? 'Hello, World!');
      setRunning(false);
    }, 700);
  }

  return (
    <div className={styles.window}>
      <div className={styles.titlebar}>
        <span className={`${styles.dot} ${styles.dotRed}`} />
        <span className={`${styles.dot} ${styles.dotYellow}`} />
        <span className={`${styles.dot} ${styles.dotGreen}`} />
        <span className={styles.filename}>{filename}</span>
        {runnable && (
          <button
            type="button"
            onClick={run}
            disabled={running}
            className={styles.runBtn}
          >
            {running ? '...' : '▶ Run'}
          </button>
        )}
      </div>
      <div className={styles.code}>
        {lines.map((line, idx) => (
          <div key={idx} className={styles.line}>
            <span className={styles.gutter}>{idx + 1}</span>
            <span>{highlight(line)}</span>
          </div>
        ))}
      </div>
      {shown && (
        <div className={styles.output}>
          <div className={styles.outputLabel}>Output</div>
          <pre className={styles.outputText}>{shown}</pre>
        </div>
      )}
    </div>
  );
}
