# `@codice/db` — el esquema, sus policies y el banco que las prueba

Nace con la orden Códice #13 (Mi espacio, PR 1). Trae **el esquema entero de v1
con su RLS y sus tests, y nada más**: ni API, ni pantalla, ni kit.

```
migrations/          las seis migraciones, inmutables una vez aplicadas
supabase-base.sql    el entorno de Supabase para el banco — NO es una migración
src/banco.ts         un Postgres de verdad, en proceso, con las migraciones puestas
src/*.test.ts        83 tests que afirman fila por fila qué ve cada sesión
```

---

## La regla que llega antes que la primera tabla

> **Ninguna política de RLS se copia de Bitácora ni de Omnia. Todas se
> reescriben.**

Armando es un **tercer modelo de inquilino**
(`01 Documentos/docs/inventario-armando.md`):

| App | Dueño del dato | Cómo se expresa |
|---|---|---|
| Bitácora | el profesional | `professional_id`, RLS `auth.uid() = professional_id` |
| Omnia | la clínica | `clinica_id` + rol en `miembros` |
| **Códice** | **la organización, con dos poblaciones** | miembros con rol **y territorio**, más **clientes**, que no son miembros |

Dos cosas lo hacen distinto de Omnia: el **territorio** —Diana ve lo
internacional, Gabi ve México, y eso decide qué filas existen para esa sesión, no
solo qué botones se dibujan— y los **clientes**, una población entera que no es
miembro de nada.

Una policy copiada funciona con una persona y filtra datos en silencio cuando
entra la segunda. Con datos de familias de por medio, eso no es un bug: es un
incidente.

**Se cumplió:** las policies de las migraciones `001`–`004` y `006` están
escritas de cero. Lo único que sí se copió, y va declarado en su cabecera, son las
dos tablas del Kit de Seguridad 512 de la `005` (`referencia-cenit`) y el
**mecanismo** del banco (`supabase-base.sql` y `src/banco.ts`, de Omnia) — que no
trae ni una policy: trae la forma de ejecutarlas.

## Una sola base, y es producción

`armandoduarte-familia`, ref `jrscpjdscgycetyvenco`, región us-east-1. No hay
base de desarrollo: el banco de pruebas **es** el entorno de desarrollo.

**El SQL viaja a `main` en su propio PR y lo corre Germán** en el editor SQL,
después del merge. Rodolfo no toca Supabase.

### Las dos cicatrices de Omnia, como procedimiento

1. **Antes de ejecutar, la barra del proyecto dice `armandoduarte-familia`.** Se
   mira, no se supone. Dos pestañas abiertas y el SQL entra en el proyecto
   equivocado.
2. **«APLICADA» se escribe cuando se vio terminar.** No al pegar el SQL, no al
   apretar Run: cuando la salida volvió sin error. Una cabecera que dice
   «aplicada» sobre una migración que se cortó a la mitad es peor que una que no
   dice nada.

## Estado de las migraciones

| # | archivo | qué trae | aplicada |
|---|---|---|---|
| 001 | `001_personas_y_miembros.sql` | `personas`, `miembros` y **las cinco funciones** de las que cuelgan todas las policias siguientes | — |
| 002 | `002_cursos_y_ediciones.sql` | el catálogo; lo publicado se ve sin entrar | — |
| 003 | `003_inscripciones_y_libro.sql` | `inscripciones` (sin columna estado) y `pagos_libro` insert-only | — |
| 004 | `004_datos_de_cobro_y_auditoria.sql` | la cuenta a la que se transfiere y el registro append-only | — |
| 005 | `005_seguridad_512.sql` | `totp_backup_codes` y `security_devices`, del kit | — |
| 006 | `006_storage_comprobantes.sql` | el bucket privado `comprobantes` y sus policies | — |

**Al correrlas, se completa la columna de arriba y la línea `-- APLICADA:` de
cada archivo, con la fecha.** Hay un test que hoy afirma que las seis están en
«—»: el día que se apliquen se pone rojo, y eso es a propósito — es el
recordatorio más barato de que el repo y la base tienen que decir lo mismo.

### El orden es el orden

`001` → `006`, una por una, esperando que cada una termine. La `002` usa
`es_zona_iana()` de la `001`; la `003` usa `veo_pais()` de la `001`; la `006` usa
`inscripcion_es_mia()` de la `003`. Salteada una, la siguiente no compila.

### Si la `006` da un error de permisos

`storage.objects` no es de `postgres`: es de `supabase_storage_admin`. En el
editor SQL esto normalmente funciona, pero si **esa sola** migración falla por
permisos, **no se fuerza nada**: el bucket se crea desde Storage → New bucket
(privado, 5 MB, `image/jpeg` · `image/png` · `application/pdf`) y las policies
desde Storage → Policies, con las mismas expresiones del archivo.

## El primer dueño, que no viene sembrado

Ninguna migración crea un miembro. La app nace **con Armando como dueño y nadie
más**, y esa fila la inserta Germán a mano el día que Armando entre por primera
vez —antes no, porque `miembros.user_id` referencia a `personas`, que nace con el
primer ingreso—:

```sql
-- Después de que Armando entró una vez por mail. Se comprueba el id primero:
select id, email from public.personas where email = 'el-mail-de-armando';

insert into public.miembros (user_id, rol, territorio)
values ('<el id de arriba>', 'dueno', 'todos');
```

Gabi y Diana **no** se insertan a mano: las invita Armando desde el panel (PR 6),
que es lo que deja el renglón en `auditoria`.

## El banco de pruebas

`pnpm --filter @codice/db test`. Levanta PGlite —Postgres compilado a
WebAssembly, en proceso—, le pone encima `supabase-base.sql` y le corre las seis
migraciones en orden. No toca Supabase, no toca la red, no necesita Docker.

`banco.como(usuarioId, aal, hacer)` corre algo como esa persona, con el rol
`authenticated` y el `aal` que se le pase. El `aal` es lo que este banco tiene y
el de Omnia no, y sin él no se puede probar S3 del kit.

**Lo que el banco NO prueba**, dicho para que no se lea como «todo»:

- **`service_role`.** Lleva `bypassrls`; probarlo sería probar que bypassea. Es
  el rol de la API y su freno está en la API.
- **La subida real de un archivo.** Se prueban las policies sobre
  `storage.objects`, que son filas. El tope de 5 MB y los tres tipos MIME los
  aplica el servicio de Storage: acá se afirma que el bucket los **declare**.
- **La versión de Postgres.** PGlite trae una más nueva que la del proyecto. Nada
  de estas seis migraciones usa sintaxis posterior a Postgres 15, pero la
  diferencia existe.

## Los tipos generados

No están todavía, y **no bloquean este PR**. `supabase gen types typescript`
necesita una base con TCP, que PGlite no da. Se generan contra el proyecto
(`--project-id jrscpjdscgycetyvenco`) **después** de que Germán corra las
migraciones, en un commit del PR 2.

## Lo que NO está acá

`rescates` (PR 3, `mi-espacio/03-rescate`), la semilla real de Mérida (PR 4), los
`.ics` y los mails (PR 5). Y ninguna regla de negocio: ésas viven en
`packages/core`, con test.
