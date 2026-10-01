# `@codice/db` — el esquema, sus policies y el banco que las prueba

Nace con la orden Códice #13 (Mi espacio, PR 1). Trae **el esquema entero de v1
con su RLS y sus tests, y nada más**: ni API, ni pantalla, ni kit.

```
migrations/          las migraciones, inmutables una vez aplicadas
semillas/            datos de arranque (no cambian el esquema); se corren después de su migración
supabase-base.sql    el entorno de Supabase para el banco — NO es una migración
src/banco.ts         un Postgres de verdad, en proceso, con las migraciones puestas
src/*.test.ts        87 tests: 83 que afirman fila por fila qué ve cada sesión
                     y 4 que afirman los permisos de tabla, verbo por verbo
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

**El SQL viaja a `main` en su propio PR y lo corre dirección** en el editor SQL,
después del merge. Rodolfo no toca Supabase, y esa regla no se movió.

Las seis de la #13 las corrió **el CEO con autorización expresa de Germán**, no
Germán en persona; la cabecera de cada archivo lo dice con esas palabras. Se
escribe porque la versión anterior de este párrafo decía «SOLO Germán» y una
regla que en los hechos se cumplió de otra manera, sin que nadie lo anote, es una
regla que la próxima vez no va a frenar nada.

### Las dos cicatrices de Omnia, como procedimiento

1. **Antes de ejecutar, la barra del proyecto dice `armandoduarte-familia`.** Se
   mira, no se supone. Dos pestañas abiertas y el SQL entra en el proyecto
   equivocado.
2. **«APLICADA» se escribe cuando se vio terminar.** No al pegar el SQL, no al
   apretar Run: cuando la salida volvió sin error. Una cabecera que dice
   «aplicada» sobre una migración que se cortó a la mitad es peor que una que no
   dice nada.

## Estado de las migraciones

**LAS NUEVE ESTÁN APLICADAS.** Las seis de la #13 el 29/9/2026 a las 02:34
(hora de Uruguay), desde el commit `fd93eab`; la 007 el mismo día a las 15:58,
desde `c3a485e`, en su propia sesión; la 008 el 30/9/2026 a las 21:55, desde
`db747a1` (`main` con el PR #37), y tres minutos después la semilla
`semillas/001_taller_de_merida.sql` (guardada en el editor como
`semilla_02_taller_de_merida`); la 009 el 30/9/2026 a las 23:35, desde `965b812`
(la rama del PR #39, antes del merge). Todas en `armandoduarte-familia`, corridas por el
CEO con autorización de Germán.

| # | archivo | qué trae | aplicada |
|---|---|---|---|
| 001 | `001_personas_y_miembros.sql` | `personas`, `miembros` y **las cinco funciones** de las que cuelgan todas las policias siguientes | **29/9/2026 02:34** |
| 002 | `002_cursos_y_ediciones.sql` | el catálogo; lo publicado se ve sin entrar | **29/9/2026 02:34** |
| 003 | `003_inscripciones_y_libro.sql` | `inscripciones` (sin columna estado) y `pagos_libro` insert-only | **29/9/2026 02:34** |
| 004 | `004_datos_de_cobro_y_auditoria.sql` | la cuenta a la que se transfiere y el registro append-only | **29/9/2026 02:34** |
| 005 | `005_seguridad_512.sql` | `totp_backup_codes` y `security_devices`, del kit | **29/9/2026 02:34** |
| 006 | `006_storage_comprobantes.sql` | el bucket privado `comprobantes` y sus policies | **29/9/2026 02:34** |
| 007 | `007_permisos.sql` | los `grant` de tabla, secuencia y función que el proyecto no da solo | **29/9/2026 15:58** |
| 008 | `008_el_panel_del_equipo.sql` | las cuatro consultas del panel `/equipo` (orden #24 A), sin tablas ni policies nuevas | **30/9/2026 21:55** |
| 009 | `009_me_anoto.sql` | el cupo cumplido por la base y las tres consultas de «me anoto» (orden #24 B) | **30/9/2026 23:35** |
| 010 | `010_el_libro_en_el_panel.sql` | `libro_de_edicion()` y `firma_del_libro()`: el último renglón del libro para Inscriptos (orden #27 C), sin tablas ni policies nuevas | pendiente (la corre el CEO después del merge del PR C) |
| 011 | `011_el_perfil.sql` | ciudad, año de nacimiento y nivel educativo en `personas`; `notas_de_persona` (solo se agrega, equipo por territorio con aal2, el cliente no la lee); `panel_clientes()` reemplazada con esas columnas (orden #27 D) | pendiente (la corre el CEO **antes** de desplegar el PR D) |

Las siete quedaron guardadas en el editor SQL de Supabase con el nombre de su
archivo (`001_personas_y_miembros` … `007_permisos`).

### Lo que se verificó contra la base, y no contra la intención

No alcanza con que el editor no haya dado error: lo que sigue se consultó sobre la
base real, después de correr las seis de la #13.

| qué | medido |
|---|---|
| tablas en `public` | **10**, y **las 10 con RLS** |
| policies en `public` | **39** |
| policies en `storage` | **3** |
| bucket `comprobantes` | **privado**, 5 MB, `jpeg`/`png`/`pdf` |
| triggers | **17** |
| funciones | **20** |

### Y el test que tenía fecha de vencimiento se cumplió

Hasta esta rama, `toda-tabla-lleva-rls.test.ts` afirmaba que **las seis decían
«APLICADA: —»**, y estaba escrito que el día que se aplicaran se iba a poner rojo
y a obligar a alguien a venir. Pasó exactamente eso: al completar las cabeceras el
test se puso rojo, y por eso ahora afirma lo contrario — que **ninguna** dice «—»,
que todas nombran el proyecto, la fecha y el commit, y que **dos cabeceras que
dicen la misma hora dicen el mismo commit**. Un test que se actualiza para volver
a verde sin cambiar de afirmación sería un test apagado; éste cambió de afirmación
porque cambió el mundo.

Y volvió a cobrar con la 007, que es lo que hizo falta para escribirlo bien: la
afirmación decía «un solo commit en las seis», la 007 se corrió doce horas después
en su propia sesión y el rojo fue sobre el test, no sobre la cabecera. Lo que se
quería decir siempre fue *una corrida, un commit* —y al revés—, que es lo que dice
ahora y vale para la sesión que viene sin que nadie toque el archivo.

### El orden es el orden

`001` → `007`, una por una, esperando que cada una termine. La `002` usa
`es_zona_iana()` de la `001`; la `003` usa `veo_pais()` de la `001`; la `006` usa
`inscripcion_es_mia()` de la `003`; la `007` da permisos sobre todo lo anterior.
Salteada una, la siguiente no compila.

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
WebAssembly, en proceso—, le pone encima `supabase-base.sql` y le corre las siete
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
  de estas siete migraciones usa sintaxis posterior a Postgres 15, pero la
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


## Semillas

`semillas/` guarda **datos**, no esquema. Se corren en Supabase después de la
migración que las necesita, con la misma regla de arriba (se mira la barra del
proyecto antes de ejecutar), y se pueden correr dos veces sin duplicar nada.

| # | archivo | qué trae | después de | aplicada |
|---|---|---|---|---|
| 001 | `001_taller_de_merida.sql` | «El arte de amar a tu adolescente», edición del 5/11/2026 8:30–13:00 `America/Merida`, Fiesta Inn Mérida, $1,170 MXN, **en borrador** | 008 | **pendiente** |

Su test está en `src/el-panel-del-equipo.test.ts`: la corre dos veces sobre el
banco y afirma el curso, la hora de pared en Mérida (14:30 UTC) y que en
borrador nadie de afuera la ve ni se puede anotar.
