---
name: video-thumbnails
description: >-
  Arma thumbnails buenos para videos (tarjeta 16:9 1280×720 y hero 2:1 1600×800) a partir del
  contenido real de cada video: lee guion, beats, tags y votos, saca 12–20 frames candidatos con
  ffmpeg, elige el más fuerte mirándolos, escribe un gancho de 3–6 palabras que dice de qué trata (claro, alineado con el summary) y compone con la
  tipografía Plus Jakarta Sans, el coral y el lenguaje visual del orbe (orbe, polvo de partículas), renderizado
  en Chrome headless. Cierra con una hoja de contacto a tamaño de tarjeta para corregir lo que no se lee.
  Usar cuando Mariano pida "generá thumbnails", "armá las previews de los videos", "thumbnails
  para los episodios", "las tarjetas no se leen", "cambiá el poster por algo mejor", "portada del
  video", "hero de la sala", "covers para los épicos / los más votados", o cuando haya videos nuevos en
  la carpeta de episodios sin thumb.jpg. Tiene un modo "cover" (gramática de las portadas de deck) para videos épicos y
  los más votados del mes.
  Skill personal: no está en el marketplace.
user_invocable: true
---

# video-thumbnails

Un thumbnail no es el último frame. Es **un frame elegido + un gancho**: una sola idea visual que se lee a
320 px, y 3–6 palabras que **dicen de qué trata el video** y dan ganas de verlo. Regla de oro (feedback de
Mariano, oct 2026): *el thumbnail tiene que entenderse y corresponderse con la descripción*. Alguien que no vio
el video tiene que saber el tema en 1 segundo. El poster con texto quemado no sirve: el texto del video es
chico, y a tamaño de tarjeta es ruido.

## Qué hay acá

| Archivo | Para qué |
|---|---|
| `scripts/candidates.sh <dir\|mp4> <out> [N=16]` | Saca N frames del 5% al 97% del video (salta el fade inicial y el poster final) + `sheet.jpg` numerada (4 columnas, de izq. a der.) + `times.txt` |
| `scripts/compose.mjs render <spec.json> [--only a,b] [--out dir]` | Por ítem: extrae el frame exacto, compone y guarda `thumb.jpg` (1280×720 q85), `thumb-hero.jpg` (1600×800 q85) y `thumb.md` |
| `scripts/compose.mjs sheet <spec.json> <out.png>` | Hoja de contacto: cada thumb a 320 px con el **título + la primera frase del summary** (`tags.json`) y, si el ítem tiene `oldHook`, "viejo → nuevo" |
| `scripts/compose.mjs cover <spec.json> [--only] [--out]` | Modo cover: por cada ítem con `cover:{…}` guarda `thumb-cover.jpg` (1280×720) y `thumb-cover-hero.jpg` (1600×800) |
| `scripts/compose.mjs compare <spec.json> <out.png>` | Hoja normal vs cover (+ hero 2:1) de los ítems con `cover` |
| `assets/thumb.html` | La plantilla (canvas + CSS). Parámetros documentados arriba de todo |
| `assets/cover.html` | La plantilla cover (gramática de covers de deck). Parámetros arriba de todo |
| `references/deck-covers.md` | Qué se tomó de las covers de deck, en 10 líneas |
| `assets/PlusJakartaSans-Variable.ttf` | La tipografía (ver Marca) |
| `assets/orb.js` | El motor del orbe (global `Orb`) para el parámetro `orb` |
| `examples/spec.json` | Un spec chico de ejemplo: crops, ganchos, por qué, descartes y una cover |

Chrome headless corre en su **propio puerto (9495 por defecto, `port` en el spec) y su propio perfil**
(`<tmp>/chrome-prof`): no toca el Chrome de Mariano.

## Marca

- **Tipografía:** **Plus Jakarta Sans** (variable, 200–800). Está en Google Fonts con el mismo nombre.
  Gancho en 800, tracking −0.035em, interlineado 0.98.
