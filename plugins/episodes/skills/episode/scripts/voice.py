#!/usr/bin/env python3
"""ONE ElevenLabs take, with timestamps, of an episode's voice.txt in the character's voice (character/character.json → voice).
Writes voice.mp3 + voice.json + voice.js (the same data as a script, so the page works from file://) into the episode:
{duration, model, synthetic, lines: [{id, text, start, end, words: [{w, t, e}]}]}.
  python3 voice.py <episode dir>              real take (needs ELEVENLABS_API_KEY and voice.voice_id), then re-render
  python3 voice.py <episode dir> --synthetic  estimated clock (~2.3 words/s, no audio): build the beats before the voice exists
voice.txt: one line per beat, "id | text". [tags] are acted out by voice.tagged_models and stripped for the other models.
"""
import base64, json, os, pathlib, re, sys, urllib.request, urllib.error

PLUGIN = pathlib.Path(__file__).resolve().parents[3]
CHAR = json.loads((PLUGIN / "character" / "character.json").read_text())
VOICE = CHAR["voice"]
TAG = re.compile(r"\[[^\]]*\]\s*")
norm = lambda w: re.sub(r"[^\w]", "", w.lower())


def lines(ep):
    out = []
    for l in (ep / "voice.txt").read_text().splitlines():
        if not l.strip() or l.lstrip().startswith("#"): continue
        lid, text = [c.strip() for c in l.split("|", 1)] if "|" in l else (f"l{len(out) + 1}", l.strip())
        out.append((lid, text))
    if not out: raise SystemExit(f"{ep / 'voice.txt'} has no lines")
    return out


def speak(text, model):
    body = {"text": text, "model_id": model, **({"voice_settings": VOICE["settings"]} if VOICE.get("settings") else {})}
    req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE['voice_id']}/with-timestamps?output_format=mp3_44100_128",
        data=json.dumps(body).encode(), headers={"xi-api-key": os.environ["ELEVENLABS_API_KEY"], "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=240) as r: return json.load(r)


def synthetic(LINES):
    """No voice yet: estimated timings (~2.3 words/s, pauses at … and periods) so beats and captions keep a voice-shaped clock."""
    t, out, k = 0.6, [], 1 / float(VOICE.get("pace") or 1)   # character.json → voice.pace: < 1 reads slower (a written voice is read, not heard)
    for lid, text in LINES:
        ws = []
        for w in TAG.sub("", text).split():
            d = (.18 + .03 * len(norm(w))) * k; ws.append({"w": w, "t": round(t, 3), "e": round(t + d, 3)}); t += d + .05 * k
            if w.endswith("…"): t += .55 * k
            elif w[-1] in ".”?": t += .35 * k
            elif w.endswith(","): t += .15 * k
        out.append({"id": lid, "text": TAG.sub("", text), "start": ws[0]["t"], "end": ws[-1]["e"], "words": ws}); t += .45 * k
    return {"duration": round(t, 3), "model": None, "synthetic": True, "lines": out}


def write(ep, data):
    (ep / "voice.json").write_text(json.dumps(data, ensure_ascii=False, indent=1))
    (ep / "voice.js").write_text("window.VOICE = " + json.dumps(data, ensure_ascii=False) + ";\n")
    print(data["model"], data["duration"]); [print(f"{l['id']:8} {l['start']:6.2f}-{l['end']:6.2f}  {l['text']}") for l in data["lines"]]


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    ep = pathlib.Path(args[0] if args else ".").resolve(); LINES = lines(ep)
    if "--synthetic" in sys.argv: return write(ep, synthetic(LINES))
    who = CHAR["display_name"]
    if VOICE.get("provider") != "elevenlabs": raise SystemExit(f"character.json → voice.provider is {VOICE.get('provider')!r}: only 'elevenlabs' is supported")
    if not VOICE.get("voice_id"): raise SystemExit(f"character.json → voice.voice_id is null: {who} has no voice yet. Pick one in ElevenLabs and set it, or run with --synthetic.")
    if not os.environ.get("ELEVENLABS_API_KEY"): raise SystemExit("ELEVENLABS_API_KEY is not set (export it in your shell; it never goes in the plugin).")
    full = " ".join(t for _, t in LINES); last = None
    for model in VOICE["models"]:
        said = full if model in VOICE.get("tagged_models", []) else TAG.sub("", full)
        try: r = speak(said, model); break
        except urllib.error.HTTPError as e: last = f"{model}: {e.code} {e.read()[:200]}"
    else: raise SystemExit(last)
    (ep / "voice.mp3").write_bytes(base64.b64decode(r["audio_base64"]))
    al = r.get("alignment") or r["normalized_alignment"]
    spoken, cur, depth = [], "", 0
    for ch, s, e in zip(al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]):
        if ch == "[": depth += 1
        if depth:
            if ch == "]": depth -= 1
            continue
        if ch.isspace():
            if cur: spoken.append((cur, t0, pe)); cur = ""
            continue
        if not cur: t0 = s
        cur += ch; pe = e
    if cur: spoken.append((cur, t0, pe))
    k, out = 0, []
    for lid, text in LINES:
        ws = []
        for w in TAG.sub("", text).split():
            while k < len(spoken) and norm(spoken[k][0]) != norm(w) and norm(w): k += 1
            if k < len(spoken): ws.append({"w": w, "t": round(spoken[k][1], 3), "e": round(spoken[k][2], 3)}); k += 1
            else: ws.append({"w": w, "t": ws[-1]["e"] if ws else 0, "e": ws[-1]["e"] if ws else 0})
        out.append({"id": lid, "text": TAG.sub("", text), "start": ws[0]["t"], "end": ws[-1]["e"], "words": ws})
    write(ep, {"duration": round(al["character_end_times_seconds"][-1], 3), "model": model, "synthetic": False, "lines": out})


if __name__ == "__main__": main()
