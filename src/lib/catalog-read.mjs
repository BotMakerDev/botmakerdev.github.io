// Reading the catalog: botmaker-catalog's generated catalog.json, the file Studio reads, as rows the pages show.
// Plain code with no Node import, because the gallery's script runs it in the browser too; the build loads the
// file through catalog.mjs.
//
// A catalog that answers but cannot be read — another schema, not JSON — is a state the pages show ("the catalog
// could not be read"), never an empty list pretending there is nothing published. A row that is wrong is left out
// and the others still show.

export const CATALOG_URL = 'https://raw.githubusercontent.com/BotMakerDev/botmaker-catalog/main/catalog.json';

/**
 * The newest schema this site reads (botmaker-cli `Catalog.SCHEMA_VERSION`). 6 (2026-11-21) only added fields, so 5
 * still reads: times, downloads, platforms, yanked releases, `formerly` and advisories absent.
 */
export const SCHEMA = 6;
const OLDEST_SCHEMA = 5;

/** A platform id the catalog uses, as the pages name it (botmaker-cli `Platform`). */
export const PLATFORM_LABEL = { linux: 'Linux', windows: 'Windows', macos: 'macOS' };

/** Each rank, as the pages name it. */
export const RANK_LABEL = { admin: 'Official', trusted: 'Trusted', community: 'Community' };

const RANKS = new Set(Object.keys(RANK_LABEL));

// owner/name, the characters GitHub allows: a repository lands in links, and names a plugin's page
// (/plugins/<owner>/<name>/), so nothing else gets through. A name made only of dots (`.`, `..`) would walk the link
// up a level, and GitHub forbids it anyway.
const REPO = /^[A-Za-z0-9-]+\/(?!\.+$)[A-Za-z0-9._-]+$/;

// A commit lands in the icon's address, and a .bmk's pin is a sha256: hex only, so neither can walk a link.
const COMMIT = /^[0-9a-f]{7,40}$/;
const SHA256 = /^[0-9a-f]{64}$/;

const text = (value) => (typeof value === 'string' ? value : '');
const count = (value) => (Number.isInteger(value) && value >= 0 ? value : 0);
const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

/** The day of an ISO-8601 time, or nothing. */
const day = (value) => /^(\d{4}-\d{2}-\d{2})T/.exec(text(value))?.[1];

/**
 * The releases offered, newest first as the catalog lists them: each carries a tag and a commit, and is neither
 * yanked nor named by an advisory, as Studio's pickers leave them out.
 */
function releases(row, advised, more) {
  if (!Array.isArray(row.releases)) return [];
  const slugs = [row.repo, ...(Array.isArray(row.formerly) ? row.formerly : [])].map((s) => text(s).toLowerCase());
  return row.releases
    .filter((r) => isObject(r) && text(r.tag) && text(r.commit) && r.yanked == null
      && !slugs.some((slug) => advised.has(`${slug}@${r.tag}`)))
    .map((r) => ({ tag: r.tag, commit: r.commit, ...more(r) }));
}

/** Every `owner/name@tag` an advisory not withdrawn names, the slug in lower case. */
function advisedReleases(list) {
  const advised = new Set();
  if (!Array.isArray(list)) return advised;
  for (const advisory of list) {
    if (!isObject(advisory) || advisory.withdrawn != null || !Array.isArray(advisory.releases)) continue;
    for (const tag of advisory.releases) advised.add(`${text(advisory.repo).toLowerCase()}@${text(tag)}`);
  }
  return advised;
}

// A plugin is its repository since schema 5 (2026-10-27): the pom's coordinate is com.github.<owner>:<name>.
function plugin(row, advised) {
  if (!isObject(row) || !REPO.test(text(row.repo)) || !RANKS.has(row.rank)) return null;
  const list = releases(row, advised, (r) => ({ minContractVersion: text(r.minContractVersion) }));
  if (list.length === 0) return null;
  const updated = day(row.updatedAt);
  return {
    repo: row.repo,
    rank: row.rank,
    name: text(row.name) || row.repo.split('/')[1],
    description: text(row.description),
    stars: count(row.stars),
    ...(updated ? { updated } : {}),
    ...(COMMIT.test(list[0].commit) ? { icon: iconUrl(row.repo, list[0].commit) } : {}),
    newest: list[0],
    releases: list,
  };
}

function bot(row, advised) {
  if (!isObject(row) || !REPO.test(text(row.repo)) || !RANKS.has(row.rank)) return null;
  const list = releases(row, advised, (r) => ({
    plugins: Array.isArray(r.plugins) ? r.plugins.filter((p) => isObject(p) && text(p.repo)) : [],
    ...(SHA256.test(text(r.bmkSha256)) ? { bmkSha256: r.bmkSha256 } : {}),
    // None named means every one, so an empty list says nothing.
    platforms: Array.isArray(r.platforms) ? Object.keys(PLATFORM_LABEL).filter((id) => r.platforms.includes(id)) : [],
  }));
  if (list.length === 0) return null;
  // The .bmk offered is the newest release's that has one: a release its author's folder had moved past lists none.
  const bmk = list.find((r) => r.bmkSha256);
  const updated = day(row.updatedAt);
  return {
    repo: row.repo,
    rank: row.rank,
    description: text(row.description),
    stars: count(row.stars),
    ...(updated ? { updated } : {}),
    // A bot with no .bmk download counted lists none, which is not zero.
    ...(Number.isInteger(row.downloads) && row.downloads >= 0 ? { downloads: row.downloads } : {}),
    ...(REPO.test(text(row.forkOf)) ? { forkOf: row.forkOf } : {}),
    ...(COMMIT.test(list[0].commit) ? { icon: iconUrl(row.repo, list[0].commit) } : {}),
    ...(bmk ? { bmk: { tag: bmk.tag, sha256: bmk.bmkSha256 } } : {}),
    newest: list[0],
    releases: list,
  };
}

/**
 * A bot's or a plugin's `icon.png` at a commit, at the repository's root (a plugin's parent copies that file into
 * its jar); one without it answers 404 and its card keeps the letter.
 */
export const iconUrl = (repo, commit) => `https://raw.githubusercontent.com/${repo}/${commit}/icon.png`;

/**
 * Reads a parsed catalog.json.
 *
 * @param {unknown} json
 * @returns {{ok: true, plugins: object[], bots: object[]} | {ok: false, reason: string}}
 */
export function readCatalog(json) {
  if (!isObject(json)) return { ok: false, reason: 'not a catalog' };
  if (!Number.isInteger(json.schemaVersion) || json.schemaVersion < OLDEST_SCHEMA || json.schemaVersion > SCHEMA) {
    return {
      ok: false,
      reason: `schema ${json.schemaVersion ?? 'missing'}, and this site reads schemas ${OLDEST_SCHEMA} to ${SCHEMA}`,
    };
  }
  if (!Array.isArray(json.plugins) || !Array.isArray(json.bots)) return { ok: false, reason: 'no plugins or bots' };
  const advised = advisedReleases(json.advisories);
  return {
    ok: true,
    plugins: json.plugins.map((row) => plugin(row, advised)).filter(Boolean),
    bots: json.bots.map((row) => bot(row, advised)).filter(Boolean),
  };
}
