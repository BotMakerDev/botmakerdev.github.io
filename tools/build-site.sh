#!/usr/bin/env bash
# Writes index.html from catalog.json plus the newest release of each repository it names.
#
#   tools/build-site.sh [output-file]        # default: index.html beside this repository's root
#
# EVERY VERSION IS FETCHED, NONE IS TYPED. `gh api repos/<owner>/<repo>/releases/latest` is the one
# source; a version written into HTML is wrong the day after the next release, and being right about
# versions is the only job this page has that the per-repository sites do not already do.
#
# A FETCH THAT FAILS FAILS THE BUILD. The workflow then deploys nothing and the page that is already
# published — correct as of its own run — stays up. That is better than replacing a right version with
# an "unknown" because GitHub rate-limited a cron job.
#
# THE SNIPPETS ARE DERIVED, NOT COPIED. Every repository's build-repo.sh publishes its `.repo` file at
# `<pages>/<package>.repo`, its apt archive at `<pages>/deb` and its signing key at
# `<pages>/botmaker.asc`, so every address here is computed from a repository name. Nothing on this
# page is a snippet transcribed from somewhere else, because two copies of a snippet are two copies
# that will disagree.
set -euo pipefail

OWNER="${OWNER:-BotMakerDev}"
PAGES="${PAGES:-https://botmakerdev.github.io}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="${1:-${HERE}/index.html}"
CATALOG="${HERE}/catalog.json"

command -v jq >/dev/null || { echo "::error::jq is required" >&2; exit 1; }
command -v gh >/dev/null || { echo "::error::gh is required" >&2; exit 1; }
command -v curl >/dev/null || { echo "::error::curl is required" >&2; exit 1; }

version_of() {
  local repo="$1" tag
  tag="$(gh api "repos/${OWNER}/${repo}/releases/latest" --jq .tag_name)" || {
    echo "::error::no latest release for ${OWNER}/${repo}" >&2
    return 1
  }
  [ -n "${tag}" ] || { echo "::error::empty tag for ${OWNER}/${repo}" >&2; return 1; }
  printf '%s' "${tag}"
}

# Every packaged repository is signed by the organization's one key, so the install-everything block
# fetches a single keyring and points four sources.list entries at it. That is a claim about four
# other repositories, so it is checked here rather than believed: if a project ever publishes under a
# different key, this fails the build instead of handing a reader an apt line that cannot verify.
assert_one_signing_key() {
  local repo digest first="" first_repo=""
  for repo in "$@"; do
    digest="$(curl -fsSL "${PAGES}/${repo}/botmaker.asc" | sha256sum | cut -d' ' -f1)" || {
      echo "::error::${repo} publishes no signing key at ${PAGES}/${repo}/botmaker.asc" >&2
      return 1
    }
    if [ -z "${first}" ]; then
      first="${digest}"
      first_repo="${repo}"
    elif [ "${digest}" != "${first}" ]; then
      echo "::error::${repo} is signed by a different key than ${first_repo} — the one-keyring apt block below would be wrong" >&2
      return 1
    fi
  done
}

