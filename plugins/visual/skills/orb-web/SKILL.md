---
name: orb-web
description: >-
  Arma webs y presentaciones de una sola página con estética "orbe style": una historia en capítulos de
  pantalla completa sobre un orbe de partículas 3D fijo (Three.js), con puerta y tráiler de entrada, un
  narrador que habla palabra por palabra y un design system oscuro con glow cian. El contenido vive en un
  array de datos y cada capítulo elige cómo se mueve el orbe; si hace falta mostrar un mecanismo, suma
  escenas de motion-scenes. Verifica la página en Chrome headless (desktop y mobile). Usar cuando pidan
  "armame una web con orbe", "una web como la de Core", "presentación con el orbe", "orbe style",
  "una historia en capítulos con el orbe", o una propuesta o pitch para mostrar en pantalla con ese look.
user_invocable: true
---

# orb-web

Una web de una página que se cuenta como una historia. Cada capítulo ocupa una pantalla, dice una sola cosa y
cambia el estado del orbe. Todo vive en un HTML: el contenido en `CHAPTERS`, la marca en `SITE`, y el motor
(capítulos, navegación, orbe, tráiler) no se toca para hacer una web nueva.

## Qué hay acá

| Archivo | Para qué |
|---|---|
| `assets/template.html` | La plantilla funcionando: 5 capítulos de ejemplo, marca y orbe en `SITE`, sin escenas |
| `references/design-system.md` | Tokens, tipografías, componentes, layouts y reglas del orbe style. **Leela antes de escribir** |
| `references/orb-engine.md` | Cómo funciona el orbe: atributos, uniforms, modos, cómo sumar uno, el tráiler y sus palabras |

Las escenas en canvas salen de la skill hermana `motion-scenes` (`../motion-scenes/`): su motor
(`assets/engine.js`), su gramática y sus scripts de captura. No se copian acá.

## Flujo

1. **Brief.** Qué se cuenta, a quién y qué tiene que quedar al final. Si falta algo, preguntá una sola cosa
   por vez. Anotá el nombre del orbe (firma la burbuja y es el título del tráiler) y la marca del header.
2. **Capítulos.** Entre 5 y 15. Uno por idea, con su arco: gancho → lo que es → lo que podría ser → cómo →
   cierre. Por capítulo: `kicker` (2–4 palabras), `title` (≤ 9 palabras) con `hl` (el pedazo que se
   resalta), `body` (una o dos frases), `say` (lo que dice el orbe, ≤ 8 palabras, en primera persona).
   Escribilos como un array de datos antes de tocar el HTML y mostralos para validar el texto.
3. **Layout y modo del orbe.** `center` para frases fuertes, `side` para texto con el orbe al costado,
   `wide` con `type:"grid"` o `"list"` para enumerar, `scene` para un mecanismo animado. Después el `orb`:
   `scatter` para el problema, `gather` para la idea, `dim` para un origen humilde, `ring` y `pulse` para
   procesos, `split3` para "tres", `bright` para el cierre. En `scene` y `wide` el orbe se va a una esquina
   y queda en calma. Tabla completa en `references/orb-engine.md`.
4. **Escenas (si hacen falta).** Solo para capítulos que muestran cómo funciona algo. Seguí la skill
   `motion-scenes`: storyboard en beats, `KX.theme` con los tokens de esta página (fondo `#03050A`, acento
   `#00E5FF`, Instrument Sans y JetBrains Mono), una escena por concepto. En el capítulo: `scene:"nombre"`, y
   su texto alternativo en `SCENE_ALT`. Si un dato de la escena es de ejemplo, marcalo con `demo`.
5. **Armar la página.** Copiá `assets/template.html` al proyecto. Cambiá `SITE` y `CHAPTERS` (arriba de
   todo). Si hay escenas, pegá `engine.js` y tus escenas en el bloque comentado del final (inline si se va a
   publicar como un solo archivo). Las palabras que orbitan (`SITE.words`) y las del tráiler
   (`SITE.trailer.words`, exactamente 5) salen del tema de la web.
6. **Verificar mirando.** Con `../motion-scenes/scripts/cdp-shot.mjs` (tiempo real: el orbe tiene estado, no
   sirve `?kxt=`). Guardá las capturas en un directorio temporal, nunca en el proyecto:

   ```sh
   CDP=<plugin>/skills/motion-scenes/scripts/cdp-shot.mjs; U="file://$PWD/index.html"; OUT=$(mktemp -d)
   for id in <ids de los capítulos>; do
     node $CDP "$U?intro=skip#$id" $OUT/d-$id- 3500                # desktop 1440×900
     W=390 H=844 node $CDP "$U?intro=skip#$id" $OUT/m-$id- 3500    # mobile
   done
   node $CDP "$U" $OUT/gate- 2500                                  # la puerta
   node $CDP "$U?intro=play" $OUT/tr- 2500 5600 9900 11800        # tráiler: palabra, palabra, big bang, título
   ffmpeg -v error -pattern_type glob -i "$OUT/d-*.png" -vf "scale=720:-1,tile=2x4" $OUT/sheet-d.jpg
   ```

   Leé las hojas y revisá: texto que no entra en una pantalla de desktop, el orbe de esquina pisando el
   kicker, la burbuja tapando contenido, títulos de más de 3 líneas en mobile, palabras del tráiler que no
   entran a lo ancho. Corregí el contenido antes que el CSS. Las corridas son secuenciales (comparten perfil).
7. **Publicar (si se pide).** Como Artifact, un solo archivo: las escenas inline, Three.js desde cdnjs
   (ya está así) y las fuentes de Google Fonts. Si la web ya existe, se actualiza la misma; no se crea otra.

## Reglas cortas

- Poco texto: si un capítulo no entra en 1440×900 sin scrollear, sobra texto.
- Nada de guiones como puntuación. Puntos, comas y dos puntos.
- Un solo mundo oscuro, un solo acento (cian). El resaltado del título es el único color fuerte.
- Lo ilustrativo se dice: `demo` en el capítulo, chip DEMO en la escena.
- Con `prefers-reduced-motion` no hay puerta ni tráiler, el orbe va lento y la burbuja no anima.

## Origen

Sale de la web de Core (una página de propuesta con su orbe, oct 2026). La plantilla es esa misma página con
el contenido reemplazado por un ejemplo neutro; el motor es el mismo.
