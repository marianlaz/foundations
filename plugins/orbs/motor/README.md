# Motor de orbes

El lenguaje de partículas de **Orbe Cian**, convertido en un motor reusable. Un orbe del Akasha se dibuja con su `hue`, su `form` y su nombre como semilla: el mismo nombre dibuja siempre el mismo orbe.

| Archivo | Qué es |
|---|---|
| `orbe.js` | El motor. Script clásico, sin bundler. |
| `orbe.html` | Vista previa de un orbe por parámetros de URL. Sin parámetros es Orbe Cian. |
| `galeria.html` | Las cuatro formas en una grilla 2×2, con tonos para comparar. |
| `orbe-cian.original.html` | El artifact original, tal cual (la única copia del código fuera de claude.ai). |

## API

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="./orbe.js"></script>
<script>
  try {
    var orbe = Orbe.create(document.querySelector('canvas'), { hue: 265, form: 'crystal', seed: 'atlas' });
    orbe.set({ hue: 42 });   // el tono cambia en caliente; forma, semilla o densidad rearman las partículas
    // orbe.destroy();
  } catch (e) {
    // e.code === 'SIN_WEBGL': no hay THREE o no hay WebGL. Mostrá un aviso.
  }
</script>
```

| Opción | Default | Qué hace |
|---|---|---|
| `hue` | `187` | Tono 0–360, la misma unidad que la ficha del orbe. 187 es el cian `#00e5ff`. |
| `form` | `'orb'` | `orb`, `ring`, `crystal` o `star`. |
| `seed` | al azar | Texto o número. Misma semilla, mismo dibujo. |
| `density` | `1` | Multiplica la cantidad de partículas (80 000, o 36 000 en mobile). |
| `interactive` | `true` | Arrastrar gira, el puntero empuja, click en el orbe entra (Escape o click para salir). |
| `still` | `false` | Dibuja un solo cuadro y no anima. Para miniaturas. |

Conserva todo lo del original: pixel ratio tope 2, `prefers-reduced-motion` (ritmo al 25 %), resize (con `ResizeObserver`, sirve para varios lienzos en una página) y el viaje de cámara hacia adentro.

## Formas y roles

| `form` | Rol en el Akasha | Cómo se ve |
|---|---|---|
| `orb` | generalista | 44 anillos de birome y una nube. Orbe Cian, sin cambios. |
| `ring` | vigía / monitor | Un disco ecuatorial de surcos finos con una división, lo de adentro gira más rápido; dos halos inclinados, núcleo chico, nube tenue. |
| `crystal` | analista / investigador | Un icosaedro: el trazo corre por las 30 aristas con pulsos, nudos en los vértices, polvo en las caras que se ilumina según hacia dónde mira cada cara. |
| `star` | ejecutor / hacedor | 26 a 35 rayos, largos y cortos, que nacen del núcleo; pulsos de luz viajan hacia afuera. Corona de anillos chicos y halo. |

Todas usan el mismo idioma: cada partícula se mueve sola en el vertex shader, mezcla aditiva, misma cola de empuje y brillo. `orb` usa el shader original intacto; las otras tres comparten uno con cuatro clases de partícula (órbita, flujo, vaivén, rayo).

## Ver

Desde esta carpeta:

```
python3 -m http.server 8000
```

- `http://localhost:8000/orbe.html`: Orbe Cian.
- `http://localhost:8000/orbe.html?form=crystal&hue=265&nombre=Atlas`: con `nombre`, la frase de abajo y la semilla (si no hay `seed`). `still=1` congela un cuadro.
- `http://localhost:8000/galeria.html`: la grilla. `?hue=mezcla` da un tono por forma; `?seed=` cambia la semilla de las cuatro.

También abre como `file://` (three.js viene del CDN).
