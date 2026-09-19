#!/usr/bin/env bash
# Fetches every address the generated page names — links and the addresses inside its install
# snippets alike — and fails if one of them does not answer.
#
#   tools/check-links.sh [index.html]
#
# This page is nothing but links. A repository renamed, a Pages site turned off or a `.repo` file
# that moved must fail this job rather than fail a reader, which is why the snippets are checked and
# not only the <a href>s: a broken `.repo` address is a `dnf install` that 404s on a machine.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PAGE="${1:-${HERE}/index.html}"
[ -f "${PAGE}" ] || { echo "::error::no page at ${PAGE}" >&2; exit 1; }

# Both forms in one sweep: href="…" and a bare address inside a <pre><code> snippet.
mapfile -t urls < <(grep -oE 'https?://[^"'"'"' <)]+' "${PAGE}" | sed 's/[.,]$//' | sort -u)
[ "${#urls[@]}" -gt 0 ] || { echo "::error::no links found in ${PAGE}" >&2; exit 1; }

failed=0
for url in "${urls[@]}"; do
  # -L because every github.com address redirects at least once, and a repository that was renamed
  # redirects too — which is a link that works, and the reason this is not a HEAD-and-expect-200.
  code="$(curl -sSL -o /dev/null -w '%{http_code}' --retry 2 --retry-delay 3 --max-time 30 "${url}" || echo 000)"
  if [ "${code}" = "200" ]; then
    printf 'ok   %s\n' "${url}"
  else
    printf 'FAIL %s (HTTP %s)\n' "${url}" "${code}"
    failed=$((failed + 1))
  fi
done

if [ "${failed}" -gt 0 ]; then
  echo "::error::${failed} of ${#urls[@]} addresses on the page do not answer"
  exit 1
fi
echo "${#urls[@]} addresses, all answering"
