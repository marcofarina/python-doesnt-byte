/**
 * Swizzle di @theme/DocBreadcrumbs (eject).
 *
 * Due differenze rispetto all'originale:
 *  1. dopo la casetta (che punta alla home del sito) inseriamo una briciola col
 *     NOME DEL VOLUME corrente, linkata all'indice del volume. Senza, in
 *     Biblioteca dell'Apprendista la prima briciola è il volume-sorgente (es.
 *     «Manuale del Programmatore») e si ha l'impressione di essere nel Vol.1
 *     invece che negli esercizi del Vol.4.
 *  2. nella sola Biblioteca dell'Apprendista la prima briciola della sidebar (il
 *     volume-sorgente) è accorciata a «Vol. N»: affianco a «Biblioteca
 *     dell'Apprendista» due titoli di libro interi confondono.
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
  // Solo in Biblioteca dell'Apprendista: la prima briciola della sidebar è il
  // volume-sorgente (es. «Manuale del Programmatore»). Accanto a «Biblioteca
  // dell'Apprendista» due titoli di libro confondono → la accorciamo a «Vol. N».
  const shortenFirst = pluginId === 'apprendista';
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
          {homePageRoute && <HomeBreadcrumbItem />}
          <VolumeBreadcrumbItem />
          {breadcrumbs.map((item, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            const href =
              item.type === 'category' && item.linkUnlisted
                ? undefined
                : item.href;
            const label =
              shortenFirst && idx === 0
                ? (volumeShortByLabel(item.label) ?? item.label)
                : item.label;
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
