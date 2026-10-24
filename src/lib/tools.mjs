// The install snippets, from src/data/tools.json and the addresses every project page publishes.
//
// THE SNIPPETS ARE DERIVED, NOT COPIED. Every repository's build-repo.sh publishes its `.repo` file at
// `<pages>/<repo>/<package>.repo`, its apt archive at `<pages>/<repo>/deb` and its signing key at
// `<pages>/<repo>/botmaker.asc`, so every address here is computed from a repository name. Nothing on the site
// is a snippet transcribed from somewhere else, because two copies of a snippet are two copies that will
// disagree.

import { createHash } from 'node:crypto';
import { OWNER } from './versions.mjs';

export const PAGES = 'https://botmakerdev.github.io';

const KEYRING = '/etc/apt/keyrings/botmaker.asc';

/** Adds a tool's dnf repository and installs its package. */
export function dnfSnippet({ pages = PAGES, repo, package: name }) {
  return `sudo curl -fsSL -o /etc/yum.repos.d/${name}.repo ${pages}/${repo}/${name}.repo\nsudo dnf install ${name}`;
}

/** Downloads a release asset of the latest release. */
export function downloadSnippet({ repo, asset }) {
  return `curl -fLO https://github.com/${OWNER}/${repo}/releases/latest/download/${asset}`;
}

/**
 * The install-everything block, one snippet per package manager, both from the same list: the tools that name a
 * package. A tool added to tools.json joins these snippets by existing.
 *
 * @returns {{dnf: string, apt: string, names: string[]}}
 */
export function allInOne(tools, { pages = PAGES } = {}) {
  const packaged = tools.filter((t) => t.package);
  if (packaged.length === 0) throw new Error('no packaged tool in tools.json');
  const names = packaged.map((t) => t.package);
  const dnf = [
    ...packaged.map((t) => `sudo curl -fsSL -o /etc/yum.repos.d/${t.package}.repo ${pages}/${t.repo}/${t.package}.repo`),
    `sudo dnf install ${names.join(' ')}`,
  ];
  const apt = [
    'sudo install -d -m 755 /etc/apt/keyrings',
    `sudo curl -fsSL -o ${KEYRING} ${pages}/${packaged[0].repo}/botmaker.asc`,
    ...packaged.map((t) =>
      `echo "deb [signed-by=${KEYRING}] ${pages}/${t.repo}/deb stable main" | sudo tee /etc/apt/sources.list.d/${t.package}.list`),
    `sudo apt-get update && sudo apt-get install ${names.join(' ')}`,
  ];
  return { dnf: dnf.join('\n'), apt: apt.join('\n'), names };
}

/**
 * Every packaged repository is signed by the organization's one key, so the install-everything block fetches a
 * single keyring and points every sources.list entry at it. That is a claim about other repositories, so it is
 * checked rather than believed: if a project ever publishes under a different key, this fails the build instead
 * of handing a reader an apt line that cannot verify.
 */
export async function assertOneSigningKey(repos, { fetch = globalThis.fetch, pages = PAGES } = {}) {
  let first;
  for (const repo of repos) {
    const url = `${pages}/${repo}/botmaker.asc`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${repo} publishes no signing key at ${url} (HTTP ${response.status})`);
    const digest = createHash('sha256').update(Buffer.from(await response.arrayBuffer())).digest('hex');
    if (!first) first = { repo, digest };
    else if (digest !== first.digest) {
      throw new Error(`${repo} is signed by a different key than ${first.repo}: the one-keyring apt block would be wrong`);
    }
  }
}

/** tools.json's text with `backticks` as code; the page renders both as text, never as HTML. */
export function withCode(line) {
  return line
    .split('`')
    .map((text, i) => ({ code: i % 2 === 1, text }))
    .filter((part) => part.text !== '');
}
