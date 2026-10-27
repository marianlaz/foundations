# El motor del orbe

Three.js r128 desde cdnjs (`three.min.js`), un `THREE.Points` con un `ShaderMaterial` propio, mezcla aditiva y
sin depth. Vive en el script `orb()` de la plantilla. Si no hay WebGL o no carga Three.js, marca
`window.__noOrb` y la página entra directo, sin puerta.

## Partículas

80.000 en desktop, 36.000 en mobile. Cada una gira en un círculo alrededor de su propio eje:

- 38 % son **anillos**: 44 ejes compartidos (`RINGS`), radio 0.72–1.22, giran más rápido. Dibujan las órbitas.
- 62 % son **nube**: eje al azar, radio 0.25–1.05 cargado hacia afuera, giro lento.

| Atributo | Qué guarda |
|---|---|
| `position` | Vector base perpendicular al eje (punto de partida del círculo) |
| `aAxis` | El eje de giro |
| `aData` | `x` fase inicial, `y` velocidad angular (con signo), `z` radio, `w` semilla 0–100 |
| `aScat` | Posición de dispersión en pantalla (modo scatter) |
| `aRing` | 1 si es de anillo |
| `aGroup` | 0, 1 o 2: a qué orbe va en `split3` |
| `aF0`, `aF1` | Dos figuras del tráiler (texto rasterizado), se mezclan con `uMix` |

## Uniforms

| Uniform | Rango | Efecto |
|---|---|---|
| `uTime` | s | Reloj (a 0.25× con reduced motion) |
| `uScatter` | 0–1 | Cada partícula va a su `aScat` y flota |
| `uRing` | 0–1 | Los anillos brillan 1.8×, la nube baja a 0.3× |
| `uPulse` | 0–1 | Una onda radial que respira |
| `uSplit` | 0–1 | Se achica a 0.42 y se separa en tres orbes (`uOff0/1/2`) |
| `uBright` | 0–2.2 | Brillo general (también lo mueve el tráiler) |
| `uRot` | mat3 | Rotación: giro automático, arrastre con el mouse e inercia |
| `uMouse`, `uMouseOn` | | Las partículas cerca del puntero se apartan y se ponen blancas |
| `uFig`, `uMix` | 0–1 | Cuánto forman la figura del tráiler y cuál de las dos |
| `uImp`, `uSwirl` | 0–1, rad | Implosión hacia el centro con giro en espiral |
| `uSize`, `uPR`, `uH` | | Tamaño del punto según densidad de píxeles y alto de ventana |
| `uColor` | `0x00E5FF` | El color. Cambiarlo acá cambia el orbe entero |

El fragment shader dibuja cada punto como un disco con caída suave (`pow(1-d, 2.2)`) y alfa 0.55 × brillo.

## Modos

Cada capítulo pide uno con `orb`. Los valores de `MODES` son objetivos; el loop interpola hacia ellos
(`k = 1 - 0.02^dt`), así cada cambio es suave.

| Modo | s · r · p · x · b | Cuándo |
|---|---|---|
| `calm` | 0 · 0 · 0 · 0 · 1 | Por defecto. Siempre en `scene` y `wide` |
| `scatter` | 1 · 0 · 0 · 0 · 0.8 | El problema, lo desparramado. Se centra y se agranda |
| `gather` | 0 · 0 · 0 · 0 · 1.25 | La idea: todo junto, más brillante |
| `dim` | 0 · 0 · 0 · 0 · 0.5 | Un origen chico, la noche, el antes |
| `ring` | 0 · 1 · 0 · 0 · 1.05 | Procesos, ciclos, estructura |
| `pulse` | 0 · 0 · 1 · 0 · 1.1 | Feedback, algo vivo, una decisión |
| `split3` | 0 · 0 · 0 · 1 · 1 | Tres partes, tres roles |
| `bright` | 0 · 0 · 0 · 0 · 1.55 | Impacto, cierre |

(s scatter, r ring, p pulse, x split, b bright)

**Sumar un modo:** agregá la entrada en `MODES` con esos cinco números. Si necesitás un efecto nuevo, sumá un
uniform, su campo en `cur`/`tgt`, la interpolación en `frame()` y el uso en el vertex shader, en ese orden.
Mantené el estilo: un solo número 0–1 por efecto.

## Posición

`place()` decide dónde va y qué tamaño tiene, según el layout del capítulo activo:

- `gate`: centro, 0.5 (0.42 en mobile). `trailer`: centro, 1.
- `scene` y `wide`: 0.2, esquina arriba a la izquierda (`wide` un poco más arriba, para no pisar el kicker).
  En mobile, 0.16 arriba a la derecha.
- `side`: a la derecha, 1. `center`: arriba al centro, 0.9. Mobile: arriba, 0.62.
- `scatter` siempre se centra y va a 1.

`window.__orbSet(i)` lo llama la navegación al cambiar de capítulo. El glow (`#glow`, un div con blur) sigue
la proyección del orbe en pantalla y crece con scatter e implosión.

## Palabras que orbitan

`SITE.words`: cada una es un div `.word` que gira en su propia órbita (radio 1.42–1.64) y se proyecta a
pantalla; atrás se desenfoca y se apaga. Se esconden en `scene`, `wide`, `split3` y en el tráiler. En scatter
se van a su posición dispersa. Usá 6–10 palabras cortas en minúscula del tema de la web.

## Puerta y tráiler

La página arranca en la **puerta**: el orbe chico al centro y "Tocá al orbe". Scrollear, ↓ o Esc entran
directo. Tocar el orbe dispara el **tráiler** (~13 s, un solo reloj `performance.now`):

| t (s) | Qué pasa |
|---|---|
| 0–7.1 | Las partículas escriben `SITE.trailer.words`, una cada 1.6 s, con la caption en mono abajo |
| 7.8–9.4 | Implosión en espiral hacia un punto, cada vez más rápido y más blanco |
| 9.4–9.6 | Nada |
| 9.6 | Big bang: destello (`#flash`), onda (`#ring`), temblor; el orbe renace, se pasa y se asienta |
| 10.4–12.8 | El nombre del orbe (`SITE.orb`) se arma desde el blur, con `SITE.subtitle` |
| 12.8 | Se abre la página en el primer capítulo |

Las figuras se arman con `figure(txt)`: el texto se dibuja en un canvas en Bricolage 600, se muestrea cada
2 px y se reparte entre las N partículas. Hay dos ranuras (`aF0`, `aF1`): mientras una se ve, la otra se
carga con la palabra siguiente, y `uMix` cruza entre las dos.

**Cambiar las palabras:** editá `SITE.trailer.words`. Tienen que ser **exactamente 5** (los tiempos `AT`
están fijos); la última es la pregunta (`¿?`) y su caption es `SITE.trailer.ask`. Palabras cortas (≤ 8
letras) para que entren a lo ancho en mobile. `start` es lo que dice el orbe al arrancar y `bang` al nacer.

Arriba de todo, seguir para arriba (rueda, trackpad o tirar en el celular) vuelve a la puerta.

## Para revisar frames

- `?intro=skip` entra directo; con `#id` va a ese capítulo.
- `?intro=play` arranca el tráiler solo a los 0.6 s; capturá a 2.5, 5.6, 9.9 y 11.8 s.
- El orbe tiene estado y depende del tiempo real: capturalo con `motion-scenes/scripts/cdp-shot.mjs`.
