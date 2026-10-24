// Reading the catalog: botmaker-catalog's generated catalog.json, the file Studio reads, as rows the pages show.
// Plain code with no Node import, because the gallery's script runs it in the browser too; the build loads the
// file through catalog.mjs.
//
// A catalog that answers but cannot be read — another schema, not JSON — is a state the pages show ("the catalog
// could not be read"), never an empty list pretending there is nothing published. A row that is wrong is left out
// and the others still show.

export const CATALOG_URL = 'https://raw.githubusercontent.com/BotMakerDev/botmaker-catalog/main/catalog.json';

/** The one schema this site reads (botmaker-cli `Catalog.SCHEMA_VERSION`). */
export const SCHEMA = 4;

/** Each rank, as the pages name it. */
export const RANK_LABEL = { admin: 'Official', trusted: 'Trusted', community: 'Community' };

const RANKS = new Set(Object.keys(RANK_LABEL));

// owner/name, the characters GitHub allows: a repository lands in links, so nothing else gets through.
// A name made only of dots (`.`, `..`) would walk the link up a level, and GitHub forbids it anyway.
const REPO = /^[A-Za-z0-9-]+\/(?!\.+$)[A-Za-z0-9._-]+$/;

// A plugin id names its page, /plugins/<id>/: a dotted name like com.botmaker.sdk, never a slash or only dots.
const ID = /^(?!\.+$)[A-Za-z0-9._-]+$/;

const text = (value) => (typeof value === 'string' ? value : '');
const count = (value) => (Number.isInteger(value) && value >= 0 ? value : 0);
const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

/** The releases that carry a tag and a commit, newest first as the catalog lists them. */
function releases(list, more) {
  if (!Array.isArray(list)) return [];
  return list
    .filter((r) => isObject(r) && text(r.tag) && text(r.commit))
    .map((r) => ({ tag: r.tag, commit: r.commit, ...more(r) }));
}

function plugin(row) {
  if (!isObject(row) || !ID.test(text(row.id)) || !REPO.test(text(row.repo)) || !RANKS.has(row.rank)) return null;
  const list = releases(row.releases, (r) => ({ minContractVersion: text(r.minContractVersion) }));
  if (list.length === 0) return null;
  return {
    id: row.id,
    repo: row.repo,
    rank: row.rank,
    name: text(row.name) || row.repo.split('/')[1],
    description: text(row.description),
    stars: count(row.stars),
    newest: list[0],
    releases: list,
  };
}

function bot(row) {
  if (!isObject(row) || !REPO.test(text(row.repo)) || !RANKS.has(row.rank)) return null;
  const list = releases(row.releases, (r) => ({
    plugins: Array.isArray(r.plugins) ? r.plugins.filter((p) => isObject(p) && text(p.id)) : [],
  }));
  if (list.length === 0) return null;
  return {
    repo: row.repo,
    rank: row.rank,
    description: text(row.description),
    stars: count(row.stars),
    ...(REPO.test(text(row.forkOf)) ? { forkOf: row.forkOf } : {}),
    newest: list[0],
    releases: list,
  };
}

/**
 * Reads a parsed catalog.json.
 *
 * @param {unknown} json
 * @returns {{ok: true, plugins: object[], bots: object[]} | {ok: false, reason: string}}
 */
export function readCatalog(json) {
  if (!isObject(json)) return { ok: false, reason: 'not a catalog' };
  if (json.schemaVersion !== SCHEMA) {
    return { ok: false, reason: `schema ${json.schemaVersion ?? 'missing'}, and this site reads schema ${SCHEMA}` };
  }
  if (!Array.isArray(json.plugins) || !Array.isArray(json.bots)) return { ok: false, reason: 'no plugins or bots' };
  return {
    ok: true,
    plugins: json.plugins.map(plugin).filter(Boolean),
    bots: json.bots.map(bot).filter(Boolean),
  };
}
