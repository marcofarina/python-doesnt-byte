import type { ReactNode } from 'react';
import clsx from 'clsx';
import useBaseUrl from '@docusaurus/useBaseUrl';

interface CalloutEntry {
  defaultTitle: string;
  icon: string | null;
}

const CALLOUT_REGISTRY: Record<string, CalloutEntry> = {
  prereq: { defaultTitle: 'Prerequisiti', icon: 'prereq.png' },
  learn: {
    defaultTitle: 'Cosa imparerai in questa lezione',
    icon: 'learn.png',
  },
  exercise: {
    defaultTitle: 'Cosa imparerai con questo esercizio',
    icon: 'exercise.png',
  },
  definition: { defaultTitle: 'Definizioni', icon: 'definition.png' },
  history: { defaultTitle: 'Cenni storici', icon: 'history.png' },
  code: { defaultTitle: 'Programmazione', icon: 'code.png' },
  cleancode: { defaultTitle: 'Clean code', icon: 'cleancode.png' },
  nutshell: { defaultTitle: 'In a nutshell', icon: 'nutshell.png' },
  mindmap: { defaultTitle: 'Mindmap', icon: 'mindmap.png' },
  info: { defaultTitle: 'Informazioni utili', icon: 'info.png' },
  tip: { defaultTitle: 'Suggerimento', icon: 'tip.png' },
  warning: { defaultTitle: 'Attenzione', icon: 'warning.png' },
  danger: { defaultTitle: 'Pericolo', icon: 'danger.png' },
  note: { defaultTitle: 'Nota', icon: null },
};

interface AdmonitionProps {
  type: string;
  title?: ReactNode;
  icon?: ReactNode;
  children: ReactNode;
}

export default function Admonition(props: AdmonitionProps): ReactNode {
  const { type, title, children } = props;
  const entry = CALLOUT_REGISTRY[type] ?? CALLOUT_REGISTRY.note;
  const iconUrl = useBaseUrl(entry.icon ? `/img/callouts/${entry.icon}` : '');

  return (
    <aside className={clsx('callout', `callout--${type}`)}>
      <div className="callout__header">
        {entry.icon && (
          <img
            src={iconUrl}
            alt=""
            aria-hidden="true"
            className="callout__icon"
          />
        )}
        <span className="callout__title">{title ?? entry.defaultTitle}</span>
      </div>
      <div className="callout__body">{children}</div>
    </aside>
  );
}
