# Orden #15 · F.4 · la función de Vercel arranca — 29/9/2026

Segunda corrida de F.4, después del **NO PASA** del CEO. Lo que sigue es lo que
se rompió, lo que se hizo y **contra qué se midió**. Ninguna clave aparece acá.

## Estado

| | antes | ahora |
|---|---|---|
| `GET /api/salud` | 500 `FUNCTION_INVOCATION_FAILED` | **200** `{"ok":true}` |
| `GET /api/yo` sin token | 500 | **401** `Falta el token de acceso.` |
| `GET /api/respaldo/cuantos` sin token | 500 | **401** |
| `GET /entrar` | **404** (no lo había visto nadie) | **200**, la pantalla dibuja |
| `GET /mi-espacio` | 404 | **200** |
| `GET /cualquier-cosa` | 404 | **200** (el SPA decide) |

Preview medido: `https://armandoduarte-familia-i1dg0hpbz-drarmandoduarte-7842.vercel.app`
(commit `6ed5505`). Cabeceras en vivo: `x-robots-tag: noindex, nofollow`,
`cache-control: no-store` en `/api/*`, y la CSP entera sin `unsafe-inline`, con
`connect-src 'self' https://jrscpjdscgycetyvenco.supabase.co` y nadie más.

## Las tres caídas, en el orden en que aparecieron

### 1 · La función recibía un `.ts`

`apps/api/package.json` exportaba `./src/index.ts`. Vercel compila la entrada de
la función (`apps/familia/api/index.ts`) y **no** las dependencias del
workspace: en el servidor, Node recibía TypeScript.

De las dos salidas que daba la orden se eligió **la (b), y no la (a)**, por un
motivo que decide: **esbuild no emite `emitDecoratorMetadata`**. `RolMiddleware`
recibe `SupabaseService` por el tipo del constructor y por nada más; empaquetar
el fuente con esbuild habría dado un build verde y una función que se cae al
inyectar, en ejecución. `tsc` es el único que emite esos metadatos.

### 2 · El CommonJS no podía requerir `jose`

Arreglado el `.ts`, el preview volvió a dar 500: `ERR_REQUIRE_ESM` sobre
`jose@6.2.12`, que es **ESM puro** (`"type": "module"` y un `exports` sin
condición `require`).

Así que el build tiene **dos pasadas, y hacen falta las dos** — la orden daba a
elegir entre ellas y en realidad se complementan:

- `tsc -p tsconfig.build.json` → CommonJS con los metadatos ya escritos como
  llamadas a `__metadata()`. CommonJS y no ESM porque el núcleo del kit viaja
  byte por byte con imports sin extensión (`./roles`), que Node ESM no resuelve.
- `scripts/empaquetar-funcion.mjs` → esbuild sobre **esa salida**, donde ya no
  hay decorador que emitir, y mete adentro lo que Node no puede requerir.

Qué entra y qué queda afuera **no es una lista de nombres**:
`scripts/se-puede-requerir.mjs` le pregunta a cada dependencia leyendo su
`package.json`. Una lista cazaría a `jose` y a nadie más. Hoy queda adentro
`jose`; afuera, los nueve requeribles (Nest resuelve opcionales con `require()`
dentro de `try/catch` y no se empaqueta).

### 3 · `/entrar` daba 404, y eso no estaba en el parte del CEO

Con la API ya en 200, **toda ruta que no fuera `/` devolvía 404**. El
`vercel.json` decía `"source": "/((?!api/).*)"` —la negación adelantada que se
lee en medio internet— y **Vercel no la matchea**: `/api/(.*)`, sin negación,
andaba. La regla pasa a ser el **orden**, que Vercel sí respeta. Se quitó
`cleanUrls`: con él `index.html` se publica como `/` y el destino del rewrite
queda siendo una redirección; para una sola página no ahorraba nada.

## Los guardianes: el que faltaba y los dos que estaban en verde sobre un 404

