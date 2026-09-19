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
# The install snippets are derived, not copied: every repository's build-repo.sh publishes its
# `.repo` file at `<pages>/<package>.repo`, so the one-liner here is that address plus `dnf install`.
# Anything longer (the apt three-liner, the signing key, the checksums) stays on the project's own
# page, which this one links to; a snippet repeated in two places is a snippet that will disagree.
set -euo pipefail

OWNER="${OWNER:-BotMakerDev}"
PAGES="${PAGES:-https://botmakerdev.github.io}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="${1:-${HERE}/index.html}"
CATALOG="${HERE}/catalog.json"

command -v jq >/dev/null || { echo "::error::jq is required" >&2; exit 1; }
command -v gh >/dev/null || { echo "::error::gh is required" >&2; exit 1; }

version_of() {
  local repo="$1" tag
  tag="$(gh api "repos/${OWNER}/${repo}/releases/latest" --jq .tag_name)" || {
    echo "::error::no latest release for ${OWNER}/${repo}" >&2
    return 1
  }
  [ -n "${tag}" ] || { echo "::error::empty tag for ${OWNER}/${repo}" >&2; return 1; }
  printf '%s' "${tag}"
}

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

  echo "<article>"
  echo "<h3>${name}</h3>"
  echo "<p class=\"blurb\">${blurb}</p>"

  # A version is shown for what you download, and only for that: the data repositories publish by
  # merging to main and cut no release, so asking GitHub for their latest is a guaranteed 404.
  if [ -n "${package}${asset}" ]; then
    version="$(version_of "${repo}")" || return 1
    echo "<p class=\"version\">Latest release <strong>${version}</strong></p>"
  fi

  if [ -n "${package}" ]; then
    echo "<pre><code>sudo curl -fsSL -o /etc/yum.repos.d/${package}.repo ${pages_url}/${package}.repo"
    echo "sudo dnf install ${package}</code></pre>"
    echo "<p class=\"note\">apt, the signing key and the checksums are on the project page.</p>"
  elif [ -n "${asset}" ]; then
    echo "<pre><code>curl -fLO https://github.com/${OWNER}/${repo}/releases/latest/download/${asset}</code></pre>"
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

BODY_INSTALL="$(section install)"
BODY_PUBLISH="$(section publish)"
BUILT="$(date -u '+%Y-%m-%d %H:%M UTC')"

cat > "${OUT}" <<EOF
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>BotMaker — downloads</title>
<meta name="description" content="Every BotMaker tool, its newest version and how to install it.">
<link rel="stylesheet" href="assets/style.css">
</head>
<body>
<header>
<h1>BotMaker</h1>
<p class="sub">Build a bot out of blocks, run it against an emulator or a window, publish it.
Everything below is one project; take the pieces you need.</p>
</header>

<main>
<h2>Install</h2>
${BODY_INSTALL}

<h2>What is published</h2>
<p class="sub">Read by the tools above rather than installed.</p>
${BODY_PUBLISH}
</main>

<footer>
<p>Linux packages are an upgrade channel carrying the latest release only; every older version stays
downloadable from its Releases page. The desktop applications need a Java 25 runtime, which their
installers bring.</p>
<p>Versions on this page are fetched from GitHub, not typed. Generated ${BUILT} —
<a href="https://github.com/${OWNER}/botmakerdev.github.io">source of this page</a>.</p>
</footer>
</body>
</html>
EOF

echo "Wrote ${OUT} ($(wc -c <"${OUT}") bytes)"
