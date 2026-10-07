import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react';
import clsx from 'clsx';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useDismiss,
  useInteractions,
  FloatingPortal,
  FloatingFocusManager,
} from '@floating-ui/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faXmark } from '@fortawesome/free-solid-svg-icons';
import {
  RUNNER_DONE_EVENT,
  RUNNER_SELECTOR,
} from '@site/src/theme/PyRunner/runnerSignal';
import { ParticleField } from './particles';
import styles from './styles.module.css';

/**
 * - `locked`: c'è un runner prima e non è ancora stato eseguito.
 * - `ready`: il runner è stato eseguito (o non c'è): un clic rivela.
 * - `revealed`: il testo è visibile.
 */
export type SpoilerState = 'locked' | 'ready' | 'revealed';

interface SpoilerProps {
  children: ReactNode;
  /** Avvolge un blocco (paragrafi, liste, codice) invece di un pezzo di frase. */
  block?: boolean;
}

/** Durata della rivelazione: deve coincidere con quella in styles.module.css. */
const REVEAL_MS = 560;

/** Stessa clearance della navbar fissa usata dal Tooltip. */
const PADDING = { top: 68, right: 8, bottom: 8, left: 8 };

const LABELS: Record<Exclude<SpoilerState, 'revealed'>, string> = {
  locked: 'Risposta nascosta, bloccata: esegui prima il codice qui sopra',
  ready: 'Risposta nascosta: premi per mostrarla',
};

/** Il runner più vicino che precede `el` nel documento, se c'è. */
function findPrecedingRunner(el: Element): Element | null {
  let found: Element | null = null;
  for (const runner of Array.from(document.querySelectorAll(RUNNER_SELECTOR))) {
    if (runner.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) {
      found = runner;
    } else {
      break;
    }
  }
  return found;
}

