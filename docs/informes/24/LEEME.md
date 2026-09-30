# #24 A · el panel del equipo (`/equipo`)

Orden Códice #24, PR A. Rama `mi-espacio/06-el-panel`, desde `main`.

## Qué se hizo

**`/equipo`**, solo para `dueno` y `equipo`, con segundo paso. Un cliente que escribe `/equipo` ve Mi espacio y la URL se corrige sola, sin ningún error (`rutaQueCorresponde()`). En Mi espacio, a quien es del equipo le aparece arriba **«Panel del equipo →»**. Son tres pestañas, en el orden de la orden: **Cursos · Inscriptos · Clientes**. Está pensado para escritorio; en el teléfono las tablas se desplazan de costado dentro de su marco.

- **Cursos:**
  - La lista, con estado y modalidad, y debajo las ediciones de cada curso: fecha y hora **en la zona de la edición** (D15), sede y ciudad, **inscriptos / cupo**, precio y estado.
  - Crear y editar cursos: el slug se propone solo desde el título y se puede editar. También se crean y editan ediciones: las horas se escriben como hora de pared de la zona (por defecto `America/Merida`) y se guardan como instante más zona IANA.
  - Los errores salen en español al lado de cada campo. Nada se borra: un curso se archiva y una edición se cierra.
- **Inscriptos:**
  - Una tabla por edición, elegida arriba: referencia `AD-0001`, nombre, correo, WhatsApp, país, fecha y estado.
  - Búsqueda por nombre, correo o referencia, y **exportar CSV** en UTF-8 con BOM.
  - El WhatsApp abre `wa.me` con el saludo armado: «Hola {nombre}, te escribimos por tu lugar en «{curso}».».
- **Clientes:**
  - Todas las personas que quien entró puede ver, con cuántos cursos tiene y el último, más búsqueda y CSV.
  - **Solo el dueño** ve «Sumar al equipo» (elige territorio y confirma) y «Quitar del equipo» (confirma). Quitar es desactivar; la fila queda y se anota en `auditoria`. Nadie se gestiona a sí mismo ni a otro dueño.

**La pantalla no filtra por territorio: filtra la base.** El panel lee con cuatro funciones de la **migración 008**, en su propio commit (`a59f264`):
- `panel_cursos()`, `panel_inscriptos(edicion)` y `panel_clientes()` son `security invoker`: corren con la RLS de quien llama, y a quien no es miembro activo le devuelven vacío.
- `inscriptos_de_edicion(edicion)` es `definer` y cuenta **todas** las inscripciones de la edición. El cupo es uno solo: «23 / 60» dice lo mismo para Gabi y para Diana. Devuelve un número, sin datos de nadie, y solo a un miembro con segundo paso.

**No hay tablas, columnas ni policies nuevas.** Lo que el panel escribe ya lo permitían la 001, la 002 y la 007.

**Semilla del taller de Mérida:** `packages/db/semillas/001_taller_de_merida.sql`.
- «El arte de amar a tu adolescente», jueves 5/11/2026 de 8:30 a 13:00 `America/Merida`, Fiesta Inn Mérida, $1,170 MXN, **en `borrador`**.
- Se puede correr dos veces sin duplicar nada.
- Lo que la orden no fija quedó así, y se cambia desde el panel:
  - **cupo vacío** (sin tope);
  - **inscripciones hasta = el inicio del taller** (con vacío nadie se podría anotar).

**La API:** `apps/api/src/equipo/`. Tiene un controlador y un repositorio (repository pattern), y todo va con el token de quien pide, nunca con `service_role`. Hay tres frenos:
- el guard del kit exige `aal2` al equipo;
- el controlador frena al cliente con `403 SOLO_EQUIPO`, y a quien no es dueño en sumar o quitar con `SOLO_DUENO`;
- la RLS de la base.

Las nueve rutas nuevas quedan en el inventario del guardián de segundo paso, **ninguna exceptuada**.

**Las reglas van en `@codice/core`**, con sus tests:
- zonas: hora de pared ↔ instante, fechas en la zona de la edición y a 24 horas como la web;
- validaciones de curso y edición;
- slug;
- CSV con las fórmulas desarmadas (una celda que empieza con `=` no se ejecuta en Excel);
- búsqueda sin acentos;
- WhatsApp;
- qué botón de equipo ve cada rol.

## Verificación

| | resultado |
|---|---|
| gate | verde · 441 declarados, 0 saltados |
| banco (`@codice/db`) | 107, con la 008; 20 nuevos, con dueño, México, internacional y cliente |
| mutaciones | 3 en la 008, 2 en la API y 1 en la pantalla, todas vistas en rojo (ver `qa/piso-de-tests.md`) |
| capturas | 12, en esta carpeta: las tres pestañas a 1440 y 390, un formulario abierto, «Sumar al equipo» abierto y Mi espacio del dueño. Datos de prueba, ningún dato real |
| en esas 12 | naranja solo en el botón que avanza (0 o 1 por pantalla), **0 pares bajo AA**, sin scroll horizontal de página, sin errores de CSP |

Se reproducen con `apps/familia/check/capturas-24.mjs`. La app se construye con `VITE_SUPABASE_URL` pública y una clave de mentira, porque todo lo de red lo contesta el script.

## Qué quedó pendiente

- **Correr la 008 y después la semilla** en `armandoduarte-familia`. Lo hace el CEO, como las anteriores. Hasta entonces el panel en el preview contesta error al cargar: las funciones no existen.
- **Correr la F.4 del panel** en el preview con las cuentas reales: Armando con Google Authenticator, y Gabi después de que Armando la sume.

## Decisiones tomadas acá, para que dirección las vea

1. **La API no importa `@codice/core`.** La API se despliega compilada y `core` se publica como fuente. Importarlo cambia el cierre de la función de Vercel, y eso lo vigila `la-api-llega-compilada.test.ts`. Por eso la validación de negocio corre en la pantalla (`core`), la API valida la forma con DTOs de `class-validator` y la última palabra la tienen los `check` de la base. Si dirección quiere `core` en la API, es una orden aparte: hay que compilar `core`.
2. **`u-mt-4` y `u-mt-6` no existían en `apps/familia`.** Mi espacio ya los usaba en Seguridad y no hacían nada. Se agregaron con los valores de la web, así que en Seguridad aparece el aire que estaba escrito.
3. **`los-permisos-estan-puestos.test.ts` levanta el banco con 120 s de tope**, como los demás archivos del banco. Con el tope por defecto de 10 s, en la gate se pasaba y sus cuatro tests quedaban «saltados».
