import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { EditorState, Compartment, type Extension } from '@codemirror/state';
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import {
  syntaxHighlighting,
  HighlightStyle,
  indentUnit,
  bracketMatching,
} from '@codemirror/language';
import { python } from '@codemirror/lang-python';
import { tags as t } from '@lezer/highlight';
import styles from './styles.module.css';

/**
 * Theme Atmospheric per CodeMirror 6.
 * Niente colori inline: tutto via CSS var del libro, così segue automaticamente
 * light/dark di Docusaurus.
 */
const atmosphericTheme = EditorView.theme(
  {
    '&': {
      color: 'var(--py-def, var(--at-fg-strong))',
      backgroundColor: 'transparent',
      fontFamily: '"Monaspace Neon", ui-monospace, monospace',
      fontSize: '1.05rem',
      fontVariantLigatures: 'none',
    },
    '.cm-content': {
      caretColor: 'var(--at-accent)',
      padding: '12px 0',
      fontFeatureSettings: '"calt" on, "liga" off',
    },
    '.cm-line': {
      padding: '0 14px',
    },
    '&.cm-focused': {
      outline: 'none',
    },
    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: 'var(--at-accent)',
      borderLeftWidth: '2px',
    },
    '&.cm-focused .cm-selectionBackground, ::selection, .cm-selectionBackground':
      {
        backgroundColor: 'var(--at-accent-chip)',
      },
    '.cm-activeLine': {
      backgroundColor: 'var(--at-bg-subtle)',
    },
    '.cm-gutters': {
      backgroundColor: 'transparent',
      color: 'var(--at-faint)',
      border: 'none',
      borderRight: '1px solid var(--at-border)',
      paddingRight: '6px',
      fontFamily: '"Monaspace Argon", ui-monospace, monospace',
      fontSize: '0.85em',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'transparent',
      color: 'var(--at-muted-soft)',
    },
    '.cm-matchingBracket, &.cm-focused .cm-matchingBracket': {
      backgroundColor: 'var(--at-accent-chip)',
      outline: 'none',
    },
    '.cm-scroller': {
      fontFamily: 'inherit',
      lineHeight: '1.55',
    },
  },
  { dark: false },
);

const atmosphericHighlight = HighlightStyle.define([
  { tag: t.keyword, color: 'var(--py-kw)' },
  { tag: [t.string, t.special(t.string)], color: 'var(--py-str)' },
  {
    tag: t.comment,
    color: 'var(--py-cmt)',
    fontStyle: 'normal',
    fontFamily: '"Monaspace Radon", "Monaspace Neon", ui-monospace, monospace',
  },
  { tag: [t.number, t.bool, t.null], color: 'var(--py-num)' },
  { tag: t.function(t.variableName), color: 'var(--py-fn)' },
  { tag: t.definition(t.variableName), color: 'var(--py-def)' },
  { tag: t.operator, color: 'var(--py-op)' },
  { tag: t.variableName, color: 'var(--py-id)' },
  { tag: t.propertyName, color: 'var(--py-id)' },
  { tag: t.className, color: 'var(--py-def)' },
  { tag: t.typeName, color: 'var(--py-def)' },
]);

export interface EditorProps {
  initialCode: string;
  showLineNumbers: boolean;
  readonly?: boolean;
  onChange?: (code: string) => void;
  onRun?: () => void;
  /** Estensione di linguaggio CodeMirror. Default: Python. */
  language?: Extension;
  /** Etichetta accessibile per la textbox dell'editor (screen reader). */
  ariaLabel?: string;
}

export interface EditorHandle {
  getCode: () => string;
  setCode: (next: string) => void;
}

export const Editor = forwardRef<EditorHandle, EditorProps>(function Editor(
  {
    initialCode,
    showLineNumbers,
    readonly = false,
    onChange,
    onRun,
    language,
    ariaLabel = 'Editor di codice Python',
  },
  ref,
) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const readOnlyCompartment = useRef(new Compartment()).current;

  useImperativeHandle(
    ref,
    () => ({
      getCode: () => viewRef.current?.state.doc.toString() ?? '',
      setCode: (next: string) => {
        const view = viewRef.current;
        if (!view) return;
        view.dispatch({
          changes: { from: 0, to: view.state.doc.length, insert: next },
        });
      },
    }),
    [],
  );

  useEffect(() => {
    if (!hostRef.current) return;

    const runHandler = onRun;
    const extensions = [
      ...(showLineNumbers ? [lineNumbers(), highlightActiveLineGutter()] : []),
      history(),
      bracketMatching(),
      indentUnit.of('    '),
      highlightActiveLine(),
      syntaxHighlighting(atmosphericHighlight),
      language ?? python(),
      keymap.of([
        ...defaultKeymap,
        ...historyKeymap,
        {
          key: 'Mod-Enter',
          run: () => {
            runHandler?.();
            return true;
          },
        },
      ]),
      atmosphericTheme,
      // Etichetta la textbox di CodeMirror (.cm-content, role="textbox") per gli
      // screen reader: senza, viene annunciata come campo editabile anonimo.
      EditorView.contentAttributes.of({ 'aria-label': ariaLabel }),
      readOnlyCompartment.of([
        EditorState.readOnly.of(readonly),
        EditorView.editable.of(!readonly),
      ]),
      EditorView.updateListener.of((update) => {
        if (update.docChanged && onChange) {
          onChange(update.state.doc.toString());
        }
      }),
    ];

    const view = new EditorView({
      doc: initialCode,
      extensions,
      parent: hostRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // Volutamente senza dipendenze: l'editor CodeMirror viene costruito una
    // sola volta al mount (ricostruirlo a ogni cambio prop perderebbe undo
    // history e cursore). readonly è gestito sotto via Compartment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Aggiorna readonly senza ricostruire l'editor
  useEffect(() => {
    if (!viewRef.current) return;
    viewRef.current.dispatch({
      effects: readOnlyCompartment.reconfigure([
        EditorState.readOnly.of(readonly),
        EditorView.editable.of(!readonly),
      ]),
    });
  }, [readonly, readOnlyCompartment]);

  return <div ref={hostRef} className={styles.editor} />;
});
