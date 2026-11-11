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

<!-- Próximos tips: mismo formato (Problema · Idea · Receta · Verificar · Gotchas). -->

## Demo

La newsletter con los tips publicados: https://mariano-builders.vercel.app/#builders-1
