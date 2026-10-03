# Orden Códice #33 bis — la modalidad dice «Presencial»

Ajuste de Armando, 2/10/2026 13:31: de «Modalidad Presencial» a **«Presencial»**. Ya no se lee «MODALIDAD · Modalidad Presencial». Capturas a 1440: `ficha-portada-1440.jpg` y `hechos-merida-1440.jpg`, generadas con `apps/web/check/capturas-33-bis.mjs`.

## Qué se hizo

- `web.json`: `inicio.taller.fichaModalidadValor` y `taller.hechos.modalidadValor` pasan a «Presencial».
- La OG y el JSON-LD no nombran la modalidad. El Event usa `OfflineEventAttendanceMode` y la descripción dice «Taller presencial». No hubo nada más que cambiar.
- `lo-que-mando-armando.test.ts`:
  - fija «Presencial» en los dos lugares de i18n;
  - suma «Modalidad Presencial» a los textos que no pueden quedar en `dist`.

## Verificación

- Gate verde.
- Fidelidad con `--update-snapshots`, declarada: `inicio` y `taller` a 1440, 900 y 390 (texto y png). En el diff de texto solo se va la palabra «Modalidad».
- **Mutación:** volví `modalidadValor` a «Modalidad Presencial» y cayó 1 test, el de los tres textos del 2/10 (`expected 'Modalidad Presencial' to be 'Presencial'`). Al devolverlo, 5/5 en verde.

## Para dirección

El ajuste llegó por chat y **no está escrito en la orden #33**, que sigue diciendo «Modalidad Presencial». Por eso el test fija «Presencial» como literal y no lo busca en el pedido; la sede y el receso sí se siguen midiendo contra la orden. Si dirección corrige la orden #33, el test puede volver a medir la modalidad contra ella.
