"""Re-time a synthetic voice clock for storytelling: silences and speed per line, so a piece can breathe, rush and stop.
Run after `voice.py <dir> --synthetic`; it rewrites voice.json and voice.js.

  python3 retime.py <episode dir>

<episode>/timing.json: {"<line id>": {"gap": <seconds of silence before the line>, "pace": <speed, 1 = as written, 2 = twice
as fast>}, …}. Lines not listed keep their own pace and get a 0.6 s gap. Only for synthetic clocks: a real take is the take."""
import json, pathlib, sys

ep = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
v, tm = json.loads((ep / "voice.json").read_text()), json.loads((ep / "timing.json").read_text())
if not v.get("synthetic"): raise SystemExit("voice.json is a real take: re-timing it would break it")
t = 0.0
for l in v["lines"]:
    cfg = tm.get(l["id"], {}); gap, pace = cfg.get("gap", .6), cfg.get("pace", 1)
    t0, start = l["start"], t + gap
    for w in l["words"]:
        w["t"], w["e"] = round(start + (w["t"] - t0) / pace, 3), round(start + (w["e"] - t0) / pace, 3)
    l["start"], l["end"] = l["words"][0]["t"], l["words"][-1]["e"]; t = l["end"]
v["duration"] = round(t + .6, 3)
(ep / "voice.json").write_text(json.dumps(v, ensure_ascii=False, indent=1))
(ep / "voice.js").write_text("window.VOICE = " + json.dumps(v, ensure_ascii=False) + ";\n")
for l in v["lines"]: print(f"{l['id']:9} {l['start']:6.2f}-{l['end']:6.2f}  {l['text']}")
