---
name: how-to-work-with-agents
description: >-
  Tips probados para ingenieros que trabajan con Claude Code (u otros agentes) en el
  laburo: cómo configurar la máquina, separar cuentas trabajo/personal y armar hábitos
  que rinden. Muestra el catálogo de tips, explica uno en detalle o lo aplica en la
  máquina de quien pregunta. Usar cuando alguien escriba /wwa, /hwa, "wwa",
  "hwa", "work with agents", "how to work with agents", "cómo trabajar con agentes",
  "tips para trabajar con claude", "htw-w-agents", "dame un tip de agentes", "cómo
  separo mi cuenta personal de la del trabajo", o pida sumar un tip nuevo al catálogo.
user_invocable: true
---

# How to work with agents (wwa / hwa)

Catálogo vivo de tips para laburar con agentes. Cada tip es algo que alguien ya
configuró y le sirvió, no teoría.

## Cómo responder

Según lo que pida:

- **Sin argumento** (`/wwa`): listar los tips del catálogo, una línea cada uno, y
  preguntar cuál quiere ver o aplicar.
- **Un tip** (`/wwa cuentas`, "cómo separo las cuentas"): explicarlo corto, con
  por qué sirve, la receta y cómo verificar que anda.
- **"Aplicalo" / "configurámelo"**: diagnosticar antes de tocar nada (qué hay hoy en
  la máquina), aplicar la receta adaptando rutas y nombres, y verificar. Hacer backup
  de todo archivo que se edite (`cp archivo archivo.bak-$(date +%Y%m%d%H%M)`).
- **"Sumá este tip"**: agregarlo abajo con el mismo formato (problema, receta,
  verificar, gotchas). Solo tips que alguien ya usó de verdad.

Escribir para un ingeniero que no conoce el setup de Mariano: rutas genéricas
(`$WORK_DIR`, `~/.claude-work`), nada de datos personales.

## Publicar

Publicar los tips en la newsletter es el pipeline propio del autor y no viene en este plugin.

---

## Tip 1 · Una cuenta por carpeta (personal afuera, trabajo adentro)

**Problema.** Tenés dos cuentas de Claude (la tuya y la de la empresa). Hacer
`/logout` + `/login` cada vez que cambiás de proyecto es lento, y es fácil terminar
usando la cuenta de la empresa para algo personal o al revés.

**Idea.** Claude Code guarda todo (credenciales, settings, historial) en el
directorio que diga `CLAUDE_CONFIG_DIR` (por defecto `~/.claude`). Si lo cambiás
según la carpeta donde estás, la cuenta se elige sola. Cada directorio tiene su propia
sesión en el Keychain, así que **las dos cuentas quedan logueadas a la vez**.

**Receta (zsh).** En `~/.zshrc`:

```zsh
# claude elige cuenta por carpeta: dentro de $WORK_DIR (o bajo un marcador
# .claude-work) usa la cuenta del trabajo; en el resto, la personal
claude() {
  local d=$PWD
  while [[ $d != / ]]; do
    if [[ $d == $HOME/Documents/work || -f $d/.claude-work ]]; then
      CLAUDE_CONFIG_DIR=$HOME/.claude-work command claude "$@"; return
    fi
    d=${d:h}
  done
  command claude "$@"
}
```

Después:

```zsh
source ~/.zshrc
mkdir -p ~/.claude-work
cd ~/Documents/work && claude   # /login con la cuenta del trabajo, una sola vez
```

**Compartir lo que querés en las dos cuentas.** Skills, agentes, hooks, memoria e
historial pueden ser los mismos con symlinks desde el dir del trabajo al personal:

```zsh
for f in skills agents commands hooks plugins projects history.jsonl settings.local.json; do
  [ -e ~/.claude/$f ] && ln -sfn ~/.claude/$f ~/.claude-work/$f
done
```

**No** compartir: credenciales, `.claude.json`, `remote-settings*` ni
`policy-limits*`. Son de cada cuenta (la empresa puede imponer settings remotos que
no querés en tu cuenta personal). `settings.json` conviene dejarlo separado si la
empresa te fija cosas por ahí; si no, se puede linkear.

**Verificar.**

```zsh
cd ~ && claude        # adentro: /status → cuenta personal
cd ~/Documents/work && claude   # /status → cuenta del trabajo
```

**Gotchas.**

- El marcador se chequea con `-f` (archivo), no con `-e`. Si el dir de config se
  llama igual que el marcador y vive en `$HOME`, con `-e` todo `$HOME` matchea y
  siempre usás la cuenta del trabajo.
- Si ya tenés otra función o alias `claude` en el `.zshrc`, la última definida pisa
  a las anteriores. Juntalas en una sola (`grep -n "claude()" ~/.zshrc`).
- Una skill o hook nuevo que agregues en `~/.claude` solo aparece en la cuenta del
  trabajo si está bajo algo symlinkeado. Si agregás un archivo nuevo de primer nivel,
  sumá su symlink.
- Para usar la cuenta del trabajo en un repo fuera de `$WORK_DIR`, tirá un
  `touch .claude-work` en la raíz del repo (y sumalo al `.gitignore`).
