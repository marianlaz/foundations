---
name: motion-scenes
description: >-
  Arma animaciones explicativas dibujadas en código (canvas, cada frame es una función del
  tiempo) para contar los conceptos clave de un producto, una historia o una arquitectura, y
  las mete en una web. Usa un motor propio con HUD, captions que entran palabra por palabra,
  pulsos por caminos, contadores y sellos. Además verifica cada escena renderizando frames
  en Chrome headless. Usar cuando Mariano pida "armame animaciones para esto", "una
  animación que explique X", "motion graphics como los de los tweets", "animá esta
  sección", "ingeniería inversa de este video", o pase links de X con motion pieces para
  estudiar. Skill personal: no está en el marketplace.
user_invocable: true
---

# motion-scenes

Escenas cortas que se repiten en loop (10–20 s), una por concepto, dibujadas en `<canvas>` con JavaScript
puro. No usa librerías ni video. Cada frame es `draw(ctx, t)`: una función pura del tiempo. Por eso se
puede pausar, recorrer, congelar para una captura o exportar a video sin cambiar nada.

## Qué hay acá

| Archivo | Para qué |
|---|---|
| `assets/engine.js` | El motor: helpers de dibujo, fondo + HUD + grano, montaje (IntersectionObserver, reduced motion, `?kxt=`) |
| `assets/scene-template.js` | Una escena mínima de ejemplo con todos los recursos básicos. Copiala para empezar |
| `assets/gallery.html` | Galería para revisar escenas con pausa y scrubber |
| `references/grammar.md` | La gramática visual sacada de los videos de referencia. **Leela antes de diseñar** |
| `scripts/refs.sh` | Baja los videos de posts de X y arma una hoja de contactos de 16 frames por video |
| `scripts/shoot.sh` | Renderiza frames de una escena en Chrome headless y los junta en una hoja para revisar |
| `scripts/cdp-shot.mjs` | Capturas en **tiempo real** (Chrome DevTools Protocol desde Node): para capas con estado (fondos, partículas simuladas, micro-animaciones HTML) donde `?kxt=` y el tiempo virtual no sirven |
| `examples/akasha-field.js` | Capa de fondo fija con estado: big bang en un punto, viaje 3D, vórtice hacia una escena, API para un tour (`bang/travel/focus/calm/bind`) |
| `examples/kx-cards.js` | Micro-animaciones sobre HTML existente sin tocar el texto: `flow` (chips en secuencia), `morph` (today → planned fila por fila), `rollcall`, `layers`, `uses` |

## Flujo

1. **Referencias (si hay).** Si Mariano pasa links de X: `scripts/refs.sh <dir> <url>...` y después leé cada
   `sheet<N>.jpg`. Anotá qué recursos se repiten y sumá lo nuevo a `references/grammar.md`. Si no hay links,
   usá la gramática como está.
2. **Conceptos.** Del guion o la web, elegí los 4–8 conceptos que más importan. Si no se animan, no se
   entienden. Para cada uno: en qué sección va, qué **mecanismo** muestra (no una ilustración) y cuál es
   el remate que queda quieto al final.
3. **Storyboard en tiempos.** Beats de 2–4 s con una caption por beat (≤ 9 palabras, una sola **palabra
   acento**). Escribilo como comentario arriba de cada escena. Los datos salen del material fuente. Si
   necesitás relleno, que sea genérico, y avisale a Mariano cuál es.
4. **Escribir las escenas.** Copiá `assets/engine.js` al proyecto y creá `<proyecto>/scenes.js` a partir
   de `scene-template.js`. Marca: `KX.theme({name, colors, sans, mono})` con los tokens del sitio (leé
   su CSS: `:root`, fuentes, color de acento). Todo en el espacio 1600×1000. Tiempos con `pr(t, a, b, ease)`
   y `env(t, a, b)`, nunca con estado. Cada escena termina en fade antes de repetirse.
5. **Verificar mirando.** `scripts/shoot.sh <scenes.js> <escena> t1 t2 …` con 4–10 tiempos que caigan en
   cada beat y en el póster. Leé la hoja y revisá: superposiciones, texto cortado contra los bordes,
   elementos que aparecen antes de tiempo, flashes feos, que la caption y la imagen digan lo mismo.
   Corregí y volvé a renderizar hasta que esté limpio. Ojo: las corridas son secuenciales (comparten
   perfil de Chrome). Si las corrés en paralelo, se pierden frames.
