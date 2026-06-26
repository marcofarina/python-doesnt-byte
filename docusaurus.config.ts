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

    // Set the production url of your site here
    url: 'https://www.rainbowbits.cloud',
    // Set the /<baseUrl>/ pathname under which your site is served
    // For GitHub pages deployment, it is often '/<projectName>/'
    baseUrl: '/python-doesnt-byte/',

    // GitHub pages deployment config.
    // If you aren't using GitHub pages, you don't need these.
    organizationName: 'marcofarina', // Usually your GitHub org/username.
    projectName: 'python-doesnt-byte', // Usually your repo name.
    deploymentBranch: 'gh-pages',
    trailingSlash: false,

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
          blog: {
            showReadingTime: true,
            feedOptions: {
              type: ['rss', 'atom'],
              xslt: true,
            },
            // Please change this to your repo.
            // Remove this to remove the "edit this page" links.
            //editUrl:
            //  'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
            // Useful options to enforce blogging best practices
            remarkPlugins: [protectCode, smartypants, restoreCode],
            onInlineTags: 'warn',
            onInlineAuthors: 'warn',
            onUntruncatedBlogPosts: 'warn',
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
    scripts:
      process.env.NODE_ENV === 'production'
        ? [
            {
              src: 'https://gc.zgo.at/count.js',
              async: true,
              'data-goatcounter':
                'https://pythondoesntbyte.goatcounter.com/count',
            },
          ]
        : [],

    clientModules: ['./src/fonts.ts'],

    plugins: [
      './plugins/pyrunner/index.js',
      './plugins/exercise-graph/index.js',
      './plugins/copy-page-md/index.js',
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
          /*        {
                    to: '/blog',
                    label: 'Blog',
                    position: 'left'},*/
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
