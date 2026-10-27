#!/usr/bin/env bash
# Extrae N frames candidatos de un video y arma una hoja numerada para elegir mirando.
# uso: candidates.sh <carpeta-episodio|video.mp4> <outdir> [N=16]
#   - si le pasás una carpeta, usa episode-16x9.mp4 si existe (mejor para recortar a 16:9), si no episode.mp4
#   - deja <outdir>/NN.jpg (resolución completa), <outdir>/times.txt (NN segundo) y <outdir>/sheet.jpg (4 columnas, numerados por posición, de izq. a der. y de arriba a abajo, desde 01)
set -euo pipefail
src="$1"; out="$2"; n="${3:-16}"
if [ -d "$src" ]; then
  if [ -f "$src/episode-16x9.mp4" ]; then src="$src/episode-16x9.mp4"; else src="$src/episode.mp4"; fi
fi
[ -f "$src" ] || { echo "no encuentro el video: $src" >&2; exit 1; }
mkdir -p "$out"; rm -f "$out"/[0-9][0-9].jpg "$out/times.txt"
dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$src")
# del 5% al 97%: el arranque suele ser negro/fade y el final es el poster con texto quemado
for i in $(seq 1 "$n"); do
  t=$(awk -v d="$dur" -v i="$i" -v n="$n" 'BEGIN{printf "%.2f", d*(0.05+0.92*(i-1)/(n-1))}')
  f=$(printf "%02d" "$i")
  ffmpeg -v error -y -ss "$t" -i "$src" -frames:v 1 -q:v 2 "$out/$f.jpg"
  echo "$f $t" >> "$out/times.txt"
done
cols=4; rows=$(( (n + cols - 1) / cols ))
ffmpeg -v error -y -framerate 1 -i "$out/%02d.jpg" -vf "scale=360:-2,tile=${cols}x${rows}:padding=8:margin=8:color=0x333333" -frames:v 1 -q:v 3 "$out/sheet.jpg"
echo "$src  ($dur s)  ->  $out/sheet.jpg"
cat "$out/times.txt" | tr '\n' ' '; echo
