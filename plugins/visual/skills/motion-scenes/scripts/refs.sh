#!/bin/zsh
# Download the videos behind X/Twitter posts (via api.fxtwitter.com) and make a 16-frame contact sheet of each.
# usage: refs.sh <out-dir> <x.com url> [url ...]   → <out-dir>/ref<N>.mp4, sheet<N>.jpg, ref<N>.txt (post text)
# Skips videos over 150 MB (MAXMB=...) — take the thumbnail instead. Needs curl, python3, ffmpeg.
set -e
OUT=${1:a}; shift; mkdir -p $OUT; n=0; MAXMB=${MAXMB:-150}
for u in "$@"; do n=$((n+1)); p=$(echo $u | sed -E 's#https?://(x|twitter)\.com/##; s#\?.*##')
  j=$(curl -s "https://api.fxtwitter.com/$p")
  echo $j | python3 -c "import json,sys;d=json.load(sys.stdin)['tweet'];print(d.get('author',{}).get('screen_name'),'—',d.get('text'))" > $OUT/ref$n.txt || true
  v=$(echo $j | python3 -c "import json,sys;m=(json.load(sys.stdin)['tweet'].get('media') or {}).get('videos') or [];print(m[0]['url'] if m else '')")
  th=$(echo $j | python3 -c "import json,sys;m=(json.load(sys.stdin)['tweet'].get('media') or {}).get('videos') or [];print(m[0].get('thumbnail_url','') if m else '')")
  [[ -z $v ]] && { echo "ref$n: no video"; continue; }
  sz=$(curl -sIL "$v" | awk 'tolower($1)=="content-length:"{s=$2} END{print s+0}')
  if (( sz > MAXMB*1024*1024 )); then curl -sL -o $OUT/ref$n.jpg "$th"; echo "ref$n: $((sz/1048576)) MB, thumbnail only"; continue; fi
  curl -sL -o $OUT/ref$n.mp4 "$v"
  d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 $OUT/ref$n.mp4)
  ffmpeg -v error -y -i $OUT/ref$n.mp4 -vf "fps=$(python3 -c "print(16/$d)"),scale=480:-1,tile=4x4" -frames:v 1 $OUT/sheet$n.jpg
  echo "ref$n: ${d%.*}s → $OUT/sheet$n.jpg"
done
