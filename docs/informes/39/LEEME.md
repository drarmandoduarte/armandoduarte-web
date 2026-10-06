# Web · Orden Códice #39: `/matrimonios`, el gancho primero, «El dolor…» en espejo y la miniatura de Diana

Rama `web/39-matrimonios-dolor-y-miniatura`, desde `main` (`c984ed7`). Toca `apps/web` y una clave de `web.json` (el alt de la foto nueva).

**Qué se hizo**
- **§1 · `#dolor` en dos filas espejo** (primer commit). Las dos filas usan la misma rejilla y la misma foto 3:2. La fila 1 no cambia. La fila 2 lleva los dos párrafos a la izquierda y `dolor-hijo-mirando` a la derecha.
  - Medido a 1440: las dos fotos dan **608×405** y cada una toca el borde de la rejilla (x 72 y 1368).
  - El texto va centrado en vertical contra su foto, sin línea entre filas, y la cita queda alineada a la rejilla.
  - En el teléfono, las dos filas muestran primero la foto.
  - `dolor-hijo` (la vertical) salió de la página y de `public/`; queda de reserva en los insumos.
- **§2 · La miniatura v4, la de Diana.** Los dos `og-matrimonios-*.jpg` del insumo, con los mismos nombres (1200×630 y 1200×1200, verificados). La `?v=` cambió sola: 630 `20296c8d` → `9e471f2c`, 1200 `3d37800f` → `15d94dcc`. El alt no cambió. (La v3 entró en el primer commit y la v4 la reemplaza en el segundo.)
- **§3 · El gancho primero.** El orden nuevo, el mismo en todos los anchos: hero → «¿Hace cuánto tiempo…?» → «El dolor…» → giro con botón → banda de hechos → fortalezas → frases → facilitador → cierre.
  - Se movió `<Hechos />` en `Matrimonios.tsx`, en el DOM: sin `order` de CSS y sin duplicados. «Ver el programa ↓» sigue apuntando a `#programa` (las fortalezas).

**Uniones de fondo** (medidas en el navegador, en el orden del DOM)
- Hero (crema) → «¿Hace cuánto…?» (foto con velo crema; en el teléfono, la foto ocupa la primera pantalla y debajo va crema). Antes las separaba la banda de hechos. Ahora el borde lo marca la foto, igual que en «¿Te suena?» de `/merida`. No hizo falta tocar nada.
- «El dolor…» (cálido) → giro (blanco): no cambia.
- Giro (blanco) → hechos (cálido) → fortalezas (crema): tres tonos distintos, el borde lo pone el cambio de color. Ninguna unión nueva junta dos secciones del mismo tono.
- Ya venían así y no los toca esta orden: fortalezas → frases (las dos crema) y facilitador → cierre (las dos terracota; el cierre lleva foto).

**Verificación**
- **Gate verde:** 828 tests, 65 en Chromium, 0 saltados.
- **Huellas:** 42 imágenes en `/matrimonios`, las tres nuevas incluidas.
- **`check:altura`:** verde. `#dolor` mide 1308 px = **1,45 pantallas** a 1440×900, así que no hizo falta achicar las fotos.
- **`check:acento`:** verde (320 elementos). **`check:contraste`:** 0 pares bajo el umbral (312 pares, 149 sobre foto). **`check:renglones`:** sin huérfanos a los cuatro anchos.
- **Fidelidad: capturas actualizadas por la orden #39.** Solo cambia `matrimonios`: las imágenes a 1440/900/390, las dos `?v=` en la cabeza y, en el texto, la línea de la banda de hechos, que se mueve de lugar sin cambiar una palabra.
- Capturas en esta carpeta: `matrimonios-1440.jpg` y `matrimonios-390.jpg` (la página entera, con el orden nuevo), y `dolor-1440.jpg` y `dolor-390.jpg`. Las genera `apps/web/check/capturas-39.mjs`.

**Aparte, en un commit propio:** el PR #60 se mergeó con `check:tokens` en rojo. Mi script `apps/familia/check/molde-37-pr1.mjs` escribía a mano cuatro hex del `design.json`; corrí ese guardián antes de escribir el script y no después. Ahora el script lee los valores del `design.json`. `check:tokens` vuelve al verde y el script sigue pasando.
