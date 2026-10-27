---
name: forjar-orbe
description: >-
  Forja un orbe del Akasha fuera de la app: de "qué querés que exista" a una capacidad agéntica con nombre, esencia,
  runas, forma y color, escrita en el formato exacto del Akasha (un plugin local de Claude Code más su entrada en
  agents.json) para que la app lo levante, o para invocarlo como agente de Claude Code sin la app. Afina el diseño
  con un diálogo corto, una cosa a la vez. Usar cuando Mariano diga "forjá un orbe", "creá una capacidad", "quiero un
  orbe que…", "armame un orbe para X", "sumá un orbe al Akasha", o quiera convertir un pedido recurrente en un agente
  con identidad propia. Skill personal: no está en el marketplace.
user_invocable: true
---

# forjar-orbe

Un **orbe** es una capacidad agéntica con identidad: un nombre, una esencia (su misión, en segunda persona), unas
**runas** (lo que puede hacer sin preguntar), una forma y un color. Por detrás es una sesión de `claude -p` que carga
un plugin local. Esta skill hace lo mismo que la forja de la app (⌘N), pero desde cualquier sesión de Claude Code.

## Qué hay acá

| Archivo | Para qué |
|---|---|
| `references/formato.md` | La ficha, las runas, dónde vive un orbe y qué no se toca. **Leelo antes de forjar** |
| `scripts/forjar.py` | Valida la ficha y escribe el plugin (y lo registra en el Akasha). Sin dependencias |
| Motor de orbes | `orbe.js` en `foundations/plugins/orbs/motor/`: dibuja el orbe con su `hue` y su `form`. El script lo busca ahí (al lado de esta skill en foundations, o en `~/Documents/builders/foundations/`) y no lo copia. Si no está, forja igual, sin dibujo |

## Flujo

1. **El deseo.** Si Mariano no dijo qué quiere que exista, preguntá solo eso: "¿qué querés que haga este orbe?".
2. **Diseñá la ficha vos.** Con las reglas de `references/formato.md`: `name`, `title`, `prompt`, `runes`, `hue`,
   `form`, y `model` si hace falta. Las runas, las mínimas: un orbe que solo lee no lleva `write` ni `shell`.
3. **Mostrala en corto** y afiná **una cosa a la vez**:
   ```
   ✦ Nombre — su rol
   Esencia: <prompt, 3-6 oraciones>
   Runas: read, web   ·   Forma: crystal   ·   Color: 265 (violeta)
   ```
   Preguntá lo que más pesa primero (casi siempre: "¿la esencia es esa?"). Después, si algo no cierra, las runas.
   Nombre, forma y color los cambia si quiere; no los preguntes uno por uno.
   Después del texto, mostrale el orbe: escribí la ficha en un JSON y corré
   `python3 scripts/forjar.py ficha.json --ver`. Valida, arma la página en una carpeta temporal y la abre; no forja
   nada. Si cambia el color o la forma, corrélo de nuevo.
4. **Escribí la ficha** en un JSON y validala: `python3 scripts/forjar.py ficha.json --check`.
5. **Forjá.** Elegí el destino según lo que pidió:
   - **Al Akasha** (default si lo nombra o si usa la app): `python3 scripts/forjar.py ficha.json --akasha`.
     Si la app está abierta, el script frena: pedile que la cierre (una sola cosa) y corrélo de nuevo. Al abrirla,
     el orbe aparece en el espacio.
   - **Sin la app**: `python3 scripts/forjar.py ficha.json --out <dir>`. Proponé
     `~/Documents/builders/orbes/` si no dice dónde.
6. **Skills propias (si la misión las pide).** Si el orbe tiene un procedimiento propio que se repite, escribilo como
   `skills/<slug>-<verbo>/SKILL.md` dentro de su plugin. No se pisan cuando la app reescribe el plugin.
   Las tres de ciclo de vida (`setup`, `onboarding`, `feedback`) salen como stubs con TODO: completá la de
   onboarding con 2 o 3 pedidos reales si ya los conocés.
7. **Cerrá** con una línea: dónde quedó, cómo se invoca y dónde está su dibujo (el script lo imprime):
   `claude --plugin-dir "<dir>" --agent <slug>:<slug>`, y `<dir>/orbe.html`, que abre con doble click. Está en la
   raíz del plugin porque la app solo reescribe `plugin.json` y `agents/<slug>.md`. Si después le cambian el color o
   la forma en la app, la página queda vieja: se rehace con `--ver`.

## Reglas

- **El formato es el de la app, no uno parecido.** Los archivos los escribe el script, que copia la lógica de
  `core/plugins.mjs`. No los escribas a mano.
- **Nunca toques `agents.json` con el Akasha abierto.** La app lo pisa al guardar.
- **No edites el código del Akasha** ni sus ramas: esta skill solo escribe datos (un plugin, su `orbe.html` y una
  entrada).
- **No inventes runas.** Son las ocho de `references/formato.md`. Si la misión necesita algo que ninguna da (por
  ejemplo, un conector puntual), decilo y elegí `conectores`, que pregunta antes de mandar o borrar.
- **El dorado (hue 35-50) es del guardián** (el orbe que cuida la memoria). No se usa en orbes nuevos.

## Cuándo esta skill falla

- **Orbes gordos.** Un orbe con seis runas y una esencia de diez oraciones es un agente genérico con otro nombre. Si
  la misión no entra en 6 oraciones, son dos orbes.
- **Preguntar todo.** El diseño lo proponés vos; Mariano corrige. Una pregunta por mensaje.
- **Esencia en tercera persona.** El prompt le habla al orbe: "Tu misión es…", no "Este orbe hace…".
