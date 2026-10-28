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

const dnfRepoLine = (pages, { repo, package: name }) =>
  `sudo curl -fsSL -o /etc/yum.repos.d/${name}.repo ${pages}/${repo}/${name}.repo`;
const aptKeyLines = (pages, { repo }) =>
  ['sudo install -d -m 755 /etc/apt/keyrings', `sudo curl -fsSL -o ${KEYRING} ${pages}/${repo}/botmaker.asc`];
const aptSourceLine = (pages, { repo, package: name }) =>
  `echo "deb [signed-by=${KEYRING}] ${pages}/${repo}/deb stable main" | sudo tee /etc/apt/sources.list.d/${name}.list`;

/**
 * The packaged tools a tool's package requires (tools.json `requires`, by repository), whose repositories its
 * snippets add too: Studio's package requires `botmaker`, which only botmaker-cli's repository serves, so a
 * snippet adding Studio's repository alone ends in "nothing provides botmaker".
 */
export function requiredTools(tool, tools) {
  return (tool.requires ?? []).map((repo) => {
    const required = tools.find((t) => t.repo === repo);
    if (!required?.package) throw new Error(`${tool.repo} requires ${repo}, which tools.json lists with no package`);
    return required;
  });
}

/** Adds a tool's dnf repository, and those of the tools it requires, then installs its package. */
export function dnfSnippet({ pages = PAGES, repo, package: name }, requires = []) {
  return [
    ...[{ repo, package: name }, ...requires].map((t) => dnfRepoLine(pages, t)),
    `sudo dnf install ${name}`,
  ].join('\n');
}

/** Adds the signing key and a tool's apt repository, and those of the tools it requires, then installs its package. */
export function aptSnippet({ pages = PAGES, repo, package: name }, requires = []) {
  return [
    ...aptKeyLines(pages, { repo }),
    ...[{ repo, package: name }, ...requires].map((t) => aptSourceLine(pages, t)),
    `sudo apt-get update && sudo apt-get install ${name}`,
  ].join('\n');
}

/**
 * Runs a tool's own installer (tools.json `installer`), served by its Pages site at `<pages>/<repo>/install.sh`:
 * it adds every repository the package needs for dnf or apt, then installs; run again, it upgrades.
 */
export function installerSnippet({ pages = PAGES, repo }) {
  return `curl -fsSL ${pages}/${repo}/install.sh | sudo bash`;
}

/** Installs a tool's Arch User Repository package (tools.json `aur`) with an AUR helper. */
export function aurSnippet({ aur }) {
  if (!aur) throw new Error('no AUR package named');
  return `yay -S ${aur}`;
}

/** Downloads a release asset of the latest release. */
export function downloadSnippet({ repo, asset }) {
  return `curl -fLO https://github.com/${OWNER}/${repo}/releases/latest/download/${asset}`;
}

/**
 * The address of the file a tool's release attaches for one system (tools.json `downloads`), at the version the
 * build read. The tagged address, not `latest/download`: the file's name carries the version, so the two must
 * come from the same release.
 *
 * @returns {{name: string, url: string}}
 */
export function download({ repo, version, downloads }, system) {
  const pattern = downloads?.[system];
  if (!pattern) throw new Error(`tools.json names no ${system} download for ${repo}`);
  if (!version) throw new Error(`no version read for ${repo}`);
  const name = pattern.replaceAll('{version}', version);
  return { name, url: `https://github.com/${OWNER}/${repo}/releases/download/${encodeURIComponent(version)}/${name}` };
}

/** Downloads an AppImage, makes it runnable and starts it. */
export function appImageSnippet({ name, url }) {
  return `curl -fLO ${url}\nchmod +x ${name}\n./${name}`;
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
    ...packaged.map((t) => dnfRepoLine(pages, t)),
    `sudo dnf install ${names.join(' ')}`,
  ];
  const apt = [
    ...aptKeyLines(pages, packaged[0]),
    ...packaged.map((t) => aptSourceLine(pages, t)),
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
