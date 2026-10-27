#!/bin/zsh
# Render frames of one scene with headless Chrome and tile them into a contact sheet.
# usage: shoot.sh <scenes.js> <scene> <t1> [t2 ...]  [OUT=dir] [ENGINE=path]
# → $OUT/sheet_<scene>.jpg (read it to check the frames). Needs Google Chrome + ffmpeg.
set -e
H=${0:a:h}; SC=${1:a}; NAME=$2; shift 2
OUT=${OUT:-${TMPDIR:-/tmp}/motion-scenes}; ENGINE=${ENGINE:-$H/../assets/engine.js}; ENGINE=${ENGINE:a}
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
mkdir -p $OUT/prof
cat > $OUT/one.html <<HTML
<!doctype html><html><head><meta charset=utf-8>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap">
<style>body{margin:0;background:#000}canvas{width:1600px;height:1000px;display:block}</style></head><body>
<canvas id=c></canvas><script>document.getElementById('c').dataset.kx=new URLSearchParams(location.search).get('s')</script>
<script src="file://$ENGINE"></script><script src="file://$SC"></script></body></html>
HTML
i=0
for t in "$@"; do i=$((i+1)); f=$OUT/${NAME}_$(printf %02d $i).png; rm -f $f
  # Chrome writes the png and then lingers: wait for the file, then kill it. Runs are sequential (shared profile).
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --user-data-dir=$OUT/prof --allow-file-access-from-files \
    --screenshot=$f --window-size=1600,1000 --virtual-time-budget=3000 "file://$OUT/one.html?s=$NAME&kxt=$t" >/dev/null 2>&1 &
  pid=$!; for k in {1..100}; do [[ -s $f ]] && break; sleep .3; done; sleep .3; kill $pid 2>/dev/null || true; wait $pid 2>/dev/null || true
done
ffmpeg -v error -y -pattern_type glob -i "$OUT/${NAME}_*.png" -vf "scale=800:-1,tile=2x$(( (i+1)/2 ))" -frames:v 1 $OUT/sheet_$NAME.jpg
rm -f $OUT/${NAME}_*.png; echo $OUT/sheet_$NAME.jpg
