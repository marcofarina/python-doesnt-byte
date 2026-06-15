/**
 * SearchBar — swizzle di @theme/SearchBar (slot di ricerca già cablato nella
 * navbar). Apre una modale che carica on-demand la Pagefind UI dagli asset
 * statici generati dallo step `postbuild` (`pagefind --site build`).
 *
 * Note d'integrazione:
 * - I path degli asset Pagefind passano da `useBaseUrl`, così rispettano
 *   `baseUrl: /python-doesnt-byte/` sia in locale sia in produzione.
 * - La ricerca esiste solo nel build di produzione (`npm run build` + `serve`):
 *   in `npm start` non c'è `build/pagefind/`, quindi lo script 404 e mostriamo
 *   un placeholder invece di un errore in console (degrado con grazia).
 * - Le stringhe UI sono in italiano e rispettano le norme tipografiche.
 */
import React, {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import { useColorMode } from '@docusaurus/theme-common';

import styles from './styles.module.css';

interface PagefindUIInstance {
  destroy?: () => void;
}

interface PagefindUIOptions {
  element: HTMLElement;
  bundlePath?: string;
  showSubResults?: boolean;
  showImages?: boolean;
  resetStyles?: boolean;
  autofocus?: boolean;
  translations?: Record<string, string>;
}

declare global {
  interface Window {
    PagefindUI?: new (options: PagefindUIOptions) => PagefindUIInstance;
  }
}

const TRANSLATIONS: Record<string, string> = {
  placeholder: 'Cerca nel libro',
  clear_search: 'Pulisci',
  load_more: 'Mostra altri risultati',
  search_label: 'Cerca nel libro',
  filters_label: 'Filtri',
  zero_results: 'Nessun risultato per «[SEARCH_TERM]»',
  many_results: '[COUNT] risultati per «[SEARCH_TERM]»',
  one_result: '[COUNT] risultato per «[SEARCH_TERM]»',
  alt_search:
    'Nessun risultato per «[SEARCH_TERM]». Mostro invece i risultati per «[DIFFERENT_TERM]»',
  search_suggestion:
    'Nessun risultato per «[SEARCH_TERM]». Prova una di queste ricerche:',
  searching: 'Sto cercando…',
};

type LoadState = 'idle' | 'loading' | 'ready' | 'unavailable';

function injectStylesheet(href: string): void {
  if (document.querySelector(`link[data-pagefind-ui][href="${href}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  link.setAttribute('data-pagefind-ui', '');
  document.head.appendChild(link);
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[data-pagefind-ui][src="${src}"]`,
    );
    if (existing) {
      if (window.PagefindUI) {
        resolve();
      } else {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () =>
          reject(new Error('pagefind-ui.js non disponibile')),
        );
      }
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.setAttribute('data-pagefind-ui', '');
    script.addEventListener('load', () => resolve());
    script.addEventListener('error', () =>
      reject(new Error('pagefind-ui.js non disponibile')),
    );
    document.body.appendChild(script);
  });
}

function SearchModal({ onClose }: { onClose: () => void }): ReactNode {
  const { colorMode } = useColorMode();
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<PagefindUIInstance | null>(null);
  const [state, setState] = useState<LoadState>('loading');

  const bundlePath = useBaseUrl('/pagefind/');
  const cssUrl = useBaseUrl('/pagefind/pagefind-ui.css');
  const jsUrl = useBaseUrl('/pagefind/pagefind-ui.js');

  // Chiudi con Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Carica la Pagefind UI on-demand e inizializzala dentro la modale.
  useEffect(() => {
    let cancelled = false;
    injectStylesheet(cssUrl);
    loadScript(jsUrl)
      .then(() => {
        if (cancelled || !containerRef.current || !window.PagefindUI) {
          if (!window.PagefindUI && !cancelled) setState('unavailable');
          return;
        }
        instanceRef.current = new window.PagefindUI({
          element: containerRef.current,
          bundlePath,
          showSubResults: true,
          showImages: false,
          resetStyles: false,
          autofocus: true,
          translations: TRANSLATIONS,
        });
        setState('ready');
      })
      .catch(() => {
        if (!cancelled) setState('unavailable');
      });
    return () => {
      cancelled = true;
      instanceRef.current?.destroy?.();
      instanceRef.current = null;
    };
  }, [bundlePath, cssUrl, jsUrl]);

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Ricerca nel libro"
      data-pagefind-ignore
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.modal} data-theme={colorMode}>
        <button
          type="button"
          className={styles.close}
          aria-label="Chiudi la ricerca"
          onClick={onClose}
        >
          ×
        </button>
        {state === 'unavailable' ? (
          <p className={styles.unavailable}>
            La ricerca è disponibile solo nel sito compilato (
            <code>npm run build</code> + <code>npm run serve</code>), non in
            modalità sviluppo.
          </p>
        ) : (
          <div ref={containerRef} className={styles.results} />
        )}
      </div>
    </div>
  );
}

export default function SearchBar(): ReactNode {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  // Scorciatoia ⌘K / Ctrl+K per aprire la ricerca.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        className={styles.trigger}
        aria-label="Cerca nel libro"
        onClick={() => setOpen(true)}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <span className={styles.triggerLabel}>Cerca</span>
        <kbd className={styles.kbd}>⌘K</kbd>
      </button>
      {open && <SearchModal onClose={close} />}
    </>
  );
}
