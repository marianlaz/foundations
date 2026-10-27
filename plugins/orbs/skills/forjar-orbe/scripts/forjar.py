#!/usr/bin/env python3
"""Forja un orbe a partir de su ficha (JSON) en el formato exacto del Akasha.

  forjar.py ficha.json --out <dir>     escribe el plugin en <dir>/<slug>/ (sirve sin la app)
  forjar.py ficha.json --akasha        además lo registra en el Akasha (data/agents.json + data/plugins/<slug>/)
  forjar.py ficha.json --check         solo valida la ficha
  forjar.py ficha.json --ver           valida y abre el orbe dibujado (una página temporal); no forja nada

La ficha es lo que diseña la forja de la app (core/forge.mjs): name, title, prompt, runes, hue, form, y model opcional.
Los archivos salen igual que core/plugins.mjs: plugin.json con los bloques meta y akasha, agents/<slug>.md y las tres
skills de ciclo de vida. Las skills que ya existen no se pisan, así una skill propia en skills/ sobrevive.

Al forjar también deja orbe.html en la raíz del plugin: el orbe dibujado con su hue y su form por el motor de
foundations (plugins/orbs/motor/). La página lleva el motor adentro y three.js del CDN: abre con doble click.
"""
import json, math, os, re, secrets, shutil, subprocess, sys, tempfile, unicodedata
from datetime import datetime, timezone

DATA = os.environ.get("AKASHA_DATA") or os.path.expanduser("~/Library/Application Support/Akasha/data")

# Igual que RUNES y RUNE_WORDS de core/orbs.mjs y core/plugins.mjs.
RUNE_WORDS = {
    "read": "leer archivos", "web": "buscar y leer en internet",
    "akasha": "consultar la memoria de la organización (akasha ask)", "write": "editar archivos",
    "shell": "correr comandos", "agents": "lanzar sub-agentes", "skills": "usar las skills y plugins de la persona",
    "conectores": "usar los conectores del Akasha (leer sin preguntar; lo que manda o borra, siempre preguntando)",
}
FORMS = {"orb", "ring", "crystal", "star"}

# El motor de orbes vive en foundations y no se copia: primero al lado de esta skill (la copia de foundations),
# después en el lugar fijo de foundations. La copia de ~/.claude/skills cae siempre en el segundo.
MOTOR = [
    os.path.join(os.path.dirname(os.path.realpath(__file__)), "..", "..", "..", "motor"),
    os.path.expanduser("~/Documents/builders/foundations/plugins/orbs/motor"),
]
STUBS = {
    "setup": ("Prepara la máquina para usar {n}: chequea lo que necesita y lo verifica.",
              "Usar cuando alguien instala {s} o algo de {n} no le anda.",
              "Revisá los requisitos del bloque meta de plugin.json (requires). Para cada uno: detectá antes de tocar, y decí qué falta y cómo se consigue."),
    "onboarding": ("Enseña a usar {n} con 2 o 3 casos reales.",
                   "Usar cuando alguien pregunta qué hace {s} o cómo arrancar.",
                   "Explicá en una línea qué hace {n} y mostrá 2 o 3 pedidos de ejemplo que le podés hacer. TODO: casos reales."),
    "feedback": ("Junta feedback sobre {n} y lo manda al dueño.",
                 "Usar cuando alguien dice que {s} anduvo mal, bien, o le falta algo.",
                 "Preguntá qué pidió, qué esperaba y qué pasó. Armá un resumen corto. TODO: a dónde se manda (codeowners o canal de Slack)."),
}


def slug_of(s):
    s = unicodedata.normalize("NFD", str(s or "")).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")[:40]


def check(f):
    errors = []
    for k in ("name", "title", "prompt", "runes", "hue", "form"):
        if k not in f:
            errors.append(f"falta '{k}'")
    if errors:
        return errors
    if not str(f["name"]).strip():
        errors.append("name vacío")
    bad = [r for r in f["runes"] if r not in RUNE_WORDS]
    if bad:
        errors.append(f"runas que no existen: {bad} (hay: {', '.join(RUNE_WORDS)})")
    if not isinstance(f["hue"], int) or not 0 <= f["hue"] <= 360:
        errors.append("hue tiene que ser un entero entre 0 y 360")
    elif 35 <= f["hue"] <= 50:
        errors.append("hue entre 35 y 50 es el dorado del guardián: elegí otro")
    if f["form"] not in FORMS:
        errors.append(f"form tiene que ser una de {sorted(FORMS)}")
    return errors


