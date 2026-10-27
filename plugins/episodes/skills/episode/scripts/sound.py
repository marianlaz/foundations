"""Sound for an episode, synthesized (no samples, no API): an ambient bed plus cues keyed to the voice clock → sound.wav.
render.mjs muxes sound.wav into the mp4 (mixed with voice.mp3 when both exist).

  python3 sound.py <episode dir>

<episode>/sound.json:
  {"bed": {"chords": [[<when>, [hz, …]], …], "gain": .22, "tremolo": .08},
   "tail": 3.4,  (seconds after the last line: match scenes.js)
   "cues": [{"at": <when>, "kind": "chime"|"tick"|"wind"|"thump"|"glide"|"swell"|"breath", …params}]}
<when> is seconds, "id" (a voice line's start), "id+1.2", "end:id" (a line's end), "close" (after the last line) or "end".
Kinds: chime {hz, gain, decay} · tick {dur, rate (per s) or rates [[t, rate]…], gain} · wind {dur, gain, bright} ·
thump {hz, gain} · glide {hz, to, dur, gain} · swell {dur, gain} · breath {dur, gain} (a soft noise in/out).
Pure Python (array + wave), mono at 32 kHz duplicated to stereo: a minute renders in a few seconds."""
import array, json, math, pathlib, random, re, sys, wave

SR = 32000
TAU = 2 * math.pi
SIN = [math.sin(TAU * i / 4096) for i in range(4096)]


def when(v, lines, last_end, dur):
    if isinstance(v, (int, float)): return float(v)
    m = re.fullmatch(r"(end:)?([\w-]+)([+-][\d.]+)?", v.strip())
    if not m: raise SystemExit(f"sound.json: can't read time {v!r}")
    end, key, off = m.group(1), m.group(2), float(m.group(3) or 0)
    if key == "close": return last_end + 1.4 + off
    if key == "end" and not end: return dur + off
    if key not in lines: raise SystemExit(f"sound.json: no voice line {key!r}")
    return (lines[key]["end"] if end else lines[key]["start"]) + off


def osc(buf, start, n, hz, amp, env=None, phase=0.0):
    inc, p = hz * 4096 / SR, phase * 4096
    for i in range(max(0, -start), min(n, len(buf) - start)):
        a = amp * (env(i / SR) if env else 1)
        buf[start + i] += a * SIN[int(p + inc * i) & 4095]


def noise(buf, start, n, amp_fn, cutoff_fn, seed=1):
    r, y = random.Random(seed), 0.0
    for i in range(max(0, -start), min(n, len(buf) - start)):
        s = i / SR; k = min(1, TAU * cutoff_fn(s) / SR)
        y += k * (r.uniform(-1, 1) - y)
        buf[start + i] += amp_fn(s) * y


def bed(buf, cfg, dur):
    chords, g, trem = cfg.get("chords", []), cfg.get("gain", .22), cfg.get("tremolo", .08)
    xf = 2.5                                                             # chords cross-fade over 2.5 s
    for j, (t0, freqs) in enumerate(chords):
        t1 = chords[j + 1][0] if j + 1 < len(chords) else dur
        a, b = max(0, t0 - (xf if j else 0)), min(dur, t1 + xf)
        n = int((b - a) * SR)
        def env(s, a=a, b=b, j=j, last=j + 1 == len(chords)):
            t = a + s
            fin = min(1, (t - a) / (xf if j else 3.5))
            fout = 1 if last and t < dur - 3 else max(0, min(1, (b - t) / xf)) if not last else max(0, (dur - t) / 3)
            return fin * fout * (1 - trem + trem * math.sin(TAU * .11 * t + j))
        for k, f in enumerate(freqs):
            amp = g / len(freqs) / (1 + .35 * k)
            osc(buf, int(a * SR), n, f, amp, env)
            osc(buf, int(a * SR), n, f * 1.0035, amp * .6, env, .3)      # a detuned twin: the pad breathes


