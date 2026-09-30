# #15 · 0-bis y los puntos 1–3 — las consultas contra la base

Rama `mi-espacio/02-la-puerta` (PR #27), con `main` mergeado adentro (trae la
`007`). Es lo que faltaba para que el CEO pueda repetir F.4 entera.

## Qué se hizo

### 0. La cabecera de la 007 y su fila de PENDIENTES

- `packages/db/migrations/007_permisos.sql` — `APLICADA: 29/9/2026 15:58 (UY), en
  \`armandoduarte-familia\`, desde c3a485e`, con lo verificado y el nombre con el
  que quedó guardada en el editor.
- `packages/db/src/toda-tabla-lleva-rls.test.ts` — la fila de `PENDIENTES` se
  borró. **La pidió el test, no la memoria**: apenas la cabecera dijo su fecha,
  la mitad «sobra tan rojo como falta» se puso roja sola.
- `packages/db/README.md` — «LAS SIETE ESTÁN APLICADAS», con las dos sesiones.

Y dos afirmaciones del inventario cambiaron porque eran **copias**, no hechos:

| afirmación | antes | ahora |
|---|---|---|
| la fecha de la cabecera | `29/9/2026 02:34` escrito literal | día, mes, año, hora y huso **por forma** |
| el commit | «las seis, uno solo» | **una corrida, un commit — y al revés** |

La segunda es la que vale el renglón. Decía `[...new Set(commits)].toHaveLength(1)`
y era verdad mientras existiera una sola sesión; la `007` se corrió doce horas
después y el rojo fue **sobre el test**, no sobre la cabecera. Lo que se quería
decir siempre fue que dos cabeceras con la misma hora dicen el mismo commit.
Escrito así vale para la sesión que viene sin que nadie toque el archivo, y sigue
cazando lo mismo: la cabecera copiada de la vecina. Mutaciones, cada mitad por
separado:

| mutación | qué cae |
|---|---|
| la 007 dice `fd93eab` (el commit de las seis) | «estas migraciones dicen el mismo commit desde horas distintas» |
| la 007 dice `02:34` (la hora de las seis) | «estas corridas dicen la misma fecha y hora desde commits distintos» |

### 0-bis. La API estaba escrita contra un esquema que no es el de las migraciones

Cuatro consultas, y **ninguna habría funcionado nunca**:

| dónde | decía | la columna es | quién la define |
|---|---|---|---|
| `supabase.service.ts:126` (`rolDe`) | `miembros.persona_id` | `user_id` | `001_personas_y_miembros.sql:65` |
| `respaldo.controller.ts:49` (`cuantos`) | `persona_id` · `usado_en` | `user_id` · `used_at` | `005_seguridad_512.sql:59` |
| `respaldo.controller.ts:73,77` (`generar`) | `persona_id` | `user_id` | ídem |
| `respaldo.controller.ts:110,126` (`usar`) | `persona_id` · `usado_en` | `user_id` · `used_at` | ídem |

**Y apareció un quinto defecto que el 42703 tapaba, que no estaba en la orden:**
las tres escrituras de `respaldo` —borrar, insertar y quemar— se hacían **con el
token de la persona**, y la `005` ya había escrito

```sql
revoke insert, update, delete on public.totp_backup_codes from anon, authenticated;
-- Escritura (generar / consumir / regenerar): SOLO backend con `service_role`.
```

que la `007` confirmó dándole a `authenticated` **select y nada más** sobre esa
tabla. O sea: aunque los nombres hubieran estado bien, `generar` habría fallado
igual, con `42501` en vez de `42703`. No es una decisión de diseño que se tomó
acá — es la que ya habían tomado las migraciones, y el código la contradecía.

Arreglado: `SupabaseService` gana `comoElServicio()`, con su porqué escrito y
apuntando a la línea de la `005`. `generar` y el `update` de `usar` van por ahí y
filtran por el `user_id` que sale del token validado, nunca por uno del cuerpo del
pedido. `cuantos` y el `select` de `usar` siguen con el token de la persona: ahí
la `007` sí da `select` y la RLS decide, que es un freno más que conviene tener.

