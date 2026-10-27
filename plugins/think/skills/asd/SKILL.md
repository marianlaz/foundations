---
name: asd
description: >-
  Shorten a response to one of three levels — muy corto (one line), medio (the
  answer and the key steps) or largo (all the content, without filler) — and
  rewrite it with ASD-STE100 Simplified Technical English rules: short
  sentences, active voice, one instruction per sentence, one word = one
  meaning. The level is optional — without it, the skill picks it from the
  context. Other skills (PRD, KB pages) call it to write their output. Use when
  the user invokes /asd, or says "más corto", "resumilo", "sacale el relleno",
  "bajale la verbosidad", "en criollo y corto", "STE", "simplified technical
  english", "make it shorter", "too long", "tl;dr".
user_invocable: true
---

# /asd — tres niveles de largo + ASD-STE100

Toma un texto y lo devuelve **más corto y más claro**. Dos ejes, siempre juntos:

1. **Nivel** — `muy corto`, `medio` o `largo`. Cuánto se corta.
2. **ASD-STE100** — cómo se escribe lo que queda. Se aplica en los tres niveles.

## Qué texto se reduce

- `/asd` solo, o `/asd <nivel>` → la **última respuesta** del asistente.
- `/asd [nivel] <texto>` → ese texto.
- `/asd [nivel] <pregunta>` → respondé la pregunta ya en ese nivel.
- El modo dura **una respuesta**. Si el usuario dice "seguí así" o "dejalo en
  ASD", se mantiene hasta que diga lo contrario o cambie el tema.

El nivel es el primer argumento. Aceptá sinónimos: `corto` / `1` / `short` →
muy corto; `2` / `mid` → medio; `3` / `long` → largo. Sin nivel, es **auto**.

## Los tres niveles

| Nivel | Corte aprox. | Qué sale |
|---|---|---|
| **largo** | 10–30 % | **Todo el contenido.** Solo sale el relleno: muletillas, preámbulos ("Buena pregunta", "Claro, te explico"), cierres de cortesía, hedges ("podría ser que quizás"), resúmenes que repiten lo dicho y transiciones vacías. |
| **medio** | 50–65 % | **La respuesta y los pasos clave.** Un ejemplo en vez de tres. Sin contexto histórico ni alternativas descartadas. El "por qué" solo si cambia la decisión. Listas en vez de prosa. |
| **muy corto** | 85–95 % | **Una línea.** La acción o la respuesta, en una sola oración. Si hay una advertencia, va en esa línea. |

Medí el corte en palabras, sin contar bloques de código.

## Nivel auto

Sin nivel, partí de **medio** y movete un nivel por señal fuerte:

- **→ muy corto:** el usuario pidió "corto", "tl;dr", "decime nomás", o la
  respuesta es un sí/no o un dato puntual.
- **→ largo:** hay riesgo (acción destructiva, producción, dinero, seguridad,
  datos personales), el usuario está aprendiendo el tema, o el texto es un
  procedimiento que va a ejecutar paso a paso.
- Si hay señales en las dos direcciones, quedate en **medio**.

Mostrá el nivel en la primera línea:

```
ASD medio · auto (respuesta larga, sin riesgo)
```

Con nivel explícito, solo `ASD medio`.

## Lo que nunca se corta

En ningún nivel se pierde:

- **Código, comandos, rutas, URLs, IDs, números y fechas** — se copian exactos.
  Un bloque de código no se resume: se quita entero o se deja entero.
- **Advertencias** (WARNING / CAUTION): lo que puede romper algo, borrar datos o
  costar dinero. Si el nivel no da lugar, la advertencia ocupa la línea.
- **La respuesta a la pregunta.** Si el corte la vuelve falsa o ambigua, subí
  al nivel siguiente y decí en una línea por qué.
- **Pedidos de input al usuario** (preguntas abiertas, decisiones pendientes).

Reducir la presentación nunca es permiso para pensar menos: el análisis es el
mismo en `largo` y en `muy corto`.

## ASD-STE100 — reglas que se aplican

ASD-STE100 (Simplified Technical English) es el estándar aeroespacial para
escribir documentación técnica sin ambigüedad. En inglés se aplica tal cual. En
español se aplican las mismas reglas de estructura (el diccionario aprobado es
solo en inglés: usá la palabra más común y concreta).

**Palabras**

- Una palabra = un significado. Si usaste "deploy" para algo, no lo llames
  después "release" ni "publicación".
- Verbos simples y concretos: "usar", no "utilizar"; "start", no "initiate";
  "do", no "perform".
- Nada de verbos frasales ambiguos en inglés ("set up" → "configure",
  "carry out" → "do").
- Términos técnicos (nombres de servicios, comandos, campos) se mantienen: son
  "technical names" en STE.
- Grupos de sustantivos de máximo 3 palabras. "Pipeline de import de pedidos
  del cliente Acme" → "el import de pedidos (Acme)".

**Oraciones**

- Procedimientos: **máximo 20 palabras** por oración. Descripciones: **máximo 25**.
- **Una instrucción por oración.** "Abrí el archivo y cambiá el puerto" → dos oraciones.
- Instrucciones en **imperativo**, empezando por el verbo: "Corré `make test`."
- Si hay una condición, va primero: "Si el test falla, revisá el log."
- **Voz activa.** "El job carga los datos", no "los datos son cargados por el job".
- Tiempos simples: presente, pasado, futuro. Evitá gerundios y "-ing" como
  sustantivo ("When checking..." → "When you check...").
- Usá artículos ("el", "la", "the", "a"). Solo en `muy corto` se pueden sacar.

**Párrafos y estructura**

- Un tema por párrafo. **Máximo 6 oraciones** por párrafo.
- Pasos secuenciales → lista numerada. Ítems no ordenados → bullets.
- Advertencias antes del paso al que se aplican, no después.

## Formato de salida

1. Línea de nivel (`ASD medio` o `ASD medio · auto (motivo)`).
2. El texto reducido. Nada más.

No expliques qué cortaste ni muestres un diff, salvo que el usuario lo pida.
Si el usuario después pide "más corto" o "más largo", movete un nivel.

## Uso desde otro skill o agente

Otros plugins (`prd-expert`, `kb-expert`) usan esta skill como **estilo de
escritura** de lo que producen. El llamador dice qué nivel aplica a qué parte.
En ese modo:

- **Sin línea de nivel.** El texto va directo al documento.
- **La estructura del llamador manda.** Las secciones obligatorias de un
  template o de un tipo de página no se borran ni se fusionan, en ningún
  nivel. El nivel se aplica *dentro* de cada sección.
- **Las reglas del llamador ganan.** Si el llamador exige un dato (un
  placeholder, un tag de confianza, un criterio de aceptación), ese dato queda.
- **Un solo pase.** Escribí el texto ya en STE; no lo escribas largo para
  después recortarlo.
