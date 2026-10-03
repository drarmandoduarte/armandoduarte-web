# Orden Códice #33 ter — la sede vuelve a «Fiesta Inn Mérida»

Pedido de Diana, 2/10/2026 por la tarde: «en el lugar del evento sea solamente Fiesta Inn Mérida». La sede vuelve a **«Fiesta Inn Mérida»** en todos los lugares donde la #33 puso «Fiesta Inn CORDEMEX». Capturas a 1440: `ficha-portada-1440.jpg` y `hechos-merida-1440.jpg`, generadas con `apps/web/check/capturas-33-ter.mjs`.

## Qué se hizo

- `web.json`: `inicio.ahora.meta1`, `inicio.taller.fichaLugarValor`, `taller.head.description` (la meta y la OG), `taller.hechos.dondeValor` y `taller.hechos.dondeAria`.
- `cabeza.ts`: el `Place` del `Event` en el JSON-LD.
- Semilla 001: el valor de `sede` y la nota del encabezado. **La fila de la base no la toca Rodolfo**: la corrige el CEO por SQL, como en la #33.
- `el-panel-del-equipo.test.ts`: el dato de prueba de la sede, para que diga lo mismo que la semilla.
- **Mensajes de WhatsApp: no hubo nada que cambiar.** Los textos de `comun.mensajes.*` no nombran la sede, ni en la #33 ni ahora.
- `lo-que-mando-armando.test.ts`:
  - fija «Fiesta Inn Mérida» en los cinco lugares de i18n y en el `Place` del JSON-LD;
  - la mide además contra el insumo del 28/9, que la dice así, y contra la orden #33, que ya anota la vuelta entre comillas latinas;
  - «CORDEMEX» pasa a la lista de textos que no pueden quedar en ninguna página publicada de `dist` (las cuatro, meta y JSON-LD incluidos). Se busca la palabra suelta, no «Fiesta Inn CORDEMEX», para cazarla en cualquier forma. El chequeo exige primero que cada HTML exista y pase de 1000 caracteres.

## Verificación

- Gate verde: 692 tests, 0 saltados.
- Fidelidad con `--update-snapshots`, declarada: `inicio` y `taller` a 1440, 900 y 390 (texto y png), más `taller-cabeza` (el JSON-LD). En el diff de texto lo único que cambia es «CORDEMEX» → «Mérida» (12 apariciones).
- **Mutación, una mitad por vez:**
  - JSON-LD: volví el `Place` a «Fiesta Inn CORDEMEX» y cayó 1 test, el de los textos del 2/10 (`merida.html todavía dice «CORDEMEX»`). Ese caso solo lo podía cazar el chequeo de `dist`, porque el JSON-LD no vive en i18n.
  - i18n: volví `dondeValor` a «Fiesta Inn CORDEMEX» y cayeron 2 tests (`expected 'Fiesta Inn CORDEMEX' to be 'Fiesta Inn Mérida'`).
  - Con los dos archivos devueltos, 5/5 en verde.

## Para dirección

- Falta corregir `ediciones.sede` en la base: lo hace el CEO, con el mismo SQL de la #33 pero al revés.
- `docs/informes/33/LEEME.md` sigue diciendo CORDEMEX. Es el registro de lo que se hizo en esa orden y no se reescribe.