**El test que faltaba** —`apps/api/src/las-consultas-corren-contra-la-base.spec.ts`,
9 tests—. Levanta el banco PGlite de `@codice/db` con las siete migraciones y le
corre por encima `rolDe`, `personaDe` y los tres de `RespaldoController` **sin
tocarlos**: lo único reemplazado es a quién le hablan. Un traductor convierte la
misma cadena de `.from().select().eq()` que escribe la app en SQL y la ejecuta
como `authenticated` o como `service_role`, una sesión por consulta, igual que
PostgREST. Lo que el traductor no entiende, lo tira en vez de adivinar: un
traductor que adivina se prueba a sí mismo.

Para que eso fuera posible, `@codice/db` gana `comoServicio()` en el banco. Estaba
escrito que el banco **no** probaba `service_role` «porque probar `bypassrls`
sería probar que bypassea», y sigue siendo cierto para la RLS. Lo que se prueba
ahora con ese rol es lo otro, lo que `bypassrls` **no** tapa: que la tabla exista,
que la columna exista y que el `grant` esté puesto. Está reescrito en `banco.ts` y
en el README.

Las tres mutaciones, cada una vista en rojo y devuelta:

| mutación | qué cae |
|---|---|
| volver a `persona_id` en `miembros` | los dos de `rolDe`: «promise rejected UnauthorizedException» |
| volver a `usado_en` en `totp_backup_codes` | los cuatro de respaldo: «No pudimos contar tus códigos» |
| `generar` con el token de la persona | tres: «No pudimos reemplazar tus códigos» (42501) |

**La lección quedó en `docs/tareas.md` § Reglas de la casa:** *un test de la API
que no toca la base no prueba una consulta.* Con su caso y con la yapa que vale
igual: un `catch` que descarta el código del error está tirando la única parte del
mensaje que sirve.

### 1. El 401 del mediodía, con evidencia en vez de hipótesis

`getUserFromToken` registra ahora `nombre · código · mensaje` del error antes de
devolver el 401 — **nunca el token, ni la pila** (la pila de `jose` lleva la URL
del JWKS y no aporta nada acá). Se vio funcionando en la corrida de tests:

```
WARN [SupabaseService] El token no pasó la verificación:
     JWTExpired · ERR_JWT_EXPIRED · "exp" claim timestamp check failed
```

Y un arreglo de paso: lo que el propio método ya había decidido adentro del `try`
—un token sin `sub`— salía disfrazado de error de `jose` («Token inválido o
vencido»), que manda a mirar el lugar equivocado. Ahora sale con su mensaje.

**El 401 de las 12:29 no se reprodujo**, y esto no lo cierra: lo instrumenta. Fue
una sola invocación en arranque en frío y desde entonces el mismo camino contestó
403 tres veces seguidas. Si vuelve, el log dice qué error era.

### 2. El token, verificado sobre el empaquetado

`apps/api/src/el-token-se-verifica-de-verdad.spec.ts`, 5 tests, y lo que importa
es **contra qué corren**: `dist/funcion.cjs`, no `src/`. Un JWKS de verdad en un
servidor HTTP efímero, clave ES256 generada en el test y publicada en la ruta
exacta que arma `SupabaseService`. Es lo único que ejercita a la vez el `fetch`
del runtime, el `jose` que esbuild metió adentro y la URL que sale de
`SUPABASE_URL` — los tres sospechosos del 401, y ninguno existe en el fuente.

Qué afirma: token de la clave del JWKS → vale, y **por el camino `jwks`** (si
dijera `getUser`, el JWKS no estaría probando nada); otra clave → 401; vencido →
401; sin token → «Falta el token de acceso»; firma buena sin `sub` → su mensaje
propio.

Se lo vio en rojo sin buscarlo: la primera corrida fue contra un empaquetado de
cinco minutos antes y el caso del `sub` falló diciendo «Token inválido o vencido».
Es exactamente la prueba de que el archivo lee el empaquetado y no el fuente.

### 3. La pantalla no enrola a quien no conoce

Antes, un error cualquiera de `/api/yo` dejaba `yo` en `null`, `decidirReto`
recibía `rol: undefined`, `esEquipo(undefined)` es `true` —y hace bien: es la
regla S0 del kit, que falla cerrado— y salía `enrolar`. **Una mamá cuyo `/api/yo`
falle por lo que sea era mandada a instalar un autenticador.**

