# Orden Códice #24 · PR B — El cliente ve los cursos y se anota

Rama `mi-espacio/07-me-anoto`. Capturas de esta carpeta: `apps/familia/check/capturas-24-b.mjs` (clienta con `aal1`, API con datos de prueba; ningún nombre, teléfono ni CLABE real).

## Qué se hizo

- **Mi espacio**, arriba de «Tus datos»: **«Talleres abiertos»** (fecha en la zona de la edición y, si la persona vive en otra con otra hora, la suya al lado; sede, precio, «Quedan N lugares» solo con 15 o menos), **«Me anoto»** en el mismo lugar (pide nombre, apellido o WhatsApp solo si faltan), la **confirmación** con la referencia `AD-…` y botón de copiar, y **«Mis talleres»** (solo si hay alguno).
- **Datos de cobro**: si hay una cuenta vigente en `datos_de_cobro`, se muestran banco, titular, CLABE (con copiar), concepto (la referencia) y monto. **Si está vacía**: la referencia y «Te mandamos los datos para transferir por WhatsApp», con el enlace a Gaby y la referencia ya escrita. Nada de cobro vive en el repo.
- **`/entrar?ir=<ruta>`**: después de entrar (código o Google, incluida la vuelta del OAuth, que cae en `/`) se va a esa ruta. Solo rutas internas (`rutaInternaSegura()` en `core`): con `https://…`, `//…`, `/\…`, un esquema o caracteres de control, a Mi espacio. El destino se guarda en `sessionStorage`, así no hay que tocar las Redirect URLs de Supabase.
- **`/me-anoto/<slug>`**: abre «Me anoto» con ese taller elegido. Sin sesión, va a `/entrar?ir=/me-anoto/<slug>`.
- **Migración 009** (commit propio): el cupo lo cumple la base (trigger con `for update`, corre antes que la referencia: un rechazo no quema un `AD-`), más `talleres_abiertos()`, `mis_talleres()` e `inscribirme()`. Sin tablas, columnas ni policies nuevas.
- **Cabeceras APLICADA** de la 008 (30/9 21:55 UY, `db747a1`) y de la semilla (21:58, `semilla_02_taller_de_merida`), según `infraestructura-2026-09-29.md`.
- Un naranja por pantalla (D26): con talleres disponibles, «Guardar» de «Tus datos» —que está apagado— pasa a contorno.

## Mutaciones (se rompió cada cosa, se vio el rojo, se devolvió y volvió a verde)

| dónde | qué se rompió | cayó en |
|---|---|---|
| 009 | sin el trigger del cupo | «con cupo 1… Pilar recibe CD409» y «el trigger frena también el insert directo» |
| 009 | `mis_talleres` sin filtrar por persona | «Pilar no ve la inscripción de Laura» |
| 009 | `inscribirme` sin mirar primero si ya estaba | «quien ya tiene su lugar en un taller lleno ve su referencia» |
| 009 | `talleres_abiertos` sin `edicion_abierta()` | «cerrada, vencida o de un borrador: CD410 y fuera de la lista» |
| 009 | el trigger renombrado para correr después de la referencia | «una inscripción rechazada por cupo no quema un número AD-» |
| core | `rutaInternaSegura` sin el freno de esquema | `"https://otro.sitio": expected … to be null` |
| core | sin el freno de `//` | `"//otro.sitio": expected … to be null` |
| core | umbral 15 → 20 | «Quedan N solo con 15 o menos» |
| familia | `rutaQueCorresponde` sin validar el destino (**la mutación de la orden**) | «?ir=https://otro.sitio → Mi espacio» |
| familia | `App` sin pasar el destino guardado | «la vuelta de Google cae en /, va ahí y lo olvida» |
| familia | el slug no abre el paso | cinco tests de `/me-anoto/<slug>` |
| familia | «Guardar» siempre naranja | los dos tests de «un naranja» |
| api | sin traducir `CD409` | `expected 'DESCONOCIDO' to be 'SIN_LUGARES'` |
| api | sin exigir los datos que faltan | «400 FALTAN_DATOS» |
| db | cabecera de la 008 completa con la fila en PENDIENTES | «se borra la fila de PENDIENTES» |

## Lo que no se prueba

Dos inscripciones en el mismo instante: el banco PGlite es una sola conexión. El `for update` está escrito y explicado en la 009; lo que se prueba es que el trigger frena cualquier insert sobre una edición llena.
