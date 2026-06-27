/**
 * SearchBar — swizzle di @theme/SearchBar (slot di ricerca già cablato nella
 * navbar). Apre una modale che carica on-demand la Pagefind UI dagli asset
 * statici generati dallo step `postbuild` (`pagefind --site build`).
 *
 * Note d'integrazione:
 * - I path degli asset Pagefind passano da `useBaseUrl`, così rispettano
 *   `baseUrl: /python-doesnt-byte/` sia in locale sia in produzione.
 * - La modale è montata via Portal su `document.body`: dentro la navbar un
 *   antenato con `transform` intrappolerebbe `position: fixed` (overlay che
 *   copre solo la fascia alta). Il Portal la tira fuori da quel contesto.
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
import { createPortal } from 'react-dom';
import useBaseUrl from '@docusaurus/useBaseUrl';

import { LensIcon, CircleXmarkIcon } from './icons';
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
  placeholder: 'Cerca un argomento, una funzione, un concetto…',
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

type LoadState = 'loading' | 'ready' | 'unavailable';

/* ── Primer della tastiera (iOS) ───────────────────────────────────────────
   Su iOS la tastiera software si apre SOLO se `.focus()` parte dentro un gesto
   utente sincrono. La nostra modale monta dopo il tap e la PagefindUI si
   costruisce dopo un load async: l'autofocus arriva troppo tardi e la tastiera
   non compare. Workaround: al tap mettiamo a fuoco un input nascosto (apre la
   tastiera nel gesto), poi trasferiamo il focus al campo reale quando è pronto
   — il passaggio fra due input tiene viva la tastiera. Solo su touch. */
let primerInput: HTMLInputElement | null = null;

function isTouchDevice(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(hover: none) and (pointer: coarse)').matches
  );
}

function openKeyboardPrimer(): void {
  if (!isTouchDevice()) return;
  removeKeyboardPrimer();
  const input = document.createElement('input');
  input.type = 'text';
  input.setAttribute('aria-hidden', 'true');
  input.tabIndex = -1;
  // font-size 16px evita lo zoom automatico di iOS sul focus.
  input.style.cssText =
    'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;border:0;padding:0;margin:0;font-size:16px;z-index:-1;';
  document.body.appendChild(input);
  input.focus();
  primerInput = input;
}

