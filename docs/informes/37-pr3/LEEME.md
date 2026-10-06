# Mi espacio · Orden Códice #37, PR 3 (`molde/03-ajustes-inicio-shell`): Ajustes, Inicio, shell y Bienvenida del molde

Rama `molde/03-ajustes-inicio-shell`, desde `main` (`1b8dbe6`, con el #62 adentro). Molde 1.1.2, el mismo de los PR 1 y 2: la copia no se tocó, y el guardián cuenta 379 archivos.

## ⚠ Antes del merge: migración 014 (y una decisión)

`packages/db/migrations/014_ajustes_y_papelera.sql`, entera. Va en commits propios (`7adc4c4` y `c218248`), con su test en el banco (22 casos). **Sin ella, `GET /api/yo` da `42703` y nadie entra.**

Qué trae:
1. **`personas.inicio`** (jsonb, techo de 4 KB): cómo acomodó cada persona su Inicio (fase-2 §9, «guarda la configuración de cada persona»). **`personas.borrada_el`**: la autoriza la orden.
2. **`borrar_mi_cuenta()`**: anonimiza nombre, apellido, WhatsApp, ciudad, año y nivel; el correo pasa a `borrado+<id>@cuenta-borrada.invalid`. Conserva el país (decide el territorio de lo que queda), las inscripciones y el libro. Saca a la persona del equipo y cancela un rescate abierto. Da `UNICO_DUENO` si es el único dueño activo. El trigger de la 001 («el mail no se cambia») ahora deja cambiar el correo y `borrada_el` solo dentro de esta función.
3. **La papelera**: `en_la_papelera()`, `restaurar_de_la_papelera()` y `vaciar_la_papelera()`.

**Decisión para Germán (dos puntos):**
- **`inicio` es una columna que la orden no nombra.** El contrato dice «columnas por cuenta propia: se frena y se reporta». La pide §9 del molde. Se puede guardar por aparato, en el navegador, pero así se pierde al cambiar de teléfono. Tema y tamaño del texto sí van por aparato, como dice el molde («en este aparato»), y no tocan el esquema.
- **El borrado a los 30 días choca con la regla de la 002** («Nadie borra: se archiva; una edición se lleva las inscripciones de gente que pagó»). La forma que no la rompe: **a la papelera, y al borrado, entra solo lo archivado o cerrado *sin inscripciones***. Lo que tiene gente que pagó queda archivado para siempre, como hasta hoy. El borrado lo hace la base cuando alguien del equipo abre la papelera, y deja un renglón en `auditoria`. Es SQL destructivo que corre en producción: **si dirección no lo quiere, se saca `vaciar_la_papelera()` y la papelera queda solo para restaurar.**

## Qué se hizo

**§9 · el shell** (`molde/Esqueleto.tsx`): `<Shell>` del molde en lugar de la barra de la #29/#34.
- El cliente ve Inicio · Talleres · Mis talleres. El equipo y el dueño, además Panel.
- Transversales: Centro de alertas, Papelera y Equipo (solo el dueño).
- `principal` = Talleres, que va en la pestaña del celular.
- Sin `onPreguntar`: no hay «Pregúntale».
- Debajo del nombre va el rol («Equipo · México»).
- Quién ve qué lo decide `core` (`mi-espacio/molde.ts`, con test).

**§6 · Ajustes** (`molde/ajustes.tsx`): `<Ajustes>` con su adaptador.
- Comunes: Perfil, Cuenta y seguridad, Apariencia, Idioma, Notificaciones, Privacidad y datos y Acerca de. Sin Datos, Avisos, Plan, integraciones, asistente ni copias.
- Propia: **«Perfil del taller»** (para todos), en el grupo «Armando Duarte». Lleva apellido, WhatsApp (el campo de la #32), país, ciudad, año (con la edad), nivel y «¿Para qué pedimos esto?». Cada campo guarda lo suyo.
- `alias` de la #34 (`seguridad`, `sesiones` → Cuenta). `?s=equipo` va a la pantalla Equipo (si no es el dueño, a Ajustes).
- Seguridad está dentro de Cuenta y el correo también. Equipo está en el menú.
- Autenticador: `.d.obligatorio` para equipo y dueño, `.d.opcional` para el cliente, y `.d.inactivo` con «Activar», que abre P4 y se puede cancelar.
- Notificaciones: «Avisos por correo» de la 012.
- Idioma: guarda en `personas.idioma` (001) y gana sobre el del aparato.
- Apariencia: tema y tamaño **en este aparato**.
- Acerca de: versión y Novedades del CHANGELOG del molde (`apps/familia/CHANGELOG-del-molde.md`).
- **Borrar cuenta, obligatorio, con palabra y código.** Con autenticador, el código es el suyo. Sin autenticador, al abrir la zona le llega un código al correo. `POST /api/cuenta/borrar` hace la anonimización de la 014 y, con `service_role`, borra códigos y autenticadores, pasa el correo de `auth.users` a `borrado+…`, lo banea y cierra todas sus sesiones.
- Exportar: baja un archivo con lo que la API sabe de la persona, en el momento.

**§9 · Inicio** (`molde/inicio.tsx`): `<Inicio>` con el catálogo.
- Los tres cuadros del molde: Hoy, Centro de alertas y Pendientes.
- Cuatro de Mi espacio: Tu próximo taller, Tus datos, ¿Necesitas ayuda? y Panel del equipo (`soloManda`).
- Defaults por rol: cliente → próximo, datos, ayuda; equipo y dueño → panel, próximo.
- Lectura única (`molde/lectura.ts`), que comparte con la campana y el Centro de alertas. `sanear()` sobre lo guardado. Subir y Bajar, y «Listo» guarda en `personas.inicio`.

**§9 · Centro de alertas, Papelera y Equipo**
- Alertas: el tono lo decide `core` (`alertasDeMiEspacio`).
  - Crítico: comprobante rechazado, o reseteo propio pendiente.
  - Hoy: taller hoy.
  - Próximamente: taller en 7 días, y para el equipo, comprobantes en revisión (cuántos, nunca de quién).
  - Oportunidades: taller abierto sin anotarse.
- Papelera: del equipo (`GET /api/papelera`, restaurar). Para un cliente está vacía y no consulta la API.
- Equipo: solo el dueño (`GET /api/equipo/miembros`).
  - `kit.rescate = 'solo'`: **no existe «Resetear autenticador»**.
  - Suspender y reactivar usan las rutas de la #24. «Invitar» lleva a Panel → Clientes.

**§9 · Bienvenida** (`molde/bienvenida.tsx`): reemplaza a `/empezar`.
- Paso 1, «Tus datos» (nombre, apellido, WhatsApp de la #32): obligatorio.
- Paso 2, «¿Desde dónde?» (país y ciudad).
- Paso 3, solo para el equipo sin autenticador. En la práctica no aparece: el núcleo pide P4 antes que cualquier pantalla.
- El `?ir=` espera y, al terminar, vuelve al taller.
- `/empezar`, `/mis-datos` y `/ajustes/<s>` son 308 a su lugar (`vercel.json` y `rutaQueCorresponde`).

**§5 · textos**: `core/src/i18n/{es,en,pt}/molde.json`, con la sintaxis del molde, 113 claves en los tres idiomas. En `familia.json` en/pt, lo que esas pantallas reusan: campo de WhatsApp, errores, niveles y estados. `check:i18n` los compara: `familia` por prefijos declarados y `molde` entero.

**Lo que se borró** (las #29, #34 y #35 quedan cumplidas por el molde): la barra (`comun/Marco.tsx`), «Tus preferencias.» (`mi-espacio/Ajustes.tsx`), el Inicio de tarjetas, `/empezar`, sus estilos, sus textos y sus tests. También el e2e `entrar-como-quien.spec.ts`, que medía la composición de `/empezar` (#31). El panel pasa de `equipo.*` a `panel.*`: los `extras` pisan al molde, y `equipo.titulo` tapaba el título de la pantalla Equipo.

## Verificación

- **Gate verde**: `pnpm test` con el guardián del molde primero («379 archivos»). Son 955 tests y ninguna suite queda bajo su piso. Pisos subidos en `qa/piso-de-tests.md`.
- **Con cada rol** (`molde/el-molde-por-dentro.test.tsx`, 44 tests):
  - la barra, el riel de Ajustes y los cuadros de Inicio de cliente, equipo y dueño;
  - el autenticador por rol, que Equipo no tiene reseteo y que la papelera del cliente está vacía;
  - borrar la cuenta (cliente sin autenticador, y el único dueño);
  - **§5: en EN y PT, ni una clave ni un texto en español** en la barra, Inicio, las ocho secciones de Ajustes, la Bienvenida y la Papelera.
- **Vistos en rojo**, cada uno por separado:
  - 014: sin la regla «sin inscripciones», sin la del único dueño y sin el freno de `borrada_el`;
  - API: sin el chequeo de código para clientes, y con el código del correo para quien tiene autenticador;
  - core: la alerta de revisión siempre y la oportunidad aunque ya esté anotada;
  - app: un texto en español en EN, el Panel para el cliente, Datos y Plan en el riel, y el reseteo con `rescate: 'dueno'`;
  - `check:i18n`: una clave que falta, una variable cambiada y una clave de `familia` que falta.
  - El barrido de §5 tenía un falso verde: comparaba los archivos entre sí, y un texto copiado igual se excluía solo. Se arregló con una lista explícita de los textos iguales a propósito, y la mutación quedó en rojo.
- **Capturas** (`check/molde-37-pr3.mjs`):
  - Hay 146: cada pantalla a 390 y 1440, en claro y oscuro, con los dos roles.
  - La entrada y la verificación van en los tres idiomas, y Inicio y Ajustes también en EN y PT.
  - La app está servida con la CSP de producción: **cero violaciones y cero `<style>`**, ningún par bajo AA fuera del selector de idioma del molde y sin scroll horizontal. Está todo en `mediciones.txt`.
  - **Cada una al lado de la del molde** en `comparadas/`. Las diferencias son de color (las tarjetas usan el `surface` cálido del canon), tipografía y nombre, más las que se listan abajo.

## Qué quedó distinto del molde, y por qué

- **Sin «Pregúntale»** (no hay asistente), **sin selector de rol en Equipo** (no hay ruta para pasar de equipo a dueño) y **sin Actividad** (es el molde de Auditoría, §13). La fila «Actividad» de Cuenta dice «Todavía no está en Mi espacio».
- **Once textos del molde pisados por `extras`**, porque en Mi espacio dirían algo que no pasa. Por ejemplo: «Tienes 14 días para arrepentirte», «Te mandamos un archivo por correo», «Cambiarlo pide el código…», «Correo, dentro de la app, WhatsApp», «Verlos pide el código». Están al final de `molde.json`: revisalos.
- **El correo no se cambia desde acá** (es la llave de la cuenta). No se pasa `guardarCorreo` y la explicación de la fila lo dice. El campo del molde sigue siendo editable y «Guardar» no hace nada.
- **«Resumen» queda en «No»**: Mi espacio no manda resúmenes. El molde dibuja la fila igual.
- **Las Novedades de Acerca de están solo en español**: el CHANGELOG del molde es así («a decidir» desde su PR 3). El barrido de §5 lo deja afuera, declarado.
- **Talleres, Mis talleres y el panel**: su cabecera es `Pantalla` del molde (Talleres y Mis talleres) y está en los tres idiomas. **El cuerpo sigue en español**, igual que todo el panel, que conserva su cabecera y su «← Mi espacio». En oscuro usan la paleta del molde. El texto grande no las agranda, porque están en `px`.
- **WhatsApp** en «Perfil del taller» y en la Bienvenida es el campo de la #32, con su estilo, como pide la orden.

## Propuestas al molde (no se tocó la copia)

1. `FilaDeCampo`: de solo lectura cuando la app no pasa la acción, y que atrape el error de la acción. Hoy queda un rechazo suelto en la consola.
2. `ZonaPeligrosa`: un `onAbrir`. Hoy, para mandar el código por correo a quien no tiene autenticador, la app escucha el clic en el botón.
3. `PanelNotificaciones`: no dibujar Resumen ni Por dónde si la app no pasa `cambiarResumen` ni `canales`.
4. Novedades en tres idiomas.
5. La de siempre: `Idioma` con los idiomas no activos a 2,81:1 en claro.

## Hallazgos fuera de la orden

- `SupabaseService.cerrarOtrasSesiones()` le pasa a `auth.admin.signOut()` **el id**, y Supabase espera **el JWT**. «Cerrar las otras sesiones» (la de la #34) probablemente nunca funcionó. Desde este PR no la usa ninguna pantalla: Cuenta usa «Cerrar en todos». No lo toqué.
- La cabecera de la 013 sigue diciendo «APLICADA: —» y está en `PENDIENTES`. La completa quien la corrió.

## Pendiente de dirección

- **La 014 y las dos decisiones de arriba.**
- `RESEND_API_KEY` y `CORREO_REMITENTE` en Vercel (vienen del PR 2).
- **Modo oscuro**: las capturas están; Germán lo veta o lo aprueba mirándolas.