def cue(buf, c, t):
    k, at = c["kind"], int(t * SR)
    if k == "chime":
        hz, g, dec = c.get("hz", 880), c.get("gain", .16), c.get("decay", 2.6)
        for m, a in ((1, 1), (2.01, .35), (3.0, .18), (4.2, .08)):
            osc(buf, at, int(dec * 2 * SR), hz * m, g * a, lambda s, dec=dec / m ** .5: min(1, s / .004) * math.exp(-s / dec * 2.2))
    elif k == "thump":
        hz, g = c.get("hz", 55), c.get("gain", .35); n = int(.9 * SR); p = 0.0
        for i in range(n):
            if at + i >= len(buf): break
            s = i / SR; p += (hz * (1 + 1.5 * math.exp(-s * 18))) * 4096 / SR
            buf[at + i] += g * math.exp(-s * 6) * min(1, s / .003) * SIN[int(p) & 4095]
    elif k == "glide":
        hz, to, d, g = c.get("hz", 660), c.get("to", 220), c.get("dur", 1.4), c.get("gain", .1); p = 0.0
        for i in range(int(d * SR)):
            if at + i >= len(buf): break
            s = i / SR; u = s / d; p += hz * (to / hz) ** u * 4096 / SR
            buf[at + i] += g * math.sin(math.pi * u) * SIN[int(p) & 4095]
    elif k == "tick":
        d, g, rates = c.get("dur", 4), c.get("gain", .16), c.get("rates") or [[0, c.get("rate", 1)]]
        s, r = 0.0, random.Random(7)
        while s < d:
            rate = [x for x in rates if x[0] <= s][-1][1]
            n0 = at + int(s * SR)
            for i in range(int(.025 * SR)):
                if n0 + i >= len(buf): break
                e = math.exp(-i / SR * 260)
                buf[n0 + i] += g * e * (SIN[int(i * 2400 * 4096 / SR) & 4095] * .6 + r.uniform(-1, 1) * .4)
            s += 1 / max(.2, rate)
    elif k in ("wind", "breath", "swell"):
        d, g = c.get("dur", 4), c.get("gain", .2)
        bright = c.get("bright", 900 if k == "wind" else 500 if k == "breath" else 1400)
        if k == "wind":
            amp = lambda s: g * math.sin(math.pi * min(1, s / d)) ** .7 * (.75 + .25 * math.sin(TAU * .37 * s) * math.sin(TAU * .13 * s + 1))
            cut = lambda s: bright * (.6 + .4 * math.sin(TAU * .21 * s))
        elif k == "breath":
            amp = lambda s: g * math.sin(math.pi * min(1, s / d)) ** 2
            cut = lambda s: bright
        else:
            amp = lambda s: g * (s / d) ** 2 * (1 if s < d else 0)
            cut = lambda s: 200 + bright * (s / d) ** 2
        noise(buf, at, int(d * SR), amp, cut, seed=hash(k) & 0xffff)
    else:
        raise SystemExit(f"sound.json: unknown cue kind {k!r}")


def main():
    ep = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
    cfg = json.loads((ep / "sound.json").read_text())
    v = json.loads((ep / "voice.json").read_text())
    lines = {l["id"]: l for l in v["lines"]}
    last_end = max(l["end"] for l in v["lines"])
    dur = round(last_end + cfg.get("tail", 3.4), 2)   # the episode's length: scenes.js ends `tail` s after the last line (template: 3.4)
    buf = array.array("d", bytes(8 * int(dur * SR)))
    if cfg.get("bed"): bed(buf, {**cfg["bed"], "chords": [[when(t, lines, last_end, dur), f] for t, f in cfg["bed"]["chords"]]}, dur)
    for c in cfg.get("cues", []): cue(buf, c, when(c["at"], lines, last_end, dur))
    peak = max(1e-9, max(abs(x) for x in buf)); k = cfg.get("level", .6) / peak   # every episode peaks at the same level
    out = array.array("h", (int(max(-1, min(1, x * k)) * 32000) for x in buf for _ in (0, 1)))
    with wave.open(str(ep / "sound.wav"), "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(out.tobytes())
    print(f"sound.wav  {dur:.1f}s  {len(cfg.get('cues', []))} cues  peak {peak:.2f}")


if __name__ == "__main__":
    main()
