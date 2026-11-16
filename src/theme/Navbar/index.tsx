/**
 * Swizzle Navbar — l'originale di theme-classic (Layout + Content) con, subito
 * sotto la navbar, la barra della modalità temporanea dello zaino
 * («Non è il mio computer», fase Q5 del piano pm/piano-2026-11-quaderno.md).
 * La barra è appiccicosa e sta nel flusso: spinge il contenuto invece di
 * coprirlo, e si vede solo in quella modalità.
 */
import React, { type ReactNode } from 'react';
import NavbarLayout from '@theme/Navbar/Layout';
import NavbarContent from '@theme/Navbar/Content';

import BarraTemporanea from '@site/src/components/BarraTemporanea';

export default function Navbar(): ReactNode {
  return (
    <>
      <NavbarLayout>
        <NavbarContent />
      </NavbarLayout>
      <BarraTemporanea />
    </>
  );
}
