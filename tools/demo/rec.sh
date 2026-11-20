#!/usr/bin/env bash
# rec.sh <name>: place Studio's main window, grab the region under it (popups included), save frames/<name>.png.
set -euo pipefail
here=$(dirname "$(readlink -f "$0")")
mkdir -p "$here/frames"
id=$(qdbus org.kde.KWin /Scripting org.kde.kwin.Scripting.loadScript "$here/place.js" docplace)
qdbus org.kde.KWin "/Scripting/Script$id" org.kde.kwin.Script.run >/dev/null
sleep 1.5
qdbus org.kde.KWin /Scripting org.kde.kwin.Scripting.unloadScript docplace >/dev/null
spectacle -b -n -f -o "$here/full.png"
magick "$here/full.png" -crop 3360x1944+3086+96 +repage -resize 1680x972 "$here/frames/$1.png"
