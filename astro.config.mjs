// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { DARK_EDITOR, MANUAL } from './src/lib/code-themes.mjs';

// The site lives at the organization's Pages root. The four project sites (/botmaker-studio/,
// /botmaker-cli/, /botmaker-dashboard/, /botmaker-remote-server/) are served from the same origin by
// their own repositories: nothing here may be emitted under those paths (test/reserved-paths.test.mjs).
//
// The docs are Starlight, under /docs/ because their content lives in src/content/docs/docs/. They wear the
// site's two looks: the same tokens (starlight.css maps Starlight's properties onto them), the site's header,
// and the site's theme toggle in place of Starlight's select, so one light/dark choice holds on every page.
export default defineConfig({
  site: 'https://botmakerdev.github.io',
  trailingSlash: 'always',
  // A plugin's page was named by its id until the catalog's schema 5 (2026-10-27) named plugins by repository.
  redirects: {
    '/plugins/com.botmaker.sdk/': '/plugins/BotMakerDev/botmaker-sdk/',
    '/plugins/com.botmaker.basics/': '/plugins/BotMakerDev/botmaker-plugin-basics/',
  },
  integrations: [
    starlight({
      title: 'BotMaker docs',
      description: 'Tutorials, how-to guides, reference and explanation for BotMaker.',
      customCss: [
        '@fontsource/fraunces/500.css',
        '@fontsource/fraunces/700.css',
        '@fontsource/ibm-plex-sans/400.css',
        '@fontsource/ibm-plex-sans/500.css',
        '@fontsource/ibm-plex-sans/600.css',
        '@fontsource/ibm-plex-mono/400.css',
        '@fontsource/ibm-plex-mono/600.css',
        '@fontsource/space-grotesk/500.css',
        '@fontsource/space-grotesk/700.css',
        './src/styles/tokens.css',
        './src/styles/header.css',
        './src/styles/starlight.css',
      ],
      components: {
        Header: './src/components/starlight/Header.astro',
        ThemeProvider: './src/components/starlight/ThemeProvider.astro',
        ThemeSelect: './src/components/starlight/ThemeSelect.astro',
        MobileMenuFooter: './src/components/starlight/MobileMenuFooter.astro',
      },
      // Diátaxis: learning, doing, looking up, understanding — in that order.
      sidebar: [
        { label: 'Tutorials', items: [{ autogenerate: { directory: 'docs/tutorials' } }] },
        { label: 'How-to guides', items: [{ autogenerate: { directory: 'docs/how-to' } }] },
        { label: 'Reference', items: [{ autogenerate: { directory: 'docs/reference' } }] },
        { label: 'Explanation', items: [{ autogenerate: { directory: 'docs/explanation' } }] },
      ],
      expressiveCode: {
        // Light first, the dark one also by the system setting: without JavaScript no data-theme is set, and the
        // code blocks follow the system setting like the tokens do.
        themes: [MANUAL, DARK_EDITOR],
        useDarkModeMediaQuery: true,
        styleOverrides: {
          borderRadius: 'var(--radius)',
          codeFontFamily: 'var(--font-mono)',
          uiFontFamily: 'var(--font-body)',
        },
      },
    }),
  ],
});
