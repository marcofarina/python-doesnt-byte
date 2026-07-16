/**
 * Root — Docusaurus envelope around the app. Used here to:
 *  - register the FontAwesome icon library globally (so navbar
 *    icons, ColorModeToggle icons and other non-MDX surfaces
 *    can use <FontAwesomeIcon> by name)
 *  - inject our PathProvider so any component (sidebar, banner,
 *    navbar selector) can read/write the user's chosen path per
 *    volume.
 */
import React, { type ReactNode } from 'react';
import { library } from '@fortawesome/fontawesome-svg-core';
import { fab } from '@fortawesome/free-brands-svg-icons';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { PathProvider } from '@site/src/contexts/PathContext';
import { CurriculumProvider } from '@site/src/contexts/CurriculumContext';

library.add(fab, fas);

// PathProvider resta finché il vecchio sistema percorsi non viene rimosso
// (fase 4 di pm/design-percorsi-personalizzati.md).
export default function Root({ children }: { children: ReactNode }) {
  return (
    <CurriculumProvider>
      <PathProvider>{children}</PathProvider>
    </CurriculumProvider>
  );
}
