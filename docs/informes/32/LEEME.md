# Orden Códice #32 — El WhatsApp con prefijo de país y bandera

Capturas en esta carpeta: `/empezar` a 1440 y 390, con el campo **cerrado**, **abierto buscando «arg»** y **con error**. Script: `apps/familia/check/capturas-32.mjs`.

## Qué se hizo

- **`CampoWhatsApp`** (`apps/familia/src/comun/`). Se usa en `/empezar`, en Mis datos y en el paso de «Me anoto».
  - Se ve como **un solo campo**: el borde y el fondo de los demás, partido adentro por una hairline. A la izquierda va el país (bandera 20×15, «+52» y chevron) y a la derecha el número nacional (`inputmode="tel"`, con un celular del país como ejemplo: «222 123 4567» para México).
  - El foco pinta el borde entero en teal.
- **El selector** es una lista propia, no un `<select>`:
  - arriba un buscador («Busca tu país»), que busca por nombre, código o prefijo;
  - México primero, después LATAM y después el resto por nombre (`paisesParaElegir` de `core`);
  - por teclado: flechas, Home/End, Enter, Esc devuelve el foco, Tab cierra, y tipear sobre el botón abre ya buscando; `aria` de combobox con `aria-activedescendant`;
  - sombra suave, esquinas de 12, fondo crema, opción activa en cálido, sin telón;
  - se cierra al elegir o con un clic afuera, y ocupa el ancho del campo, también en el teléfono.
- **Banderas**: SVG de **flag-icons 7.5.0 (MIT)**, solo las de los **242 países con prefijo** de la lista de `core`, en `apps/familia/public/banderas/<iso>.svg`. Mismo origen, así que la CSP no cambia. La licencia está en `docs/creditos.md`.
  - `check:tokens` excusa esa carpeta con tres condiciones: nombre `<iso>.svg`, exactamente 242 archivos y la licencia declarada.
  - Probado: con una bandera de menos cae, y con un SVG cualquiera adentro también.
- **El enlace con País**: mientras la persona no eligió el prefijo a mano, sigue al País del formulario (México por defecto). Un número ya guardado cuenta como elegido: ni montar la pantalla ni cambiar País lo pisan. Ese era un bug del primer intento, que encontró el test.
- **`core`** (`mi-espacio/whatsapp.ts`): valida **para el país** con `libphonenumber-js/min` y guarda en **E.164**. La regla que usan `/empezar`, Mis datos, «Me anoto», la ficha y `necesitaEmpezar` es la misma.
  - El error dice el país: «Ese número no parece de México. Revisa que esté completo.».
  - Un número viejo sin `+` se lee como de México.
- **Panel** (Inscriptos y Clientes): el número se ve formateado (`+52 999 123 4567`); el `wa.me` sigue igual.

## Lo que pesa

| | JS | gzip |
|---|---|---|
| antes | 644,29 kB | 185,89 kB |
| después | 807,64 kB | 225,40 kB |
| **diferencia** | **+163,35 kB** | **+39,51 kB** |

La diferencia es casi toda de `libphonenumber-js/min` (metadata y `AsYouType`) más los ejemplos de celular por país, que se usan para el placeholder. Las banderas no van en el bundle: se bajan una por una. Con el campo cerrado se baja una sola, la de México (85 KB, por el escudo); las demás, al abrir la lista (`loading="lazy"`).

## Tests

- `core/whatsapp.test.ts` (6) y `familia/campo-whatsapp.test.tsx` (9), en la gate.
- **Mutación** (quitar la validación por país y volver a «de 8 a 15 dígitos») → caen «inválidos… y uno que no es del país elegido» (core) y «un número corto da el error en español, con el país» (familia). Al devolver el archivo, verde.
- En el navegador (`capturas-32.mjs`, 6 capturas): un solo borde (la caja con borde en los cuatro lados y adentro solo la hairline), banderas del mismo origen, un naranja como mucho, 0 pares bajo AA, sin scroll horizontal y sin violaciones de CSP.
  - El borde naranja del campo con error se declara permitido, porque es el mismo de cualquier campo inválido; el barrido lo ve solo porque esta caja tiene texto adentro.

## Lo que decide dirección

1. **Números viejos**: un WhatsApp guardado que no es válido para su país (la regla vieja aceptaba cualquier cosa de 8 a 15 dígitos) hace que esa persona vuelva a pasar por `/empezar`, con el número escrito, para corregirlo. No hay forma de saber cuántos son sin mirar la base.
2. **Las banderas pesadas**: México 85 KB, Bolivia 103 y Serbia 181 son las que traen escudo. Se pueden optimizar con SVGO, pero eso ya no es «sin tocar».
3. **La API** sigue validando la forma (de 8 a 15 dígitos, en el DTO); la validación por país la hacen `core` y las pantallas. Mover la regla de país también a la API es una orden chica aparte.
