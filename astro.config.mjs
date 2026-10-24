// @ts-check
import { defineConfig } from 'astro/config';

// The site lives at the organization's Pages root. The four project sites (/botmaker-studio/,
// /botmaker-cli/, /botmaker-dashboard/, /botmaker-remote-server/) are served from the same origin by
// their own repositories: nothing here may be emitted under those paths (test/reserved-paths.test.mjs).
export default defineConfig({
  site: 'https://botmakerdev.github.io',
  trailingSlash: 'always',
});
