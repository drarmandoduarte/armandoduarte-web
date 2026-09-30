# Seguridad 512 · medición · Mi espacio (`apps/familia` + `apps/api`) · 2026-09-29

Kit de Seguridad 512 **v1.1.0**, instalado por la orden Códice #15.
Cada fila dice **dónde está**, con `archivo:línea`. Ninguna queda «A MEDIAS».

| # | Qué exige la vara | Estado | Dónde |
|---|---|---|---|
| **S0** | Todos los roles clasificados `equipo`/`cliente`, y el segundo paso obligatorio solo para equipo | **CUMPLE** | `apps/api/src/seguridad-512/seguridad-512.config.ts:69-73` (`dueno`/`equipo` → equipo, `cliente` → cliente) · idéntica en `apps/familia/src/seguridad-512/seguridad-512.config.ts` · guardián: `apps/api/src/roles-clasificados.spec.ts:85` lee el `check (rol in (…))` de `packages/db/migrations/001_personas_y_miembros.sql:66` |
| **S1** | Sin contraseña: se entra con un código al correo | **CUMPLE** | `apps/familia/src/entrar/Entrar.tsx:60` (`signInWithOtp`, `shouldCreateUser: true`) · no existe ningún `signInWithPassword` en el repo |
| **S2** | Autenticador **obligatorio** para todo rol de equipo, sin «después» | **CUMPLE** | decide `apps/familia/src/seguridad-512/nucleo/decidir-reto.ts:45` (núcleo, sin editar) · pantalla `apps/familia/src/entrar/Enrolar.tsx` · la única salida es cerrar sesión: `apps/familia/src/App.tsx:75` |
| **S3** | Guard global deny-by-default; excepciones con razón escrita | **CUMPLE** | `apps/api/src/app.module.ts:31` (`{ provide: APP_GUARD, useClass: Aal2Guard }`) · **dos** excepciones: `apps/api/src/salud.controller.ts:14` y `apps/api/src/respaldo/respaldo.controller.ts:106` · inventario: `apps/api/src/aal2-cobertura.spec.ts:63` |
| **S4** | 30 min de inactividad y tope de 12 h, en la app **y** en el servidor | **CUMPLE** | app: `apps/familia/src/seguridad-512/nucleo/useAalWindow.ts:33` (`INACTIVITY_MS`), consumido en `apps/familia/src/comun/sesion.ts:42 y :102` y actuado en `apps/familia/src/App.tsx:101` · servidor: `apps/api/src/seguridad-512/nucleo/aal2.guard.ts:36` (`AAL2_MAX_AGE_SECONDS`, 12 h por defecto) |
| **S5** | Códigos de respaldo: diez, scrypt, tiempo constante, guardarlos es obligatorio | **CUMPLE** | generación y verificación en el núcleo: `apps/api/src/seguridad-512/nucleo/backup-codes.ts` · cableado a `totp_backup_codes` de la #13: `apps/api/src/respaldo/respaldo.controller.ts:76` · quemado con carrera resuelta en la base: `:139` · pantalla con el botón apagado hasta guardar: `apps/familia/src/entrar/CodigosDeRespaldo.tsx:91` |
| **S6** | Paso reciente para las acciones que duelen | **CUMPLE** | `apps/api/src/respaldo/respaldo.controller.ts:66` (`@PasoReciente(5)` sobre regenerar) · inventario: `apps/api/src/paso-reciente.spec.ts:36` · la pantalla traduce el código: `apps/familia/src/mi-espacio/MiEspacio.tsx:137` |
| **S7** | El código de respaldo se usa **desde la pantalla de entrada** | **CUMPLE** | ruta: `apps/api/src/respaldo/respaldo.controller.ts:101` (`@SinSegundoPaso`, con la razón) · pantalla: `apps/familia/src/entrar/Reto.tsx:56` |

## Lo que la vara pide y esta app resuelve distinto, con su motivo

- **RLS con `aal2` para los roles de equipo.** El `LEEME.md` del kit lo pide
  «si la app lee la base desde el navegador». **Ésta no la lee**: `apps/familia`
  tiene cero `.from(`, `.rpc(` y `.storage`, con un test y su mutación
  (`apps/familia/src/sin-base-desde-el-navegador.test.ts`). La RLS con `aal2`
  igual existe, la trajo la #13 y la prueban sus 83 tests; lo que no hace falta
  es repetirla acá.
- **Service worker.** **No hay en v1**, y se declara: el día que entre, la regla
  del `README.md` del kit pasa a test. No hay ningún `serviceWorker` ni
  `manifest` en `apps/familia`.
- **Tabla de auditoría / avisos.** La #13 dejó la auditoría append-only
  (`004_datos_de_cobro_y_auditoria.sql`). Los avisos de aparato nuevo
  (`0035_seguridad_avisos` de Cenit) **no entran en la #15**: ninguna ruta de
  esta orden los escribe, y la orden no los pide.

## Las dos cosas del kit que NO se pudieron cumplir desde este repo

Las dos son defectos del kit v1.1.0 y se arreglan **en el kit** (sube `VERSION`,
se regeneran huellas, sale un kit nuevo para todas las apps). Lo decide Dirección
de 512, no esta orden.

1. **`apps/api/src/seguridad-512/nucleo/aal2.guard.ts:147` devuelve un mensaje en voseo** —«Volvé a ingresar
   el código de tu autenticador para hacer esto»— y ese texto **lo lee una
   persona**: es el `message` del 403 con `PASO_RECIENTE_REQUERIDO`. En una app
   mexicana está mal escrito, y el núcleo no se edita dentro de una app.
   *Mitigado acá*: la pantalla **nunca** pinta el `message` del servidor; traduce
   el **código** a un texto de `familia.json`. Ver `apps/familia/src/comun/api.ts`.
   `check:tuteo` se saltea `seguridad-512/nucleo/` con el caso escrito.
2. **`apps/api/src/seguridad-512/nucleo/usuario-del-pedido.spec.ts` no es portable**: importa
   `../../auth/auth.guard`, `../../auth/profiles.repository` y
   `../../shared/supabase.service`, que son de Cenit. Un archivo de `nucleo/` que
   no se puede instalar byte por byte en otra app contradice el `LEEME.md` del
   propio kit. *Mitigado acá*: **no se editó** (huella intacta, 19/19), se excluyó
   del corredor con el motivo escrito en `apps/api/vitest.config.ts`, y la
   propiedad que afirmaba —una sola validación por pedido— se recuperó en
   `apps/api/src/aal2-comportamiento.spec.ts:167` y `:179`.

## Y una corrección de la orden, medida

La orden #15 y el `LEEME.md` del kit dicen **«20 de 20»** huellas. El kit tiene
**19** archivos de núcleo, **19** líneas en `HUELLAS.txt`, y su propio guardián
declara `PISO_DE_ARCHIVOS = 19`. Se contó antes de afirmarlo. El guardián da
**19 de 19 intactos**.
