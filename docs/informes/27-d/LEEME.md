# Orden Códice #27 — PR D · El perfil del cliente y las notas del equipo

Capturas: `apps/familia/check/capturas-27-d.mjs` (1440 y 390; `/privacidad#perfil` a 1440). Un naranja como mucho, 0 pares bajo AA, sin scroll horizontal, sin CSP.

## Qué se hizo

- **Migración 011 `011_el_perfil.sql`** (commit propio, pendiente): `personas` suma `ciudad`, `anio_nacimiento` (1920 a hace 14 años; año, no fecha) y `nivel_educativo` (los seis valores), todas nulas. Tabla **`notas_de_persona`**: solo se agrega (`solo_se_agrega` de la 003), el equipo lee y agrega por territorio (`veo_a_la_persona()`, definer, sobre `veo_pais()`) y con aal2, firma propia obligatoria, **el cliente no tiene ninguna policy**; `auditoria` anota cada alta; grants en la misma migración. **`panel_clientes()` reemplazada** (drop + create en una transacción) y no `_v2`: regla de nombres de la casa, y la API la llama por nombre, así que la versión vieja de la API sigue andando con la función nueva.
- **API:** `POST /api/yo` guarda «Tus datos» (la orden decía `PATCH`; es `POST` porque `api()` y toda la API hablan `GET`/`POST`). Hasta hoy «Guardar» estaba apagado: ahora guarda los siete campos, `null` borra. `GET /api/yo` devuelve el perfil. Ficha del cliente: `GET /api/equipo/clientes/:id` (inscripciones con estado + notas firmadas) y `POST /api/equipo/clientes/:id/notas` — bajo `/api/equipo/` como el resto del panel, no `/api/clientes/` como decía la orden. La API comprueba el territorio antes que la RLS (`404 FUERA_DE_TERRITORIO`).
- **`core`:** países (249 ISO; México primero, los 32 de LATAM, después el resto; nombres en es/en/pt con `Intl.DisplayNames`), niveles, edad, validación, «perfil incompleto».
- **Mi espacio:** «Tus datos» con país (select), ciudad, año (con «Edad: 42» al lado), nivel (con «Prefiero no decir»); la línea «¿Para qué pedimos esto?» → `armandoduarte.com/privacidad#perfil`; tarjeta suave «Completa tu perfil (30 segundos)» después de «Me anoto».
- **Clientes:** ciudad, edad calculada (nunca el año), nivel, búsqueda por ciudad, CSV con edad; «Abrir» despliega la ficha con inscripciones y notas, y el campo para agregar una. No hay botón de borrar ni editar.
- **`/privacidad`:** el bloque `#perfil` con el texto exacto de la orden, en «Qué datos se recaban». Capturas de fidelidad de `/privacidad` actualizadas con `--update-snapshots` por la orden #27 D (antes de actualizar cayeron solo las tres de `/privacidad`).

## Mutaciones

| qué se rompió | cayó en |
|---|---|
| lectura de notas sin territorio (policy `using (soy_miembro_activo())`) | banco: «Diana ve la suya y NO la de Laura» |
| escritura de notas sin territorio | banco: «Gabi NO escribe sobre Pilar» (y cuatro más en cadena) |
| una policy que deja al cliente leer sus notas | banco: «LAURA NO LEE NINGUNA» |
| la API sin comprobar territorio | contra el banco: `SIN_PERMISO` en vez de `FUERA_DE_TERRITORIO` (la RLS igual frena) |
| «Tus datos» sin validar antes de mandar | `el-perfil.test.tsx`: año fuera de rango |
| `personaDe` con las columnas nuevas | el test de columnas de la API se puso rojo pidiendo actualizarse |

## Pendiente / para dirección

- **Correr la 011 ANTES de desplegar este PR** (snippet `011_el_perfil`): la API nueva lee las columnas en `GET /api/yo` y sin ellas nadie entra a Mi espacio.
- **`/privacidad` dice cosas que ya no son ciertas** y la orden no pidió tocarlas: «Este sitio no tiene formularios» (Mi espacio sí los tiene) y «Última actualización: 12 de septiembre de 2026». Texto de dirección/Armando.
- Las capturas de fidelidad de `/privacidad` van a chocar con las del #41 (las dos cambian la página): al mergear el #41 hay que regenerarlas en esta rama.
