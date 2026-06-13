import type { ArraySceneState } from './types';
import styles from './styles.module.css';

interface ExplanationProps {
  phase: string;
  note: string;
  /** L'esito arriva già dalle note degli step `outcome`: la nota resta. */
  outcome: ArraySceneState['outcome'];
}

export default function Explanation({ phase, note }: ExplanationProps) {
  return (
    <div className={styles.explanation} aria-live="polite">
      <div className={styles.phase}>{phase}</div>
      <div className={styles.note}>{note}</div>
    </div>
  );
}
