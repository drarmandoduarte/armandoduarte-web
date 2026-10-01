# Orden Códice #27 — PR C · El comprobante de pago

Capturas: `apps/familia/check/capturas-27-c.mjs` (1440 y 390; un naranja como mucho, 0 pares bajo AA, sin scroll horizontal, sin CSP). `.error` entra a la lista de permitidos del barrido de acento: es la primera captura con un error a la vista, y es el texto de error de la casa (#15), no un acento.

## Qué se hizo

- **009:** cabecera APLICADA (30/9 23:35 UY, `965b812`, `009_me_anoto`); fuera de PENDIENTES (el test se puso rojo pidiéndolo).
- **Migración 010 `010_el_libro_en_el_panel.sql`** (commit propio, pendiente de correr): `libro_de_edicion(edicion)` (invoker: último renglón, lo declarado con el path del comprobante, lo confirmado) y `firma_del_libro(persona)` (definer: solo el nombre de pila de un miembro, solo para miembro activo con aal2). Ni `panel_inscriptos_v2` (regla «sin _v2» y obligaría a un `drop` sobre una función aplicada) ni una por inscripción (N viajes): una por edición, juntada por `inscripcion_id`. Test en el banco con los cuatro perfiles (`packages/db/src/el-comprobante.test.ts`).
- **API** `/api/pagos`: `POST declarar` (cliente; ruta en la carpeta de la inscripción o 403 `RUTA_AJENA`; una declaración por vez, 409 `NO_ESPERA_COMPROBANTE`; si el insert falla intenta borrar el archivo con el token del cliente), `POST resolver` (equipo; `SOLO_EQUIPO`, `SOLO_DUENO` para anular, 400 `FALTA_MOTIVO`, 409 `NO_ESTA_EN_REVISION`; correo después), `GET comprobante/:inscripcion` (URL firmada de 60 s con el token de quien pide). `GET /api/talleres` suma a cada taller propio `inscripcion_id`, precio, motivo del último rechazo y si hay comprobante, y los datos de cobro.
- **Correo** por Resend con `fetch` (sin dependencia nueva), texto plano, nunca tira: si falla, la confirmación queda y la pantalla dice «avísale por WhatsApp». Texto en `familia.json` (`correos.*`); la API tiene una copia porque no puede importar `core`, y `pagos.spec.ts` las compara campo por campo.
- **Mi espacio:** estados con palabras de persona, «Ya transferí, subo mi comprobante» con el paso en el mismo lugar (archivo validado antes de subir, fecha de hoy en la zona de la persona, monto prellenado, banco, folio, datos de cobro con la referencia), motivo del rechazo, «Ver mi comprobante». La subida va directo a Storage desde `mi-espacio/subir-comprobante.ts`: **única excepción** al guardián `sin-base-desde-el-navegador`, declarada con su forma exacta y un piso de una llamada. Un naranja: `principalDeMiEspacio()` en `core`.
- **Inscriptos:** filtro Todos/En revisión/Confirmadas/Pendientes (arranca en En revisión si hay), punto de color, historial corto, Ver / Confirmar (teal) / Rechazar (contorno, motivo obligatorio) / Anular (solo dueño), confirmación en el mismo lugar, CSV con último movimiento y montos.

## Mutaciones

| qué se rompió | cayó en |
|---|---|
| `libro_de_edicion` como `security definer` | banco: Gabi ve la de Pilar, Diana la de Laura, Gabi aal1 ve algo (4 rojos) |
| `firma_del_libro` sin el join a `miembros` | banco: «de un cliente no devuelve nada» |
| `firma_del_libro` sin el freno de miembro con aal2 | banco: «a quien no es miembro con segundo paso, nulo» |
| controlador sin `SOLO_DUENO` | `pagos.spec` y contra el banco: Gabi anula |
| controlador sin `RUTA_AJENA` | `pagos.spec` y contra el banco |
| controlador sin borrar el archivo al fallar | `pagos.spec`: «intenta borrar el archivo recién subido» |
| rechazo sin motivo permitido | `pagos.spec` y contra el banco: `FALTA_MOTIVO` |
| pantalla sin validar el archivo antes de subir | `el-comprobante.test.tsx`: tipo y 5 MB «ANTES de subir» |
| «Me anoto» siempre naranja | `el-comprobante.test.tsx`: un naranja con pago pendiente |
| una lectura `.download(` o una segunda subida en el archivo exceptuado | guardián: cero `.storage` / «UNA llamada» |

## Pendiente / para dirección

- **Correr la 010** (snippet `010_el_libro_en_el_panel`). Sin ella, Inscriptos da error.
- **Variables en Vercel (`armandoduarte-familia`):** `RESEND_API_KEY` y `CORREO_REMITENTE` (la misma dirección del SMTP de Supabase). Sin ellas, todo funciona y el correo no sale.
- **El archivo huérfano:** la orden pide que, si el insert falla, la API borre el archivo con el token del cliente. La 006 no tiene policy de borrado, así que hoy no se borra (queda en la carpeta del cliente, sin renglón; lo prueba el banco). No se usó `service_role`. Si dirección quiere, una policy en la próxima migración: el cliente borra en su carpeta solo un objeto que ningún renglón del libro nombra.
