# `@codice/ui` — el contrato: **dos** entradas de CSS

Quien consuma este paquete importa **las dos**, y en este orden:

```ts
import '@codice/ui/fuentes';   // solo los @font-face
import '@codice/ui/styles';    // los tokens
```

| entrada | qué trae | cada cuánto cambia |
|---|---|---|
| `@codice/ui/fuentes` | los ocho `@font-face` de Great Vibes, Montserrat y Open Sans, con sus `unicode-range` | casi nunca |
| `@codice/ui/styles` | `codice-tokens.css`: los colores, la escala y el resto de los tokens | en casi cada orden |

## Por qué están separadas (orden Códice #09)

**No es «partir el CSS en dos pedazos para que pesen menos»** —los bytes son los
mismos—: es separar **lo que casi nunca cambia** de **lo que cambia siempre**,
que es el único criterio que hace que la caché sirva de algo. Una orden que
mueve un color no tiene por qué invalidarle al visitante los 2,7 KB de
`@font-face` que ya tenía.

Hasta la #08 eran una sola hoja y el argumento era bueno: «un solo import y el
producto tiene la marca». Lo que lo tumbó está medido en `docs/tareas.md` § 5b —
una hoja sola le cobra a cada página lo que agregó la sección que esa página no
usa.

## El orden importa

Primero las fuentes, después los estilos. Un `@font-face` tiene que estar
declarado cuando se aplica la regla que lo usa; al revés, el navegador pinta el
primer cuadro con la tipografía de sistema y la cambia al llegar la buena, que
es un salto de texto donde hoy no hay ninguno.

## Y en producción, un detalle que conviene saber

En `apps/web` la hoja de fuentes **no baja por el grafo de JavaScript**: la
compila `apps/web/scripts/hoja-de-fuentes.mjs` en un build propio, y el
prerender la enlaza. El motivo —con los dos errores de Vite que lo obligan— está
escrito en la cabeza de ese archivo. Para quien consuma el paquete el contrato
no cambia: son dos entradas, en ese orden.