function removeKeyboardPrimer(): void {
  primerInput?.remove();
  primerInput = null;
}

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
  const overlayRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<PagefindUIInstance | null>(null);
  const [state, setState] = useState<LoadState>('loading');

  const bundlePath = useBaseUrl('/pagefind/');
  const cssUrl = useBaseUrl('/pagefind/pagefind-ui.css');
  const jsUrl = useBaseUrl('/pagefind/pagefind-ui.js');

  // Chiudi con Escape e blocca lo scroll del body mentre la modale è aperta.
  // Su iOS `overflow:hidden` non basta: la pagina sotto continua a scorrere col
  // touch. Fissiamo il body (position:fixed allo scroll corrente) e lo
  // ripristiniamo alla chiusura, riposizionando lo scroll.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);

    const { body } = document;
    const scrollY = window.scrollY;
    const prev = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow,
    };
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.left = prev.left;
      body.style.right = prev.right;
      body.style.width = prev.width;
      body.style.overflow = prev.overflow;
      window.scrollTo(0, scrollY);
      removeKeyboardPrimer();
    };
  }, [onClose]);

  // Lega l'altezza dell'overlay alla `visualViewport`: quando su mobile si apre
  // la tastiera l'area visibile si accorcia, così la modale resta sopra di essa
  // e a scorrere è solo l'elenco dei risultati (vedi --pf-vh in styles.module).
  useEffect(() => {
    const vv = window.visualViewport;
    const apply = () => {
      const h = vv?.height ?? window.innerHeight;
      overlayRef.current?.style.setProperty('--pf-vh', `${Math.round(h)}px`);
    };
    apply();
    vv?.addEventListener('resize', apply);
    vv?.addEventListener('scroll', apply);
    window.addEventListener('resize', apply);
    return () => {
      vv?.removeEventListener('resize', apply);
      vv?.removeEventListener('scroll', apply);
      window.removeEventListener('resize', apply);
    };
  }, []);

  // Lock dello scroll a prova di iOS. Il solo body fixed non basta: con la
  // tastiera aperta, quando lo scroll interno tocca un bordo il rubber-band
  // «panna» la visualViewport e trascina via l'intero overlay fixed. Quindi
  // blocchiamo `touchmove` fuori dall'area risultati E, dentro di essa, ai
  // bordi (in cima trascinando giù, in fondo trascinando su) o se non c'è nulla
  // da scorrere — così non parte mai l'overscroll che muove il viewport.
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    let startY = 0;
    const onTouchStart = (e: TouchEvent) => {
      startY = e.touches[0]?.clientY ?? 0;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 1) return;
      const scroller = containerRef.current?.querySelector<HTMLElement>(
        '.pagefind-ui__results-area',
      );
      if (!scroller || !scroller.contains(e.target as Node)) {
        e.preventDefault();
        return;
      }
      const dy = (e.touches[0]?.clientY ?? 0) - startY;
      const canScroll = scroller.scrollHeight > scroller.clientHeight;
      const atTop = scroller.scrollTop <= 0;
      const atBottom =
        scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 1;
      if (!canScroll || (atTop && dy > 0) || (atBottom && dy < 0)) {
        e.preventDefault();
      }
    };
    overlay.addEventListener('touchstart', onTouchStart, { passive: true });
    overlay.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => {
      overlay.removeEventListener('touchstart', onTouchStart);
      overlay.removeEventListener('touchmove', onTouchMove);
    };
  }, []);

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
        // Trasferisci il focus dal primer al campo reale: su iOS tiene viva la
        // tastiera già aperta nel gesto del tap; su desktop è un focus innocuo.
        const input = containerRef.current.querySelector<HTMLInputElement>(
          'input.pagefind-ui__search-input',
        );
        input?.focus();
        removeKeyboardPrimer();
        // Il tasto «Vai»/lente della tastiera iOS, premuto nel campo, resterebbe
        // un pulsante morto: Pagefind non lo usa (la ricerca è live, filtra
        // mentre digiti) e la tastiera non si chiude. Lo intercettiamo per
        // togliere il focus e chiudere la tastiera. Due agganci, perché iOS a
        // volte emette solo il `keydown` Enter e a volte anche il `submit`:
        //  - `keydown` su Enter in fase di CATTURA: scatta prima degli handler
        //    di Pagefind, quindi non può essere fermato da uno stopPropagation;
        //  - `submit` del form come rete di sicurezza.
        input?.addEventListener(
          'keydown',
          (e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              input.blur();
            }
          },
          { capture: true },
        );
        const form = containerRef.current.querySelector<HTMLFormElement>(
          'form.pagefind-ui__form',
        );
        form?.addEventListener('submit', (e) => {
          e.preventDefault();
          input?.blur();
        });
      })
      .catch(() => {
        if (!cancelled) setState('unavailable');
        removeKeyboardPrimer();
      });
    return () => {
      cancelled = true;
      instanceRef.current?.destroy?.();
      instanceRef.current = null;
    };
  }, [bundlePath, cssUrl, jsUrl]);

  return (
    <div
      ref={overlayRef}
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Ricerca nel libro"
      data-pagefind-ignore
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.modal}>
        <div className={styles.header}>
          <span className={styles.kicker}>Cerca nel libro</span>
          <button
            type="button"
            className={styles.close}
            aria-label="Chiudi la ricerca"
            onClick={onClose}
          >
            <CircleXmarkIcon className={styles.closeIcon} />
            <kbd className={styles.escHint}>Esc</kbd>
          </button>
        </div>

        {state === 'unavailable' ? (
          <p className={styles.unavailable}>
            La ricerca è disponibile solo nel sito compilato (
            <code>npm run build</code> + <code>npm run serve</code>), non in
            modalità sviluppo.
          </p>
        ) : (
          <div className={styles.searchArea}>
            <LensIcon className={styles.lens} />
            <div ref={containerRef} className={styles.results} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchBar(): ReactNode {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const warmedRef = useRef(false);

  const cssUrl = useBaseUrl('/pagefind/pagefind-ui.css');
  const jsUrl = useBaseUrl('/pagefind/pagefind-ui.js');

  // Precarica gli asset Pagefind al primo contatto col trigger: così alla
  // costruzione della modale lo script c'è già e il primer della tastiera
  // (iOS) ha una finestra minima prima del trasferimento di focus.
  const warm = useCallback(() => {
    if (warmedRef.current) return;
    warmedRef.current = true;
    injectStylesheet(cssUrl);
    loadScript(jsUrl).catch(() => {});
  }, [cssUrl, jsUrl]);

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

  // Apertura programmatica da altrove nella pagina (es. il box «Cerca» della
  // homepage). L'evento è dispatchato sincronamente nel gesto utente, così
  // warm() e il primer della tastiera (iOS) restano dentro l'interazione.
  useEffect(() => {
    const onOpen = () => {
      warm();
      openKeyboardPrimer();
      setOpen(true);
    };
    window.addEventListener('pdb:open-search', onOpen);
    return () => window.removeEventListener('pdb:open-search', onOpen);
  }, [warm]);

  return (
    <>
      <button
        type="button"
        className={styles.trigger}
        aria-label="Cerca nel libro"
        onPointerEnter={warm}
        onTouchStart={warm}
        onClick={() => {
          openKeyboardPrimer();
          setOpen(true);
        }}
      >
        <LensIcon className={styles.triggerIcon} />
        <span className={styles.triggerLabel}>Cerca</span>
        <kbd className={styles.kbd}>⌘K</kbd>
      </button>
      {open &&
        typeof document !== 'undefined' &&
        createPortal(<SearchModal onClose={close} />, document.body)}
    </>
  );
}
