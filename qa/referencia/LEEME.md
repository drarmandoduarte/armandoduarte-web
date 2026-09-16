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

## Pero todavía la leen tres tests, y conviene saber cuáles

La D24 dice «ya no lo lee ningún test». Es la intención, y todavía no es cierto:

- `apps/web/e2e/comportamiento.spec.ts` — compara el menú, el tinte del header y
  el fundido de los dos lados. Mide **comportamiento**, que la #05 no tocó.
- `packages/ui/tokens.test.mjs` — comprueba que la tipografía y el aire del JSON
  estén textualmente en `estilo.css`.
- `apps/web/src/el-css-esta-entero.test.ts` — que no falte ni sobre ninguna
  regla, con el delta de cada orden declarado.

Los tres están verdes y ninguno se tocó en la #05: retirarlos es bajar
vigilancia, y eso lo decide dirección. Está anotado en `docs/tareas.md`,
pendiente 10.

**No se edita nunca**, y ahora por una razón más simple que antes: es lo que
Armando vio y aprobó el 12/9. Si hay que cambiar algo de la web, se cambia en
`apps/web`.

No se publica: el `.vercelignore` de la raíz deja `qa/` afuera del despliegue.
