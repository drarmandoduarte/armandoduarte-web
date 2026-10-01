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

## Auditoría del CEO (PR #41) — los cuatro ajustes

1. **«Ver el programa ↓»** vuelve al hero de `/merida` como enlace de texto (`.hero-enlace`, cromo neutro, acento solo en hover) debajo de la línea de datos. `comun/Hero.tsx` suma la prop opcional `debajo`; la portada no la usa.
2. **Banda AHORA:** el título del taller es un enlace a `/merida`; la acción de la derecha sigue «Reservar mi lugar →».
3. **«Lo que te llevas»** e **«Inversión»** pasan a «Reservar mi lugar →» hacia la app (naranja). En «Inversión», WhatsApp queda segundo en contorno («Prefiero escribir por WhatsApp», mensaje `asegurar` de siempre). En «Llevas» solo el botón principal. A 375 el botón de contorno no entraba en la tarjeta de precio (la página medía 396 px): dentro de `.plan`, a ese ancho, el botón se parte en dos renglones.
4. Franja de hechos: sin cambios (solo el JSON-LD).

Capturas nuevas: `llevas-taller-*.jpg`, `inversion-taller-*.jpg`; regeneradas hero, AHORA y cierre. Fidelidad: capturas de `inicio` y `taller` actualizadas con `--update-snapshots` por la auditoría del #41 (diff de enlaces revisado: `#programa`, `/merida` del título de AHORA y dos `…/entrar?ir=…` donde antes había `wa.me`).

| mutación | cayó en |
|---|---|
| el botón de «Inversión» a `#reservar` (sin enlace a la app) | «EL PISO: /merida reserva en la app…» (3 de 4) y «“Lo que te llevas” e “Inversión” reservan en la app…» (`«Inversión» no lleva a la app`) |

Pendiente (no es de esta orden): a 320 px el hero de `/merida` desborda (la palabra «ADOLESCENTE», 367 px); ya pasaba antes de estos ajustes.