# --- the install-everything card ------------------------------------------------------------------
# One block per package manager, both derived from the same list: the catalog entries that name a
# package. A tool added to the catalog joins these snippets by existing.
all_in_one() {
  local repos=() packages=() repo package dnf="" apt="" names
  while IFS=$'\t' read -r repo package; do
    repos+=("${repo}")
    packages+=("${package}")
  done < <(jq -r '.tools[] | select(.package) | [.repo, .package] | @tsv' "${CATALOG}")

  [ "${#repos[@]}" -gt 0 ] || { echo "::error::no packaged tool in the catalog" >&2; return 1; }
  assert_one_signing_key "${repos[@]}" || return 1
  names="${packages[*]}"

  local i
  for i in "${!repos[@]}"; do
    dnf+="sudo curl -fsSL -o /etc/yum.repos.d/${packages[i]}.repo ${PAGES}/${repos[i]}/${packages[i]}.repo"$'\n'
  done
  dnf+="sudo dnf install ${names}"

  apt+="sudo install -d -m 755 /etc/apt/keyrings"$'\n'
  apt+="sudo curl -fsSL -o /etc/apt/keyrings/botmaker.asc ${PAGES}/${repos[0]}/botmaker.asc"$'\n'
  for i in "${!repos[@]}"; do
    apt+="echo \"deb [signed-by=/etc/apt/keyrings/botmaker.asc] ${PAGES}/${repos[i]}/deb stable main\" | sudo tee /etc/apt/sources.list.d/${packages[i]}.list"$'\n'
  done
  # &amp; because this lands inside <code>; the reader copies two ampersands either way.
  apt+="sudo apt-get update &amp;&amp; sudo apt-get install ${names}"

  cat <<EOF
<article class="card wide">
<h3>Everything, in one go</h3>
<p class="blurb">Adds every BotMaker repository, then installs the ${#repos[@]} packaged tools. Drop
any name from the last line to leave that one out. One key signs all of them, so apt needs one
keyring.</p>
<div class="two">
<div>
<h4>Fedora · RHEL</h4>
<div class="snippet"><pre><code>${dnf}</code></pre></div>
</div>
<div>
<h4>Debian · Ubuntu</h4>
<div class="snippet"><pre><code>${apt}</code></pre></div>
</div>
</div>
<p class="note"><strong>Upgrading is your package manager's job from here.</strong> Every tool arrives
with the rest of your system updates — <code>sudo dnf upgrade</code> or <code>sudo apt-get update
&amp;&amp; sudo apt-get upgrade</code>. To move only these: <code>sudo dnf upgrade ${names}</code>,
<code>sudo apt-get install --only-upgrade ${names}</code>.</p>
<p class="note">These are upgrade channels carrying the latest release only. The Android apps are not
here: a phone installs its own way, below.</p>
</article>
EOF
}

# --- one card per tool ----------------------------------------------------------------------------
card() {
  local repo name blurb package asset also site version pages_url
  repo="$(jq -r '.repo' <<<"$1")"
  name="$(jq -r '.name' <<<"$1")"
  blurb="$(jq -r '.blurb' <<<"$1")"
  package="$(jq -r '.package // empty' <<<"$1")"
  asset="$(jq -r '.asset // empty' <<<"$1")"
  also="$(jq -r '.also // empty' <<<"$1")"
  site="$(jq -r 'if .site == false then "no" else "yes" end' <<<"$1")"
  pages_url="${PAGES}/${repo}"

  echo "<article class=\"card\">"
  echo "<h3>${name}</h3>"

  # A version is shown for what you download, and only for that: the data repositories publish by
  # merging to main and cut no release, so asking GitHub for their latest is a guaranteed 404.
  if [ -n "${package}${asset}" ]; then
    version="$(version_of "${repo}")" || return 1
    echo "<p class=\"version\">${version}</p>"
  fi

  echo "<p class=\"blurb\">${blurb}</p>"

  if [ -n "${package}" ]; then
    echo "<div class=\"snippet\"><pre><code>sudo curl -fsSL -o /etc/yum.repos.d/${package}.repo ${pages_url}/${package}.repo"
    echo "sudo dnf install ${package}</code></pre></div>"
    echo "<p class=\"note\">apt, the signing key and the checksums are on the project page.</p>"
  elif [ -n "${asset}" ]; then
    echo "<div class=\"snippet\"><pre><code>curl -fLO https://github.com/${OWNER}/${repo}/releases/latest/download/${asset}</code></pre></div>"
  fi

  if [ -n "${also}" ]; then
    echo "<p class=\"note\">${also}</p>"
  fi

  echo "<p class=\"links\">"
  if [ "${site}" = "yes" ]; then
    echo "<a href=\"${pages_url}/\">Project page</a>"
  fi
  echo "<a href=\"https://github.com/${OWNER}/${repo}/releases\">Releases</a>"
  echo "<a href=\"https://github.com/${OWNER}/${repo}\">Source</a>"
  echo "</p>"
  echo "</article>"
}

section() {
  local which="$1" entry
  while IFS= read -r entry; do
    card "${entry}"
  done < <(jq -c --arg s "${which}" '.tools[] | select(.section == $s)' "${CATALOG}")
}

ALL_IN_ONE="$(all_in_one)"
BODY_INSTALL="$(section install)"
BODY_PUBLISH="$(section publish)"
BUILT="$(date -u '+%Y-%m-%d %H:%M UTC')"

cat > "${OUT}" <<EOF
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>BotMaker — build a bot out of blocks</title>
<meta name="description" content="Every BotMaker tool, its newest version, and one command that installs all of them.">
<link rel="stylesheet" href="assets/style.css">
</head>
<body>
<header class="hero">
<div class="inner">
<h1>BotMaker</h1>
<p class="tagline">Build a bot out of blocks, run it against an emulator or a window, publish it.
Everything below is one project — take the pieces you need.</p>
<p class="actions">
<a class="button primary" href="#install">Install everything</a>
<a class="button" href="${PAGES}/botmaker-studio/">Get Studio</a>
<a class="button" href="https://github.com/${OWNER}">Source on GitHub</a>
</p>
</div>
</header>

<main>
<h2 id="install">Install</h2>
<p class="sub">Linux packages come from repositories this project publishes, so every later version
arrives with the rest of your system updates.</p>
<div class="grid">
${ALL_IN_ONE}
${BODY_INSTALL}
</div>

<h2 id="published">What is published</h2>
<p class="sub">Read by the tools above rather than installed.</p>
<div class="grid">
${BODY_PUBLISH}
</div>
</main>

<footer>
<p>The desktop applications need a Java 25 runtime, which their installers bring. Every older version
stays downloadable from its Releases page; the repositories carry the latest release only.</p>
<p>Versions on this page are fetched from GitHub, not typed. Generated ${BUILT} —
<a href="https://github.com/${OWNER}/botmakerdev.github.io">source of this page</a>.</p>
</footer>
<script src="assets/copy.js" defer></script>
</body>
</html>
EOF

echo "Wrote ${OUT} ($(wc -c <"${OUT}") bytes)"