El kit no se tocó. Se agregó `apps/familia/src/comun/decision-de-pantalla.ts`, que
lo **envuelve**: si `/api/yo` no contestó, ni se le pregunta. La distinción es
entre «no sé quién es» y «el servidor me dijo que falta el segundo paso» — el 403
`AAL2_REQUIRED` **es** una respuesta y sigue yendo al kit, con su tabla de nueve
casos intacta.

`App.tsx` pinta el estado: «No pudimos confirmar tu cuenta. Vuelve a intentarlo.»
con «Volver a intentar» y «Cerrar sesión». Va después de los códigos de respaldo
—que se ven una sola vez— y antes de todo lo demás.

5 tests con tabla. Mutación: se borra el renglón que atrapa «no contestó» y el
rojo dice la frase del incidente, *expected 'enrolar' to be 'error'*. Va con su
otra mitad al lado —el mismo estado, con respuesta, sí da `enrolar`—, porque si no
el test podría estar pasando sobre un estado que no producía `enrolar` de todos
modos.

## Lo medido

| | |
|---|---|
| Gate | **349 declarados** · 0 saltados · ninguna suite bajo su piso |
| `@codice/api` | 48 → **62** |
| `@codice/familia` | 46 → **51** |
| `@codice/db` | 87 (sin cambio) |
| `check:tuteo`/`i18n`/`estilo`/`tokens`/`secretos`/`seguridad` | verdes (19/19 huellas del kit) |
| `typecheck`, `lint`, `build` de `@codice/web` | verdes |

El merge de `main` trajo un conflicto en `qa/piso-de-tests.md`: las dos ramas
habían agregado filas a la única tabla. Se resolvieron tomando de `main` los pisos
de `db`, `web` y `navegador` —que subieron allá— y conservando los de `familia` y
`api`, que son de esta rama. La prosa de los dos lados quedó entera.

## Lo que quedó pendiente

- **F.4 entera, en el preview.** Es lo que sigue, y es del CEO con Armando.
- El 401 de las 12:29 sigue sin reproducirse. Instrumentado, no cerrado.

## Lo que necesita dirección

**Una decisión, y no es urgente.** `ERR_JWKS_NO_MATCHING_KEY` significa «ninguna
clave del juego sirve para este token», y eso pasa en dos casos distintos: que el
proyecto firme con secreto compartido (donde el respaldo `auth.getUser()`
corresponde) y que el token lo haya firmado un desconocido (donde no corresponde y
cuesta un viaje de red por intento). Los dos terminan bien —`getUser()` rechaza al
segundo—, así que **no bloquea nada**. Estrechar el respaldo a «el JWKS vino
vacío» es media hora y una orden chica. Mientras tanto el log dice lo que se sabe
y no más.

---

## Anexo · F.4 tercera corrida — la cookie del preview

`api()` salía con `credentials: 'omit'`. El argumento escrito al lado era
correcto **sobre nuestras cookies** —la autenticación viaja en el header
`Authorization`, no en una cookie— pero no somos los únicos que ponen una: los
previews de Vercel están detrás de *Vercel Authentication*, que protege el
despliegue con la suya. El navegador la tenía —por eso la pantalla cargaba— y
cada `fetch` llegaba al borde sin ella y volvía **503**. La app se veía y no
funcionaba, y la causa no estaba en la API.

Ahora `credentials: 'same-origin'`. No `'include'`: el pedido es a `/api/…`, el
mismo origen que la pantalla, y `'same-origin'` es exactamente eso — las cookies
van al propio origen y no en un pedido cruzado, que es la superficie que el
comentario viejo quería evitar y que sigue sin hacer falta.

**Y la superficie de CSRF no cambia**, que es lo que había que comprobar antes de
tocarlo: la API no autoriza con cookies. Un pedido de otro sitio que llegue con la
cookie de Vercel pero sin el header `Authorization` es un 401 del guard, igual que
antes.

Tres tests en `apps/familia/src/comun/api-manda-la-cookie-del-preview.test.ts`.
Mutación: volver a `'omit'` y caen dos de los tres, «expected 'omit' to be
'same-origin'». El tercero va aparte a propósito —que el token siga en el header—
porque un lector apurado de este cambio podría entender que ahora la sesión viaja
en cookie, y no.

`@codice/familia` 51 → **54**. Gate: **352 declarados**, 0 saltados, ninguna suite
bajo su piso.
