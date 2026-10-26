/**
 * Vite del tema: Slidev la unisce alla propria (resolveViteConfigs legge il
 * vite.config di ogni root, temi compresi).
 *
 * Le presentazioni riusano i componenti React del libro (<Figura>,
 * <DiagrammaER>) e i ponti degli esecutori (Brython, sql.js): i file restano in
 * src/ e si importano con lo stesso alias `@site` di Docusaurus. Per farli
 * girare servono tre accorgimenti:
 *
 *  1. i `.tsx` del libro sono JSX di React: il plugin vue-jsx di Slidev non
 *     deve toccarli (lo escludiamo del tutto: il tema non ha file JSX), e li
 *     compila `jsxDelLibro` qui sotto;
 *  2. React esiste una volta sola, quello del sito (`dedupe`);
 *  3. `@docusaurus/ExecutionEnvironment`, l'unico import Docusaurus della
 *     catena di pyBoot.ts, punta a uno shim.
 *
 * In sviluppo la cartella static/ del sito è la public di Vite: Brython, la
 * stdlib, sql.js, i dataset e le icone dei callout si servono agli stessi
 * percorsi del sito pubblicato (/brython/…, /sql-datasets/…). In build no: le
 * presentazioni vivono dentro il sito (/slides/…) e quei file ci sono già.
 */
import { fileURLToPath } from 'node:url';
import { defineConfig, transformWithOxc, type Plugin } from 'vite';

const radice = fileURLToPath(new URL('../../', import.meta.url));
const shim = fileURLToPath(
  new URL('./setup/docusaurus-shim.ts', import.meta.url),
);

/**
 * Compila i `.tsx` del libro con il runtime automatico di React. Non basta
 * l'opzione `oxc` di Vite: vue-jsx (dentro Slidev) la restringe ai `.ts`,
 * perché i `.tsx` li vorrebbe compilare lui come JSX di Vue; e la
 * tsconfig.json del sito dice `jsx: preserve`, perché a Docusaurus il JSX
 * serve intatto. Questo plugin arriva prima di tutti e due.
 */
function jsxDelLibro(): Plugin {
  return {
    name: 'pdb:jsx-del-libro',
    enforce: 'pre',
    async transform(codice, id) {
      const file = id.split('?')[0];
      if (!file.endsWith('.tsx') || file.includes('/node_modules/')) return null;
      const esito = await transformWithOxc(codice, file, {
        lang: 'tsx',
        tsconfig: false,
        jsx: { runtime: 'automatic', importSource: 'react' },
      });
      return { code: esito.code, map: esito.map };
    },
  };
}

export default defineConfig(({ command }) => ({
  resolve: {
    alias: [
      { find: '@docusaurus/ExecutionEnvironment', replacement: shim },
      { find: /^@site\//, replacement: radice },
    ],
    dedupe: ['react', 'react-dom'],
  },
  plugins: [jsxDelLibro()],
  optimizeDeps: {
    include: [
      'react',
      'react-dom/client',
      'react/jsx-runtime',
      'roughjs',
      'qrcode',
      '@fortawesome/react-fontawesome',
      '@fortawesome/free-solid-svg-icons',
    ],
  },
  server: {
    fs: { allow: [radice] },
  },
  ...(command === 'serve' ? { publicDir: `${radice}static` } : {}),
  slidev: {
    vuejsx: { exclude: [/.*/] },
  },
}));