export default function Spoiler({ children, block = false }: SpoilerProps) {
  const [state, setState] = useState<SpoilerState>('locked');
  // Copia dello stato leggibile dal listener dell'evento, registrato una volta.
  const stateRef = useRef<SpoilerState>('locked');
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  const popoverId = useId();
  const [woke, setWoke] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const rootRef = useRef<HTMLElement | null>(null);
  const surfaceRef = useRef<HTMLElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fieldRef = useRef<ParticleField | null>(null);
  const okRef = useRef<HTMLButtonElement | null>(null);

  const { refs, floatingStyles, context } = useFloating({
    open: popoverOpen,
    onOpenChange: setPopoverOpen,
    placement: 'top',
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(8),
      flip({ padding: PADDING }),
      shift({ padding: PADDING }),
    ],
  });
  const dismiss = useDismiss(context);
  const { getReferenceProps, getFloatingProps } = useInteractions([dismiss]);

  // Il runner si cerca nel DOM, non per id: l'autore scrive solo <Spoiler>.
  // Lo si ricalcola a ogni evento invece di memorizzarlo, perché il fallback
  // SSR del runner viene sostituito dal componente vero dopo l'idratazione.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    if (!findPrecedingRunner(root)) {
      setState('ready');
      return undefined;
    }
    const onDone = (event: Event) => {
      if (stateRef.current !== 'locked') return;
      if (event.target !== findPrecedingRunner(root)) return;
      setState('ready');
      setWoke(true);
      setPopoverOpen(false);
    };
    document.addEventListener(RUNNER_DONE_EVENT, onDone);
    return () => document.removeEventListener(RUNNER_DONE_EVENT, onDone);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const field = new ParticleField(canvas);
    fieldRef.current = field;
    // Il colore delle particelle viene dal CSS: al cambio tema va riletto.
    const mo = new MutationObserver(() => field.refresh());
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => {
      mo.disconnect();
      field.destroy();
      fieldRef.current = null;
    };
  }, []);

  const reveal = useCallback((x?: number, y?: number) => {
    const surface = surfaceRef.current;
    if (!surface) return;
    const rect = surface.getBoundingClientRect();
    const px = x ?? rect.width / 2;
    const py = y ?? rect.height / 2;
    surface.style.setProperty('--spoiler-x', `${px}px`);
    surface.style.setProperty('--spoiler-y', `${py}px`);
    setPopoverOpen(false);
    setState('revealed');
    fieldRef.current?.dissolve(px, py, REVEAL_MS, () => {
      fieldRef.current?.destroy();
      fieldRef.current = null;
    });
    // Il fuoco resta sul testo appena rivelato, così lo screen reader lo legge.
    surface.focus({ preventScroll: true });
  }, []);

  const activate = useCallback(
    (x?: number, y?: number) => {
      if (state === 'ready') reveal(x, y);
      else if (state === 'locked') setPopoverOpen((open) => !open);
    },
    [state, reveal],
  );

  const onClick = (event: MouseEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    // detail === 0: «clic» generato da tastiera, senza coordinate utili.
    if (event.detail === 0) activate();
    else activate(event.clientX - rect.left, event.clientY - rect.top);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (state === 'revealed') return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      activate();
    }
  };

  const Tag = block ? 'div' : 'span';
  const hidden = state !== 'revealed';

  return (
    <Tag
      ref={rootRef as never}
      data-spoiler=""
      data-state={state}
      className={clsx(styles.spoiler, block ? styles.block : styles.inline)}
    >
      <Tag
        ref={(node: HTMLElement | null) => {
          surfaceRef.current = node;
          refs.setReference(node);
        }}
        className={clsx(styles.surface, woke && styles.woke)}
        onAnimationEnd={() => setWoke(false)}
        // I ref compaiono solo dentro gli handler (onClick → reveal), che
        // getReferenceProps compone senza chiamarli: falso positivo.
        // eslint-disable-next-line react-hooks/refs
        {...getReferenceProps({
          role: hidden ? 'button' : undefined,
          tabIndex: hidden ? 0 : -1,
          'aria-label': hidden ? LABELS[state] : undefined,
          'aria-haspopup': state === 'locked' ? 'dialog' : undefined,
          'aria-expanded': state === 'locked' ? popoverOpen : undefined,
          'aria-controls':
            state === 'locked' && popoverOpen ? popoverId : undefined,
          onClick: hidden ? onClick : undefined,
          onKeyDown,
        })}
      >
        <Tag className={styles.content} aria-hidden={hidden || undefined}>
          {children}
        </Tag>
        <canvas ref={canvasRef} className={styles.canvas} aria-hidden />
      </Tag>
      {popoverOpen && state === 'locked' && (
        <FloatingPortal>
          <FloatingFocusManager
            context={context}
            modal={false}
            // Il fuoco va su «Ok», non su «Mostra comunque»: un Invio di
            // troppo da tastiera non deve rivelare la risposta.
            initialFocus={okRef}
          >
            <div
              // `refs.setFloating` è un callback ref di @floating-ui, non un
              // React ref con `.current`: falso positivo della regola.
              // eslint-disable-next-line react-hooks/refs
              ref={refs.setFloating}
              id={popoverId}
              role="dialog"
              aria-labelledby={`${popoverId}-text`}
              className={styles.popover}
              style={floatingStyles}
              {...getFloatingProps()}
            >
              <button
                type="button"
                className={styles.close}
                aria-label="Chiudi"
                onClick={() => setPopoverOpen(false)}
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
              <p id={`${popoverId}-text`} className={styles.popoverText}>
                <FontAwesomeIcon icon={faLock} className={styles.popoverIcon} />
                Esegui prima il codice qui sopra.
              </p>
              <div className={styles.popoverActions}>
                <button
                  type="button"
                  className={styles.showAnyway}
                  onClick={() => reveal()}
                >
                  Mostra comunque
                </button>
                <button
                  ref={okRef}
                  type="button"
                  className={styles.ok}
                  onClick={() => setPopoverOpen(false)}
                >
                  Ok
                </button>
              </div>
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </Tag>
  );
}
