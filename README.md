# Foundations

Las skills esenciales para crear con agentes, empaquetadas como un marketplace de Claude Code. Lo agregás una vez y después instalás solo los plugins que necesitás.

## Instalar

En Claude Code:

```
/plugin marketplace add marianlaz/foundations
/plugin install think@foundations
```

Cambiá `think` por el plugin que quieras (tabla de abajo). El repo es público: no hace falta nada más.

Para actualizar: `/plugin marketplace update foundations`.

## Plugins

| Plugin | Para qué |
|---|---|
| `think` | Cómo pensar y escribir con agentes |
| `episodes` | Episodios animados contados por un personaje (el motor de Sunday) |
| `visual` | Lenguaje visual en código: animaciones, portadas y webs con orbe |
| `orbs` | Orbes del Akasha |

## Skills

### think
- **`simple`**: dial de profundidad de 0 a 11. Piensa el problema completo y responde al nivel pedido: 0 es una sola cosa dicha simple, 11 es todo con opciones y trade-offs. `/simple 3`.
- **`asd`**: acorta una respuesta a muy corto, medio o largo y la reescribe con reglas ASD-STE100 (oraciones cortas, voz activa, una palabra = un significado). `/asd`, "más corto", "sacale el relleno".

### episodes
- **`episode`**: un episodio animado en la voz del personaje: guion → voz (ElevenLabs) → escenas dibujadas en canvas → `episode.mp4` + poster.
- **`series`**: una mini serie desde tus notas, con arco entre episodios, sonido y tráiler, publicada en la galería.
- **`gallery`**: publica los episodios como sala de proyección privada en claude.ai (posters, player, likes, feedback e ideas).
- **`instance`**: crea un personaje nuevo (nombre, persona, voz, paleta) con las mismas skills de episodios.

### visual
- **`motion-scenes`**: animaciones explicativas dibujadas en código (HUD, captions palabra por palabra, pulsos, contadores) para meter en una web; verifica cada escena en Chrome headless.
- **`video-thumbnails`**: thumbnails 16:9 y hero 2:1 a partir del contenido real del video: elige frames con ffmpeg, escribe un gancho de 3–6 palabras y compone en Chrome headless.
- **`orb-web`**: webs y presentaciones de una página en orbe style: capítulos de pantalla completa sobre un orbe de partículas 3D, con puerta, tráiler y narrador. Plantilla genérica, contenido en un array y verificación en Chrome headless.

### orbs
- **`forjar-orbe`**: de "qué querés que exista" a una capacidad agéntica con nombre, esencia, runas, forma y color, en el formato del Akasha. Trae el motor de orbes 3D (`motor/`).
- **`buscar-en-el-akasha`**: busca en la memoria de la organización con `akasha ask` y contesta citando cada doc_id.
- **`explicar-akasha`**: explica el Akasha desde su ayuda: orbes, runas, forja, Biblioteca, permisos, conectores.
- **`derivar-a-una-persona`**: cuando la respuesta no está, sugiere a quién preguntar y deja el mensaje listo. Nunca manda nada.

## De dónde sale cada skill

Son copias de skills personales. Los originales se editan afuera y este repo se sincroniza desde ellos.

| Skill | Origen |
|---|---|
| `simple`, `asd`, `motion-scenes`, `video-thumbnails`, `forjar-orbe` | skills personales (`~/.claude/skills/<skill>`) |
| `episode`, `series`, `gallery`, `instance` + `character/` + `episodes/README.md` | plugin Sunday 0.1.0 |
| `orb-web` | una web de una página, con el contenido reemplazado por un ejemplo neutro |
| `buscar-en-el-akasha`, `explicar-akasha`, `derivar-a-una-persona` | las skills del orbe guardián del Akasha |

## Notas

- **episodes** trae el `character/` de Sunday, que es el molde en blanco (persona con TODO). Las skills lo leen desde la raíz del plugin; sin él no arrancan. Para un personaje propio: skill `instance`.
- **episodes** necesita `ELEVENLABS_API_KEY` en el entorno para la voz. La clave nunca va en el plugin.
- **orbs**: `buscar-en-el-akasha` usa el CLI `akasha`, que lee la memoria (KB) de tu organización.
- `video-thumbnails/examples/spec.json` apunta a una carpeta de ejemplo (`./episodes`); es solo un ejemplo.
