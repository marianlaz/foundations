---
name: buscar-en-el-akasha
description: >-
  Busca en la Akasha Memory del registro (la memoria de la organización) con `akasha ask`, siempre en segundo plano, con
  filtros si sirven, y contesta citando cada doc_id. Usar cuando preguntan algo de la compañía que no está en tus skills
  ni en el marketplace: "qué es X", "cómo funciona Y", "quién es dueño de Z", "dónde está documentado…".
---

# Buscar en el Akasha

La memoria se consulta solo en segundo plano. Nunca la leas desde tu sesión: tu charla queda libre mientras busca.

1. **Armá la consulta.** Escribila en el idioma de la memoria (suele ser inglés): usá los términos, siglas y nombres
   exactos que usaría un doc (la sigla del dominio, el nombre del cliente o del servicio).
   ```bash
   akasha ask "<consulta>" --name "<etiqueta corta>" [--area <a>] [--tipo <t>] [--estado <s>] [--k <n>]
   ```
   Para un doc entero, `akasha read <doc_id>`. Para sus vecinos, `akasha related <doc_id>`. Para lo nuevo,
   `akasha changes --since "7 days"`.
2. **Avisá en una línea y quedate libre**: "no lo tengo a mano; lo mandé a buscar al Akasha, te aviso".
3. **Cuando vuelve** ("[Resultado en segundo plano · …]"), contestá desde ahí:
   - cada afirmación con su `[doc_id]`;
   - si el doc no está verificado, decilo;
   - si vino de la copia local (sin red), decilo también.
4. **Si no encontró nada**, decilo claro y proponé reformular, o `derivar-a-una-persona`.
5. Si la persona te pide frenar una búsqueda: `akasha buscar list` y `akasha buscar cancel <id>`.
