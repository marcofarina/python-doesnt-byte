import { useState, type ReactNode } from 'react';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useClick,
  useDismiss,
  useRole,
  useInteractions,
  FloatingPortal,
} from '@floating-ui/react';
import styles from './styles.module.css';

/**
 * Spazio minimo dai bordi del viewport per flip/shift. In alto vale anche
 * come clearance della navbar fissa di Docusaurus (--ifm-navbar-height, 3.75rem
 * ≈ 60px): floating-ui non la conta tra i clipping ancestor.
 */
const PADDING = { top: 68, right: 8, bottom: 8, left: 8 };

interface TooltipProps {
  /** Definition shown in the popover. String or JSX. */
  def: ReactNode;
  /** The highlighted word (children act as the trigger). */
  children: ReactNode;
}

export default function Tooltip({ def, children }: TooltipProps) {
  const [open, setOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: 'top',
    whileElementsMounted: autoUpdate,
    middleware: [
      // Distanza dal trigger.
      offset(8),
      // Auto-flip: se non c'è spazio sopra, ribalta sotto (e viceversa).
      // Il padding superiore tiene conto della navbar fissa di Docusaurus,
      // che non è un clipping ancestor: senza, il popover si infila dietro.
      flip({ padding: PADDING }),
      // Scorre lungo l'asse per non uscire dai bordi laterali del viewport.
      shift({ padding: PADDING }),
    ],
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'tooltip' });
  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
    role,
  ]);

  return (
    <span className={styles.wrap}>
      <button
        ref={refs.setReference}
        type="button"
        className={styles.trigger}
        {...getReferenceProps()}
      >
        {children}
      </button>
      {open && (
        <FloatingPortal>
          <span
            // `refs` è l'oggetto di @floating-ui useFloating(): `setFloating` è
            // un callback ref stabile, non un React ref con `.current` — la
            // regola react-hooks/refs qui è un falso positivo (vede solo il nome).
            // eslint-disable-next-line react-hooks/refs
            ref={refs.setFloating}
            className={styles.popover}
            style={floatingStyles}
            {...getFloatingProps()}
          >
            {def}
          </span>
        </FloatingPortal>
      )}
    </span>
  );
}
