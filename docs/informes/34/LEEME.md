# Orden Códice #34: la barra y los ajustes de Mi espacio, iguales a Bitácora

Rama `mi-espacio/15-barra-y-ajustes`, apilada sobre la #32 (`mi-espacio/14-whatsapp-prefijo`), que a su vez trae la #33 ter y `origin/main`. Las capturas están en esta carpeta y salen de `apps/familia/check/capturas-34.mjs`.

## Migración: la corre el CEO ANTES del merge

**`012_avisos_por_correo.sql`**, guardada en el editor como **`012_avisos_por_correo`**. Va en un commit propio (`77b46d6`). Agrega una sola columna, `personas.avisos_por_correo boolean not null default true`, sin policies ni grants nuevos. Si se despliega sin ella, `GET /api/yo` da 42703 y nadie entra a Mi espacio.

## Qué se hizo

- **La barra (A).** Se fue «Volver a la web», también del cajón del teléfono. En el nav quedan Inicio, Talleres y Mis talleres; el equipo ve además el Panel del equipo, después del separador. «Mis datos» salió del nav. Abajo va el bloque del usuario, como en Bitácora:
  - un avatar de 40 px con las iniciales, teal sobre crema y borde teal;
  - el nombre, y debajo el rol en gris de 12 px: Cliente, Equipo · México, Equipo · Internacional o Dueño;
  - la fila con «Cerrar sesión» y el engranaje de 36×36 que abre `/ajustes`.

  Con la barra plegada se ven el avatar, el engranaje y la salida, cada uno con su tooltip. No hay campana, estrellas ni buscador.
- **«Tus preferencias.» (B).** Lleva el rótulo «§ · CONFIGURACIÓN» en teal, el título y dos columnas: el sub-nav de 220 px y la sección, de 720 px como máximo. En el teléfono el sub-nav es un carril que se desliza. Las secciones:
  - **Perfil:** Mis datos entero, con el WhatsApp de la #32.
  - **Cuenta:** el correo en solo lectura, con qué entra la persona y «Cerrar sesión en todos los dispositivos» (`signOut({ scope: 'global' })`).
  - **Notificaciones:** un interruptor que guarda al tocarlo. Si falla, vuelve a como estaba.
  - **Seguridad:** solo para el equipo, con los códigos de respaldo.
  - **Sesiones:** ver el punto 1 de decisiones.
  - **Privacidad:** el aviso, los términos y los derechos ARCO por WhatsApp con Gaby.
- **Rutas.** `/ajustes` lleva a `/ajustes/perfil`. Un cliente que entra a `/ajustes/seguridad` va a Inicio. `/mis-datos` responde **308** a `/ajustes/perfil` desde el `vercel.json`, y el servidor de QA ahora lee esas redirecciones.
- **API.** `GET /api/yo` devuelve `avisos_por_correo` y `territorio`. `POST /api/yo` acepta `avisos_por_correo`. Si la persona apagó los avisos, `pagos/resolver` no manda el correo y contesta `correo: 'apagado'`. En ese caso el panel le dice al equipo: «Esta persona pidió no recibir correos: avísale por WhatsApp».
- **`core`.** `inicialesDe`, `nombreDelBloque`, `claveDelRol`, `formasDeEntrar` y `seccionesDeAjustes`, con sus tests.
- **Inicio (C).** Cada tarjeta mide lo que mide su contenido. Medido a 1440: 385/155/177 px para un cliente y 312/161/155/159 px para el equipo.

## Verificación

- Gate verde: 798 tests (core 112, db 171, api 119, familia 190, web 72…).
- `capturas-34.mjs`, en el navegador:
  - sin «Volver a la web»;
  - las iniciales y el rol correctos para cliente, equipo y dueño;
  - el engranaje lleva a `/ajustes/perfil`;
  - el sub-nav marca la sección correcta en las seis;
  - el interruptor queda apagado después de recargar (`true → false`);
  - un cliente en `/ajustes/seguridad` va a `/mi-espacio`;
  - `/mis-datos` da 308;
  - en todas las capturas: un naranja como mucho, 0 pares bajo AA, sin scroll horizontal y 0 violaciones de CSP.
- **Mutaciones (un test no está terminado hasta que se lo vio fallar):**
  - la 012 con una policy que deja editar cualquier ficha: cae «Gabi la ve pero no la cambia»;
  - la 012 con `default false`: caen 4 tests;
  - sin el `if (!datos.avisos)` en `pagos`: caen 2 tests (el spec y el que corre contra el banco);
  - Seguridad visible para todos: cae «un cliente ve cinco secciones»;
  - el interruptor sin volver atrás cuando falla: cae su test;
  - «todos los dispositivos» con alcance `local`: cae el test de Cuenta;
  - sin el engranaje en la barra desplegada: caen 2 tests.

  En todos los casos, con el archivo devuelto vuelve a verde.

## Capturas

| | 1440 | 390 |
|---|---|---|
| Barra · cliente | `01-barra-cliente-1440.jpg` | `01-barra-cliente-390.jpg` (cajón) |
| Barra · dueño | `02-barra-dueno-1440.jpg` | `02-barra-dueno-390.jpg` (cajón) |
| Barra plegada | `03-barra-plegada-1440.jpg` | — |
| Inicio · equipo | `04-inicio-equipo-1440.jpg` | `04-inicio-equipo-390.jpg` |
| Ajustes ×6 | `05`…`10-*-1440.jpg` | `05`…`10-*-390.jpg` |
| **Al lado de Bitácora** | `11-lado-a-lado-bitacora-1024.jpg` | `11-lado-a-lado-bitacora-390.jpg` |

**Las capturas de Bitácora son las de su auditoría** (`Bitacora/.audit-shots/f3-configuracion-{1024,390}-after.png`, del 31/7). Rodolfo no tiene sesión en Bitácora, así que las nuestras se tomaron al mismo viewport que esas (1024×900 y 390×844, escala 1) para que el lado a lado sea 1:1. No hay una de Bitácora a 1440.

## Decisiones para dirección

1. **Sesiones con lista de dispositivos: no se puede hacer hoy sin inventar.** En Códice nadie escribe todavía en `security_devices`: el aviso de «aparato nuevo» es el PR 5 del kit. Además, la 005 no guarda el navegador, a propósito, y una fila no se puede ligar a una sesión para cerrarla sola. Una `mis_dispositivos()` devolvería siempre una lista vacía, así que **no se hizo**. Sesiones muestra «Este dispositivo · Activa ahora» y «Cerrar las otras sesiones», que existe y ahora vale para todos. Antes estaba en Seguridad, solo para el equipo. Si se quiere la lista, hace falta decidir: (a) construir el aviso de aparato nuevo (PR 5) y (b) si se guarda el navegador, lo que cambia una decisión de privacidad de la 005.
2. **La barra plegada también muestra el ícono de salir**, debajo del engranaje, como Bitácora. La orden dice «avatar solo, y el engranaje debajo», pero sin ese ícono plegada no habría forma de cerrar sesión.
3. «Cerrar sesión en todos los dispositivos» deja a la persona en `/entrar`, con el aviso de salida deliberada de siempre.
4. Quedan en `familia.json` algunas claves que ya no se usan (`miEspacio.seguridadTitulo`, `miEspacio.cerrarOtrasAyuda`). No estorban; se pueden limpiar en una orden chica.