- La app de escritorio y la extensión del IDE no pasan por tu shell: esto aplica a
  la CLI.

---

## Tip 2 · Compartir skills con tu equipo: un marketplace

**Problema.** Armaste una skill que te sirve. Tu equipo la quiere. Si la pasás por
chat, cada uno queda con una copia distinta y nadie recibe tus mejoras.

**Idea.** Un marketplace es un repo git con un archivo
`.claude-plugin/marketplace.json`. El archivo lista tus plugins y dónde está cada
uno. Cada persona lo agrega una vez. Después instala por nombre y recibe las
versiones nuevas. El repo puede ser privado.

**Receta.**

1. Armá el repo así:

```text
team-plugins/
├── .claude-plugin/marketplace.json
└── plugins/
    └── team-tools/
        ├── .claude-plugin/plugin.json
        └── skills/mi-skill/SKILL.md
```

2. `.claude-plugin/marketplace.json`:

```json
{
  "name": "team-plugins",
  "owner": { "name": "Tu equipo" },
  "plugins": [
    { "name": "team-tools", "source": "./plugins/team-tools", "version": "0.1.0" }
  ]
}
```

3. `plugins/team-tools/.claude-plugin/plugin.json`:

```json
{ "name": "team-tools", "version": "0.1.0", "description": "Skills del equipo" }
```

4. Hacé push. Cada persona corre, en Claude Code:

```text
/plugin marketplace add tu-org/team-plugins
/plugin install team-tools@team-plugins
```

5. Opcional: para que el equipo lo tenga sin instalar a mano, commiteá esto en
   `.claude/settings.json` del repo del proyecto:

```json
{
  "extraKnownMarketplaces": {
    "team-plugins": { "source": { "source": "github", "repo": "tu-org/team-plugins" } }
  },
  "enabledPlugins": { "team-tools@team-plugins": true }
}
```

**Actualizar.** Cambiá la skill. Subí `version` en `plugin.json` y en
`marketplace.json`. Hacé push. Con auto-update prendido, el equipo recibe el
cambio solo (`/plugin` → Marketplaces → Enable auto-update). Sin auto-update:
`/plugin` → Marketplaces → Update marketplace.

**Verificar.**

```text
claude plugin list        # aparece team-tools@team-plugins
```

En una sesión, la skill aparece cuando escribís `/`.

**Gotchas.**

- Nadie puede tener dos marketplaces con el mismo nombre. Elegí uno que otros no
  usen.
- Si no subís `version`, los demás no reciben el cambio.
- Lo de `.claude/settings.json` se aplica recién cuando cada persona confía en la
  carpeta del proyecto.
- Un plugin agrupa skills que se instalan juntas. No hace falta un plugin por skill.

**Ejemplo real.** Este mismo repo: https://github.com/marianlaz/foundations

**Fuentes.**

- Crear un marketplace: https://code.claude.com/docs/en/plugin-marketplaces
- Instalar y actualizar plugins: https://code.claude.com/docs/en/discover-plugins
- `extraKnownMarketplaces` y `enabledPlugins`: https://code.claude.com/docs/en/settings

---

## Tip 3 · Pasale un secreto al agente sin pegarlo en el chat

**Problema.** El agente necesita un token (Notion, GitHub, una API). Si lo pegás en
el chat, queda en la conversación, en el historial y viaja al modelo. Ya no es
secreto.

**Idea.** El token nunca entra al chat. Lo copiás al portapapeles y el agente corre
un comando que lo lee del portapapeles y lo escribe directo en el archivo. El
comando solo muestra el largo y el prefijo, para confirmar que es el correcto.

**Receta (macOS).** Copiá el token. Después pedile al agente que corra esto:

```bash
T="$(pbpaste)"
case "$T" in
  ntn_*) printf 'NOTION_TOKEN=%s\n' "$T" > .env.local && chmod 600 .env.local \
           && echo "guardado (${#T} caracteres, prefijo ${T%%_*}_)" ;;
  *)     echo "el portapapeles no tiene un token de Notion" ;;
esac
unset T
```

Cambiá `ntn_*` por el prefijo de tu token (`ghp_*`, `sk-*`, etc.). En Linux usá
`wl-paste` o `xclip -o`. En Windows, `Get-Clipboard`.

**Verificar.**

```bash
ls -l .env.local                 # permisos -rw------- (600)
git check-ignore .env.local      # tiene que imprimir .env.local
```

**Gotchas.**

- Confirmá que el archivo está en `.gitignore` antes de crearlo.
- El comando no contiene el token, así que tampoco queda en el historial del shell.
- Después, limpiá el portapapeles: `pbcopy < /dev/null`.
- El agente igual puede leer el archivo si se lo pide alguien. Esto saca el secreto
  del chat, no lo vuelve invisible. Para más resguardo, corré el comando vos con
  `!` adelante, o usá un gestor de secretos (por ejemplo `op read` de 1Password).
- Nunca le pidas al agente que "muestre" o "verifique" el token imprimiéndolo.

---

<!-- Próximos tips: mismo formato (Problema · Idea · Receta · Verificar · Gotchas). -->

## Demo

Demo: pendiente.
