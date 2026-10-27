# El formato de un orbe (Akasha 0.9, rama main)

Sacado de `~/Documents/builders/akasha/core/forge.mjs`, `orbs.mjs`, `agents.mjs` y `plugins.mjs`. Si la app cambia,
esto se actualiza desde ahí.

## La ficha (lo que diseña la forja)

`core/forge.mjs` corre un `claude -p` con este schema y devuelve la ficha:

| Campo | Qué es | Regla |
|---|---|---|
| `name` | Nombre evocador | 1–2 palabras |
| `title` | Su rol | 3–6 palabras, en el idioma del deseo |
| `prompt` | Misión y comportamiento: su **esencia** | 3–6 oraciones, en segunda persona, en el idioma del deseo |
| `runes` | Lo que puede hacer sin preguntar | Las **mínimas** que la misión necesita |
| `hue` | Su color | Entero 0–360 que vaya con la esencia. 35–50 es el dorado del guardián: no |
| `form` | Su forma | `orb` generalista · `ring` vigía/monitor · `crystal` analista/investigador · `star` ejecutor/hacedor |
| `model` | Opcional | `sonnet`, `opus` o nada (el default del espacio) |

`form` y `hue` también deciden cómo se dibuja el orbe: el motor de `foundations/plugins/orbs/motor/` los usa tal cual.

## Las runas

Una runa es un permiso con nombre: un grupo de herramientas de Claude que el orbe usa **sin preguntar**
(van a `--allowedTools`). No es un techo: cualquier otra herramienta la puede pedir, y la persona decide.

| Runa | Herramientas | Qué habilita |
|---|---|---|
| `read` | Read, Grep, Glob | leer archivos |
| `web` | WebSearch, WebFetch | buscar y leer en internet |
| `akasha` | Bash(akasha *) | consultar la memoria (KB) de la organización con el CLI `akasha` |
| `write` | Edit, Write | editar archivos |
| `shell` | Bash | correr cualquier comando |
| `agents` | Task | lanzar sub-agentes |
| `skills` | Skill | usar las skills y plugins de la persona |
| `conectores` | MCP del Akasha | Notion, Drive, Gmail, Slack…: leer libre; mandar o borrar, siempre preguntando |

## Dónde vive un orbe

Dos lugares, en `~/Library/Application Support/Akasha/data/` (o `$AKASHA_DATA`):

1. **`agents.json`**: una entrada por orbe. Las forjadas tienen `kind: "custom"` y un puntero `plugin: "<slug>"`:
   ```json
   {"id": "a1b2c3d4", "kind": "custom", "name": "…", "title": "…", "prompt": "…", "runes": ["read"],
    "hue": 265, "form": "crystal", "model": null, "x": 0, "y": 0, "xp": 0, "turns": 0, "cost": 0,
    "sessionId": null, "createdAt": 1791149149951, "plugin": "slug"}
   ```
2. **`plugins/<slug>/`**: un plugin local de Claude Code con un bloque `meta` de metadatos (dueño, estado, requisitos). Es la fuente de verdad de lo que el
   orbe es, y su proceso lo carga con `--plugin-dir <dir> --agent <slug>:<slug>`.
   ```
   .claude-plugin/plugin.json      name, description, author, keywords, meta {…}, akasha {orbId, runes, hue, form, forgedAt}
   agents/<slug>.md                frontmatter (name, description, model?) + "Sos …" + prompt + "## Lo que podés hacer sin preguntar"
   skills/<slug>-setup/SKILL.md    las tres de ciclo de vida (stubs con TODO); se escriben solo si faltan
   skills/<slug>-onboarding/SKILL.md
   skills/<slug>-feedback/SKILL.md
   ```

Detalles que importan:
- **El slug** sale del nombre (sin tildes, minúsculas, guiones, 40 caracteres). Si está tomado, se le suma `-<id[:4]>`.
  Se elige una vez: renombrar el orbe no mueve su plugin.
- **El agente no lleva `tools:`** a propósito: en el frontmatter de un `--agent` le ganaría a `--tools`.
- **Cada edición en la app reescribe** `plugin.json` y el agente desde la entrada de `agents.json`. Las skills de
  `skills/` no se pisan: una skill propia del orbe sobrevive.
- **Con la app abierta no se toca `agents.json`**: la app lo reescribe al guardar. Se cierra antes, o se forja adentro
  (⌘N).
- **Al arrancar**, la app (`plugins.migrate`) escribe el plugin de cualquier orbe forjado al que le falte.

## Variante en camino (rama `v1/orbes-world`)

En la rama v1 un orbe es una carpeta de un registro: `registros/<registro>/orbes/<id>/ORBE.md` con frontmatter
(`type: Orbe`, `id`, `nombre`, `titulo`, `description`, `version`, `requires.runas`, `apariencia.hue/forma`,
`motor.modelo`, `permisos.modo`, `limites`) y la esencia en el cuerpo, más `skills/`. No está en main: no forjar ahí
salvo que Mariano lo pida.