**Nuevo — `apps/familia/src/la-api-llega-compilada.test.ts` (6 tests).** Recorre
el **cierre real** de la función: arranca en `apps/familia/api/index.ts`, junta
los `@codice/*` que importa de verdad —sin leer los comentarios, que los nombran
una docena de veces— y sigue hacia adentro. Cada afirmación se vio en rojo con
su mutación antes de darla por buena:

| lo que vigila | la mutación que lo puso en rojo |
|---|---|
| el piso: el cierre salió de la entrada real | — (es el piso de los otros cinco) |
| ningún paquete del cierre resuelve a un `.ts` | devolver `"exports": "./src/index.ts"` |
| el `.js` existe compilado y hay un `build` que lo hace | borrar `apps/api/dist` |
| el `vercel.json` lo compila antes que la pantalla | sacar `--filter @codice/api build` del `buildCommand` |
| el empaquetado es CommonJS, conserva `design:paramtypes` y no deja un `require()` de ESM puro | devolver `"type": "module"`; apagar `emitDecoratorMetadata`; dejar `jose` afuera del empaquetado |
| el lector de manifiestos y la regla de «¿se puede requerir?» | aflojar la regla: este cae antes que los otros |

**Corregido — `cabeceras.test.ts` (6).** Comparaba el rewrite contra el texto
del archivo con un `toEqual`. Estaba **en verde sobre un 404**. Ahora afirma el
orden, prohíbe la negación en cualquier `source` y exige que el comodín cubra
las rutas declaradas en `src/rutas.ts`.

**Corregido — `e2e/servidor.mjs`.** Inventaba el fallback de SPA en vez de leer
el `vercel.json`, con un comentario que decía, palabra por palabra, que sin él
«`/mi-espacio` da 404 en QA y anda en producción — la peor clase de diferencia
entre los dos». **Pasó al revés.** Ahora aplica los rewrites del archivo, en
orden; con la negación puesta **no arranca** y dice que no sabe traducir ese
source. Medido: con el rewrite arreglado, `/`, `/entrar`, `/mi-espacio` y
`/cualquier-cosa` dan 200 y `/api/salud` da 501 (acá no hay función, y 501 no es
404 a propósito).

**El que ya existía y nunca se había corrido:** `e2e/f4-en-vivo.spec.ts` pide
`GET /entrar` y espera 200. Habría cazado el 404 el primer día. No corrió porque
necesita un preview de verdad — ver *Lo que necesita dirección*.

`@codice/familia` sube de 40 a **46** en `qa/piso-de-tests.md`. Gate entera:
313 tests declarados, 0 saltados, ninguna suite bajo su piso; `typecheck` y
`lint` en verde.

## De paso: la entrada de la función no la typechequeaba nadie

`apps/familia/tsconfig.json` incluía sólo `src`. El archivo del que depende todo
el despliegue —`api/index.ts`— estaba fuera del `tsc --noEmit`. Entró al
`include`, con `experimentalDecorators` para poder **leer** los tipos de NestJS
(esta app no escribe un solo decorador).

## Lo que quedó pendiente

- **La prueba en vivo del flujo** (login, autenticador, códigos de respaldo, los
  31 minutos): es del CEO, y ya se puede correr.
- **`e2e/f4-en-vivo.spec.ts` sigue sin poder correr solo.** El preview está
  detrás de *Vercel Authentication*, así que un `request.get` desde Playwright
  recibe un 302 al SSO. Lo de arriba se midió desde el navegador de dirección,
  que sí tiene la sesión. Para automatizarlo hace falta encender **Protection
  Bypass for Automation** en el panel y guardar su secreto — **es decisión de
  Germán**, cuesta un secreto más y no lo toca Rodolfo.

## Lo que necesita dirección

1. **¿Se enciende el Protection Bypass for Automation?** Sin eso, F.4
   automatizada no corre nunca sola y la prueba en vivo es siempre a mano.
2. El nombre del subdominio sigue sin confirmarse (§G.2 de la orden). Nada del
   código depende de él.
