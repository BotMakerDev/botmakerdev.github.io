// The catalog of published plugins and bots, loaded for the build. Reading it is catalog-read.mjs's, which the
// gallery's script shares with the browser.
//
// Two ways to fail, on purpose two outcomes. A catalog that does not answer (network, HTTP error) throws, so the
// build fails and the published site stays. A catalog that answers but cannot be read is a state the pages show.

import { readFile } from 'node:fs/promises';
import { CATALOG_URL, readCatalog } from './catalog-read.mjs';

export * from './catalog-read.mjs';

/**
 * The catalog, from `file` when given (CATALOG_FILE: a local preview before the live catalog is schema 4),
 * else from the catalog repository's `main`.
 */
export async function loadCatalog({ fetch = globalThis.fetch, file = process.env.CATALOG_FILE } = {}) {
  let body;
  if (file) {
    body = await readFile(file, 'utf8');
  } else {
    const response = await fetch(CATALOG_URL);
    if (!response.ok) throw new Error(`the catalog did not answer: HTTP ${response.status} from ${CATALOG_URL}`);
    body = await response.text();
  }
  try {
    return readCatalog(JSON.parse(body));
  } catch {
    return { ok: false, reason: 'not JSON' };
  }
}

/**
 * Where a bot release's `.bmk` downloads from, asked of the release's asset list on github.com (the page the
 * release shows, not the REST API, as versions.mjs reads tags: no token, no hourly limit). The file is named after
 * the bot's pom, which the catalog does not carry, so its address is read there.
 *
 * A release that is gone (the author deleted it, or the repository) or lists no `.bmk` answers `{gone: true}`; any
 * other failure throws, and the build fails as it does when the catalog does not answer.
 *
 * @returns {Promise<{url: string} | {gone: true}>}
 */
export async function bmkDownload(repo, tag, { fetch = globalThis.fetch } = {}) {
  const url = `https://github.com/${repo}/releases/expanded_assets/${encodeURIComponent(tag)}`;
  const response = await fetch(url);
  if (response.status === 404) return { gone: true };
  if (!response.ok) throw new Error(`the release's files did not answer: HTTP ${response.status} from ${url}`);
  // GitHub spells the repository its own way, whatever case the catalog uses.
  const base = `/${repo}/releases/download/${encodeURIComponent(tag)}/`.toLowerCase();
  const files = [...(await response.text()).matchAll(/href="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((href) => href.toLowerCase().startsWith(base) && /^[A-Za-z0-9._-]+\.bmk$/.test(href.slice(base.length)));
  // botmaker-cli names it <name>-<version>.bmk (BotFiles.fileName); another .bmk on the release is a fallback.
  const version = tag.replace(/^v(?=\d)/, '');
  const file = files.find((href) => href.endsWith(`-${version}.bmk`)) ?? files[0];
  return file ? { url: `https://github.com${file}` } : { gone: true };
}

/** Whether the file at `url` is there: 404 is no, any other failure throws. */
async function exists(url, { fetch = globalThis.fetch } = {}) {
  const response = await fetch(url, { method: 'HEAD' });
  if (response.status === 404) return false;
  if (!response.ok) throw new Error(`HTTP ${response.status} from ${url}`);
  return true;
}

/**
 * The catalog with each bot's files looked up: `download` when its `.bmk` is there, `gone` when it no longer is, and
 * `icon` only when the bot has an icon.png, so a card asks for no picture that is not there.
 */
export async function withFiles(catalog, options = {}) {
  if (!catalog.ok) return catalog;
  const bots = await Promise.all(catalog.bots.map(async ({ icon, ...bot }) => {
    const found = bot.bmk ? await bmkDownload(bot.repo, bot.bmk.tag, options) : {};
    return {
      ...bot,
      ...(icon && await exists(icon, options) ? { icon } : {}),
      ...('url' in found ? { download: found.url } : {}),
      ...('gone' in found ? { gone: true } : {}),
    };
  }));
  return { ...catalog, bots };
}
