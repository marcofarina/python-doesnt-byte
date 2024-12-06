import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Python Doesn\'t Byte',
  tagline: 'Il libro di testo, reinventato.',
  favicon: 'img/icons/favicon.ico',

  // Set the production url of your site here
  url: 'https://www.rainbowbits.cloud',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'marcofarina', // Usually your GitHub org/user name.
  projectName: 'python-doesnt-byte', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

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
          editUrl:
            'https://github.com/marcofarina/python-doesnt-byte',
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

  themeConfig: {
    // Replace with your project's social card
    image: 'img/docusaurus-social-card.jpg',
    navbar: {
      title: 'Python Doesn\'t Byte',
      logo: {
        alt: 'Python Doesn\'t Byte Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Libro',
        },
/*        {
          to: '/blog',
          label: 'Blog',
          position: 'left'},*/
        {
          to: '/support/',
          label: 'Support',
          position: 'right',
          className: 'sponsorship-link',
        },
        {
          to: 'https://github.com/marcofarina/python-doesnt-byte',
          label: 'GitHub',
          position: 'right',
          target: '_blank',
          className: 'github-link',
          'aria-label': 'GitHub repository',
        },
        {
          to: 'https://www.rainbowbits.cloud',
          label: 'Rainbow Bits',
          position: 'right',
          target: '_blank',
          className: 'rainbowbits-link',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Rainbow Bits',
          items: [
            {
              label: 'Python Doesn\'t Byte',
              to: '/docs/intro',
            },
          ],
        },
        {
          title: 'Contribuisci',
          items: [
            {
              html: '<span style="display: block">Bitcoin on-chain</span><span style="font-family: monospace; font-size: small;">bc1qhll2p0geaeqn4qskl2fk9gnlqusrcqja0v8p2d</span>'
            },
            {
              label: 'Buy me a coffee',
              href: 'https://ko-fi.com/marcofarina',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'Blog',
              to: '/blog',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/marcofarina/',
            },
          ],
        },
      ],
      logo: {
        alt: 'Rainbow Bits Logo',
        src: 'img/rb-hero-logo-dark.svg',
        href: 'https://www.rainbowbits.cloud',
        width: 160,
        height: 51,
      },
      copyright: `Except where otherwise noted, content on this site is licensed under a<br>Creative Commons Attribution - Non-commercial - Share Alike 4.0 International license. ${new Date().getFullYear()}.<br>Built with Docusaurus. Icons by Font Awesome.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
  themes: [
    'docusaurus-live-brython'
  ],
};

export default config;
