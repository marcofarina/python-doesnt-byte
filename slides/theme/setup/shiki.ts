import { defineShikiSetup } from '@slidev/types';

// Lo stesso tema del codice nel libro (prism `github`, docusaurus.config.ts).
export default defineShikiSetup(() => ({
  themes: {
    light: 'github-light',
    dark: 'github-dark',
  },
}));
