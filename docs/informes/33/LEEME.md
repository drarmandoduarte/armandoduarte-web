# Orden Códice #33 — la web sin «Mi espacio» ni Spotify, reservas por WhatsApp

Pedido de Armando, 2/10/2026. Capturas a 1440 en esta carpeta: `cabecera-1440.jpg`, `pie-1440.jpg`, `hero-taller-1440.jpg` y `contacto-1440.jpg` (las genera `apps/web/check/capturas-33.mjs`).

## Qué se hizo

- **Dos banderas en `core`** (`packages/core/src/web/mi-espacio.ts`, junto a `APP_FAMILIA`): `MI_ESPACIO_EN_LA_WEB = false` y `SPOTIFY_EN_LA_WEB = false`, con el comentario de quién lo pidió y cuándo.
- **Con la bandera en `false`:**
  - cabecera, menú a 375 y pie: sin «Mi espacio»;
  - hero de `/merida`: «Reservar por WhatsApp» (naranja) + «Ver el programa» (contorno), sin el enlace de texto «Ver el programa ↓»;
  - «Lo que te llevas» e «Inversión»: un solo botón, «Reservar por WhatsApp» naranja;
  - cierre: «Reservar por WhatsApp» naranja + «Conocer a Armando», como antes de la #25;
  - tarjeta del taller de la portada: «Reservar por WhatsApp» naranja (el WhatsApp de Gaby que tenía antes de la #28) + «Ver el programa» en contorno;
  - banda AHORA: «Reservar por WhatsApp →», con el número de Gaby y el mensaje de reservar (ver la decisión 1);
  - JSON-LD del Event: sin `offers.url`.
- **Spotify escondido** en el contacto, en la lista de canales de la portada (queda 01 YouTube, 02 Facebook) y en el pie. YouTube, Facebook e Instagram siguen.
- **Los tres textos de Armando**:
  - «Fiesta Inn CORDEMEX» en la banda AHORA, la ficha de la portada, los hechos de `/merida` (también el aria del mapa), la descripción (meta y OG) y el `Place` del JSON-LD;
  - «Modalidad Presencial» en la ficha de la portada y en los hechos de `/merida`;
  - «Con un receso de 20 minutos» en el programa.
  - Semilla `001` corregida, junto con el test de `packages/db` que la lee.
  - Los mensajes de WhatsApp y `familia.json` no nombran ninguno de los tres.
- **La app no se tocó.**

## Verificación

- **Gate verde.** 692 tests declarados, 0 saltados. `@codice/web` pasa de 63 a 71 en el piso.
- `check:acento` en verde en las cuatro páginas, contraste con 0 pares por debajo, renglones y altura en verde.
- **Grep sobre `dist`**: 0 `familia.armandoduarte.com` y 0 `spotify` en las cuatro páginas. El JS publicado tampoco los tiene.
- **Las dos ramas de `la-web-no-nombra-vercel.test.ts`, probadas:**
  - build con las banderas en `true` → 7/7 en verde (lo de la #25 y la #28);
  - ese build con el test leyendo `false` → caen 5: cabecera/menú/pie, hero, Llevas/Inversión/cierre, portada y Spotify;
  - build en `false` con el test leyendo `true` → caen los mismos 5;
  - banderas de vuelta en `false` → 7/7 en verde.
- **Fidelidad con `--update-snapshots`, declarado.** Cambian las cuatro páginas a 1440, 900 y 390 (texto, png y enlaces; privacidad y términos por la cabecera y el pie), `taller-cabeza` (descripción, `Place` y `offers.url`) y las dos capturas del menú abierto. Revisé el diff de texto palabra por palabra: solo cambia lo de esta orden.
- `lo-que-mando-armando.test.ts`: fecha y horario se siguen midiendo contra el insumo del 28/9. Los tres textos nuevos se miden contra **la orden #33**, que es donde dirección los dejó escritos entre «». Rodolfo no crea insumos. Además comprueba que en `dist` no queda ninguno de los textos viejos.

## Decisiones que tomé y hay que mirar

1. **Banda AHORA.** Antes de la #25 decía «Ver el taller» → `/merida`, sin WhatsApp. La orden pide «Reservar por WhatsApp» con «sus mensajes». Usé el número de la portada (Gaby) y `comun.mensajes.reservar`, igual que la tarjeta del taller. El título de la banda sigue llevando a `/merida`.
2. **Cierre de `/merida`.** Volvió el «Conocer a Armando» que tenía antes de la #25. El botón principal ahora dice «Reservar por WhatsApp»; antes decía «Asegurar mi lugar».
3. ~~**«Modalidad Presencial»** queda debajo del rótulo «MODALIDAD»~~ · resuelto en la #33 bis: Armando lo ajustó a «Presencial» (2/10, 13:31).

## Pendiente para Germán

- **Legal.** `/privacidad` y `/terminos` siguen diciendo que «desde él se entra a Mi espacio» y que los lugares «se reservan en Mi espacio» (la aplicación a la que entras desde «Mi espacio» o «Reservar mi lugar»). Con la bandera apagada eso ya no es exacto. La orden no lo pide, así que no lo toqué: decide dirección.
- **Otros «cupo limitado».** Siguen en la descripción de `/merida` («…con Armando Duarte, cupo limitado») y en la bajada de la tarjeta de la portada («…en vivo, con cupo limitado»). No son el campo de modalidad y no los toqué.
- **Base de datos.** La fila `sede` de la edición en Supabase la cambia el CEO por SQL y lo anota en `infraestructura`. Este PR solo corrige la semilla.
- **`docs/tareas.md` #17**: volver a prender las dos banderas cuando Armando lo pida.
