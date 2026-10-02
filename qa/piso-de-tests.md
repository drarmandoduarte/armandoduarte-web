# Piso de tests

Cuántos tests tiene que **declarar** cada suite como mínimo. Lo lee
`scripts/guardian-de-guardianes.mjs` y se compara contra el reporte de cada
corrida.

Cuenta los **declarados**, corran o no. Su trabajo es cazar a los que
desaparecen —el archivo renombrado que se sale del glob y no deja ni rastro de
saltado—; de los que están y no corren se ocupa `qa/skips-permitidos.md`.

**Bajar un número de esta tabla es un acto visible**: es un renglón en el diff y
alguien lo va a leer en el PR. Ése es el punto.

> Este archivo tiene **una sola tabla**, y no es una preferencia de formato: el
> lector se queda con la primera y una segunda le pisaría los números en
> silencio. El relato va abajo, en prosa.

| paquete | piso |
|---|---|
| `@codice/ui` | 31 |
| `@codice/core` | 96 |
| `@codice/prompts` | 3 |
| `@codice/db` | 107 |
| `@codice/web` | 71 |
| `@codice/familia` | 160 |
| `@codice/api` | 70 |
| `@codice/navegador` | 40 |




## Lo que trae la orden #33 — `web` 63 → 71

- **`@codice/web` (+3 de la #33)**: `la-web-no-nombra-vercel.test.ts` pasa de 5 a
  7 —el piso de las cuatro páginas y Spotify— y cada test afirma la rama de
  `MI_ESPACIO_EN_LA_WEB` que se publicó, con las dos escritas;
  `lo-que-mando-armando.test.ts` pasa de 4 a 5 (los tres textos del 2/10 en
  i18n y en `dist`). Los otros 5 ya estaban y no se había subido el piso.
  Mutación: build con las banderas en `true` y test en `false` → caen 5; build
  en `false` y test en `true` → caen 5.

## Lo que trae la orden #29 — `core` 39 → 96, `familia` 89 → 160

- **`@codice/core`**: `src/mi-espacio/marco.test.ts` (+11) — `necesitaEmpezar`,
  `faltanEnLaFicha`, `proximoTaller`, `edicionesVigentes`, `validarEmpezar` y
  `empezarParaEnviar`. El resto de la diferencia son los tests de la #27 (C y
  D: comprobante y perfil), que entraron sin subir el piso; se suben acá para
  que un archivo que desaparezca se note.
- **`@codice/familia`**: `src/comun/el-marco.test.tsx` (+12: la barra para
  cliente y equipo, el activo por ruta, navegar sin recargar, plegar que se
  recuerda, el cajón con el foco atrapado, Inicio), los casos de `/empezar` en
  `acento-y-ruta.test.ts` (+5) y en `me-anoto.test.tsx` (+3). Mutaciones:
  quitar el chequeo de datos → caen 2; el panel para todos → caen 2; sin trampa
  de foco → cae 1; sin guardar el plegado → cae 1. Más los de la #27.

## Lo que trae la orden #24 A — `db` 87 → 107, `core` 23 → 39, `api` 62 → 70, `familia` 83 → 89

- **`@codice/db` (+20)**, `src/el-panel-del-equipo.test.ts`: las cuatro funciones
  de la 008 con dueño, equipo México, equipo internacional y cliente; lo que el
  panel escribe (cursos, ediciones, sumar y quitar del equipo, auditoría); y la
  semilla del taller de Mérida corrida dos veces. Mutaciones: `panel_inscriptos`
  como `security definer` → caen 4 (Gabi ve a Pilar…); sin el filtro de miembro
  → caen 2 (el cliente ve su fila); `inscriptos_de_edicion` sin freno → cae 1.
- **`@codice/core` (+16)**, `src/panel/panel.test.ts`: hora de pared ↔ instante
  por zona (D15, con horario de verano), validaciones de curso y edición, CSV
  con BOM y fórmulas desarmadas, búsqueda, WhatsApp y qué botón de equipo ve
  cada rol.
- **`@codice/api` (+8)**, en `las-consultas-corren-contra-la-base.spec.ts`:
  `EquipoController` contra el banco (con `rpc` en el traductor). Mutaciones: el
  argumento de `panel_inscriptos` mal nombrado y leer con `service_role` → cae
  «Gabi ve a Laura y no a Pilar».
- **`@codice/familia` (+6)**: `equipo/el-panel-del-equipo.test.tsx` (5) y la
  ruta `/equipo` en `acento-y-ruta.test.ts` (1). Mutación: la columna de equipo
  para todos → cae «el equipo (no dueño) no ve la columna».

## Lo que trae la orden #23-bis — `@codice/navegador` 39 → 40

`e2e/nucleo-se-pinta.spec.ts`: con el mouse sobre el núcleo 3, el círculo y la
línea en `--naranja` y el glifo en `--crema`; en reposo, teal. Mutación: sin la
regla de hover → cae.

## Lo que trae la orden #23 — `@codice/web` 62 → 63 y `@codice/navegador` 38 → 39

**Uno** en `apps/web/src/armando-no-flota.test.ts`: la primera fila del
`de-pie-560.png` es transparente en todo el ancho (la cabeza está entera).
Mutación: el PNG de la v2 en su lugar → cae con «228 píxeles con alfa»; y cae
también el de `Retrato.tsx`, que declara 2791.

En el navegador, **dos más y uno menos**:
- `e2e/heroes-iguales.spec.ts` (dos, 1440×900 y 1920×1080): portada y taller con
  la misma caja de arco, rótulo a la misma altura y título del mismo tamaño;
  arco a 48 px de la cabecera y apoyado abajo, rótulo a 72. Mutación: devolverle
  al taller las columnas 1,32fr/0,68fr de la #16 → caen los dos.
- `e2e/altura.spec.ts` pierde «ninguna excepción sobra»: `PENDIENTES` quedó
  vacía y el mensaje del propio test decía que ese día se borraba. Las dos
  afirmaciones nuevas (hero exacto, tope de 1,6 pantallas) viven en `JUZGAR` de
  `check/altura.mjs`. Mutaciones: el hero con 40 px de más → 4 hallazgos; una
  sección con `padding-block: 500px` → cae «pasa el tope de 1.6 pantallas».

## Lo que trae la orden #22 — `@codice/familia` 80 → 83

Tres en `src/comun/nunca-un-momento-eterno.test.tsx`, montando `App`:
(a) `getAuthenticatorAssuranceLevel` rechaza → la pantalla de error con sus dos
botones, nunca «Un momento…»; (b) nunca contesta → a los 11.999 ms todavía
espera y a los 12.000 muestra el error (reloj falso); y la otra mitad, que
cuando todo contesta se llega a Mi espacio igual que antes.

Mutaciones: sin el `finally` que baja `cargando` → caen (a) y (b); sin el tope
→ cae (b) y solo (b).

## Lo que trae la orden #21 — `@codice/web` 58 → 62 y `@codice/ui` 30 → 31

