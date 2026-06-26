import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import clsx from 'clsx';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useClick,
  useDismiss,
  useRole,
  useListNavigation,
  useInteractions,
  FloatingPortal,
  FloatingFocusManager,
} from '@floating-ui/react';
import { useDoc } from '@docusaurus/plugin-content-docs/client';
import { usePluginData } from '@docusaurus/useGlobalData';
import Icon from '@site/src/components/Icon';
import { copyToClipboard } from '@site/src/theme/PyRunner/clipboard';
import { AI_PROVIDERS, buildAiPrompt } from './providers';
import styles from './styles.module.css';

// Padding per flip/shift: in alto vale come clearance della navbar fissa di
// Docusaurus (≈60px), come nel Tooltip.
const PADDING = { top: 68, right: 8, bottom: 8, left: 8 };
const RESET_MS = 1500;

type CopyState = 'idle' | 'done' | 'error';

interface CopyPageData {
  // In dev (`npm start`) il plugin espone qui il Markdown di ogni pagina (no
  // file statici). In produzione è `{}`: si fa fetch del `.md` statico.
  pages?: Record<string, string>;
}

// Percorso del `.md` accanto alla pagina. Il permalink include già il baseUrl;
// i permalink che finiscono con `/` (landing/category) mappano su `index.md`,
// coerente con quanto scrive il plugin in build.
function mdPath(permalink: string): string {
  return permalink.endsWith('/') ? `${permalink}index.md` : `${permalink}.md`;
}

// Gate: il chip vive nelle briciole, condivise con le pagine category
// (generated-index) che NON hanno DocProvider. useDoc() lancia lì: lo
// intercettiamo. useDoc chiama esattamente un hook (useContext) prima di
// lanciare, quindi il try/catch non altera il conteggio degli hook.
export default function CopyPageButton(): ReactNode {
  let permalink: string;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    permalink = useDoc().metadata.permalink;
  } catch {
    return null;
  }
  return <CopyPageMenu permalink={permalink} />;
}

function CopyPageMenu({ permalink }: { permalink: string }): ReactNode {
  const data = usePluginData('copy-page-md') as CopyPageData | undefined;

  const [open, setOpen] = useState(false);
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const resetTimer = useRef<number | undefined>(undefined);
  const listRef = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => () => window.clearTimeout(resetTimer.current), []);

  const relMdUrl = mdPath(permalink);

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: 'bottom-end',
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(8),
      flip({ padding: PADDING }),
      shift({ padding: PADDING }),
    ],
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'menu' });
  const listNav = useListNavigation(context, {
    listRef,
    activeIndex,
    onNavigate: setActiveIndex,
    loop: true,
  });
  const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions(
    [click, dismiss, role, listNav],
  );

  const getMarkdown = useCallback(async (): Promise<string> => {
    const cached = data?.pages?.[permalink];
    if (cached) return cached;
    const res = await fetch(relMdUrl);
    if (!res.ok) throw new Error(`md ${res.status}`);
    return res.text();
  }, [data, permalink, relMdUrl]);

  const handleCopy = useCallback(() => {
    window.clearTimeout(resetTimer.current);
    getMarkdown()
      .then((md) => copyToClipboard(md))
      .then(() => setCopyState('done'))
      .catch(() => setCopyState('error'))
      .finally(() => {
        resetTimer.current = window.setTimeout(() => {
          setCopyState('idle');
          setOpen(false);
        }, RESET_MS);
      });
  }, [getMarkdown]);

  const handleProvider = useCallback(
    (url: string) => {
      // URL assoluto del .md calcolato dall'origin reale a runtime (non da
      // siteConfig.url): così punta sempre all'host da cui la pagina è
      // realmente servita — dominio custom, fallback GitHub Pages o deploy di
      // preview — invece di una sola URL canonica fissata a build-time.
      const mdUrl = window.location.origin + relMdUrl;
      const target = url + encodeURIComponent(buildAiPrompt(mdUrl));
      window.open(target, '_blank', 'noopener,noreferrer');
      setOpen(false);
    },
    [relMdUrl],
  );

  const copyLabel =
    copyState === 'done'
      ? 'Copiato'
      : copyState === 'error'
        ? 'Copia non riuscita'
        : 'Copia pagina';

  return (
    <div className={styles.root}>
      <button
        ref={refs.setReference}
        type="button"
        className={styles.trigger}
        aria-label="Spiegamelo facile: copia la pagina o chiedi aiuto a un assistente AI"
        {...getReferenceProps()}
      >
        <Icon name="microchip-ai" size={16} className={styles.triggerIcon} />
        <span className={styles.triggerLabel}>Spiegamelo facile</span>
        <Icon
          name="chevron-down"
          size={11}
          className={clsx(styles.chevron, open && styles.chevronOpen)}
        />
      </button>

      {open && (
        <FloatingPortal>
          <FloatingFocusManager context={context} modal={false}>
            <div
              // `refs.setFloating` è un callback ref stabile di @floating-ui:
              // la regola react-hooks/refs qui è un falso positivo.
              // eslint-disable-next-line react-hooks/refs
              ref={refs.setFloating}
              className={styles.menu}
              style={floatingStyles}
              {...getFloatingProps()}
            >
              <button
                type="button"
                role="menuitem"
                ref={(n) => {
                  listRef.current[0] = n;
                }}
                className={clsx(
                  styles.item,
                  copyState === 'done' && styles.itemDone,
                )}
                // getItemProps inietta il ref di tracking di @floating-ui:
                // falso positivo della regola, come per refs.setFloating.
                // eslint-disable-next-line react-hooks/refs
                {...getItemProps({ onClick: handleCopy })}
              >
                <Icon
                  name={copyState === 'done' ? 'check' : 'copy'}
                  size={16}
                  className={styles.itemIcon}
                />
                <span>{copyLabel}</span>
              </button>

              <div className={styles.sep} role="separator" />
              <p className={styles.groupLabel}>Chiedi una spiegazione a</p>

              {AI_PROVIDERS.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  role="menuitem"
                  ref={(n) => {
                    listRef.current[i + 1] = n;
                  }}
                  className={styles.item}
                  // eslint-disable-next-line react-hooks/refs
                  {...getItemProps({ onClick: () => handleProvider(p.url) })}
                >
                  <Icon name={p.icon} size={16} className={styles.itemIcon} />
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </div>
  );
}
