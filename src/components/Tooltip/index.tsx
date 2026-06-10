import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import styles from './styles.module.css';

interface TooltipProps {
  /** Definition shown in the popover. String or JSX. */
  def: ReactNode;
  /** The highlighted word (children act as the trigger). */
  children: ReactNode;
}

export default function Tooltip({ def, children }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverId = useId();

  useEffect(() => {
    if (!open) return;

    function handlePointer(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  return (
    <span ref={wrapRef} className={styles.wrap}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        aria-describedby={open ? popoverId : undefined}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {children}
      </button>
      {open && (
        <span id={popoverId} role="tooltip" className={styles.popover}>
          {def}
        </span>
      )}
    </span>
  );
}
