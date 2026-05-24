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

// Map every descendant docId of each top-level category to that category's
// 1-based chapter index (counting only top-level categories).
function buildChapterMap(items: PropSidebar): Map<string, number> {
  const map = new Map<string, number>();
  let chapter = 0;
  const collect = (xs: readonly PropSidebarItem[], n: number) => {
    for (const item of xs) {
      if (item.type === 'link' && item.docId) {
        map.set(item.docId, n);
      } else if (item.type === 'category') {
        collect(item.items, n);
      }
    }
  };
  for (const item of items as PropSidebarItem[]) {
    if (item.type === 'category') {
      chapter += 1;
      collect(item.items, chapter);
    }
  }
  return map;
}

function useChapterNumber(): number | null {
  const {metadata, frontMatter} = useDoc();
  const sidebar = useDocsSidebar();
  if ((frontMatter as {hide_chapter_kicker?: boolean}).hide_chapter_kicker)
    return null;
  if (!sidebar) return null;
  const chapterMap = buildChapterMap(sidebar.items);
  return chapterMap.get(metadata.id) ?? null;
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
