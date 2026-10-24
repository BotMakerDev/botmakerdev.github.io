#!/usr/bin/env bash
# Fetches every address the built site names — links and the addresses inside its install snippets alike —
# and fails if one of them does not answer. Links inside the site are checked against the built files.
#
#   tools/check-links.sh [dist]
#
# This site is mostly links. A repository renamed, a Pages site turned off or a `.repo` file that moved
# must fail this job rather than fail a reader, which is why the snippets are checked and not only the
# <a href>s: a broken `.repo` address is a `dnf install` that 404s on a machine.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST="${1:-${HERE}/dist}"
[ -d "${DIST}" ] || { echo "::error::no built site at ${DIST} (run npm run build)" >&2; exit 1; }

mapfile -t pages < <(find "${DIST}" -name '*.html' | sort)
[ "${#pages[@]}" -gt 0 ] || { echo "::error::no pages in ${DIST}" >&2; exit 1; }

# The pages' text without the bodies of their scripts: a script builds addresses from parts
# (`https://github.com/${repo}`), which are not addresses, and the one whole address in one, the catalog's, is
# fetched by the build itself. The opening tags stay, so a script's src is still checked.
page_text() { perl -0777 -pe 's#(<script\b[^>]*>).*?</script>#$1</script>#gs' "${pages[@]}"; }

# Both forms in one sweep: href="…" and a bare address inside a <pre><code> snippet.
mapfile -t urls < <(page_text | grep -oE 'https?://[^"'"'"' <)]+' | sed 's/[.,]$//' \
  | grep -vE '^https?://(www\.)?w3\.org/' | sort -u)

# The site's own pages and files: every href or src starting with one slash.
mapfile -t locals < <(page_text | grep -oE '(href|src)="/[^/"][^"]*"|(href|src)="/"' \
  | sed -E 's/^(href|src)="//; s/"$//; s/[?#].*$//' | sort -u)

# An apt archive root is not a document: GitHub Pages serves no directory index, so `<pages>/deb`
# answers 404 while being a perfectly good `deb …` line. Check what apt itself fetches first — the
# signed index — which also proves the archive is really there and really signed.
probe_for() {
  case "$1" in
    */deb) printf '%s/dists/stable/InRelease' "$1" ;;
    *)     printf '%s' "$1" ;;
  esac
}

failed=0
for url in "${urls[@]}"; do
  probe="$(probe_for "${url}")"
  # -L because every github.com address redirects at least once, and a repository that was renamed
  # redirects too — which is a link that works, and the reason this is not a HEAD-and-expect-200.
  code="$(curl -sSL -o /dev/null -w '%{http_code}' --retry 2 --retry-delay 3 --max-time 30 "${probe}" || echo 000)"
  if [ "${code}" = "200" ]; then
    printf 'ok   %s\n' "${probe}"
  else
    printf 'FAIL %s (HTTP %s)\n' "${probe}" "${code}"
    failed=$((failed + 1))
  fi
done

for path in "${locals[@]}"; do
  file="${DIST}${path}"
  [[ "${path}" == */ ]] && file="${file}index.html"
  if [ -f "${file}" ]; then
    printf 'ok   %s\n' "${path}"
  else
    printf 'FAIL %s (no %s)\n' "${path}" "${file#"${HERE}"/}"
    failed=$((failed + 1))
  fi
done

total=$(( ${#urls[@]} + ${#locals[@]} ))
if [ "${failed}" -gt 0 ]; then
  echo "::error::${failed} of ${total} addresses on the site do not answer"
  exit 1
fi
echo "${total} addresses, all answering"
