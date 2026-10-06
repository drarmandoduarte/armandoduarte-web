# Web · Orden Códice #39: `/matrimonios`, «El dolor…» en espejo y la miniatura v3

Rama `web/39-matrimonios-dolor-y-miniatura`, desde `main` (`c984ed7`). Toca `apps/web` y una clave de `web.json` (el alt de la foto nueva).

**Qué se hizo**
- **`#dolor` en dos filas espejo.** Las dos filas usan la misma rejilla y la misma foto 3:2. La fila 1 no cambia. La fila 2 lleva los dos párrafos a la izquierda y `dolor-hijo-mirando` a la derecha.
  - Medido a 1440: las dos fotos dan **608×405** y cada una toca el borde de la rejilla (x 72 y 1368).
  - El texto va centrado en vertical contra su foto, sin línea entre filas, y la cita queda alineada a la rejilla.
  - En el teléfono, las dos filas muestran primero la foto.
  - `dolor-hijo` (la vertical) salió de la página y de `public/`; queda de reserva en los insumos.
- **La miniatura v3**: los dos `og-matrimonios-*.jpg` del insumo, con los mismos nombres. La `?v=` cambió sola: 630 `f5c2791f` → `20296c8d`, 1200 `1f613b29` → `3d37800f`. El alt no cambió.

**Verificación**
- **Gate verde:** 828 tests, 65 en Chromium, 0 saltados.
- **Huellas:** 42 imágenes en `/matrimonios`, las tres nuevas incluidas.
- **`check:altura`:** `#dolor` mide 1,45 pantallas a 1440×900 (había dado 1,48), así que **no hizo falta achicar las fotos**. A 1920 mide 1,31.
- **`check:renglones`:** sin huérfanos a los cuatro anchos.
- **Fidelidad: capturas actualizadas por la orden #39.** Solo cambia `matrimonios`: las imágenes a 1440/900/390 y las dos `?v=` en la cabeza. El texto visible no cambia.
- Capturas en esta carpeta: `dolor-1440.jpg` y `dolor-390.jpg`. Las genera `apps/web/check/capturas-39.mjs`, que además mide las dos fotos.

**Aparte, en un commit propio:** el PR #60 se mergeó con `check:tokens` en rojo. Mi script `apps/familia/check/molde-37-pr1.mjs` escribía a mano cuatro hex del `design.json`; corrí ese guardián antes de escribir el script y no después. Ahora el script lee los valores del `design.json`. `check:tokens` vuelve al verde y el script sigue pasando.

**Para mirar:** en `og-matrimonios-1200x630.jpg` (el del insumo, sin tocar) hay una franja horizontal un poco más clara cerca del borde de abajo, a la altura de los suéteres (y≈565). Parece una costura del retoque. Vale revisarla antes de verificar con Facebook y WhatsApp.
