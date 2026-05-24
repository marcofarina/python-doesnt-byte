import React, {type ReactNode} from 'react';
import clsx from 'clsx';
import useIsBrowser from '@docusaurus/useIsBrowser';
import IconLightMode from '@theme/Icon/LightMode';
import IconDarkMode from '@theme/Icon/DarkMode';
import IconSystemColorMode from '@theme/Icon/SystemColorMode';
import type {Props} from '@theme/ColorModeToggle';
import type {ColorMode} from '@docusaurus/theme-common';

import styles from './styles.module.css';

function getNextColorMode(
  colorMode: ColorMode | null,
  respectPrefersColorScheme: boolean,
): ColorMode | null {
  if (!respectPrefersColorScheme) {
    return colorMode === 'dark' ? 'light' : 'dark';
  }
  switch (colorMode) {
    case null:
      return 'light';
    case 'light':
      return 'dark';
    case 'dark':
      return null;
    default:
      throw new Error(`unexpected color mode ${colorMode}`);
  }
}

function getSpell(nextMode: ColorMode | null): string {
  switch (nextMode) {
    case 'light':
      return 'Lumos!';
    case 'dark':
      return 'Nox!';
    case null:
    default:
      return 'Auto';
  }
}

function CurrentColorModeIcon(): ReactNode {
  return (
    <>
      <IconLightMode
        aria-hidden
        className={clsx(styles.toggleIcon, styles.lightToggleIcon)}
      />
      <IconDarkMode
        aria-hidden
        className={clsx(styles.toggleIcon, styles.darkToggleIcon)}
      />
      <IconSystemColorMode
        aria-hidden
        className={clsx(styles.toggleIcon, styles.systemToggleIcon)}
      />
    </>
  );
}

function ColorModeToggle({
  className,
  buttonClassName,
  respectPrefersColorScheme,
  value,
  onChange,
}: Props): ReactNode {
  const isBrowser = useIsBrowser();
  const nextMode = getNextColorMode(value, respectPrefersColorScheme);
  const spell = getSpell(nextMode);
  const ariaLabel = `Cambia tema (clicca per attivare ${
    nextMode === 'light'
      ? 'la modalità chiara'
      : nextMode === 'dark'
        ? 'la modalità scura'
        : 'il tema di sistema'
  })`;

  return (
    <div className={clsx(styles.toggle, className)}>
      <button
        className={clsx(
          'clean-btn',
          styles.toggleButton,
          !isBrowser && styles.toggleButtonDisabled,
          buttonClassName,
        )}
        type="button"
        onClick={() => onChange(nextMode)}
        disabled={!isBrowser}
        aria-label={ariaLabel}
        data-next-mode={nextMode ?? 'system'}>
        <CurrentColorModeIcon />
        <span className={styles.spellTooltip} aria-hidden="true">
          <span className={styles.spellGlow} />
          <span className={styles.spellText}>{spell}</span>
        </span>
      </button>
    </div>
  );
}

export default React.memo(ColorModeToggle);
