#!/usr/bin/env bash
# shot.sh <out.png> [title-prefix]: raise the window whose title starts with the prefix (BotMaker), keep it at
# 1600x960, and capture it without decoration or shadow, so no title bar (and no home path) shows.
set -euo pipefail
here=$(dirname "$(readlink -f "$0")")
prefix=${2:-BotMaker}
# $3: size (1600x960, the default), keep, or WxH
size=${3:-size}
w=1600; h=960
if [[ $size =~ ^([0-9]+)x([0-9]+)$ ]]; then w=${BASH_REMATCH[1]}; h=${BASH_REMATCH[2]}; size=size; fi
js=$(mktemp "${TMPDIR:-/tmp}/raise-XXXX.js")
trap 'rm -f "$js"' EXIT
# The prefix goes into the script as a JSON string, so a quote in a title cannot break it.
quoted=$(jq -Rn --arg p "$prefix" '$p')
cat > "$js" <<EOF
for (const w of workspace.windowList()) {
  if (w.caption.startsWith($quoted)) {
    if ("$size" === "size") {
      w.setMaximize(false, false);
      w.frameGeometry = {x: 100, y: 60, width: $w, height: $h};
    }
    workspace.activeWindow = w;
  }
}
EOF
id=$(qdbus org.kde.KWin /Scripting org.kde.kwin.Scripting.loadScript "$js" docshot)
qdbus org.kde.KWin "/Scripting/Script$id" org.kde.kwin.Script.run >/dev/null
sleep 1.2
qdbus org.kde.KWin /Scripting org.kde.kwin.Scripting.unloadScript docshot >/dev/null
spectacle -b -n -a -e -S -o "$1"
