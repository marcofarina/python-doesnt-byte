/**
 * Root — Docusaurus envelope around the app. Used here to:
 *  - register the FontAwesome icon library globally (so navbar
 *    icons, ColorModeToggle icons and other non-MDX surfaces
 *    can use <FontAwesomeIcon> by name)
 *  - inject our CurriculumProvider so any component (sidebar filtrata,
 *    banner, indicatore navbar, pagina /percorso) can read/write the
 *    active curriculum code.
 *  - avviare lo zaino (src/lib/zaino/sincronizza.ts) una volta per scheda,
 *    dopo aver registrato le sue sezioni (oggi il quaderno).
 */
import React, { useEffect, type ReactNode } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { library } from '@fortawesome/fontawesome-svg-core';
import { fab } from '@fortawesome/free-brands-svg-icons';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { CurriculumProvider } from '@site/src/contexts/CurriculumContext';
import '@site/src/lib/quaderno/sezione';
import { avviaZaino } from '@site/src/lib/zaino/sincronizza';

library.add(fab, fas);

export default function Root({ children }: { children: ReactNode }) {
  const { siteConfig } = useDocusaurusContext();
  const servizio = siteConfig.customFields?.zaino as string;
  useEffect(() => avviaZaino(servizio), [servizio]);
  return <CurriculumProvider>{children}</CurriculumProvider>;
}