6. **Integrar.** Cada escena es `<figure class="kx-fig"><canvas class="kx" data-kx="nombre" role="img"
   aria-label="…"></canvas></figure>` más `<script src="engine.js"></script><script src="scenes.js"></script>`
   antes de `</body>`. CSS base:
   `.kx{width:100%;aspect-ratio:16/10;display:block;border-radius:10px}`. En columnas angostas conviene
   ensanchar la figura (≥ 800 px), porque debajo de eso la mono chica no se lee. Antes de editar el
   HTML: hacé un backup o, mejor, fijate que el proyecto esté en git. Si otra sesión está editando el
   mismo archivo, coordiná con ella en vez de pisarlo.
7. **Galería.** Copiá `assets/gallery.html` al proyecto, completá `SCENES` y abrila con `open` para que
   Mariano las vea.

## API del motor (`KX.h`)

- Tiempo: `pr(t,a,b,E.expo|out|io|back|lin)` da el progreso 0..1 en [a,b]. `env(t,a,b,in,out)` da una
  envolvente que entra, se mantiene y sale. `rnd(seed)` es un azar determinístico (siempre la misma seed).
- Texto: `T(ctx,s,x,y,{s,w,mono,c,al,a,grad,ls})`. `cap(ctx,t,a,b,'texto con **acento**',{x,y,s,al})`
  hace la caption kinética. `kv(ctx,[[k,v,color]],x,y,t0,t)` escribe filas mono tipeadas.
- Formas: `card(ctx,x,y,w,h,{fill,stroke,glow,dash,r,a})`, `rr`, `dot(ctx,x,y,r,col,a)`,
  `orb(ctx,x,y,r,t,col,{a,glow})` (el héroe) y `stamp(ctx,'TEXTO',x,y,p,col,rot)`.
- Caminos: `bez(a,d,bend,vertical)` arma una cúbica, `path(ctx,P,u0,u1,col,{lw,dash,glow})` la dibuja,
  `travel(ctx,P,t,a,b,col)` manda un pulso con cola y `cubic(...P,u)` da un punto sobre la curva.
- Otros: `hex(col,a)`, `grad(ctx,x,w)` (degradado de marca), `fmt(n)` (miles con coma) y `blur(ctx,px)`
  (se degrada bien donde no hay `ctx.filter`).
- Montaje: se reproduce solo en pantalla y arranca de cero al entrar (`data-kx-keep` lo evita). Con reduced
  motion muestra `poster`. `?kxt=N` congela todo en el segundo N. `canvas.kx.{seek,pause,paint,D}` controla
  cada escena. El evento `kx:frame` avisa en cada frame.

## Temas claro y oscuro

- Una escena puede nacer clara con `light: true` en su definición (el motor pinta papel y grilla blueprint).
- Cualquier escena oscura tiene variante clara sin reescribirla: `data-kx-theme="light"` en el canvas, o `"auto"`
  para que siga a `body.tone-light`. El motor dibuja con una paleta clara equivalente (tinta oscura, tarjetas
  blancas, acentos más saturados). Evitá colores literales en las escenas: usá los tokens de `C`.
- Verificá los dos temas: con `shoot.sh` (agregá `&theme=light` a la URL del harness) o con `cdp-shot.mjs`.

## Tres escalas de animación

1. **Escena en canvas** (este motor): cuenta un concepto entero, 12–28 s en loop.
2. **Capa de fondo con estado** (`examples/akasha-field.js`): continuidad entre secciones, reacciona a la voz y
   al tour. No es función pura del tiempo: se verifica con `cdp-shot.mjs`.
3. **Micro-animación sobre HTML** (`examples/kx-cards.js`): cuando el texto ya está perfecto, no se reemplaza
   por canvas; se le agrega movimiento con clases y variables CSS de la página.

## Extras que se pueden pedir

- **MP4/GIF de una escena:** renderizá con `?kxt=` a 30 fps (un frame cada 1/30 s, con el mismo método que
  `shoot.sh`, sin el tile) y uní todo con `ffmpeg -framerate 30 -i f_%04d.png -pix_fmt yuv420p out.mp4`.
- **Vertical 9:16 para redes:** usá otro espacio lógico. Hoy el motor fija 1600×1000, así que hay que
  parametrizar W/H en `mount` si se pide.

## Estado

Personal, **no subir al marketplace** hasta que Mariano diga. Cuando se comparta, empaquetarlo como plugin
(`motion-scenes`) con esta skill adentro. Nació con la web de un producto (2026-09-29).
