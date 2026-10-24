// The newest version of a BotMaker repository, asked of GitHub at build time.
//
// EVERY VERSION IS FETCHED, NONE IS TYPED. `releases/latest` is the one source: a version written into the
// site is wrong the day after the next release, and being right about versions is the one thing this site
// does that the project pages do not already do.
//
// A FETCH THAT FAILS FAILS THE BUILD. The workflow then deploys nothing and the site already published —
// correct as of its own run — stays up. That is better than replacing a right version with an "unknown"
// because GitHub rate-limited a cron job.

export const OWNER = 'BotMakerDev';

/**
 * The tag of `repo`'s latest release, e.g. `v1.6.0`.
 *
 * @param {string} repo a repository of the organization, without the owner
 * @param {{fetch?: typeof fetch, token?: string}} options `token` raises the rate limit (CI passes its own)
 * @returns {Promise<string>}
 */
export async function latestTag(repo, { fetch = globalThis.fetch, token } = {}) {
  const headers = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`https://api.github.com/repos/${OWNER}/${repo}/releases/latest`, { headers });
  const tag = response.ok ? (await response.json()).tag_name : '';
  if (!tag) throw new Error(`no latest release for ${OWNER}/${repo} (HTTP ${response.status})`);
  return tag;
}
