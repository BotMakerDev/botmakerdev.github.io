#!/usr/bin/env bash
# video.sh: frames/*.png (in name order) -> out/blocks-demo.{webm,mp4} + poster, each frame held HOLD s, FADE s crossfades.
set -euo pipefail
here=$(dirname "$(readlink -f "$0")")
cd "$here"
HOLD=${HOLD:-3}; FADE=${FADE:-0.5}; W=1280; H=740
mkdir -p out
frames=(frames/*.png)
n=${#frames[@]}
inputs=(); filter=""
for i in "${!frames[@]}"; do
  inputs+=(-loop 1 -t "$HOLD" -framerate 30 -i "${frames[$i]}")
  filter+="[$i:v]scale=${W}:${H}:flags=lanczos,format=yuv420p,setsar=1[v$i];"
done
prev="v0"; offset=0
for ((i = 1; i < n; i++)); do
  offset=$(echo "$offset + $HOLD - $FADE" | bc)
  filter+="[$prev][v$i]xfade=transition=fade:duration=$FADE:offset=$offset[x$i];"
  prev="x$i"
done
filter=${filter%;}
ffmpeg -y -loglevel error "${inputs[@]}" -filter_complex "$filter" -map "[$prev]" -r 30 \
  -c:v libvpx-vp9 -b:v 0 -crf 36 -row-mt 1 -an out/blocks-demo.webm
ffmpeg -y -loglevel error "${inputs[@]}" -filter_complex "$filter" -map "[$prev]" -r 30 \
  -c:v libx264 -crf 26 -preset slow -pix_fmt yuv420p -movflags +faststart -an out/blocks-demo.mp4
magick "${frames[$((n - 1))]}" -resize ${W}x${H} -quality 85 out/blocks-demo-poster.webp
ls -la out
