/**
 * Filtri presentazionali per il percorso attivo: operano sulla PropSidebar
 * già compilata da Docusaurus (quella che DocRoot passa al layout), quindi
 * il filtro non tocca build, ricerca o URL — solo ciò che l'utente vede.
 */
import type {
  PropSidebar,
  PropSidebarItem,
} from '@docusaurus/plugin-content-docs';

/**
 * Rimuove dalla sidebar i doc esclusi dal percorso e le categorie rimaste
 * vuote. Le voci che non sono lezioni (link esterni, html) restano.
 */
export function filterSidebarItems(
  items: readonly PropSidebarItem[],
  volumeId: string,
  isIncluded: (key: string) => boolean,
): PropSidebarItem[] {
  const out: PropSidebarItem[] = [];
  for (const item of items) {
    if (item.type === 'link') {
      if (item.docId && !isIncluded(`${volumeId}/${item.docId}`)) continue;
      out.push(item);
    } else if (item.type === 'category') {
      const children = filterSidebarItems(item.items, volumeId, isIncluded);
      if (children.length === 0) continue;
      out.push({ ...item, items: children });
    } else {
      out.push(item);
    }
  }
  return out;
}

export interface SidebarDocLink {
  href: string;
  label: string;
}

/**
 * Appiattisce una sidebar (già filtrata) nella sequenza ordinata delle sue
 * pagine navigabili — doc link e landing page delle categorie (categoria
 * prima dei figli, come la paginazione nativa di Docusaurus). Serve a
 * ricalcolare prev/next quando un percorso è attivo.
 */
export function flattenSidebarLinks(
  items: PropSidebar | readonly PropSidebarItem[],
  out: SidebarDocLink[] = [],
): SidebarDocLink[] {
  for (const item of items as readonly PropSidebarItem[]) {
    if (item.type === 'link') {
      out.push({ href: item.href, label: item.label });
    } else if (item.type === 'category') {
      if (item.href) out.push({ href: item.href, label: item.label });
      flattenSidebarLinks(item.items, out);
    }
  }
  return out;
}