- **Color:** fondo `#08070e`, coral `#FF6447` (también el `solve`/`thinking` del orbe). Una palabra del gancho en
  coral, nunca todo.
- **El orbe:** si el video tiene un orbe o mascota, suele estar en casi todos los frames; si falta,
  `orb:{x,y,r,tint}` lo dibuja con `orb.js`. El polvo de partículas (paleta violeta/azul de `akasha-field.js` de
  motion-scenes + filamentos) va sobre el lado oscuro,
  con semilla por episodio para que cada uno sea distinto.
- **Nada más:** chip chico "Unverified" (punto ámbar, como la píldora de la galería) y el gancho. Sin íconos,
  sin logos, sin clipart, sin el título (la sala lo pone debajo).

## Flujo

1. **Analizar el contenido.** Por video: `tags.json` (summary, topics, audiencia), `voice.txt`/`script.md`
   (las frases del narrador, el giro, el remate) y `votes.js` (qué les gustó a los votantes y qué les molestó).
   Anotá: la idea central en una frase, el giro y la frase más del narrador. Un volcado rápido de todos:
   `node -e` sobre `tags.json` + `votes.js` y `cat */*/voice.txt | cut -c1-900`.
2. **Candidatos.** `scripts/candidates.sh <episodio> <scratch>/cand/<slug> 16`. Usa `episode-16x9.mp4` si existe.
   Corré todos en paralelo y mirá cada `sheet.jpg` con Read.
3. **Elegir el frame** (anotá el número del candidato). Criterios, en orden:
   - una sola idea visual clara (el objeto del episodio: el código en pantalla grande, la puerta cerrada, el rastro encendido);
   - el orbe o un personaje presente (la mascota, gente real en fotos);
   - que lo importante sea grande; el texto chico de UI se acepta solo como textura que el oscurecido tapa;
   - nada de frames con el caption quemado o el cierre con logo; preferí el momento en que la escena está completa.
   Si el orbe cae a la izquierda (donde va el gancho), usá `side:"right"`; si el sujeto está arriba y abajo hay
   aire, usá `wash:"floor"`.
4. **Gancho: el tema, en palabras claras.** 3–6 palabras en inglés (como los videos), alineadas con el título y
   el `summary` del episodio (`tags.json`, `episode.okf.md`). Tiene que nombrar el sustantivo del video (cache,
   deploy, skill, console, values…). Puede llevar gancho emocional o forma de pregunta, pero **el tema va
   primero**: "What's inside a *cache*?", "Why deploys *fail*", "Inside your admin *console*".
   - **Prohibido lo críptico**: frases del narrador sacadas del guion que solo se entienden después de verlo
     ("Check my memory.", "Still being built.", "Who stays behind?", "Fast, until it lies."). Esas van en el `desc`
     de una cover o en el post, no en el gancho.
   - Puede parecerse al título (la sala lo pone debajo): mejor redundante que críptico; si podés, sumá el
     beneficio o el ángulo ("Catch failing deploys *early*" para uno de CI).
   - Test: tapá el frame y leé solo el gancho + el título. ¿Alguien de afuera sabe de qué trata? Si no, reescribí.
   - Evitá promesas y números internos que asusten afuera (p. ej. "0 verified").
   Escribí 2–3 alternativas y quedate con la que dice el tema más rápido. Si reemplazás uno, dejá el viejo en
   `oldHook` para que la hoja muestre "viejo → nuevo".
