# Gramática de las covers de deck (template `cover` de un deck corporativo)

1. **Canvas negro** (`#000`, sin degradés propios): la cover es un statement sobre negro; la foto/asset es el único color.
2. **Asset héroe a la derecha, full-height**: caja desde x=40% hasta el borde (5486400 EMU de 9144000), relleno CENTER_CROP sin deformar.
3. **Scrim negro→transparente** horneado sobre el borde izquierdo del asset (~22% del ancho): funde la foto al negro y deja la columna de texto limpia.
4. **Columna de texto a la izquierda**: margen x≈6.9%, arranca ~35% de la altura, ancho útil ~47%; alineada a la izquierda, nunca centrada.
5. **Jerarquía de dos niveles**: título enorme (Montserrat 800, 47pt, 1–2 palabras = 1 línea, 3+ = 2 líneas balanceadas con auto-shrink) + descripción corta (400, 21pt ≈ 45% del título): rol del deck o una frase.
6. **Coral solo para LA cosa**: exactamente un término coral por headline (`#FF573D`); "si todo está resaltado, nada lo está". Ámbar solo en lockups de edición (cover-event).
7. **Logo blanco abajo-izquierda** (opcional; x≈8.8%, y≈87.6%, ~11% del ancho), con aire; nunca recoloreado ni sobre zona ruidosa sin scrim.
8. **Mucho aire**: nada en las esquinas salvo el logo; sin chips, íconos ni bordes. La restricción es la marca.
9. **Familias**: `cover` (statement + asset), `cover-photo` (marca protagonista + foto, investor deck), `cover-event` (lockup de edición tipo EVENTO **Q2** 2026).
10. **Adaptación a video** (`assets/cover.html`): Plus Jakarta Sans en vez de Montserrat, coral `#FF6447`, fondo `#08070e`; el frame/orbe del video es el asset; eyebrow coral con rayita ("Introducing", "Most voted · October") arriba del título completo; sello redondo chico "Nº n" en la columna negra para los más votados; logo solo si el spec trae `logo`.
