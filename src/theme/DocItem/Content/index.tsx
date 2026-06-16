import React, { type ReactNode } from 'react';
import clsx from 'clsx';
import { ThemeClassNames } from '@docusaurus/theme-common';
import { useDoc, useDocsSidebar } from '@docusaurus/plugin-content-docs/client';
import Heading from '@theme/Heading';
import MDXContent from '@theme/MDXContent';
import type { Props } from '@theme/DocItem/Content';
import type {
  PropSidebar,
  PropSidebarItem,
} from '@docusaurus/plugin-content-docs';

import OffPathBanner from '@site/src/components/OffPathBanner';

function useSyntheticTitle(): string | null {
  const { metadata, frontMatter, contentTitle } = useDoc();
  const shouldRender =
    !frontMatter.hide_title && typeof contentTitle === 'undefined';
  return shouldRender ? metadata.title : null;
}

// Model: Volume (docs instance) → Capitolo (top-level category) → Lezione (doc).
// Map every page permalink to its 1-based chapter index, counting only
// top-level categories. The map is keyed by permalink (`href`) rather than
// docId so it covers both leaf lessons AND a chapter's landing page (a category
// with `link: {type: 'doc'}` or a generated-index): the category's own `href`
// gets the chapter number too. Nested sub-categories inherit the parent's
// number. Top-level links (intro, come-usare-questo-libro) stay out of the map
// and render no kicker.
function buildChapterMap(items: PropSidebar): Map<string, number> {
  const map = new Map<string, number>();
  const collect = (xs: readonly PropSidebarItem[], n: number) => {
    for (const item of xs) {
      if (item.type === 'link') {
        map.set(item.href, n);
      } else if (item.type === 'category') {
        if (item.href) map.set(item.href, n);
        collect(item.items, n);
      }
    }
  };
  let chapter = 0;
  for (const item of items as PropSidebarItem[]) {
    if (item.type === 'category') {
      chapter += 1;
      if (item.href) map.set(item.href, chapter);
      collect(item.items, chapter);
    }
  }
  return map;
}

function useChapterNumber(): number | null {
  const { metadata, frontMatter } = useDoc();
  const sidebar = useDocsSidebar();
  if ((frontMatter as { hide_chapter_kicker?: boolean }).hide_chapter_kicker)
    return null;
  if (!sidebar) return null;
  const chapterMap = buildChapterMap(sidebar.items);
  return chapterMap.get(metadata.permalink) ?? null;
}

export default function DocItemContent({ children }: Props): ReactNode {
  const syntheticTitle = useSyntheticTitle();
  const chapter = useChapterNumber();
  const kicker =
    chapter !== null ? `Capitolo ${String(chapter).padStart(2, '0')}` : null;
  return (
    <div
      data-pagefind-body
      className={clsx(
        ThemeClassNames.docs.docMarkdown,
        'markdown',
        kicker && 'doc-has-chapter-kicker',
      )}
    >
      <OffPathBanner />
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