def person():
    try:
        p = json.load(open(os.path.join(DATA, "last-person.json")))
        return {"name": p.get("name") or p.get("email") or "local", **({"email": p["email"]} if p.get("email") else {})}
    except Exception:
        git = lambda k: subprocess.run(["git", "config", k], capture_output=True, text=True).stdout.strip()
        name, email = git("user.name"), git("user.email")
        return {"name": name or email or "local", **({"email": email} if email else {})}


def manifest(f, s, orb_id, forged_at):
    runes = [r for r in f["runes"] if r in RUNE_WORDS]
    return {
        "name": s,
        "description": f"{f['name']}{' — ' + f['title'] if f['title'] else ''}. Orbe forjado en el Akasha.",
        "author": person(), "keywords": ["akasha", "orb"],
        "meta": {
            "schema": 1, "status": "sandbox", "owner": {"area": "Akasha", "codeowners": []}, "audience": ["internal"],
            "requires": [{"kind": "cli", "name": "akasha", "why": "la memoria de la organización (akasha ask)", "install": "akasha"}] if "akasha" in runes else [],
            "exposure": ["internal"], "kind": "code", "clients": ["claude-code"],
            "lifecycle": {k: f"{s}-{k}" for k in ("setup", "onboarding", "feedback")},
            "todo": ["codeowners: falta quién aprueba los cambios (usuario o grupo del repo)", "demo: falta una demo (meta.demo)"],
        },
        "akasha": {"orbId": orb_id, "runes": runes, "hue": f["hue"], "form": f["form"], "forgedAt": forged_at},
    }


def agent_md(f, s):
    runes = [r for r in f["runes"] if r in RUNE_WORDS]
    lines = ["---", f"name: {s}", f"description: {json.dumps(f['name'] + (': ' + f['title'] if f['title'] else ''), ensure_ascii=False)}"]
    if f.get("model"):
        lines.append(f"model: {f['model']}")
    lines += ["---", f"Sos \"{f['name']}\"{', ' + f['title'] if f['title'] else ''}.", "", f["prompt"].strip(), ""]
    if runes:
        lines += ["## Lo que podés hacer sin preguntar", *[f"- {r}: {RUNE_WORDS[r]}" for r in runes], ""]
    return "\n".join(lines)


def write_plugin(f, d, s, orb_id, forged_at):
    os.makedirs(os.path.join(d, ".claude-plugin"), exist_ok=True)
    os.makedirs(os.path.join(d, "agents"), exist_ok=True)
    with open(os.path.join(d, ".claude-plugin", "plugin.json"), "w") as fh:
        fh.write(json.dumps(manifest(f, s, orb_id, forged_at), indent=2, ensure_ascii=False) + "\n")
    with open(os.path.join(d, "agents", f"{s}.md"), "w") as fh:
        fh.write(agent_md(f, s))
    for k, (what, when, body) in STUBS.items():
        path = os.path.join(d, "skills", f"{s}-{k}", "SKILL.md")
        if os.path.exists(path):
            continue
        os.makedirs(os.path.dirname(path), exist_ok=True)
        desc = f"{what} {when}".format(n=f["name"], s=s)
        with open(path, "w") as fh:
            fh.write("\n".join(["---", f"name: {s}-{k}", f"description: {json.dumps(desc, ensure_ascii=False)}", "---", "", body.format(n=f["name"], s=s), ""]))


def motor_dir():
    for d in MOTOR:
        if os.path.isfile(os.path.join(d, "orbe.js")) and os.path.isfile(os.path.join(d, "orbe.html")):
            return os.path.normpath(d)
    return None