5. **Componer.** Armá `spec.json` (ver encabezado de `compose.mjs` y `examples/spec.json`):
   `t` (segundo del candidato, de `times.txt`), `focus` (punto del frame que es el sujeto, 0–1), `anchor`
   (dónde cae en el lienzo; default `[.7,.46]`), `zoom` (1 = el ancho del frame llena el lienzo), `dim`, `side`,
   `wash`, `hero:{…}` para ajustar solo el 2:1, y `why` / `alts` / `hookAlts` que van a `thumb.md`.
   Para ubicar `focus` en la hoja: (x − x0 de la celda) / ancho de celda, ídem y. Para frames 4:5, zoom 0.7–1.1
   (por debajo de 1 el frame no cubre el ancho y los bordes se funden con el fondo, a propósito).
   `node scripts/compose.mjs render spec.json` (o `--only` para iterar uno).
6. **Hoja de control.** `node scripts/compose.mjs sheet spec.json <scratch>/thumbs/contact.png` y mirala con
   Read. Primero el chequeo de sentido: al lado de cada thumb están el título y la primera frase del summary —
   **¿el gancho se corresponde con eso?** Si un gancho no se entiende sin el video, reescribilo. Después, a 320 px:
   ¿se lee el gancho en un vistazo?, ¿la UI del fondo compite con las letras (subí `dim` o
   corré `anchor`)?, ¿el sujeto quedó cortado (ajustá `focus` en y)?, ¿dos tarjetas seguidas iguales? Corregí,
   re-renderizá esos con `--only` y regenerá la hoja. Mirá también un par de `thumb-hero.jpg`.

## Modo cover (épicos y más votados del mes)

Para los videos que merecen portada (lanzamientos tipo "Introducing · <producto>", y los 3 más votados del mes)
hay una segunda pieza con la gramática de las covers de deck (`references/deck-covers.md`): columna negra a la
izquierda con eyebrow coral + **título completo del video** (Jakarta 800, un término coral) + una frase; el frame
del video como héroe a la derecha (caja desde el 40%, full-height) fundido con scrim; si el spec trae `logo` (ruta
absoluta a un wordmark SVG blanco), va abajo-izquierda, y sin `logo` la cover sale sin logo; y, para los más votados, un sello
redondo chico "Nº n · Most voted · <mes>" en la columna negra (nunca sobre el héroe). Sin chip, sin polvo, sin gancho:
la calma es lo que la distingue del thumb normal.

- En el ítem del spec: `"cover": {"eyebrow": "Most voted · October", "title": "Why caches *lie*",
  "desc": "Fix it before it reaches the user.", "seal": {"rank": 1, "label": "Most voted · October 2026"},
  "focus": [.55,.42], "zoom": 1.12, "dim": 0, "hero": {…solo 2:1}}`. Toma `t` del ítem (o `cover.t`).
- `node scripts/compose.mjs cover spec.json` → `thumb-cover.jpg` + `thumb-cover-hero.jpg` en cada carpeta;
  `node scripts/compose.mjs compare spec.json <scratch>/thumbs/covers.png` para verlas contra el normal.
- Encuadre: subí `zoom` hasta que no se vean captions quemados abajo ni rótulos arriba del frame; si el frame es
  una UI clara, `dim` .2–.3 para que no grite.
- **Ranking del mes**: los votos reales de la sala viven en la base del artifact (no se leen desde acá); si no
  hay acceso, usá `episodes/votes.js` (votos de los roles) con el mismo orden que la galería: score desc, después
  cantidad de votos, después orden de serie. Anotalo en el reporte.

## Notas

- La plantilla elige sola el tamaño de letra más grande que entra en la columna en ≤2 líneas (`col`, `lines`,
  `max` para forzar). `|` en el gancho fuerza el corte.
- `compose.mjs` navega con `?n=<contador>#<json>`: con solo el hash, Chrome hace navegación en el mismo
  documento y no re-renderiza (bug que aparece como "todos los thumbs iguales").
- No commitear ni publicar desde la skill: dejá los archivos y avisá. La galería (`gallery.html`) hoy usa
  `poster.jpg` y superpone su propia píldora "Unverified" arriba a la izquierda; si pasa a usar `thumb.jpg`,
  sacá una de las dos (`chip:false` en el spec, o la de la galería).
