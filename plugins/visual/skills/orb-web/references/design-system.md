# Design system: orbe style

Un mundo oscuro, un orbe cian que brilla y texto grande con mucho aire. Todo está en `:root` y en las clases de
`assets/template.html`; acá está qué es cada cosa y cuándo usarla.

## Tokens

| Token | Valor | Uso |
|---|---|---|
| `--bg` | `#03050A` | Fondo de todo (página, franja, viñeta) |
| `--ink` | `#EEF4F6` | Títulos y texto fuerte |
| `--soft` | `#A3B0BA` | Cuerpo, texto de la burbuja |
| `--faint` | `#66737D` | Hint, contador, notas, riel apagado |
| `--cyan` | `#00E5FF` | El acento: puntos, orbe, glow, foco |
| `--cyan-soft` | `#8FF3FF` | Resaltado del título, kicker, labels activos |
| `--glass` | `rgba(12,20,28,.52)` | Tarjetas y botón Saltar (con `backdrop-filter: blur`) |
| `--glass-strong` | `rgba(10,18,26,.78)` | La burbuja del narrador |
| `--line` | `rgba(143,243,255,.16)` | Bordes y separadores |

El glow siempre es el mismo cian con alfa: `box-shadow:0 0 10px 2px rgba(0,229,255,.7)` en puntos,
`text-shadow:0 0 34px rgba(0,229,255,.45)` en el resaltado, radial `rgba(0,229,255,.30 → 0)` detrás del orbe.

## Tipografías (Google Fonts)

- **Bricolage Grotesque** (`--display`): títulos `h2` en 400 con tracking −0.045em, número grande `.fig` en
  300, marca en 600. También rasteriza las palabras del tráiler.
- **Instrument Sans** (`--body`): cuerpo 17–20 px, kicker en 600 mayúsculas con tracking 0.16em.
- **JetBrains Mono** (`--mono`): `.note`, caption del tráiler. Chico y en `--faint`.

## Piezas fijas

- **Header `.top`**: `.brand` = `.dot` (punto cian con glow) + nombre en minúscula + tagline (`span`, se oculta
  en mobile). A la derecha `.hint` con cómo avanzar.
- **Riel `.rail`**: un botón por capítulo a la derecha, centrado en alto. El activo crece y brilla; el nombre
  aparece al hover. No existe en mobile.
- **Contador `.counter`**: `03 / 05` abajo a la derecha, desktop solo.
- **Franja `#band`**: 104 px abajo, degradé al fondo. Nada compite con la burbuja.
- **Narrador `.narrator`**: burbuja de vidrio abajo al centro: punto, nombre del orbe en negrita y la línea
  del capítulo (`say`). Cada palabra entra con blur y una subida chica, 70 ms entre palabras (`say()`).
- **Viñeta `#vignette`**: radial en desktop; en mobile, degradé desde abajo para que el texto se lea sobre
  el orbe.

## Capítulo

`<section class="chapter {layout}">` → `.inner` → `.copy` (+ `figure.kx-fig` si hay escena). Dentro de
`.copy`, en este orden: `.kicker`, `h2`, `.fig`, `.body`, `.grid`/`.list`, `.note`.

| Pieza | Dato en `CHAPTERS` | Qué es |
|---|---|---|
| `.kicker` | `kicker` | 2–4 palabras en mayúscula con un punto cian. También es el nombre en el riel |
| `h2` + `em` | `title`, `hl` | El título. `hl` es un pedazo literal del título que se pinta cian con glow |
| `.body` | `body` | Una o dos frases en `--soft`, máx. 560 px |
| `.fig` | `fig:{n,u}` | Número grande (`n`) con una unidad antes (`u`): "todo en **1 lugar**" |
| `.grid` / `.card` | `type:"grid"`, `items:[{l,x,k}]` | Tarjetas de vidrio: `l` título con punto, `x` texto. `k:"feature"` borde cian brillante, `k:"callout"` ocupa toda la fila con fondo cian oscuro |
| `.list` | `type:"list"`, `items:[{l,x}]` | Filas con separador: `l` en display cian (140 px), `x` en ink |
| `.note` | `demo` | `DEMO · …` en mono, para avisar que algo es ilustrativo |
| `.kx-fig` | `scene` | Canvas 16:10 de motion-scenes con borde `--line` y sombra con glow |

## Layouts

| `layout` | Desktop | Mobile | Orbe |
|---|---|---|---|
| `center` | Copy centrado, pegado abajo; el orbe arriba | Copy abajo, orbe arriba | Su modo, centrado arriba |
| `side` | Copy a la izquierda, orbe grande a la derecha | Como center | Su modo, a la derecha |
| `scene` | Grilla .72 / 1.28: copy a la izquierda (máx. 480), escena a la derecha | Una columna | Chico, esquina arriba a la izquierda, calma |
| `wide` | Copy de hasta 1060 px; grid de 3 columnas, lista de 2 | Una columna | Chico, en la esquina, calma |
| `roles` | Copy centrado ocupando el alto (arriba y abajo) | Como center | Su modo |

## Reglas responsive

- **Mobile primero (≤ 760 px):** el capítulo deja el 44 % de arriba para el orbe y apoya el texto abajo;
  `scene` y `wide` arrancan a 96 px. Títulos `clamp(34px, 9.6vw, 50px)`. Sin riel, sin contador, sin tagline.
- **Desktop (≥ 761 px):** cada capítulo mide exactamente `100vh` con `scroll-snap-type: y mandatory` y
  `scroll-snap-stop: always`, así rueda, trackpad y teclado caen siempre en el mismo lugar. Los tamaños salen
  también del alto (`min(…vw, …vh)`) para que todo entre entre el header (84 px) y la franja (104 px). Lo
  que no entra se corta (`overflow:hidden`): es señal de que sobra texto.

## Reglas de contenido

- Poco texto. Una idea por pantalla. Título ≤ 9 palabras, cuerpo ≤ 2 frases, tarjetas ≤ 6.
- Nada de guiones como puntuación. Puntos, comas y dos puntos.
- Un solo mundo oscuro: no hay tema claro. El único color fuerte es el cian (y en las escenas, los acentos
  que defina motion-scenes).
- El orbe habla en primera persona, corto y con algo de personalidad.
- Lo inventado o ilustrativo se marca (`demo`).
- `prefers-reduced-motion`: sin puerta ni tráiler, scroll sin smooth, orbe a 0.25× y texto de la burbuja sin
  animación. Las escenas muestran su póster quieto.
- Accesibilidad: el riel son botones con `aria-label`, la burbuja es `role="status"` con `aria-live`, cada
  escena lleva `role="img"` y su `aria-label` de `SCENE_ALT`. Todo lo decorativo va con `aria-hidden`.