def orbe_html(f, seed):
    """La página del orbe: motor/orbe.html con orbe.js adentro y la ficha como parámetros por defecto.
    Los parámetros de la URL (?still=1, ?hue=…) siguen ganando. → el HTML, o None (con aviso) si no se puede."""
    d = motor_dir()
    if not d:
        print("Aviso: no encuentro el motor de orbes (foundations/plugins/orbs/motor/orbe.js); sigo sin dibujar el orbe.", file=sys.stderr)
        return None
    page = open(os.path.join(d, "orbe.html"), encoding="utf-8").read()
    motor = open(os.path.join(d, "orbe.js"), encoding="utf-8").read()
    tag, params = '<script src="./orbe.js"></script>', "new URLSearchParams(location.search)"
    if tag not in page or params not in page or "</script" in motor.lower():
        print(f"Aviso: {d}/orbe.html cambió y ya no sé dónde meter el motor; sigo sin dibujar el orbe.", file=sys.stderr)
        return None
    ficha = {"hue": str(f["hue"]), "form": f["form"], "seed": seed, "nombre": f["name"]}
    defaults = json.dumps(ficha, ensure_ascii=False).replace("<", "\\u003c")
    page = page.replace(tag, "<script>\n" + motor + "\n</script>", 1)
    page = page.replace(params, "(function () { // la ficha del orbe; lo que venga en la URL gana\n"
                        f"    var q = new URLSearchParams({defaults});\n"
                        "    new URLSearchParams(location.search).forEach(function (v, k) { q.set(k, v); });\n"
                        "    return q;\n  })()", 1)
    title = f["name"] + (" — " + f["title"] if f.get("title") else "")
    page = re.sub(r"<title>.*?</title>", lambda m: "<title>" + title.replace("&", "&amp;").replace("<", "&lt;") + "</title>", page, count=1)
    return page


def write_orbe(f, d, seed):
    page = orbe_html(f, seed)
    if page is None:
        return None
    path = os.path.join(d, "orbe.html")
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(page)
    return path


def akasha_running():
    return subprocess.run(["pgrep", "-f", "akasha.*server.mjs|Akasha.app"], capture_output=True).returncode == 0


def register(f, s, orb_id, created_ms):
    path = os.path.join(DATA, "agents.json")
    agents = json.load(open(path))
    if any(a.get("plugin") == s for a in agents) or os.path.exists(os.path.join(DATA, "plugins", s)):
        s = f"{s}-{orb_id[:4]}"  # igual que slugFor: si el slug está tomado, se le suma el id
    angle = len(agents) * 2.4  # ángulo áureo aprox.: los orbes nuevos no caen uno encima del otro
    entry = {"id": orb_id, "kind": "custom", "name": f["name"], "title": f["title"], "prompt": f["prompt"],
             "runes": f["runes"], "hue": f["hue"], "form": f["form"], "model": f.get("model"),
             "x": round(420 * math.cos(angle)), "y": round(420 * math.sin(angle)),
             "xp": 0, "turns": 0, "cost": 0, "sessionId": None, "createdAt": created_ms, "plugin": s}
    shutil.copy(path, path + ".bak")
    agents.append(entry)
    tmp = path + ".tmp"
    with open(tmp, "w") as fh:
        json.dump(agents, fh, indent=2, ensure_ascii=False)
    os.replace(tmp, path)
    return s


def main():
    args = sys.argv[1:]
    if not args or args[0].startswith("-"):
        sys.exit(__doc__)
    f = json.load(open(args[0]))
    errors = check(f)
    if errors:
        sys.exit("La ficha no está lista:\n- " + "\n- ".join(errors))
    if "--check" in args:
        return print("Ficha válida.")
    if "--ver" in args:
        path = write_orbe(f, tempfile.mkdtemp(prefix="orbe-"), slug_of(f["name"]) or f["name"])
        if path:
            subprocess.run(["open", path])
            print(f"Orbe dibujado: {path}")
        return

    orb_id = f.get("id") or secrets.token_hex(4)
    now = datetime.now(timezone.utc)
    forged_at = now.strftime("%Y-%m-%dT%H:%M:%S.") + f"{now.microsecond // 1000:03d}Z"
    s = slug_of(f["name"]) or "orbe"

    if "--akasha" in args:
        if akasha_running():
            sys.exit("El Akasha está abierto: cerralo y volvé a correr esto (si no, la app pisa agents.json al guardar).")
        s = register(f, s, orb_id, int(now.timestamp() * 1000))
        d = os.path.join(DATA, "plugins", s)
    elif "--out" in args:
        d = os.path.join(os.path.expanduser(args[args.index("--out") + 1]), s)
    else:
        sys.exit("Falta --out <dir> o --akasha.")

    write_plugin(f, d, s, orb_id, forged_at)
    # orbe.html va en la raíz del plugin: la app solo reescribe plugin.json y agents/<slug>.md, así que sobrevive.
    orbe = write_orbe(f, d, s)
    print(json.dumps({"slug": s, "id": orb_id, "dir": d, "orbe": orbe,
                      "invocar": f"claude --plugin-dir {json.dumps(d)} --agent {s}:{s}"}, ensure_ascii=False))


if __name__ == "__main__":
    main()
