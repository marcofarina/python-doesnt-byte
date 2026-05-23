import React, {type ReactNode} from 'react';
import clsx from 'clsx';
import {ThemeClassNames} from '@docusaurus/theme-common';
import {useDoc, useDocsSidebar} from '@docusaurus/plugin-content-docs/client';
import Heading from '@theme/Heading';
import MDXContent from '@theme/MDXContent';
import type {Props} from '@theme/DocItem/Content';
import type {
  PropSidebar,
  PropSidebarItem,
} from '@docusaurus/plugin-content-docs';

function useSyntheticTitle(): string | null {
  const {metadata, frontMatter, contentTitle} = useDoc();
  const shouldRender =
    !frontMatter.hide_title && typeof contentTitle === 'undefined';
  return shouldRender ? metadata.title : null;
}

function collectDocIds(items: PropSidebar): string[] {
  const ids: string[] = [];
  for (const item of items as PropSidebarItem[]) {
    if (item.type === 'link' && item.docId) {
      ids.push(item.docId);
    } else if (item.type === 'category') {
      ids.push(...collectDocIds(item.items));
    }
  }
  return ids;
}

function useChapterNumber(): number | null {
  const {metadata, frontMatter} = useDoc();
  const sidebar = useDocsSidebar();
  if ((frontMatter as {hide_chapter_kicker?: boolean}).hide_chapter_kicker)
    return null;
  if (!sidebar) return null;
  const ids = collectDocIds(sidebar.items);
  const idx = ids.indexOf(metadata.id);
  return idx >= 0 ? idx + 1 : null;
}

export default function DocItemContent({children}: Props): ReactNode {
  const syntheticTitle = useSyntheticTitle();
  const chapter = useChapterNumber();
  const kicker =
    chapter !== null ? `Capitolo ${String(chapter).padStart(2, '0')}` : null;
  return (
    <div
      className={clsx(
        ThemeClassNames.docs.docMarkdown,
        'markdown',
        kicker && 'doc-has-chapter-kicker',
      )}>
      {kicker && <p className="doc-chapter-kicker">{kicker}</p>}
      {syntheticTitle && (
        <header>
          <Heading as="h1">{syntheticTitle}</Heading>
        </header>
      )}
      <MDXContent>{children}</MDXContent>
    </div>
  );
}
