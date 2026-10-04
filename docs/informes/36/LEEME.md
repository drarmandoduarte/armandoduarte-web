# Orden Códice #36: «Libros publicados» (tres) y la miniatura del taller

Rama `web/36-libros-y-miniatura`, desde `main` (`42e1c26`, ya incluye la #35). Solo toca `apps/web` y `packages/core`.

## Qué se hizo

1. **«Obra» → «Libros publicados», con los tres** (`packages/core/src/i18n/es/web.json`):
   - `#quien` (portada): ahora dice *Construyendo Familias Fuertes* · *Padres digitalmente responsables* · *Inteligencias Múltiples en la Familia*. Los tres van en cursiva y se sacó «Autor de». Se cambiaron las claves `fichaObra*` por `fichaLibros*` (`Quien.tsx`).
   - `#facilitador` (`/merida`): «Construyendo Familias Fuertes · Padres digitalmente responsables · Inteligencias Múltiples en la Familia». Se cambiaron las claves `obraClave/obraValor` por `librosClave/librosValor` (`Facilitador.tsx`).
   - En el hero de la portada, «2 libros» pasa a **«3 libros»** (en pantalla sale en mayúsculas por CSS). La descripción de `<head>` y la sección «Libros» con dos tapas no cambian.
2. **La miniatura**: `apps/web/public/img/og-merida-1200x1200.jpg` y `og-merida-1200x630.jpg` se reemplazaron por los de `03 Producto/web/insumos/2026-10-03-miniatura-armando/`, con los mismos nombres y 1200×1200 / 1200×630 medidos. El `?v=` cambió solo: 630 `c72cdd49` → `349ff6d6`, 1200 `63d4f1fb` → `756abc35`. `ogImageAlt` de `/merida` = «Taller · El arte de amar a tu hijo adolescente». `og-home` no se tocó.

## Verificación

- **Gate verde:** 785 tests, 53 en Chromium, 0 saltados.
- **Huellas:** `las-imagenes-llevan-su-huella.test.ts` 4/4. Hay 20 imágenes con huella en `/` y 32 en `/merida`, la misma cantidad que antes.
- **`lo-que-mando-armando.test.ts`**, con un test nuevo para la #36. Compara contra la orden #36 (las comillas latinas), no contra una copia. Revisa:
  - las dos fichas, el «3 libros» y el `ogImageAlt` en i18n;
  - en `dist`, que ninguna página tenga el rótulo `>Obra<` ni `>2 libros<`;
  - que la ficha de `#quien` tenga los tres `<em>`;
  - y el `og:image:alt` de `/merida`.

  Se lo vio fallar con dos mutaciones:
  - (a) le saqué el tercer título a `librosValor` → rojo en `toBe(LIBROS)`;
  - (b) volví a poner `>Obra<` en `dist/merida.html` → rojo con «merida.html todavía tiene el rótulo «Obra»».

  Después de devolver los dos cambios, 7/7 en verde.
- **Fidelidad: capturas actualizadas por la orden #36.** Cambian `inicio` y `taller` a 1440/900/390, en los `.png` y en el `-texto.txt`, y también `taller-cabeza.json`. El diff de texto es exactamente:
  - «OBRA Autor de … y …» → «LIBROS PUBLICADOS … · … · Inteligencias Múltiples en la Familia»;
  - «LIDERAZGO2» → «LIDERAZGO3»;
  - las dos `?v=` de `og-merida-*`.

  `privacidad` y `terminos` no cambian.

## Capturas (1440×900, `apps/web/check/capturas-36.mjs`)

- `quien-ficha-1440.jpg` y `quien-portada-1440.jpg`
- `facilitador-ficha-1440.jpg` y `facilitador-merida-1440.jpg`

## Pendiente

- **Después del merge, el CEO verifica la miniatura** en el depurador de Facebook y pegando `armandoduarte.com/merida` en WhatsApp.
- **Decisión para Armando:** si manda la portada de *Inteligencias Múltiples en la Familia*, se suma la tercera tarjeta en «Libros».
