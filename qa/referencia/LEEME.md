# La referencia

Esto es **la web pública tal como se publicó el 12/9/2026**: el sitio estático,
HTML y CSS a mano, el primer approach que vio Armando y lo que estuvo sirviendo
producción hasta esta orden.

Sigue acá porque es **la referencia del guardián de fidelidad**
(`apps/web/e2e/fidelidad.spec.ts`): el port a React se mide contra estas páginas
—texto, píxeles, `href` y `<head>`— y un guardián sin referencia es un guardián
que no mira. Versionada adentro del repo, no depende de una ruta externa ni de
una variable de entorno que alguien olvide.

**No se edita nunca.** Si hay que cambiar algo de la web, se cambia en
`apps/web`, y el guardián se encarga de declarar la diferencia —así se hizo en la
orden #03, en `apps/web/e2e/cambios-visibles.ts`—. Tocar esta carpeta es mover la
vara en vez de saltarla.

No se publica: el `.vercelignore` de la raíz deja `qa/` afuera del despliegue.
