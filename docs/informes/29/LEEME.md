# Orden Códice #29 — Mi espacio con barra lateral, y la primera entrada completa los datos

Capturas y mediciones: `apps/familia/check/capturas-29.mjs` (14 capturas, 1440 y 390).

## Qué se hizo

- **El marco** (`comun/Marco.tsx`), con Bitácora como molde para la estructura (`Sidebar.tsx`, `AppShell.tsx`, `DashboardLayout.tsx`):
  - una barra de 256 px que se pliega a 64 con el chevron, y el plegado se recuerda en el navegador;
  - «ARMANDO DUARTE» arriba e ítems Lucide de trazo 1,5: Inicio, Talleres, Mis talleres, Mis datos y, solo para el equipo y tras un separador, Panel del equipo;
  - abajo, el correo de la sesión, «Salir» y «Volver a la web»;
  - el ítem activo va en `--tinta` sobre `--crema`, con una línea `--teal` de 2 px;
  - debajo de 900 px hay una cabecera con «Menú» que abre la barra como cajón sobre el telón grafito, con el foco atrapado y Esc para cerrar;
  - el contenido va en una columna de 720 px con 48 de margen (el panel del equipo va ancho).
- **Navegación sin recargar** (`comun/navegacion.tsx`): `pushState` sobre la ruta que `App.tsx` ya guardaba. Los enlaces siguen siendo `<a href>` de verdad, y el «atrás» funciona.
- **Las pantallas**: Talleres, Mis talleres y Mis datos son lo de antes, tal cual, cada uno en su ruta. Inicio es nuevo y tiene tres tarjetas, más una cuarta para el equipo:
  - Tu próximo taller;
  - Tus datos («Faltan: ciudad» o «Completos»);
  - ¿Necesitas ayuda?;
  - para el equipo, Panel del equipo con «N comprobantes en revisión».
- **`/empezar`**: si a la ficha le falta nombre, apellido o WhatsApp, la persona pasa por acá antes que por cualquier otra ruta, también el equipo. El `?ir=` espera y se usa al terminar. Lleva el panel cálido con la firma, los tres campos obligatorios, país (México por defecto), ciudad opcional, «¿Para qué pedimos esto?» y un único botón, «Guardar y entrar». Con los datos completos, escribir `/empezar` a mano lleva a Inicio.
- **Reglas en `core`** (`mi-espacio/marco.ts`, 11 tests): `necesitaEmpezar`, `faltanEnLaFicha`, `proximoTaller`, `edicionesVigentes`, `validarEmpezar` y `empezarParaEnviar`.

## Verificación

- **`rutaQueCorresponde()`**: 5 casos nuevos (sin datos → `/empezar` desde cualquier ruta; con datos, nunca; el `?ir=` sobrevive). Si se quita el chequeo de datos, caen 2.
- **`el-marco.test.tsx`** (12): la barra muestra 4 ítems al cliente y 5 al equipo, el activo sigue a la ruta, se navega sin volver a preguntar `/api/yo`, el «atrás» funciona, el plegado se recuerda, el cajón atrapa el foco y se cierra con Esc y al navegar, Inicio y el «N en revisión». Mutaciones:

  | mutación | cae |
  |---|---|
  | el panel visible para todos | 2 |
  | sin trampa de foco | 1 |
  | sin guardar el plegado | 1 |

- **`me-anoto.test.tsx`**: el recorrido completo funciona (llega sin datos a `/me-anoto/<slug>` → `/empezar` → guarda → vuelve al taller).
- **En el navegador** (`capturas-29.mjs`): las 14 capturas tienen la barra con 4 o 5 ítems y uno activo, como mucho un naranja, 0 pares bajo AA, sin scroll horizontal y sin violaciones de CSP.
- **Gate verde**: 689 tests. Pisos: `core` 39 → 96 y `familia` 89 → 160 (incluye los tests de la #27, que no habían subido el piso).

## Lo que cambió en tests viejos, dicho

- Los fixtures de sesión y de «Me anoto» ahora usan fichas completas: sin los tres datos, la pantalla es `/empezar`.
- «Me anoto» ya no pide datos en la práctica, porque `/empezar` los garantiza antes. El paso sigue en el código como defensa.
- El «un naranja» de la #27 es ahora por pantalla: en Mis talleres, con el pago en revisión, no hay naranja; «Me anoto» lo tiene en Talleres.
- «Completa tu perfil» enlaza a `/mis-datos` (antes era `#tus-datos`).

## Decisiones para dirección

1. **El #43 no entró a `main`.** Se mergeó en `mi-espacio/08-el-comprobante`, que era su base. El **#47** lo lleva a `main` (misma rama, sin cambios; la 011 tiene que estar corrida antes). Esta rama ya trae ese código: conviene mergear el #47 primero.
2. **Dependencia nueva: `lucide-react`** (ISC). La orden pide íconos Lucide como Bitácora; se importan los diez que se usan.
3. **Seguridad del equipo** (códigos de respaldo, cerrar otras sesiones) quedó al final de Mis datos. La orden no la ubica.
4. **El pie legal** (Privacidad, Términos, ayuda) ya no aparece adentro de la app: solo en `/entrar` y `/empezar`. La ayuda está en la tarjeta de Inicio.
5. **«N en revisión»** se cuenta con los endpoints que ya tiene el panel: uno por edición vigente, sin endpoint nuevo. Si un día hay muchas ediciones vivas, conviene un conteo en la base.
6. **Barra plegada**: muestra solo íconos y «Salir»; «Volver a la web» queda solo con la barra desplegada.
