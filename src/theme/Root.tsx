/**
 * Root — Docusaurus envelope around the app. Used here to:
 *  - register the FontAwesome icon library globally (so navbar
 *    icons, ColorModeToggle icons and other non-MDX surfaces
 *    can use <FontAwesomeIcon> by name)
 *  - inject our CurriculumProvider so any component (sidebar filtrata,
 *    banner, indicatore navbar, pagina /percorso) can read/write the
 *    active curriculum code.
 */
import React, { type ReactNode } from 'react';
import { library } from '@fortawesome/fontawesome-svg-core';
import { fab } from '@fortawesome/free-brands-svg-icons';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { CurriculumProvider } from '@site/src/contexts/CurriculumContext';

library.add(fab, fas);

export default function Root({ children }: { children: ReactNode }) {
  return <CurriculumProvider>{children}</CurriculumProvider>;
}
