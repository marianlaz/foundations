"""Cut a trailer from rendered episodes: an intro card, a clip from each episode, an outro card, joined with cross-fades
(picture and sound). Every input is an mp4 with an audio track, rendered at the same size and fps.

  python3 trailer.py <out.mp4> <intro.mp4> <clip> [<clip> …] <outro.mp4> [--fade 0.6]
  <clip> = <episode dir>@<when>+<seconds>   e.g. eps/01-mascaras@light+0.3+4.5
<when> is seconds or a voice line id with an optional offset, read from the episode's voice.json (as in sound.py)."""
import json, pathlib, re, subprocess, sys


def dur(f):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).decode())


def clip(spec):
    d, rest = spec.rsplit("@", 1)
    m = re.fullmatch(r"([\w-]+|[\d.]+)([+-][\d.]+)?\+([\d.]+)", rest)
    if not m: raise SystemExit(f"clip {spec!r}: expected <dir>@<when>+<seconds>")
    when, off, length = m.group(1), float(m.group(2) or 0), float(m.group(3))
    if re.fullmatch(r"[\d.]+", when): start = float(when)
    else:
        lines = {l["id"]: l for l in json.loads((pathlib.Path(d) / "voice.json").read_text())["lines"]}
        start = lines[when]["start"]
    return str(pathlib.Path(d) / "episode.mp4"), start + off, length


def main():
    args, fade = [a for a in sys.argv[1:] if not a.startswith("--")], 0.6
    if "--fade" in sys.argv: fade = float(sys.argv[sys.argv.index("--fade") + 1]); args.remove(str(sys.argv[sys.argv.index("--fade") + 1]))
    out, intro, outro, clips = args[0], args[1], args[-1], [clip(c) for c in args[2:-1]]
    parts = [(intro, 0, dur(intro))] + clips + [(outro, 0, dur(outro))]
    cmd, fv, fa = ["ffmpeg", "-v", "error", "-y"], [], []
    for i, (f, s, l) in enumerate(parts):
        cmd += ["-ss", f"{s:.3f}", "-t", f"{l:.3f}", "-i", f]
        fv.append(f"[{i}:v]settb=AVTB,setpts=PTS-STARTPTS,fps=30[v{i}]"); fa.append(f"[{i}:a]asetpts=PTS-STARTPTS,aresample=44100[a{i}]")
    v, a, t = "v0", "a0", parts[0][2]
    for i in range(1, len(parts)):
        t -= fade
        fv.append(f"[{v}][v{i}]xfade=transition=fade:duration={fade}:offset={t:.3f}[x{i}]"); v = f"x{i}"
        fa.append(f"[{a}][a{i}]acrossfade=d={fade}[y{i}]"); a = f"y{i}"
        t += parts[i][2]
    cmd += ["-filter_complex", ";".join(fv + fa), "-map", f"[{v}]", "-map", f"[{a}]",
            "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-preset", "medium", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", out]
    subprocess.run(cmd, check=True)
    print(f"{out}  {dur(out):.1f}s  ({len(clips)} clips)")


if __name__ == "__main__":
    main()