**Cuatro** en `apps/web/src/las-imagenes-llevan-su-huella.test.ts`, sobre
`dist/`: el piso (las cuatro páginas, ≥ 15 URLs de imagen en `/` y ≥ 25 en
`/merida`, ninguna en el CSS), ninguna URL de `img/` sin `?v=`, la huella igual
al SHA-256 del archivo publicado, y cada `og:image` con huella. Busca con una
expresión propia y no con la de `scripts/huellas.mjs`, para no compartir sus
puntos ciegos.

Las dos mutaciones de la orden, cada una vista en rojo y en su test:
(a) un byte más en `dist/img/armando/medio-cuerpo-900.webp` sin regenerar el
HTML → cae «la huella es la del archivo», con «el archivo da 78fbc39d»;
(b) un `<img src="/img/cff-400.webp">` escrito a mano en `dist/index.html` → cae
«ninguna URL sale sin `?v=`», nombrándolo.

**Uno** en `packages/ui/tokens.test.mjs`: `brand.ochre.text` sobre crema ≥ 4,5
(6,48 plano). Lo que manda es el píxel pintado sobre la foto, y eso se mide en
el navegador; esto es el piso para que nadie aclare el token sin enterarse.

## Lo que trae la orden #18 — `@codice/familia` 59 → 80

Veintiuno nuevos, en dos archivos:

- `src/comun/la-entrada-a-la-altura.test.tsx` (**12**): las seis casillas del
  código —una sola entrada, pegar «123 456» o «65-43-21-99» las llena, el foco
  que avanza, las casillas en `aria-hidden`—; el marco —la cabecera lleva a la
  web, el pie trae las dos legales y **el WhatsApp de Gaby y nunca el del
  taller**, el panel de Armando solo en `/entrar`, y panel **o** retrato, nunca
  las dos imágenes—; y `/entrar` de arriba abajo —Google primero y con su logo,
  «espacio» en teal y un solo naranja, el aviso legal con sus dos enlaces—.
- `src/comun/acento-y-ruta.test.ts` (**9**): `partirAcento`, con la comprobación
  de que los cinco títulos de `familia.json` llevan exactamente una palabra
  marcada, y `rutaQueCorresponde` (punto F): `/entrar` → `/mi-espacio` con
  sesión y rol, también desde `/`, y ningún estado intermedio mueve la URL.

Mutaciones, cada una por separado y cada una vista en rojo: el campo sin limpiar
lo pegado (cae 1); el retrato montado también a ≥ 1100 (cae «panel o retrato»);
`/entrar` sin panel (caen 2); `rutaQueCorresponde` sin la rama de `pasar` (caen
2); `partirAcento` que nunca parte (caen 4); el pie con `TELEFONO_TALLER` (cae 1).
La última se hizo dos veces: la primera **no importaba la constante** y tiraba
once tests por un `ReferenceError`, que es un rojo que no mide la regla; la
segunda, con el import, cae exactamente el del pie.

`check:tokens` suma su propia mitad sin contar tests: la excepción del logo de
Google, con tres mutaciones (otro SVG con hex en `apps/familia/public`, una
segunda fila en la lista, y el logo sin color) — ver el informe de la #18.

## Lo que trae la orden #20 — `@codice/navegador` 35 → 38

