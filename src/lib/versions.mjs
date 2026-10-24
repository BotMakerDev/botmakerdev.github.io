// The newest version of a BotMaker repository, asked of GitHub at build time.
//
// EVERY VERSION IS FETCHED, NONE IS TYPED. The latest release is the one source: a version written into the
// site is wrong the day after the next release, and being right about versions is the one thing this site
// does that the project pages do not already do.
//
// IT IS READ OFF THE WEB PAGE, NOT THE API. `github.com/<owner>/<repo>/releases/latest` redirects to the latest
// release's tag (drafts and prereleases excluded, as the API's `releases/latest` does), and it is not under the
// REST API's 60-calls-an-hour limit, so a local build needs no token and no rebuild ever waits for a reset. A
// repository with no release redirects to its release list instead, which names no tag.
//
// A FETCH THAT FAILS FAILS THE BUILD. The workflow then deploys nothing and the site already published —
// correct as of its own run — stays up. That is better than replacing a right version with an "unknown".

export const OWNER = 'BotMakerDev';

/**
 * The tag of `repo`'s latest release, e.g. `v1.6.0`.
 *
 * @param {string} repo a repository of the organization, without the owner
 * @param {{fetch?: typeof fetch}} options
 * @returns {Promise<string>}
 */
export async function latestTag(repo, { fetch = globalThis.fetch } = {}) {
  const url = `https://github.com/${OWNER}/${repo}/releases/latest`;
  const response = await fetch(url, { method: 'HEAD', redirect: 'manual' });
  const location = response.headers.get('location') ?? '';
  const tag = /\/releases\/tag\/([^/?#]+)$/.exec(location)?.[1];
  if (!tag) throw new Error(`no latest release for ${OWNER}/${repo} (HTTP ${response.status} from ${url})`);
  return decodeURIComponent(tag);
}
