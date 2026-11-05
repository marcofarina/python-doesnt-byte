/**
 * Swizzle di @theme/DocBreadcrumbs (eject).
 *
 * Due differenze rispetto all'originale:
 *  1. dopo la casetta (che punta alla home del sito) inseriamo una briciola col
 *     NOME DEL VOLUME corrente, linkata all'indice del volume. Senza, in
 *     Biblioteca dell'Apprendista la prima briciola è il volume-sorgente (es.
 *     «Manuale del Programmatore») e si ha l'impressione di essere nel Vol.1
 *     invece che negli esercizi del Vol.4.
 *  2. nella sola Biblioteca dell'Apprendista il percorso è corto (Marco,
 *     2026-11-03): «Vol. N › lezione › esercizio», senza casetta, senza la
 *     briciola del volume corrente e senza capitolo; l'ultima briciola perde il
 *     prefisso «Esercizio:»/«Laboratorio:». Il percorso intero resta nella
 *     sidebar e nei dati strutturati.
 *
 * Il resto è copia fedele dell'originale: ricontrollare a ogni upgrade di
 * Docusaurus (vedi memoria upgrade_risks).
 */
import React, { type ReactNode } from 'react';
import clsx from 'clsx';
import { ThemeClassNames } from '@docusaurus/theme-common';
import {
  useSidebarBreadcrumbs,
  useDocsVersion,
} from '@docusaurus/plugin-content-docs/client';
import { useHomePageRoute } from '@docusaurus/theme-common/internal';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import { translate } from '@docusaurus/Translate';
import HomeBreadcrumbItem from '@theme/DocBreadcrumbs/Items/Home';
import DocBreadcrumbsStructuredData from '@theme/DocBreadcrumbs/StructuredData';

import { VOLUME_LABELS, volumeShortByLabel } from '@site/src/lib/docResolve';
import CopyPageButton from '@site/src/components/CopyPageButton';

import styles from './styles.module.css';

function BreadcrumbsItemLink({
  children,
  href,
  isLast,
}: {
  children: ReactNode;
  href?: string;
  isLast: boolean;
}): ReactNode {
  const className = 'breadcrumbs__link';
  if (isLast) {
    return <span className={className}>{children}</span>;
  }
  return href ? (
    <Link className={className} href={href}>
      <span>{children}</span>
    </Link>
  ) : (
    <span className={className}>{children}</span>
  );
}

function BreadcrumbsItem({
  children,
  active,
}: {
  children: ReactNode;
  active?: boolean;
}): ReactNode {
  return (
    <li
      className={clsx('breadcrumbs__item', {
        'breadcrumbs__item--active': active,
      })}
    >
      {children}
    </li>
  );
}

// Briciola del volume corrente, subito dopo la casetta.
function VolumeBreadcrumbItem(): ReactNode {
  const { pluginId } = useDocsVersion();
  const href = useBaseUrl(`/${pluginId}/`);
  const label = VOLUME_LABELS[pluginId];
  if (!label) {
    return null;
  }
  return (
    <BreadcrumbsItem>
      <BreadcrumbsItemLink href={href} isLast={false}>
        {label}
      </BreadcrumbsItemLink>
    </BreadcrumbsItem>
  );
}

export default function DocBreadcrumbs(): ReactNode {
  const breadcrumbs = useSidebarBreadcrumbs();
  const homePageRoute = useHomePageRoute();
  const { pluginId } = useDocsVersion();
  if (!breadcrumbs) {
    return null;
  }
  // Solo in Biblioteca dell'Apprendista il percorso si accorcia a
  // «Vol. N › lezione › esercizio»: niente casetta, niente briciola del volume
  // corrente né capitolo, e il volume-sorgente diventa «Vol. N». Dall'ultima
  // briciola cade il prefisso del tipo («Esercizio: …»), che il badge già dice.
  const apprendista = pluginId === 'apprendista';
  const items = apprendista
    ? breadcrumbs.filter((_, idx) => idx === 0 || idx >= breadcrumbs.length - 2)
    : breadcrumbs;
  return (
    <>
      <DocBreadcrumbsStructuredData breadcrumbs={breadcrumbs} />
      <nav
        className={clsx(
          ThemeClassNames.docs.docBreadcrumbs,
          styles.breadcrumbsContainer,
        )}
        aria-label={translate({
          id: 'theme.docs.breadcrumbs.navAriaLabel',
          message: 'Breadcrumbs',
          description: 'The ARIA label for the breadcrumbs',
        })}
      >
        <ul className="breadcrumbs">
          {!apprendista && homePageRoute && <HomeBreadcrumbItem />}
          {!apprendista && <VolumeBreadcrumbItem />}
          {items.map((item, idx) => {
            const isLast = idx === items.length - 1;
            const href =
              item.type === 'category' && item.linkUnlisted
                ? undefined
                : item.href;
            let label = item.label;
            if (apprendista && idx === 0) {
              label = volumeShortByLabel(item.label) ?? item.label;
            } else if (apprendista && isLast) {
              const short = item.label.replace(
                /^(Esercizio|Laboratorio)\s*:\s*/i,
                '',
              );
              label = short.charAt(0).toUpperCase() + short.slice(1);
            }
            return (
              <BreadcrumbsItem key={idx} active={isLast}>
                <BreadcrumbsItemLink href={href} isLast={isLast}>
                  {label}
                </BreadcrumbsItemLink>
              </BreadcrumbsItem>
            );
          })}
        </ul>
        {/* Self-gate: null fuori da una lezione (pagine category). */}
        <div className={styles.action}>
          <CopyPageButton />
        </div>
      </nav>
    </>
  );
}