Tres tests en `e2e/altura.spec.ts`, la segunda puerta del guardián nuevo
`check:altura`: **ninguna sección es más alta que la pantalla** (regla A de la
#20, que nace de lo que dirección vio en producción a 1920).

Dos son por ruta —portada y `/merida`, los dos viewports de escritorio adentro de
una sola navegación, como `renglones.spec.ts` y por el mismo precio— y **el
tercero es la otra mitad**: que ninguna fila de `PENDIENTES` sobre. Va aparte
porque sobra tan rojo como falta, y una lista de excepciones que no se limpia se
convierte en una lista de mentiras.

Las dos mutaciones, cada una vista en rojo y cada mitad por separado:

| mutación | qué cae |
|---|---|
| `#quien{padding-bottom:400px}` | «#quien mide 1434px y la pantalla 900px: sobran 534px», y también el de 1920 |
| una fila de `PENDIENTES` para una sección que ya entra | «estas secciones ya entran… se borra su fila» |

La lógica no se copia: se importa de `check/altura.mjs`, **incluidas las dos
listas de excepciones**. Dos copias serían dos verdades que un día no coinciden —
la lección del token duplicado de la #06.

## Lo que trajo F.4 cuarta corrida — `@codice/familia` 54 → 59

Cuatro tests en `src/comun/sesion-pregunta-al-entrar.test.tsx` y uno en
`decision-de-pantalla.test.ts`. Existen porque correo → código → «Entrar» daba
`POST /auth/v1/verify` 200 y **no salía ningún `GET /api/yo`**: al montar sin
sesión se anotaba `'no-contesto'`, y el `onAuthStateChange` guardaba la sesión
nueva sin volver a preguntar. La pantalla decía «No pudimos confirmar tu cuenta»
a alguien que acababa de entrar bien.

Se monta `App` entera, con Supabase y `fetch` simulados: el defecto no estaba en
una pieza sino en cómo se encadenaban, y una tabla pura no lo habría visto.

Mutaciones, cada mitad por separado: sacar el `recargar()` del callback → caen
«EL CASO» (un `GET /api/yo` y Mi espacio) y «se espera»; volver el estado sin
sesión a `'no-contesto'` → cae «se espera»; borrar la regla `sin-sesion →
esperando` de `decidirPantalla` → caen la tabla y «se espera». «Montar sin
sesión» no cae con ninguna, y está dicho en su archivo: sin sesión `App` pinta la
entrada sin mirar la decisión; el test está para que eso siga siendo cierto.

## Lo que trajo F.4 tercera corrida — `@codice/familia` 51 → 54

Tres tests en `src/comun/api-manda-la-cookie-del-preview.test.ts`. Existen porque
la pantalla cargaba y **ninguna llamada funcionaba**: los previews de Vercel están
detrás de *Vercel Authentication*, que protege el despliegue con una cookie, y
`api()` salía con `credentials: 'omit'`, llegaba al borde sin ella y volvía 503.

Es el modo de falla de siempre —una opción de transporte que nadie mira hasta que
está publicada, como el `X-Robots-Tag` de la #08 o el `exports` de la #15— y acá
costaba más que un 503 suelto: **sin esto F.4 no se puede correr nunca contra un
preview**, y F.4 es lo que dice si la #15 sirve.

Mutación: volver a `'omit'` y caen dos de los tres, diciendo «expected 'omit' to
be 'same-origin'». El tercero es la otra mitad y va aparte a propósito: que el
token siga yendo en el header `Authorization`. La cookie es del borde de Vercel,
no de nuestra autenticación, y un lector apurado de este cambio podría entender lo
contrario.

## Lo que trae el 0-bis de la #15 — `@codice/api` 48 → 62 y `@codice/familia` 46 → 51

Catorce tests nuevos en `@codice/api` y cinco en `@codice/familia`, y los
diecinueve existen por el mismo motivo: **los 48 de esta API estaban en verde
sobre cuatro consultas que no habrían funcionado nunca**, porque los 48 le
hablaban a un doble de `SupabaseService` en vez de a una base.

**Nueve** en `src/las-consultas-corren-contra-la-base.spec.ts`. Levantan el banco
PGlite de `@codice/db` —las siete migraciones, la `007` incluida— y le corren por
encima `rolDe`, `personaDe` y los tres métodos de `RespaldoController` **sin
tocarlos**: lo único reemplazado es a quién le hablan. Un traductor convierte la
misma cadena de `.from().select().eq()` en SQL y la ejecuta como `authenticated`
o como `service_role`. Las tres mutaciones, cada una vista en rojo:

| mutación | qué cae |
|---|---|
| `miembros.user_id` → `persona_id` | los dos de `rolDe`: «promise rejected UnauthorizedException» (42703 atrapado) |
| `totp_backup_codes.used_at` → `usado_en` | los cuatro de respaldo, empezando por «No pudimos contar tus códigos» |
| `generar` con el token de la persona en vez de `service_role` | tres, con «No pudimos reemplazar tus códigos» (42501) |

**Cinco** en `src/el-token-se-verifica-de-verdad.spec.ts`, y la parte que importa
es contra qué corren: **`dist/funcion.cjs`**, el empaquetado, no el fuente. Un
JWKS de verdad en un servidor HTTP efímero, una clave ES256 generada en el test y
publicada en la ruta exacta que arma `SupabaseService`. Es lo único que ejercita a
la vez el `fetch` del runtime, el `jose` que esbuild metió adentro y la URL que
sale de `SUPABASE_URL` — los tres sospechosos del 401 del 29/9, y ninguno de los
tres existe en `src/`. Se vio en rojo sin pedirlo: el primer intento corrió contra
un empaquetado de cinco minutos antes y el caso del `sub` faltante falló diciendo
«Token inválido o vencido» en vez del mensaje propio, que es exactamente la
diferencia que el arreglo introduce.

**Cinco** en `apps/familia/src/comun/decision-de-pantalla.test.ts`: que un
`/api/yo` que no contesta dé `error` y nunca `enrolar`. La mutación es borrar el
renglón que lo atrapa, y el rojo dice la frase del incidente: *expected 'enrolar'
to be 'error'*. Van con su otra mitad al lado —el mismo estado, con respuesta del
servidor, sí da `enrolar`—, porque si no el test podría estar pasando sobre un
estado que no producía `enrolar` de todos modos.

## Lo que movió la orden #16 — `@codice/navegador` sube a 33

Cuatro tests nuevos en `e2e/renglones.spec.ts`, uno por ruta, y cada uno mide los
**cuatro anchos** que pide la orden (1440, 900, 390, 375): dieciséis mediciones en
cuatro tests. Van agrupados por ruta y no como dieciséis tests porque así hacen
una navegación cada uno en vez de cuatro — **2,4 s medidos** sobre una gate que ya
levanta Chromium. Un rojo igual dice ruta, ancho, título y renglón, porque las
cuatro mediciones se acumulan antes de comparar.

Lo que vigilan es la regla que dirección sacó del hero de `/merida`: *ningún
título termina ni se parte en un renglón de una palabra ni de menos de seis
caracteres.* Es de las que se deshacen solas —alguien alarga un texto, tres
órdenes después otro angosta una columna— y contra la deriva no sirve una
herramienta que hay que acordarse de correr. Ninguna otra comprobación de la casa
mide **cómo se parte** un título: las capturas de fidelidad lo verían, pero
dirían «cambió», no «quedó mal», y solo después de que alguien aprobara la captura
nueva.

La lógica **no se duplica**: el spec importa `RUTAS`, `ANCHOS`, `PISO`,
`EXCEPCIONES`, `RECOLECTAR` y `DE_MAS` de `apps/web/check/renglones.mjs`, que es
el mismo archivo que corre por consola con `pnpm check:renglones`. Es el reparto
que la #07 ya usó con `acento.mjs`, por el mismo motivo: dos copias de la lista de
excepciones serían dos verdades que un día no coinciden.

Y una nota que vale más escrita que callada, porque es un falso positivo con muy
buena cara: la primera versión del barrido agrupaba las palabras por `top`
redondeado y **denunció cuatro renglones huérfanos que no existían**. Las fichas
de «Ahora» tienen `h3 a{display:inline-flex;align-items:center}` con la flecha a
`.8em`, así que la flecha va al lado del texto con otro `top`. Se llegó a
«arreglar» la página con un espacio duro antes de la flecha, y el arreglo no
cambió nada — un ítem de flex con `flex-wrap:nowrap` no se puede ir de renglón. Lo
que estaba mal era la medición. Ahora agrupa por **solape vertical**, que tolera
tamaños de letra distintos y sigue separando dos renglones de verdad.

## Lo que trae la corrección de la #15 — `@codice/db` 83 → 87

Cuatro tests en `src/los-permisos-estan-puestos.test.ts`, y existen porque **el
banco regalaba permisos**.

`supabase-base.sql` reproducía lo que Supabase da cuando se le deja exponer las
tablas nuevas automáticamente (`grant all on tables` por default privilege). El
proyecto `armandoduarte-familia` se creó con esa opción en **no**, que es la
decisión correcta, y Supabase lo implementa quitando `select, insert, update,
delete` de esos defaults. Resultado: las diez tablas nacían **sin un solo
permiso** en producción y con los cuatro verbos acá.

Lo que costó: un cliente con token válido pedía `/api/yo`, el `select` sobre
`miembros` contestaba `42501 permission denied`, el middleware lo atrapaba en
silencio —por diseño: no autentica—, el guard fallaba cerrado y la pantalla lo
mandaba a enrolar un autenticador. **Un cliente no podía entrar de ninguna
forma, y los 83 tests estaban en verde.**

La distinción que ninguna comprobación de esta casa sabía hacer: **42501 no es
RLS**. La RLS devuelve cero filas; la falta de `grant` levanta un error.

| mutación | qué cae |
|---|---|
| quitar `grant select` de `miembros` | «esperado: [select, insert, update] · tiene: [insert, update]» |
| dar `delete` a `authenticated` en `inscripciones` | el de los verbos **y** el que dice «delete en ninguna de las diez» |
| **quitar el revoke del banco** (volver a regalar) | el PISO: «el banco le está dando select sobre personas a anon sin que ninguna migración lo pida» |

La tercera es la que sostiene a las otras dos, y por eso va primero en el
archivo: sin ella, los dos tests de abajo miden la generosidad de PGlite.

### Y cuatro de los 83 cambiaron de afirmación

No se aflojaron: **se endurecieron**, porque con los permisos reales el freno
que corta es otro y es el de más afuera.

| test | antes | ahora |
|---|---|---|
| `anon` no lee `datos_de_cobro` | cero filas (RLS) | `permission denied` (no tiene `select`) |
| `anon` no ve las ocho tablas | ocho ceros (RLS) | ocho `permission denied` |
| nadie borra cursos | la fila sigue ahí | `permission denied` **y** la fila sigue ahí |
| un miembro se desactiva, no se borra | la fila sigue ahí | `permission denied` **y** la fila sigue ahí |

Los dos últimos afirman **las dos mitades**: el permiso, porque es el que decide
hoy, y la fila, porque el día que alguien devuelva el `grant` —un renglón en un
diff— el segundo freno tiene que seguir ahí y decirlo.

## Lo que trae la orden #19 — `@codice/web` 51 → 58 y `@codice/navegador` 33 → 35

Nueve tests, y los nueve existen porque **la #12 se auditó contra el texto de la
orden en vez de contra lo que mandó el cliente**, y el PASA dio por buenas dos
cosas que no lo estaban. La corrección de esa auditoría dejó la doctrina
escrita; esto es su forma ejecutable.

### `src/armando-no-flota.test.ts` — 3, y miran los PÍXELES

La #12 (E) midió `bottom` de la imagen contra `bottom` de la sección: **0 px a
1440, 900 y 375**, y era cierto. Pero el archivo tenía **~300 px de degradado a
transparente** abajo, así que lo que tocaba el borde era aire. **Se midió la
caja, no lo que se ve.**

Este archivo lee el PNG —con `zlib` y nada más, sin dependencias nuevas— y mira
la última fila. Medido: el recorte nuevo tiene **319 de 560 píxeles opacos**
(57 %) con alfa máxima 255; el publicado tenía **0**, alfa máxima **0**. El
tramo contiguo mayor es 163 px (29 %) y no 57 % porque la última fila son **los
dos zapatos** y entre ellos hay aire: por eso van las dos medidas, el total y el
tramo.

| mutación | qué cae |
|---|---|
| volver al `de-pie-560.png` viejo | alfa máxima 0 ≠ 255, y la relación del archivo deja de ser la declarada |
| dejar `Retrato.tsx` en 1400×2614 | la relación declarada no coincide con la del archivo |

### `e2e/armando-al-borde.spec.ts` — 2, y miran la CAJA

La otra mitad, y **en un archivo aparte a propósito**: un archivo opaco colgado
a 40 px del borde flota igual, y una caja al borde con el archivo viejo adentro
también. La regla de la casa es probar cada mitad por separado, porque un piso
que sobrevive porque la otra lo sostiene no está sosteniendo nada.

Mide los **dos** lugares que usan el mismo recorte, `/merida#facilitador` y
`/#quien`. Y ahí apareció lo que la orden mandaba mirar: con el archivo nuevo la
portada quedaba **peor que antes** —el mismo hueco cortaba a Armando a media
pierna con un borde duro y 149 px de crema debajo—. Antes no se notaba porque el
degradado se desvanecía justo ahí. O sea que aquel degradado tapaba dos
problemas, no uno. La portada pasa a apoyarse igual que el taller.

### `src/lo-que-mando-armando.test.ts` — 4, contra el insumo y no contra otro i18n

Compara los cinco núcleos, la sede y el horario contra
`03 Producto/web/insumos/2026-09-28-taller-merida/LEEME.md`, carácter por
carácter. **No** contra otro string de i18n: una copia es una segunda verdad que
coincide justo hasta el día que importa.

El modo de falla que caza no es un error de tipeo, es una **mejora**: alguien le
quita «de la vida» al núcleo 1 porque queda mejor. Probablemente tenga razón —y
no le toca a la web decidirlo. Las dos mutaciones caen con el texto de Armando y
el publicado uno debajo del otro.

### Y una que no suma tests pero vale el renglón

Al quitar el punto de «ADOLESCENTE» (#19, C), `check:renglones` **se puso rojo
solo**: su excepción nombraba «ADOLESCENTE.» y dejó de excusar ningún renglón,
así que la denunció como permiso que sobra. Nadie tuvo que acordarse de ir a
tocarla. Es exactamente para lo que esa comprobación existe.

## Lo que arregló F.4 — `@codice/familia` sube de 40 a 46

Seis tests en `src/la-api-llega-compilada.test.ts`, y existen porque **la #15
pasó la gate entera en verde y se cayó al desplegarse**: `apps/api/package.json`
exportaba `./src/index.ts`, Vercel no compila las dependencias del workspace, y
toda `/api/*` devolvió 500 con `ERR_MODULE_NOT_FOUND`. Las tres herramientas que
podían haberlo dicho —vitest, `tsc --noEmit`, el build de la pantalla— tienen en
común que **ninguna arranca la función**.

Son seis porque hay seis maneras de volver a romperlo, y cada una se probó
apagándola y viéndola en rojo antes de darla por buena:

| lo que vigila | la mutación que lo puso en rojo |
|---|---|
| el piso: el cierre se calculó sobre la entrada real | — (es el piso de los otros cinco) |
| ningún paquete del cierre resuelve a un `.ts` | devolver `"exports": "./src/index.ts"` |
| el `.js` existe compilado y hay un `build` que lo hace | borrar `apps/api/dist` |
| el `vercel.json` lo compila antes que la pantalla | sacar `--filter @codice/api build` del `buildCommand` |
| el empaquetado es CommonJS, conserva `design:paramtypes` y no deja un `require()` de ESM puro | devolver `"type": "module"`; apagar `emitDecoratorMetadata`; y dejar `jose` afuera del empaquetado |
| el lector de manifiestos y la regla de «¿se puede requerir?» | — (el autoexamen: afloja la regla y este test cae antes que los otros) |

El cierre **se recorre, no se escribe**: el test arranca en
`apps/familia/api/index.ts`, junta los `@codice/*` que importa de verdad —sin
leer los comentarios, que nombran `@codice/api` una docena de veces— y sigue
hacia adentro. Una lista escrita a mano se desactualiza en silencio; el día que
`@codice/api` importe `@codice/core`, el barrido lo incluye solo y se pone rojo
el mismo día, porque `@codice/core` todavía exporta su fuente.

Y el quinto merece su renglón, porque es el que aprendió de la **segunda**
caída del mismo día. Arreglado el `.ts`, el preview volvió a dar 500 con
`ERR_REQUIRE_ESM` sobre `jose@6`, que no publica CommonJS. De ahí salieron las
dos mitades del build —y la orden dejaba elegir entre ellas cuando en realidad
hacen falta las dos—:

- **`tsc` primero**, porque es el único que emite `emitDecoratorMetadata`.
  `RolMiddleware` recibe `SupabaseService` por el tipo del constructor y por
  nada más; sin esos metadatos Nest arranca igual y se cae al inyectar, en
  ejecución. esbuild no sabe emitirlos.
- **esbuild después**, sobre el JavaScript ya compilado, porque es el único que
  puede meter adentro un paquete ESM puro. Ahí no hay decorador que emitir: ya
  están resueltos como llamadas a `__metadata()`.

Qué entra y qué queda afuera **no es una lista**: `scripts/empaquetar-funcion.mjs`
le pregunta a cada dependencia, leyendo su `package.json`, si Node la puede
requerir. Una lista de nombres cazaría a `jose` y a nadie más; la regla caza al
próximo. Y la regla vive en un solo archivo —`scripts/se-puede-requerir.mjs`—
que usan el build y el test, porque dos copias serían dos verdades y el día que
no coincidieran mandaría la del servidor.

### Y el 404 que los seis no vieron, que vale escribirlo

Con la API ya en 200, `/entrar` seguía dando **404** en el preview. El
`vercel.json` decía `"source": "/((?!api/).*)"` —la negación adelantada que se
lee en medio internet— y **Vercel no la matchea**: `/entrar`, `/mi-espacio` y
`/cualquier-cosa` caían en el 404 de la plataforma mientras `/api/(.*)`, sin
negación, andaba.

Nada lo vio, y por dos motivos que son el mismo:

- `cabeceras.test.ts` (6) afirmaba el rewrite **con un `toEqual` contra el texto
  del archivo**. Estaba en verde sobre un 404. Ahora afirma el orden, prohíbe la
  negación y comprueba que el comodín cubra las rutas de `src/rutas.ts`.
- `e2e/servidor.mjs` **inventaba el fallback de SPA** en vez de leer el
  `vercel.json`, con un comentario que decía, palabra por palabra, que sin él
  «`/mi-espacio` da 404 en QA y anda en producción — la peor clase de diferencia
  entre los dos». Pasó al revés. Ahora aplica los rewrites del archivo, en orden,
  y con la negación puesta **no arranca**: dice que no sabe traducir ese source.

El guardián que sí lo habría cazado ya existía —`e2e/f4-en-vivo.spec.ts` pide
`GET /entrar` y espera 200— y nunca se había corrido, porque necesita un preview
de verdad. Se corrió.

## Lo que trae la orden #15 — `@codice/api` nace con 48

Seis archivos, y **cinco de los seis vienen del kit** (`tests-por-app/`), que es
la carpeta que el `LEEME.md` del kit manda «copiar y adaptar». Lo adaptado son
las rutas y los nombres de esta app; lo que afirman es del kit.

| archivo | cuántos | qué vigila |
|---|--:|---|
| `aal2-cobertura.spec.ts` | 8 | el inventario REAL de rutas de Nest contra la lista de excepciones |
| `aal2.guard.spec.ts` | 13 | el guard, unidad por unidad (del kit, casi sin tocar) |
| `paso-reciente.spec.ts` | 9 | qué rutas piden un código reciente, y qué pasa con un `aal2` viejo |
| `roles-clasificados.spec.ts` | 8 | los roles de la base contra `seguridad-512.config.ts` |
| `guardian-del-kit.spec.ts` | 2 | que `check-seguridad-512.mjs` exista y dé verde |
| `aal2-comportamiento.spec.ts` | 13 | el guard **ejecutado** sobre las seis rutas de verdad |

El último **no se adaptó: se reescribió**, y el motivo va escrito arriba de
todo en el archivo. El del kit está armado contra `TeamController.invite`,
`MeController.updateProfile` y `POST /team/:id/reset-2fa`, que no existen acá ni
van a existir; cambiarle los nombres habría dejado un test que *parece* probar
algo. Tampoco está entre los que el `LEEME.md` enumera para adaptar (nombra
cobertura, roles, el guard, paso reciente y el guardián). Se copió la idea
—preguntarle al guard lo mismo que le pregunta Nest, con la ruta real— y los
casos son los de esta app.

### Y uno del núcleo que NO corre, dicho en voz alta

`src/seguridad-512/nucleo/usuario-del-pedido.spec.ts` viene del kit **byte por
byte y con su huella**, y no se puede ejecutar acá: importa
`../../auth/auth.guard`, `../../auth/profiles.repository` y
`../../shared/supabase.service`, que son tres archivos de Cenit. Es un defecto
del kit v1.1.0 —`nucleo/` se copia byte por byte a cualquier app y este archivo
no es portable— y se arregla en el kit, no acá.

**No se editó**: la huella sigue siendo la del kit y el guardián compara 19 de
19. Lo que se hizo es excluirlo del corredor, en `apps/api/vitest.config.ts`,
con el motivo escrito — porque un test que no corre no grita, se calla.

**Y la vigilancia que perdía se recuperó**: lo que ese archivo afirma —que el
token se valida UNA sola vez por pedido— lo afirman ahora dos tests de
`aal2-comportamiento.spec.ts`, escritos contra las piezas de esta app: dos
pasadas del guard sobre el mismo pedido hacen **una** validación, y un token
distinto en el mismo pedido hace **dos**. No es la misma prueba; es la misma
propiedad, probada donde se puede probar.

## Lo que trae la orden #15 — `@codice/familia` nace con 31

`apps/familia` entra a esta tabla el día que existe, con **40 tests medidos** en
seis archivos. La mayoría no son nuestros y ése es el punto:

| archivo | cuántos | de quién |
|---|--:|---|
| `seguridad-512/nucleo/useAalWindow.test.tsx` | 9 | **del kit**, byte por byte |
| `seguridad-512/nucleo/decidir-reto.test.ts` | 9 | **del kit**, byte por byte |
| `seguridad-512/nucleo/aparato.test.ts` | 6 | **del kit**, byte por byte |
| `seguridad-512/nucleo/modo-instalado.test.ts` | 4 | **del kit**, byte por byte |
| `sin-base-desde-el-navegador.test.ts` | 3 | de esta app |
| `cabeceras.test.ts` | 9 | de esta app |

**Veintiocho de los treinta y uno vienen del Kit de Seguridad 512 y no se
escribieron acá**: viajan dentro de `nucleo/`, con su huella en
`seguridad-512/HUELLAS.txt`, y `scripts/check-seguridad-512.mjs` se pone rojo si
alguien los edita dentro de la app. Entran al piso igual que cualquier otro: si
un archivo del núcleo desaparece del glob, la cuenta baja y el guardián de
guardianes lo dice — que es una segunda red debajo de la de las huellas.

Los propios son doce. Tres son el barrido de `.from(` / `.rpc(` / `.storage`: el
piso de archivos, el cero, y el auto-examen que comprueba que `soloCodigo()`
sepa distinguir el código de la prosa —sin el tercero, los otros dos podrían
salir verdes sobre archivos que el limpiador dejó en blanco—.

Los otros nueve son las **cabeceras** (`cabeceras.test.ts`), y existen por el
motivo de siempre: una cabecera que se cae no rompe nada visible. La app carga
igual, las pantallas se ven igual y Lighthouse no dice una palabra; lo único que
cambia es que la política que impide que un script ajeno corra en la pantalla de
entrada ya no está. Es el mismo perfil de defecto que el `X-Robots-Tag` de la #08
y el `Cache-Control` de la #11, y las dos veces se descubrió que **ninguna
comprobación miraba el `vercel.json`**.

Vigilan que las cinco cabeceras de seguridad sean las mismas de la web pública,
que el `noindex` vaya **sin condición de host** —allá está condicionado porque el
dominio propio sí se indexa; acá la condición sería un agujero—, que la CSP no
tenga `unsafe-inline` en ninguna directiva, que `connect-src` nombre a Supabase y
a nadie más (`https:` a secas dejaría hablar con cualquier servidor del mundo),
que `/api/*` vaya a la función y el resto al `index.html`, y que la API nunca se
cachee: una respuesta de `/api/yo` guardada por un intermediario es la sesión de
una persona servida a otra.

## Lo que trae la orden #13 — `@codice/db` nace con 83

`packages/db` entra a esta tabla el día que existe, que es la regla que su propio
`README.md` dejó escrita en la #01: «cuando haya esquema, nace con su
`package.json` y con su piso». **83 tests, medidos contra la corrida real**, en
seis archivos que se corresponden con lo que cada uno vigila:

| archivo | cuántos | qué afirma |
|---|--:|---|
| `territorio-y-segundo-paso.test.ts` | 15 | D11 y el kit S3: quién ve a quién, y con qué `aal` |
| `el-catalogo-se-ve-sin-entrar.test.ts` | 10 | lo único que `anon` alcanza, y lo que no |
| `inscripciones-y-el-libro.test.ts` | 24 | el camino entero de una inscripción, y el libro insert-only |
| `cobro-y-auditoria.test.ts` | 14 | la cuenta que no está en la web, y el registro append-only |
| `comprobantes.test.ts` | 12 | las policies del bucket privado |
| `toda-tabla-lleva-rls.test.ts` | 8 | el censo, que cae si alguien crea una tabla sin RLS |

El último merece su renglón: **es el único que no mira una regla, mira que las
reglas existan.** Una tabla sin `enable row level security` no se ve distinta
desde ninguna pantalla —devuelve todo a todos— y es el defecto más barato de
cometer en la migración 007. Va con su piso (las diez tablas que la #13 deja) y
con una tabla de mentira que se crea, se caza y se borra dentro del propio test:
un censo que nunca encontró nada no es un censo.

Y `@codice/db` no corre contra un Postgres simulado: corre en uno **de verdad**
—PGlite, en proceso—, con el entorno de Supabase encima y las seis migraciones
aplicadas en orden, sin tocar una coma. Lo que el banco **no** prueba está escrito
en `src/banco.ts` y se repite acá porque un alcance que no está escrito se lee
como «todo»: `service_role` (lleva `bypassrls`; probarlo sería probar que
bypassea), la subida real de un archivo a Storage —se prueban las policies, que
son filas— y la versión exacta de Postgres, que en PGlite es más nueva que la del
proyecto.

## De dónde salen estos números

Son los que dejó la orden Códice #01, Fase A, medidos contra la corrida real —no
estimados—. `@codice/ui` es el guardián de los tokens; `@codice/core`, el del
i18n y el de los enlaces de WhatsApp; `@codice/prompts`, el del perfil de estilo;
`@codice/web`, el de las rutas.

`@codice/navegador` no es un paquete: es el guardián de fidelidad, que corre en Chromium
y compara el port contra el sitio estático. Son las cuatro páginas por los tres anchos.
Entra a esta tabla por la misma puerta que los demás — un guardián que no corre no dice
nada, y desde afuera se ve igual que uno que corrió bien.

## Lo que movió la orden #12

`@codice/web` sube de 43 a **51**: ocho tests nuevos en dos archivos, y los dos
vigilan cosas que **no se ven en pantalla ni en una captura**.

**Cinco en `src/el-evento-de-merida-dice-la-verdad.test.ts`.** La #12 devolvió a
`/merida` el `Event` de schema.org que la #02 había quitado por falta de fecha:
es lo que Google publica como ficha del taller —el día, la sede y el precio— y
vive en el `<head>`, donde nadie lo mira. El guardián de fidelidad ahora lo
compara (su `cabeza()` lo incluye desde esta orden) y con eso alcanza para cazar
que **cambie**; estos cinco cazan que sea **falso**, que es otra cosa.

El que más vale es el del huso. El `-06:00` está escrito a mano porque un
JSON-LD estático lleva marca ISO 8601 y no zona IANA, y un valor escrito a mano
es una copia: el día que México vuelva a mover su horario de verano —ya lo hizo
en 2022— ese número se queda viejo en silencio y la hora que publica Google se
corre una hora. El test **no compara contra otro `-06:00` escrito**: le pregunta
a `America/Merida` qué desplazamiento tiene ese día. Es la lección de la #06
—un guardián que compara contra otra copia vigila la copia— aplicada a una
fecha. Los otros atan el precio del `Event` a `taller.inversion.precio` y la
sede a `taller.hechos.dondeValor`, que hoy son los dos lugares donde vive cada
dato.

**Tres en `src/la-imagen-al-compartir-existe.test.ts`.** Un `og:image` que
nombra un archivo que no está no rompe absolutamente nada visible: la página
carga, Lighthouse no lo mira, ninguna captura lo nota. Lo único que pasa es que
el enlace se comparte **sin miniatura**, que es justo lo que Armando y Lucía
pidieron arreglar en la sección F. Y el que lo ve es el que comparte el enlace,
no el que lo publica. Comprueban que el archivo exista en `public/` y que mida
lo que su `og:image:width`/`height` declara, leído de los píxeles del JPEG.

`@codice/navegador` **no se mueve**: siguen siendo veintinueve. Lo que cambió es
que dos de ellos miran más —`fidelidad` compara ahora los datos estructurados, y
`acento` comprueba además el **tope** de cada excepción declarada— y las dos
ampliaciones tienen su motivo escrito donde viven.

## Lo que rescató la #09, que NO se mergeó

`@codice/web` sube de 39 a **43**. La división del CSS **se midió y no convenía**
—el porqué, con los números, en `docs/tareas.md` § 5b— pero dos cosas que
aparecieron trabajándola no dependían de que la división entrara:

**Cuatro tests en `src/el-css-publicado-trae-lo-suyo.test.ts`.** Se cortó a
propósito el `@import` de `packages/ui/styles.css` —de donde salen los
`@font-face` y los tokens— y **el build salió verde**. Nada miraba qué hay
adentro de la hoja que se publica. Se habría visto en las capturas de fidelidad,
pero como un rojo de píxeles que no dice la causa: doce comprobaciones en rojo y
alguien buscando media hora de dónde salió.

**Y `@codice/navegador` no se mueve, pero su guardián sí mira más.** La lista de
`cabeza()` en `fidelidad.spec.ts` pasó a incluir **las hojas de estilo
enlazadas, en orden**. El motivo: la #09 agregó un `<link rel="stylesheet">` al
`<head>` de las cuatro páginas y **las doce comprobaciones siguieron en verde**.
La ceguera no dependía de la división — cualquier orden futura que agregue,
quite o reordene una hoja pasaría igual de callada. Mismo número de tests,
lista más ancha, y las cuatro `*-cabeza.json` actualizadas.

Y una lección del propio test, que se deja escrita porque es un modo de falso
verde nuevo para esta casa: la afirmación (2) buscaba `--crema` a secas y **pasó
en verde con el `@import` de los tokens cortado**, porque `var(--crema)`
contiene esa cadena. Estaba encontrando el **uso** y dando por presente la
**definición**. Ahora busca `--crema:`, con los dos puntos. Lo destapó la
mutación, no la lectura.

## Lo que movió la orden #10

`@codice/navegador` sube de 26 a **29**. Tres tests en `e2e/csp.spec.ts`, y son
tres porque **una CSP que no rompe nada puede ser una CSP que no está puesta**:
recorrer la web y ver la consola limpia sale idéntico si la cabecera no llegó
nunca. Así que uno mira que **llegue**, otro que **no rompa** (cuatro rutas por
dos anchos, abriendo el menú y tocando el WhatsApp) y el tercero que **muerda**
—un `<script>` en línea inyectado en la respuesta que el navegador tiene que
negarse a ejecutar—. El tercero es el que convierte al segundo en una
afirmación.

La política **no se copia** en el spec: `e2e/servidor.mjs` sirve las cabeceras
del `vercel.json` de la raíz, así que el test mide lo que se va a publicar. Una
copia sería una segunda verdad que coincidiría justo hasta el día que importa.

La sonda del (3) es **permanente** y no un commit temporal como la de la #08, y
la diferencia es qué prueba cada una: aquélla probaba algo de Vercel —que honra
`has` con `host`— y sólo se podía ver desplegando; ésta prueba algo del
navegador, así que puede vivir en el repo y morder en cada corrida. No dice
`alert(1)` a propósito: un `alert` que **no** fuera bloqueado congela la pestaña
y deja un timeout que no dice cuál era el problema.
## Lo que movió la orden #11

`@codice/web` sube de 29 a **39**. Diez tests nuevos en
`src/el-cache-no-se-va-del-vercel-json.test.ts`, y existen por el motivo de
siempre: **la mutación no tiraba nada.** Antes de tocar el archivo se borró del
`vercel.json` la regla entera de `/fuentes/(.*)` —los 200 KB de tipografía que
dejarían de cachearse en cada visita— y `pnpm test` salió **verde, 29 de 29**.
Ninguna comprobación del repo miraba una cabecera de caché. Es el hallazgo de la
#08 repetido en el mismo archivo, un año de caché más abajo.

Son diez y no uno porque hay cinco maneras distintas de romperlo, y dos archivos
donde romperlo: que falte una de las tres reglas, que le saquen el `immutable`,
que la condicionen a un host —dejando al dominio propio sin caché y al preview
con ella, al revés de lo que parece—, que alguien le ponga `Cache-Control` a
`/(.*)`, y que un archivo sin hash aterrice en `/assets/`.

Las dos últimas merecen su renglón:

- **(3) `Cache-Control` sobre `/(.*)` es irreversible.** Alcanzaría al HTML, que
  no lleva hash: el navegador de cada visitante que la reciba **deja de pedir la
  página hasta 2027** y no hay despliegue que lo arregle. Es el único test del
  repo cuyo defecto no se puede deshacer desde el repo.
- **(4) todo lo de `/assets/` lleva hash en el nombre.** Es lo que hace *segura*
  la regla nueva, y es lo único de las tres carpetas que se puede comprobar
  contra la salida: `/fuentes/` y `/img/` llevan nombres estables a propósito y
  su seguridad es una decisión declarada, no una propiedad del archivo.

Y uno de paridad, el (5): la raíz y `apps/web/` tienen que declarar las mismas
reglas. El guardián del `noindex` ya decía que no pueden contradecirse; ahora
también lo dice un test en vez de un comentario.

## Lo que movió la orden #08

`@codice/web` sube de 17 a **29**: doce tests nuevos, seis por cada `vercel.json`
—el de la raíz, que es el que Vercel lee, y el de `apps/web`, que quedó como
referencia—. Vigilan una sola cosa: que la cabecera `X-Robots-Tag` siga
**condicionada al host de Vercel** y no se aplique al dominio propio.

**Se escribieron porque la mutación de la orden no tiraba nada.** La #08 pedía
quitar la condición `has` y ver qué se ponía rojo; no se ponía rojo nada, porque
ninguna comprobación del repo miraba `vercel.json`. La propia orden mandaba
escribir la comprobación en ese caso — es la lección de la #06 aplicada por
adelantado.

Lo que las hace valer la pena es el perfil del defecto: quitar ese `has` es un
renglón, se ve inocente en un diff y **no rompe nada que se pueda notar**. O
Google indexa dos sitios idénticos, o el dominio propio se queda fuera del
índice. Las dos cosas se descubren meses después.

Son seis y no una porque hay seis maneras distintas de romperlo: que no haya
regla de robots, que haya dos, que pierda la condición, que cambie de valor, que
aparezca una segunda regla **sin** condición —que dejaría la primera en verde— y
que alguien arrastre una cabecera de seguridad dentro del bloque condicionado,
dejando al dominio propio sin `nosniff`.

Lo que **no** comprueban, y está dicho en el archivo: que Vercel honre la
condición. Eso se mide con `curl` contra los dos hosts y está en el informe.

## Lo que movió la orden #07

`@codice/navegador` sube de 20 a **26**. Seis tests nuevos, en dos grupos.

**Cuatro del acento**, uno por página. Dirección los puso en la gate al aprobar
la #07, y el motivo vale más que el número: la regla del acento —el naranja es
del CTA primario y del hover, y de nada más— es de las que **se deshacen solas**.
Nadie va a pintar veinte cosas de naranja de un saque; alguien pone un número,
tres órdenes después otro pone un filete, y en un año la web volvió a estar como
estaba. Ninguna de esas veces se ve mal por sí sola.

Es el mismo modo de falla que el token duplicado de la #06: no un error, una
deriva. Y contra la deriva no sirve una herramienta que hay que acordarse de
correr; sirve un guardián en la gate.

La lógica **no se duplicó**: el spec importa `PAGINAS`, `PERMITIDO` y
`RECOLECTAR` de `check/acento.mjs`, que es el mismo archivo que corre por
consola. Dos copias de la lista de lo permitido serían dos verdades que un día no
coinciden. Cuestan **~2,3 s** sobre una gate que ya levanta Chromium.

**Dos del hero opaco**, uno por página. Afirman que **después de que el script
corrió** ningún elemento del hero lleva `.reveal` ni arranca translúcido. Que se
midan después del script es la mitad del test: la regla que apaga los bloques es
`.js .reveal`, así que sin JavaScript todo vale 1 y la comprobación pasaría sola.

Contra el hero de antes de la #07 los dos dan rojo —seis elementos con
`.reveal`— y contra el de ahora, verde.

## Lo que movió la orden #06

`@codice/web` sube de 9 a **17**, `@codice/navegador` de 14 a **17** y `@codice/ui`
de 27 a **30**. Catorce tests nuevos, y casi todos vigilan cosas que **no se ven
en una captura**.

**Tres en `@codice/ui`** — los pares del telón del menú: crema sobre grafito
(16,62), el pie del menú en crema al 65 % sobre grafito (7,13) y el ámbar del
hover sobre grafito (6,03). El del 65 % se **calcula** en el test en vez de
escribirse: una mezcla escrita a mano es un cuarto valor que se desincroniza.

**Ocho en `@codice/web`** — `comportamiento.test.ts` pasó de 2 a 10. Antes
comprobaba que una lista de dos colores coincidiera con dos tokens; ahora
comprueba que la **medición** de luminancia clasifique bien los seis fondos que
la web pinta, más cuatro pisos: que la conversión convierta, que la medición
mida los dos extremos, que `rgba(0,0,0,0)` no cuente como oscuro y que una
cadena que no es un color no rompa nada.

El cambio de forma importa más que el número. El test viejo vigilaba **una
copia** y por eso se podía desincronizar apuntando a la fuente equivocada — y se
desincronizó: entre la #05 y la #06 el header quedó en 1,70:1 sobre el teal con
el test en verde (pendiente 14). El nuevo vigila una función que mide, y lo único
que puede fallar es que alguien elija un fondo que de verdad esté en el límite,
que es exactamente lo que un test debería hacer notar.

**Seis en `@codice/navegador`** — `comportamiento.spec.ts` pasó de 2 a 8. Tres
son del menú abierto y se agregaron **después de descubrir que nadie lo miraba**:
las doce capturas del guardián de fidelidad son de la página con el menú cerrado,
y cerrado el overlay es `visibility:hidden`. La mutación que la orden proponía
—devolver el `font-size` de los ítems al `clamp()` viejo— dio **cero capturas en
rojo** la primera vez que se corrió: el rediseño entero del menú no tenía nada
que lo vigilara. Ahora hay dos capturas del overlay (1440 y 390) y un test que
mide sus números con `getComputedStyle` contra los del motor de 512. Con eso la
misma mutación tira el test **y** 32.737 píxeles.

Los otros tres son de foco:

- que el anillo sea del color del texto, 2 px, offset 3, **y que el clic con el
  mouse no lo deje** —el orden de las dos mitades importa y está escrito: una
  vez que el teclado encendió `:focus-visible`, el navegador se lo deja puesto,
  así que medir el mouse después del Tab da verde siempre;
- que con el menú abierto el `Tab` recorra cierre → ítems → WhatsApp **sin salirse
  del overlay**;
- que `Escape` cierre y devuelva el foco al botón «Menú».

## Lo que la orden #05 **bajó**, que es lo que hay que leer con cuidado

`@codice/ui` baja de 35 a **27** y `@codice/web` de 13 a **9**. Doce tests menos,
y bajar un número de esta tabla es un acto visible: acá está el motivo.

**Retirados por D24: la referencia del port cumplió su propósito en la #04.** Los
doce comparaban la web contra `qa/referencia/`, el sitio estático:

- **8 en `@codice/ui`** — el bloque que ataba la sección `web` del JSON de tokens
  a `estilo.css`: que cada `clamp()` de la escala display, el aire de sección, el
  alto del hero, el radio del arco y las dos alturas del header estuvieran
  textualmente ahí.
- **4 en `@codice/web`** — `el-css-esta-entero.test.ts` entero, que comparaba
  regla por regla en las dos direcciones.

Desde la #05 la web tiene paleta, íconos y fotografías propias: el estático dejó
de ser su especificación. Un guardián que compara contra algo que ya no es verdad
no vigila, hace ruido, y el ruido termina apagado. Lo que sí sigue vigilando que
el JSON no envejezca son las 27 que quedan: el contraste en aritmética, con cada
par y su número al lado, y que ningún color se escriba dos veces.

`@codice/navegador` **no baja**, y eso es a propósito. `comportamiento.spec.ts`
también leía el estático, pero sus dos tests ya afirmaban **cada estado contra su
valor literal** —el menú cerrado en `opacidad '0'`, abierto en `'1'`, el velo de
la cabecera encendiendo en `'1'` y apagando en `'0'`— y encima de eso comparaban
contra la otra pestaña. Se retiró la comparación; se quedaron los literales, que
son los que cazaban un menú muerto. El `toEqual` nunca lo hizo: dos páginas rotas
igual se parecen muchísimo.

## Lo que movió la orden #05

`@codice/ui` sube de 21 a 35 y `@codice/core` de 12 a 23. Los veinticinco tests
nuevos son de las dos cosas que la orden #05 podía romper en silencio.

**Contraste (14 en `@codice/ui`).** La web cambió a la paleta del manual de
Construyendo Familias Fuertes, así que hay pares nuevos: el naranja de texto
contra los tres fondos claros, el crema contra el teal oscuro, el ámbar contra la
tinta. Los ocho pares viejos —el ocre y el teal de D6— **no se borraron**: siguen
siendo ciertos y son los que va a usar la app. Tres de los nuevos son al revés,
afirmaciones de lo que **no** llega: el teal claro sobre el teal oscuro (2,56), el
teal claro sobre el cálido (2,73) y el ámbar sobre el teal (2,81, el pendiente
4c). Están escritos como igualdad y no como «menor que» a propósito: el día que
alguien los arregle, el test se pone rojo y lo obliga a venir a borrar la
excepción. Una excepción que se arregla sola en silencio vuelve a los seis meses.

**Los dos teléfonos (11 en `@codice/core`).** Desde la #05 la portada llama a
Gaby y el taller a Mérida, y el modo de fallar no es un enlace roto: es un enlace
perfecto que suena en el teléfono equivocado. Eso no lo ve una captura, no lo ve
el `<head>` y no lo caza el guardián de fidelidad. Las dos comprobaciones que
importan son cruzadas —ningún `wa.me` de la portada con el número del taller, y
ninguno del taller con el de Gaby— y van en las dos direcciones por separado:
una sola dejaría pasar la mitad de los cruces.

`@codice/web` y `@codice/navegador` **no se mueven**, y vale decir por qué no: el
guardián de fidelidad sigue siendo doce comprobaciones —cuatro páginas por tres
anchos—, lo que cambió es contra qué compara (D24). Mismo número, referencia
nueva.

## Lo que movió la orden #03

`@codice/ui` sube de 12 a 21: nueve tests nuevos de contraste. Ocho son un par
token-contra-token que tiene que dar ≥ 4,5:1, y el noveno es su piso —negro sobre
blanco da 21, un color contra sí mismo da 1, y el gris viejo sobre el cálido sigue
dando 4,00—. Van en aritmética y al lado de los valores porque un hex que se
aclara medio punto dentro de seis meses no rompe nada, no se ve en un diff de
color y devuelve la web al 96 de Lighthouse sin que ninguna comprobación diga una
palabra.

## Lo que movió la orden #02

`@codice/web` sube de 9 a 13 y `@codice/navegador` de 12 a 14, y los seis tests nuevos
son el mismo trabajo mirado desde dos distancias. La orden le sacó React al navegador,
así que hacen falta dos cosas que antes nadie tenía que comprobar: que el bundle no
vuelva —`el-html-no-carga-react`, cuatro afirmaciones baratas sobre el `dist/`— y que los
tres comportamientos sigan vivos sin él —`comportamiento.spec.ts`, dos en Chromium contra
el sitio estático—. Las doce de fidelidad no los cubrían: miden la página quieta, y lo
único que React hacía en el navegador era moverse.
