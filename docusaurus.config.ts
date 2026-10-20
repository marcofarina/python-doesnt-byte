import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const remarkPyRunner = require('./plugins/pyrunner/remark.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const remarkSqlRunner = require('./plugins/sqlrunner/remark.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { protectCode, restoreCode } = require('./plugins/smartypants-guard.js');

// Keyword admonition custom (Notion-style callouts). Vedi
// src/theme/Admonition/index.tsx per il registry di titoli + icone PNG.
const admonitions = {
  keywords: [
    'prereq',
    'learn',
    'exercise',
    'definition',
    'history',
    'code',
    'cleancode',
    'nutshell',
    'mindmap',
  ],
  extendDefaults: true,
};

// PyQuest (/pyquest, /level-editor e voce di navbar) è visibile solo in sviluppo
// (npm start): in produzione le pagine sono escluse dal plugin pages. Per
// riaccenderlo online basta rendere questa costante true.
const PYQUEST_PUBLIC = process.env.NODE_ENV !== 'production';

// Il config è una funzione async perché remark-smartypants è ESM-only e va
// caricato con import() dinamico (il config viene valutato in contesto CJS,
// vedi il require() qui sopra). smartypants converte gli apici dritti della
// prosa in virgolette curve tipografiche ("…" '…' e apostrofo ') lavorando
// sull'AST: salta blocchi di codice e inline code, quindi il codice Python e
// gli attributi JSX restano intatti. protectCode/restoreCode (vedi
// plugins/smartypants-guard.js) lo avvolgono per proteggere anche i children
// di <InlineCode>, che renderizza codice e non va "smart-quotato".
export default async function createConfig(): Promise<Config> {
  const { default: smartypants } = await import('remark-smartypants');

  const config: Config = {
    title: 'Python Doesn’t Byte',
    tagline: 'Il libro di testo, reinventato.',
    favicon: 'img/icons/favicon.ico',

    // Sottodominio tutto del libro, impostato in Settings → Pages → Custom
    // domain del repo (il deploy passa da GitHub Actions, quindi un file CNAME
    // in static/ verrebbe ignorato). Fino alla 0.20 il libro stava sotto
    // https://rainbowbits.cloud/python-doesnt-byte/: una Redirect Rule di
    // Cloudflare porta quei vecchi URL qui con un 301, path e query compresi.
    url: 'https://python.rainbowbits.cloud',
    baseUrl: '/',

    // GitHub pages deployment config.
    // If you aren't using GitHub pages, you don't need these.
    organizationName: 'marcofarina', // Usually your GitHub org/username.
    projectName: 'python-doesnt-byte', // Usually your repo name.
    deploymentBranch: 'gh-pages',
    // true: ogni pagina esce come `<pagina>/index.html` e gli URL canonici
    // finiscono con `/`. È la forma che GitHub Pages serve da sé: `/pagina/`
    // risponde 200 e `/pagina` riceve un 301 verso `/pagina/` conservando la
    // query. Con false la build scriveva `pagina.html` e `/pagina/` finiva in
    // 404.html: un lampo di «pagina non trovata» prima del redirect client-side.
    trailingSlash: true,

    onBrokenLinks: 'throw',

    markdown: {
      mermaid: true,
      hooks: {
        onBrokenMarkdownLinks: 'warn',
      },
    },

    // Even if you don't use internationalization, you can use this field to set
    // useful metadata like html lang. For example, if your site is Chinese, you
    // may want to replace "en" with "zh-Hans".
    i18n: {
      defaultLocale: 'it',
      locales: ['it'],
    },

    presets: [
      [
        'classic',
        {
          docs: {
            sidebarPath: './sidebars.ts',
            // Please change this to your repo.
            // Remove this to remove the "edit this page" links.
            editUrl: 'https://github.com/marcofarina/python-doesnt-byte',
            beforeDefaultRemarkPlugins: [remarkPyRunner, remarkSqlRunner],
            remarkPlugins: [protectCode, smartypants, restoreCode],
            admonitions,
          },
          blog: false,
          pages: {
            // Gli exclude predefiniti di Docusaurus (GlobExcludeDefault in
            // @docusaurus/utils) vanno ripetuti: passare `exclude` li sostituisce.
            exclude: [
              '**/_*.{js,jsx,ts,tsx,md,mdx}',
              '**/_*/**',
              '**/*.test.{js,jsx,ts,tsx}',
              '**/__tests__/**',
              ...(PYQUEST_PUBLIC ? [] : ['pyquest/**', 'level-editor.tsx']),
            ],
            beforeDefaultRemarkPlugins: [remarkPyRunner, remarkSqlRunner],
            remarkPlugins: [protectCode, smartypants, restoreCode],
            admonitions,
          },
          theme: {
            customCss: './src/css/custom.css',
          },
        } satisfies Preset.Options,
      ],
    ],

    // Analytics privacy-first (GoatCounter): nessun cookie, niente dati personali.
    // Solo in produzione: in dev (`npm start`) NODE_ENV è 'development', così le
    // visite locali non gonfiano le statistiche.
    //
    // Fino alla 0.20 GoatCounter registrava i path come
    // `/python-doesnt-byte/pagina`. Ora arrivano come `/pagina/`: per tenere lo
    // storico su una riga sola per pagina, `goatcounter.path` toglie la barra
    // finale (non quella della home, che l'ha sempre avuta) e rimette davanti
    // il vecchio prefisso. count.js lo legge al caricamento: lo script inline
    // deve precedere count.js, per questo stanno tutti e due qui, nell'ordine.
    headTags:
      process.env.NODE_ENV === 'production'
        ? [
            {
              tagName: 'script',
              attributes: {},
              innerHTML:
                'window.goatcounter={path:function(p){return "/python-doesnt-byte"+' +
                'p.replace(/^(\\/[^?#]*[^\\/?#])\\/(?=[?#]|$)/,"$1")}};',
            },
            {
              tagName: 'script',
              attributes: {
                src: 'https://gc.zgo.at/count.js',
                async: 'async',
                'data-goatcounter':
                  'https://pythondoesntbyte.goatcounter.com/count',
              },
            },
          ]
        : [],

    clientModules: ['./src/fonts.ts'],

    plugins: [
      './plugins/pyrunner/index.js',
      './plugins/pyquest/index.js',
      './plugins/exercise-graph/index.js',
      './plugins/copy-page-md/index.js',
      './plugins/curriculum/index.js',
      './plugins/archivio/index.js',
      [
        '@docusaurus/plugin-content-docs',
        {
          id: 'programmatore',
          path: 'volumes/programmatore',
          routeBasePath: 'programmatore',
          sidebarPath: './sidebars/programmatore.ts',
          editUrl: 'https://github.com/marcofarina/python-doesnt-byte',
          beforeDefaultRemarkPlugins: [remarkPyRunner, remarkSqlRunner],
          remarkPlugins: [protectCode, smartypants, restoreCode],
          admonitions,
        },
      ],
      [
        '@docusaurus/plugin-content-docs',
        {
          id: 'artefice',
          path: 'volumes/artefice',
          routeBasePath: 'artefice',
          sidebarPath: './sidebars/artefice.ts',
          editUrl: 'https://github.com/marcofarina/python-doesnt-byte',
          beforeDefaultRemarkPlugins: [remarkPyRunner, remarkSqlRunner],
          remarkPlugins: [protectCode, smartypants, restoreCode],
          admonitions,
        },
      ],
      [
        '@docusaurus/plugin-content-docs',
        {
          id: 'archivista',
          path: 'volumes/archivista',
          routeBasePath: 'archivista',
          sidebarPath: './sidebars/archivista.ts',
          editUrl: 'https://github.com/marcofarina/python-doesnt-byte',
          beforeDefaultRemarkPlugins: [remarkPyRunner, remarkSqlRunner],
          remarkPlugins: [protectCode, smartypants, restoreCode],
          admonitions,
        },
      ],
      [
        '@docusaurus/plugin-content-docs',
        {
          id: 'apprendista',
          path: 'volumes/apprendista',
          routeBasePath: 'apprendista',
          sidebarPath: './sidebars/apprendista.ts',
          editUrl: 'https://github.com/marcofarina/python-doesnt-byte',
          beforeDefaultRemarkPlugins: [remarkPyRunner, remarkSqlRunner],
          remarkPlugins: [protectCode, smartypants, restoreCode],
          admonitions,
        },
      ],
    ],

    themes: ['@docusaurus/theme-mermaid'],

    themeConfig: {
      // Immagine OG/social di default (1200×630, sRGB). Le singole pagine
      // possono sovrascriverla via frontmatter `image:`. Sostituisce il
      // placeholder Docusaurus. Il file va in static/img/og-card.jpg.
      image: 'img/og-card.jpg',
      // Metadata di default applicati a tutte le pagine (le pagine con
      // frontmatter/Layout proprio sovrascrivono description e og:title).
      // Docusaurus emette già da solo og:image/twitter:image (da `image`
      // qui sopra) e twitter:card=summary_large_image.
      metadata: [
        {
          name: 'keywords',
          content:
            'python, informatica, liceo scienze applicate, libro di testo, programmazione, didattica, open source, scuola superiore',
        },
        { property: 'og:type', content: 'website' },
        { property: 'og:locale', content: 'it_IT' },
        { property: 'og:site_name', content: 'Python Doesn’t Byte' },
      ],
      mermaid: {
        theme: { light: 'neutral', dark: 'dark' },
        options: {
          fontFamily:
            "'Monaspace Argon', ui-monospace, SFMono-Regular, monospace",
          fontSize: 14,
        },
      },
      docs: {
        sidebar: {
          autoCollapseCategories: true,
        },
      },
      navbar: {
        title: 'Python Doesn’t Byte',
        logo: {
          alt: 'Python Doesn’t Byte Logo',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'dropdown',
            label: 'Libri',
            position: 'left',
            items: [
              {
                type: 'doc',
                docId: 'intro',
                docsPluginId: 'programmatore',
                label: 'Manuale del Programmatore',
              },
              {
                type: 'doc',
                docId: 'intro',
                docsPluginId: 'artefice',
                label: 'Manuale dell’Artefice',
              },
              {
                type: 'doc',
                docId: 'intro',
                docsPluginId: 'archivista',
                label: 'Manuale dell’Archivista',
              },
              {
                type: 'doc',
                docId: 'intro',
                docsPluginId: 'apprendista',
                label: 'Biblioteca dell’Apprendista',
              },
            ],
          },
          ...(PYQUEST_PUBLIC
            ? [
                {
                  to: '/pyquest',
                  label: 'PyQuest',
                  position: 'left' as const,
                },
              ]
            : []),
          // GitHub e "Offrimi un caffè" sono renderizzati come icone+popup
          // (NavbarIconButton) dal swizzle src/theme/Navbar/Content, non
          // tramite navbar items standard.
        ],
      },
      // Il footer è interamente gestito dallo swizzle src/theme/Footer
      // (redesign Value 4 Value): la config `footer` non viene più usata.
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    } satisfies Preset.ThemeConfig,
  };

  return config;
}
