# Orden Códice #25 — La puerta desde la web

Capturas: `apps/web/check/capturas-25.mjs` (cabecera, menú a 375, pie, hero y cierre de `/merida`, banda «AHORA», a 1440 y 375).

## Qué se hizo

- `packages/core`: `APP_FAMILIA = 'https://familia.armandoduarte.com'` y `enlaceAMiEspacio(destino?, base?)` → `…/entrar` o `…/entrar?ir=<ruta>`. Solo arma `?ir=` con rutas internas.
- **Preview:** la web lee `VITE_APP_FAMILIA` en el build (solo `https://host`; cualquier otra cosa vuelve al subdominio). Nunca hay una URL de Vercel en el código.
- **Cabecera:** «Mi espacio →» a la izquierda de WhatsApp, en el cromo neutro (como «Menú»; acento solo en hover). A 600 px o menos se esconde y aparece **primero en el menú**. **Pie:** último de «Explorar». Las legales lo heredan.
- **`/merida` (hero y cierre «Reservar»):** «Reservar mi lugar →» naranja hacia `…/entrar?ir=/me-anoto/el-arte-de-amar-a-tu-adolescente`; WhatsApp en contorno, «Prefiero escribir por WhatsApp», con el mismo mensaje de antes.
- **Banda «AHORA»:** su enlace pasa a «Reservar mi lugar →» hacia la app, con el estilo de enlace de la banda.
- **JSON-LD del Event:** `offers.url` es el mismo enlace.
- **Capturas de referencia actualizadas por la orden #25:** las 31 de `e2e/__snapshots__` (cabecera y pie en las cuatro páginas; botones y JSON-LD en `/merida`; el menú abierto). Diff de enlaces revisado a mano.

## Mutaciones

| qué se rompió | cayó en |
|---|---|
| un `https://codice-familia.vercel.app/entrar` escrito en el pie | «ningún vercel.app en el HTML publicado» |
| el build con `VITE_APP_FAMILIA` de Vercel | los tres tests (el camino del preview funciona; esa variable no va en producción) |
| el pie sin «Mi espacio» | el piso: «cabecera, menú y pie» (2 de 3) |
| `enlaceAMiEspacio` | casos de tabla en `core` (`https://…`, `//…`, `/\…` → `/entrar` a secas) |
