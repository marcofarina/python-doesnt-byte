/**
 * Swizzle Navbar/Content — copia dell'originale theme-classic con l'aggiunta
 * del nostro <CurriculumIndicator/> al centro fra gli item di sinistra e
 * quelli di destra. Il componente si nasconde da sé quando nessun percorso
 * è attivo, quindi di norma la navbar resta vuota al centro.
 * A destra, prima di GitHub, il pulsante del quaderno (/quaderno, fase Q3
 * del piano pm/piano-2026-11-quaderno.md), con un pallino se lo zaino è
 * offline o in errore (Q5).
 */
import React, { type ReactNode } from 'react';
import clsx from 'clsx';
import {
  useThemeConfig,
  ErrorCauseBoundary,
  ThemeClassNames,
} from '@docusaurus/theme-common';
import {
  splitNavbarItems,
  useNavbarMobileSidebar,
} from '@docusaurus/theme-common/internal';
import NavbarItem, { type Props as NavbarItemConfig } from '@theme/NavbarItem';
import NavbarColorModeToggle from '@theme/Navbar/ColorModeToggle';
import SearchBar from '@theme/SearchBar';
import NavbarMobileSidebarToggle from '@theme/Navbar/MobileSidebar/Toggle';
import NavbarLogo from '@theme/Navbar/Logo';
import NavbarSearch from '@theme/Navbar/Search';

import CurriculumIndicator from '@site/src/components/CurriculumIndicator';
import NavbarIconButton from '@site/src/components/NavbarIconButton';
import { haProblemi } from '@site/src/components/ZainoStato';
import { useStatoZaino } from '@site/src/lib/zaino/sincronizza';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHighlighter } from '@fortawesome/free-solid-svg-icons';
import MugSaucer from '@site/src/icons/mug-saucer.svg';

import styles from './styles.module.css';

function useNavbarItems() {
  return useThemeConfig().navbar.items as NavbarItemConfig[];
}

function NavbarItems({ items }: { items: NavbarItemConfig[] }): ReactNode {
  return (
    <>
      {items.map((item, i) => (
        <ErrorCauseBoundary
          key={i}
          onError={(error) =>
            new Error(
              `A theme navbar item failed to render.
Please double-check the following navbar item (themeConfig.navbar.items) of your Docusaurus config:
${JSON.stringify(item, null, 2)}`,
              { cause: error },
            )
          }
        >
          <NavbarItem {...item} />
        </ErrorCauseBoundary>
      ))}
    </>
  );
}

function NavbarContentLayout({
  left,
  center,
  right,
}: {
  left: ReactNode;
  center: ReactNode;
  right: ReactNode;
}) {
  return (
    <div className="navbar__inner">
      <div
        className={clsx(
          ThemeClassNames.layout.navbar.containerLeft,
          'navbar__items',
        )}
      >
        {left}
      </div>
      <div className="navbar__items navbar__items--center">{center}</div>
      <div
        className={clsx(
          ThemeClassNames.layout.navbar.containerRight,
          'navbar__items navbar__items--right',
        )}
      >
        {right}
      </div>
    </div>
  );
}

export default function NavbarContent(): ReactNode {
  const mobileSidebar = useNavbarMobileSidebar();
  const zaino = useStatoZaino();

  const items = useNavbarItems();
  const [leftItems, rightItems] = splitNavbarItems(items);

  const searchBarItem = items.find((item) => item.type === 'search');

  return (
    <NavbarContentLayout
      left={
        <>
          {!mobileSidebar.disabled && <NavbarMobileSidebarToggle />}
          <NavbarLogo />
          <NavbarItems items={leftItems} />
        </>
      }
      center={<CurriculumIndicator />}
      right={
        <>
          <NavbarItems items={rightItems} />
          <NavbarIconButton
            to="/quaderno"
            ariaLabel={
              haProblemi(zaino)
                ? 'Il tuo quaderno (lo zaino ha un problema)'
                : 'Il tuo quaderno'
            }
            tooltip="Quaderno"
            icon={<FontAwesomeIcon icon={faHighlighter} />}
            accent="amber"
            pallino={haProblemi(zaino)}
          />
          <NavbarIconButton
            to="https://github.com/marcofarina/python-doesnt-byte"
            target="_blank"
            rel="noopener noreferrer"
            ariaLabel="Repository GitHub"
            tooltip="GitHub"
            icon={<FontAwesomeIcon icon={['fab', 'github']} />}
            accent="cyan"
          />
          <NavbarIconButton
            to="/support/"
            ariaLabel="Offrimi un caffè"
            tooltip="Offrimi un caffè"
            icon={<MugSaucer />}
            accent="amber"
          />
          <NavbarColorModeToggle className={styles.colorModeToggle} />
          {!searchBarItem && (
            <NavbarSearch>
              <SearchBar />
            </NavbarSearch>
          )}
        </>
      }
    />
  );
}
