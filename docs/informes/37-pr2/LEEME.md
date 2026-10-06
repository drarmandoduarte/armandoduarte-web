# Mi espacio · Orden Códice #37, PR 2 (`molde/02-acceso`): el Kit de Acceso 1.3.0 con rescate solo

Rama `molde/02-acceso`, desde `main` (`c984ed7`, con el PR 1 adentro). Molde 1.1.2, el mismo del PR 1.

## Qué se hizo

**§7 · el Kit de Acceso en lugar del Kit de Seguridad 512 (1.1.0)**
- `git mv` de `seguridad-512/` a `acceso/` en `apps/api` y `apps/familia` (en familia se fundió con la carpeta `acceso/` de la #35). Git lo ve como renombre.
- El núcleo entero se reemplazó por el del molde: 9 archivos en la API y 12 en la pantalla, idénticos a `packages/moldes/acceso/nucleo/`.
- `renombrar-en-app.mjs`, primero con `--probar` (33 archivos) y después en serio. No tropezó con nada del 1.1.0. Lo que tocó en comentarios (por ejemplo, «check-acceso.mjs», que no existe) se corrigió a mano.
- `moldes/instalacion.json` ahora declara `acceso` (api y familia).
- El guardián viejo se apagó: se borraron `scripts/check-seguridad-512.mjs`, la carpeta `seguridad-512/` y el script `check:seguridad`. `guardian-de-guardianes.mjs` ya no lo corre. El de los moldes va primero en `pnpm test`, como desde el PR 1.
- Los tests por app de la plantilla se copiaron a `apps/api/src/acceso/` y se adaptaron todos los `← ADAPTAR`. Cada línea dice qué se puso.
  - **Se borraron dos casos, porque Mi espacio no tiene con qué:** «resetear el 2FA de otro» (rescate solo; en su lugar va la prueba de que no existe esa ruta ni ese método) y «una integración externa».
  - `guard-de-sesion-y-aal2.spec.ts` sí se instaló. Mi espacio no tiene guard de sesión, pero tiene `RolMiddleware`, que valida el token antes del guard: es la misma pareja.
- **Se vieron en rojo** cuatro mutaciones, y todas volvieron al verde:
  - una excepción sin declarar → rojo en cobertura y en comportamiento;
  - `equipo` clasificado como `cliente` → rojo en roles y en comportamiento;
  - el middleware validando por su cuenta → rojo en «una sola validación»;
  - `generar` sin `@PasoReciente` → rojo en paso reciente.
- `nucleo/usuario-del-pedido.spec.ts`, que con el 1.1.0 no se podía correr, ahora corre.
- `tituloDeEntrada(design.app.frase, idioma, t('auth.login.titleDefault'))` en P1. En EN dice «Enter your *space*.» y en PT «Entre no seu *espaço*.».
- `globals: true` en el vitest de `apps/familia` (§7.8).

**Adaptador `acceso.config.ts`** (idéntico en api y familia): «Armando Duarte»; `dueno` → equipo, `equipo` → equipo, `cliente` → cliente; **`rescate: 'solo'`**. La plantilla 1.3.0 no trae `rescate` en el tipo: se agregó en el adaptador, con su comentario. `roles-clasificados.spec.ts` lee el `check` de la 001 (no hay enum) y trata `cliente` como «sin fila en `miembros`».

**Las pantallas, con las piezas del molde**
- Las nueve pantallas (P1–P8, más P9 «Pasó un tiempo» y la espera de P6b) usan `Titulo`, `Antetitulo`, `Idioma`, `Boton`, `BotonGoogle`, `Separador`, `Campo`, `CampoMono`, `OtpInput`, `Enlace`, `PieLegal`, `CodigosRespaldo` y `Cartel`. El marco es el de la galería del molde.
- Se borró lo que la #35 copió a mano: el `OtpInput` propio (y su test), la hoja `--acceso-*` (y su salida en `design-json.mjs`) y los 57 textos `auth.*` duplicados. Los textos del acceso son los del molde, que trae los plurales: «Te queda 1 intento».

**§8 · rescate solo, con backend**
- **Migración 013 `rescates`, en commit propio, con su test en el banco** (13 casos, visto en rojo sin la regla de las 48 h). Columnas: las de la orden.
  - RLS: cada quien lee lo suyo; escribe solo la API.
  - Nadie borra, ni `service_role`: un rescate se cierra una vez (confirmado, cancelado o usado), y un trigger lo sostiene.
  - Uno abierto por persona.
- `POST /api/rescate/pedir` (sin sesión): crea el pedido y manda los dos correos, en el idioma de la pantalla. El de confirmación lleva el enlace para confirmar y el de aviso, el enlace para cancelar. Devuelve `{ vence }`.
  - Contesta igual si el correo no existe o no tiene autenticador: no sirve para averiguar quién tiene cuenta.
  - Con un pedido abierto, devuelve ése y no manda más correos.
- `POST /api/rescate/confirmar` y `/cancelar` (enlace del correo): piden el token del enlace. Son 32 bytes al azar; en la base se guarda solo su SHA-256, y se compara en tiempo constante.
- `POST /api/rescate/aplicar`: cumplidas las 48 h, la persona entra con el código por correo y queda en el reto. La pantalla llama a esta ruta, que **borra sus factores TOTP y sus códigos de respaldo** y marca el rescate como usado. El núcleo la manda a P4.
- La página `/rescate` (la que abren los enlaces) **no hace nada sola**: hace falta tocar el botón. Así, un lector de correo que abre los enlaces no confirma nada.
- «Reseteo pendiente»: `/api/yo` lo devuelve (`reseteoPendiente`) y Ajustes → Seguridad lo muestra con el texto del molde.
- La regla de las 48 h y del estado está en `@codice/core` (`mi-espacio/rescate.ts`, con test). La API la copia, porque no puede importar `core`, y `rescate.spec.ts` compara las copias: textos en los tres idiomas, las 48 h y el formato del enlace.

## Prueba obligatoria (§5 de la orden)

Contra el banco, con Resend simulado, en `las-consultas-corren-contra-la-base.spec.ts`:
- **Un cliente entra sin autenticador:** el guard lo deja pasar en `aal1` (`aal2-comportamiento.spec.ts`).
- **Un `equipo` no entra sin él:** con `aal1` recibe `403 AAL2_REQUIRED`. Si no tiene factor, la pantalla lo manda a P4, sin forma de saltearla (`el-acceso-del-molde.test.tsx`).
- **Nadie ve ni usa un botón para resetear a otro:**
  - la lista exacta de rutas no tiene ninguna;
  - `EquipoController` no tiene ningún método de reseteo;
  - el panel no tiene ningún texto de reseteo;
  - la API del rescate solo se llama desde P6b, `/rescate` y el reto propio.
  - Además, `aplicar` con la sesión del dueño no toca el rescate listo de otra persona.
- **El pedido desde la entrada:** crea el registro con `vence_el` a 48 h exactas y manda **los dos correos**. En la base queda el hash del token, nunca el token.
- **La prueba de fuego sobre `apps/api/src/acceso/nucleo/roles.ts`:** una coma → `pnpm test` frena en el guardián con ese archivo; revertido, verde. Está en `prueba-de-fuego-coma.{txt,png}`. Y `check.mjs` editado para salir con 0 → `guardian/check.mjs: FAILED` (`prueba-de-fuego-guardian.{txt,png}`).

## Verificación

- `grep -rnE "seguridad-512|SEGURIDAD_512|Seguridad 512|seguridad512"` en el código da **cero**. Lo afirma un test con piso (`el-molde-esta-instalado.test.ts`, visto en rojo).
  - Quedan, a propósito, las migraciones ya aplicadas (`001` y `005_seguridad_512.sql`, inmutables), los documentos y los informes.
- `pnpm test`: los tres `guardian/…: OK` y «Guardián de los moldes · v1.1.2 · **379** archivos idénticos a sus huellas». Son 358 del PR 1 más los 21 del núcleo (9 + 12).
- **Gate verde.** Pisos subidos a lo que se declara hoy: `ui` 41 (−1, el test de la hoja que se fue), `core` 134, `db` 184, `familia` 228, `api` 163. Está contado en `qa/piso-de-tests.md`.
- **Capturas** (`check/molde-37-pr2.mjs`, 56): las pantallas a 390 y 1440, en claro y oscuro, servidas con la CSP de producción. La entrada va en los tres idiomas.
  - Las 56 dan **cero violaciones de CSP y cero `<style>`**. Las mediciones están en `mediciones.txt`.
- El comportamiento de siempre sigue en los tests de las pantallas: Google, el código por correo con su cuenta regresiva, el autenticador, los 30 minutos (P7) y el código de respaldo desde la entrada.

## Qué quedó distinto del molde, y por qué

- **El selector de idioma del molde (`Idioma`) no llega a AA en claro:** los idiomas no activos dan **2,81:1** (van al 70 % de opacidad). No se tocó la copia (§12). Va como **propuesta al molde**, y el barrido lo separa como tal.
- `ConfigAcceso` suma `rescate` en el adaptador (la plantilla no lo trae y Equipo/Ajustes del molde lo leen como `kit.rescate`).
- `<Equipo>` y `<Ajustes>` del molde (con `filasDeEquipo(ctx, kit)` y `valores.reseteoPendiente`) entran en el **PR 3**. Este PR deja el dato listo y la línea en la Seguridad de hoy.
- El «aviso a los otros dispositivos» es un correo al mismo buzón. Es el único canal que llega a todos los aparatos de la persona, y lleva el enlace para cancelar.
- `TZ=UTC pnpm test` no cambia nada: cada suite fija su zona en su script (`TZ=America/Merida`).

## Migración a correr (antes del merge)

`packages/db/migrations/013_rescates.sql`, entera. Sin ella fallan las cuatro rutas de `/api/rescate/*`. `/api/yo` no se cae: sin la tabla, no muestra «Reseteo pendiente».

## Para dirección

- **`RESEND_API_KEY` y `CORREO_REMITENTE` en Vercel:** sin ellas, los correos del rescate no salen (el pedido queda abierto y se avisa en el log). Ya estaba pendiente desde la #27; no las toqué.
- **Propuesta al molde:** el contraste de los idiomas no activos de `Idioma`.
