/**
 * Root — Docusaurus envelope around the app. Used here to inject our
 * PathProvider so any component (sidebar, banner, navbar selector) can
 * read/write the user's chosen path per volume.
 */
import React, {type ReactNode} from 'react';
import {PathProvider} from '@site/src/contexts/PathContext';

export default function Root({children}: {children: ReactNode}) {
  return <PathProvider>{children}</PathProvider>;
}
