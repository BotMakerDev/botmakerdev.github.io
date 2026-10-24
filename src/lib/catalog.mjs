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
