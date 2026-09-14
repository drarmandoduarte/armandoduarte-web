# `packages/ui/components` — vacío a propósito

Un componente sube acá cuando lo comparten **dos productos** (la web, el
consultorio, la academia, el asistente). Lo que comparten dos pantallas del mismo
producto vive en la carpeta `comun/` de ese producto —hoy,
`apps/web/src/web/comun/`.

Hoy hay un solo producto. Subir algo ahora sería adivinar cómo lo va a necesitar
el segundo, y una suposición en el design system la paga cada pantalla que la
hereda. Cuando entre el consultorio y necesite el mismo botón que la web, sube —
con su test y con el nombre que las dos usen.
