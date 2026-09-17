# La referencia

Esto es **la web pública tal como se publicó el 12/9/2026**: el sitio estático,
HTML y CSS a mano, el primer approach que vio Armando y lo que estuvo sirviendo
producción hasta esta orden.

## Desde la orden #05 es **historia**, no la vara (D24)

Fue la referencia del guardián de fidelidad desde la #01 hasta la #04, y su
trabajo lo hizo: probó que el port a React dibujaba el sitio estático a **cero
píxeles de diferencia**, doce comprobaciones en verde.

La #05 es la primera orden que cambia la web **a pedido del cliente** —la paleta
entera del manual de Construyendo Familias Fuertes, ocho íconos, seis
fotografías, dos teléfonos y la ruta `/merida`— y contra estas páginas ya no hay
nada que probar. El guardián de fidelidad pasó a compararse contra las capturas
de la última versión aprobada, versionadas en `apps/web/e2e/__snapshots__/`, con
el mismo presupuesto de cero píxeles. `apps/web/e2e/cambios-visibles.ts`, que
declaraba el delta de la #03, se borró: su trabajo terminó con él.

## Y desde la #05 no la lee ningún test

La D24 lo pedía y al cerrarse la #05 es cierto. Los tres que quedaban se
retiraron con la frase **«retirados por D24: la referencia del port cumplió su
propósito en la #04»**:

- `packages/ui/tokens.test.mjs` — el bloque que ataba la sección `web` del JSON a
  `estilo.css` (8 comprobaciones).
- `apps/web/src/el-css-esta-entero.test.ts` — el archivo entero (4).
- `apps/web/e2e/comportamiento.spec.ts` — sólo la mitad comparativa; sus dos
  tests siguen vivos afirmando cada estado contra su valor literal.

También se fue el segundo servidor de `playwright.config.ts` y la variable
`ESTATICO_DIR`. Nada de la gate depende ya de esta carpeta: se puede leer, se
puede citar, y si un día desaparece no se rompe ninguna comprobación.

Lo que se queda acá y sigue teniendo valor son **las nueve fotos originales de
Armando** en `img/`, incluidas las tres que la #05 sacó de `public/` por no
usarse.

**No se edita nunca**, y ahora por una razón más simple que antes: es lo que
Armando vio y aprobó el 12/9. Si hay que cambiar algo de la web, se cambia en
`apps/web`.

No se publica: el `.vercelignore` de la raíz deja `qa/` afuera del despliegue.
