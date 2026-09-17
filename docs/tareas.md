# Tareas y cola de órdenes — Códice

Las órdenes viven fuera del repo, en `03 Producto/codice/ordenes/`. Acá queda el
estado y lo que va quedando pendiente.

Desde la orden #04 el monorepo vive en `drarmandoduarte/armandoduarte-web`, que
ya es público, tiene `main` protegido y Vercel conectado. El repo `codice` no se
usa.

## Cola de órdenes

| # | Qué | Estado |
|---|---|---|
| #01 | Nace el monorepo, y la web pública se porta a React | cerrada (ramas `codice/01a-molde`, `01b-port`, `01c-fidelidad`) |
| #02 | La web pública no se hidrata | cerrada (rama `codice/02-sin-hidratar`, sobre `01c-fidelidad`) |
| #03 | Contraste a AA, con el número delante | cerrada (rama `codice/03-contraste`, sobre `02-sin-hidratar`) |
| #04 | El monorepo entra al repo de Armando | cerrada (PR #5) |
| #05 | La devolución de Lucía y de Armando: paleta CFF, íconos, fotos, dos teléfonos y `/merida` | **cerrada** (PR #7, mergeado el 16/9/2026) |
| #06 | El cromo a nivel 512: menú, header, foco y pie | **cerrada** (PR #10, mergeado el 17/9/2026) |
| #07 | Pasada premium del contenido: botones, el naranja, contacto y `/merida` | **cerrada** (PR #12, mergeado el 17/9/2026) |
| #08 | La apertura: sacar el `noindex` sin abrir la puerta de atrás | **cerrada** (PR #14, mergeado el 17/9/2026) |
| #09 | El CSS en dos hojas, y el contrato de `@codice/ui` escrito | **cerrada sin mergear** — se midió y no convenía (PR #16 cerrado). Lo que valía entró aparte: **PR #19, mergeado el 17/9/2026** (rama `web/09b-rescate`, ya borrada) |
| #10 | La CSP, mientras todavía es fácil | **cerrada** (PR #18, mergeado el 17/9/2026) |
| #11 | `Cache-Control` para `/assets/` | **cerrada** (PR #17, mergeado el 17/9/2026) |

## Reglas de la casa, con el caso que las obligó

### Todo umbral de Lighthouse se escribe junto al método que lo produjo

Dónde se sirvió, cuántas corridas, y cuál de ellas se toma. Las tres cosas, al
lado del número, siempre.

**El caso, que es de la #04.** La orden pedía `performance ≥ 86/92/99/99` sobre
el preview. Esos cuatro números venían de la #02, donde se habían medido **local
sobre `dist/`, tres corridas, la peor** — pero el umbral viajó a la orden
siguiente sin su método, y ahí se leyó como si fuera una propiedad del código.

Sobre el preview privacidad dio 97 y pareció una regresión de dos puntos. No lo
era: midiendo con el método original las cuatro páginas daban **exactamente
86/92/99/99**, los mismos números; sobre red inicio y taller salían **mejor** (91
y 93) y privacidad dispersaba 97/98/99. La diferencia era el transporte. Media
hora en averiguarlo, y la única razón por la que hizo falta averiguarlo es que
el número había perdido su método por el camino.

De yapa, la misma corrida mostró la otra mitad de la regla: **una corrida suelta
no es una medición.** La primera pasada dio 91 en taller y 97 en terminos, y
tres corridas los desmintieron (93 y 99).

Vale para cualquier número que se cite como umbral, no solo para Lighthouse: un
número sin su método vuelve a hacer perder media hora al que lo lea en tres
meses, y esa media hora la paga alguien que no estaba en la conversación.

### Cuando una consulta devuelve «no hay», confirmá que podías verlo

**Ausencia de permiso se presenta como ausencia del dato.** Antes de actuar sobre
un «no hay», hay que separar las dos cosas: que no exista, o que no lo puedas
leer. Se confirma con una segunda consulta que sí tenga permiso, o probando la
acción contra el guardián en vez de contra la consulta.

**El caso, del 17/9/2026.** Para dejar el `docs/tareas.md` del cierre de la #09
había que llevar un commit a `main`. Se preguntó por la protección de la rama:

```
GET /repos/.../branches/main/protection   →   404 Not Found
GET /repos/.../rulesets                   →   []
```

Se leyó como **«`main` no está protegido»** y se intentó el push directo. Lo paró
el remoto:

```
remote: - Changes must be made through a pull request.
! [remote rejected] main -> main (protected branch hook declined)
```

La rama **sí** estaba protegida. El 404 no decía «no hay protección», decía «no
tenés permiso para leer esta configuración» — la API de GitHub usa el mismo
código para las dos cosas a propósito, para no filtrar la existencia del recurso.
Y la lista vacía de rulesets tampoco era prueba: sólo dice que la protección no
está implementada **por ese mecanismo**.

**Es el mismo modo de falla que el guardián que lee la copia equivocada del
token** (§ 14, y el `--crema` sin los dos puntos del § 5b): el dato existía y era
otro, y la herramienta contestó con seguridad sobre lo que no había mirado. La
diferencia con un rojo honesto es que acá **la respuesta parecía información**,
no un error.

Lo barato de esta regla es que el costo de confirmar es una consulta y el costo de
no confirmar es una acción destructiva sobre algo protegido. Acá salió gratis
porque **el contrato de Rodolfo ya prohibía tocar `main` directo** y el hook del
remoto lo hizo cumplir: dos defensas independientes, y la que atajó no fue la
lectura.

## Pendientes abiertos

### 1. Conectar Vercel al monorepo ~~· es de dirección~~ · **cerrado en la #04**

No hizo falta conectar nada, y ése fue el punto: en vez de crear un proyecto
nuevo para `codice`, el monorepo entró al repo que Vercel ya estaba
desplegando. La URL de producción no cambió.

Los tres comandos viven en el `vercel.json` de la **raíz** —`pnpm install
--frozen-lockfile`, `pnpm --filter @codice/web build`, salida `apps/web/dist`—
y no en el dashboard, para que el commit que cambia el repo sea el mismo que
cambia cómo se construye. El de `apps/web/vercel.json` se queda donde está como
referencia de sus reglas.

Queda una cosa sabida: si alguien activara el override de build en el dashboard,
ese override le gana al archivo. Nadie tiene que tocarlo.

### 2. Quitar `X-Robots-Tag: noindex, nofollow` ~~el día que se abra el dominio~~ · **CERRADO en la #08**

Estuvo abierto desde la #01. La #08 lo resolvió, y **no borrando la cabecera**:
condicionándola al host.

Si se borraba, pasaban a ser indexables **dos sitios idénticos** —
`armandoduarte.com` y `armandoduarte-web.vercel.app`— y en un duplicado el que
gana no suele ser el que uno quiere. Así que la regla salió del bloque general y
volvió como la suya, con `has: [{type: host, value: armandoduarte-web.vercel.app}]`.
El cambio está en los dos `vercel.json`, como este pendiente pedía.

Que Vercel honra `has` con `host` en `headers` **está medido**: se desplegó una
sonda temporal con una cabecera propia condicionada al host del preview, apareció
solo ahí, y se quitó. De yapa quedó comprobado que los previews traen
`x-robots-tag: noindex` puesto **por Vercel**, así que esa puerta tampoco queda
abierta.

Y lo que faltaba de verdad: **nadie vigilaba `vercel.json`**. Quitar el `has` no
ponía nada en rojo. La #08 escribió doce comprobaciones —seis por archivo— que
ahora lo cazan.

**Medido sobre producción el 17/9, después del merge** — que es lo que lo
cierra:

```
armandoduarte.com                 (sin x-robots-tag)        ← indexable
armandoduarte-web.vercel.app      x-robots-tag: noindex, nofollow   ← en las 4 rutas
```

Y el resto de la apertura, sobre el dominio propio:

| | |
|---|---|
| las cuatro rutas | 200 |
| `/taller` · `/biografia` · `/conferencias` | 308 |
| `www` y `http` | 308 → `https://armandoduarte.com/` |
| cabeceras de seguridad | las cinco, intactas |
| canónicas y `og:url` | del dominio propio, sin `www` ni barra final salvo la home |
| `robots.txt` y `sitemap.xml` | servidos, con `lastmod` 2026-09-17 |
| `class="dato"` | 0 en las cuatro |

**Lighthouse móvil sobre `armandoduarte.com`**, tres corridas, la peor:

| página | SEO | accesibilidad | performance |
|---|--:|--:|--:|
| `/` | **100** | 100 | 97 |
| `/merida` | **100** | 100 | 98 |
| `/privacidad` | 66 | 100 | 99 |
| `/terminos` | 66 | 100 | 99 |

**El 66 de las dos legales es correcto y no se va a arreglar.** La única
auditoría que baja es `is-crawlable` —«Page is blocked from indexing»— y la
bloquea el `noindex, follow` que esas dos páginas llevan **a propósito**: un
aviso de privacidad y unos términos de uso no van en Google. Las otras ocho
auditorías de SEO pasan. Subirlas a 100 sería meter los legales al índice para
contentar a un número.

O sea: **SEO 100 en las dos páginas que se quieren indexar**, que es lo que la
#08 vino a conseguir.

### 2b. Dar de alta Search Console y pedir la indexación · **de dirección**

Es lo siguiente de la apertura y **no vive en el repo**: necesita una cuenta de
Google y una verificación de propiedad del dominio. La #08 deja el sitio listo
para que lo indexen —sin `noindex`, con canónicas y `og:url` del dominio propio,
`robots.txt` y `sitemap.xml` servidos y con `lastmod` al día— pero pedirle a
Google que lo mire es una acción de dirección.

Dos cosas para cuando se haga, que salen de esta misma orden:

- El sitemap está en `https://armandoduarte.com/sitemap.xml` y lista **dos**
  URLs: la portada y `/merida`. Las dos legales no están a propósito: llevan
  `noindex, follow`.
- La propiedad conviene darla de alta como **dominio** y no como prefijo de URL,
  para que `www` —que redirige con 308— quede cubierta sin darla de alta aparte.

### 3. Las plantillas `check/og-*.html` ~~todavía apuntan a la carpeta vieja~~ · **cerrado en la #02**

Las plantillas apuntan a la anatomía de este repo (`packages/ui/fuentes/fonts.css`,
`packages/ui/codice-tokens.css`, `apps/web/src/index.css`, `public/img/`) y
`og-capturar.mjs` corre desde `apps/web` con el Chromium de `@playwright/test`.
Se regeneraron las dos imágenes y salieron **idénticas byte a byte** a las que
estaban: mismo `sha256`, 45.647 y 51.634 bytes. El día que haya fecha del taller,
se agrega a `.og__linea` de `og-taller.html` y se vuelve a capturar.

### 4. Contraste de color ~~96/100~~ · **cerrado en la #03**

Las cuatro páginas dan **accesibilidad 100** en Lighthouse móvil. Tres tokens se
movieron lo mínimo medido —`--gris` #7A7267 → #716A60, `--ocre` #8F6B3D → #866539,
`--ocre-medio` #B08A52 → #B18C54— más dos reglas de `index.css`. El fondo que
obligaba el cambio no era el crema sino el cálido (#F3EBDD), donde el gris daba
4,00 y el ocre 4,09.

La tabla completa de los 125 pares de color de las cuatro páginas, las capturas
antes/después y los cuatro pares que **no** se tocaron están en
`docs/informes/03/LEEME.md`. El barrido que la produjo quedó en el repo:
`apps/web/check/contraste.mjs`.

### 4b. El bloque de contacto estaba invisible · **arreglado en la #03, llega a producción con la #04**

El teléfono de WhatsApp y los enlaces a YouTube, Spotify y Facebook de la portada
se dibujaban **tinta sobre tinta** —contraste 1,00:1— por una colisión de
especificidad entre `.tinta .grande` y `.contacto .grande` en `estilo.css`. En el
monorepo está arreglado (`color:inherit`, el cambio más chico posible).

**En producción estuvo roto hasta la #04**, porque Rodolfo no toca el sitio
estático y el arreglo vivía solo en el monorepo: cada visitante que bajaba a
«Escríbeme» no veía el teléfono. Dirección eligió el segundo camino —acelerar el
cambio de producción en vez de parchear el estático—, así que el arreglo llega
con el merge de la #04, junto con el port y el contraste.

El sitio estático **conserva el defecto** y es correcto que lo conserve: ahora es
`qa/referencia/`, la referencia del guardián de fidelidad, y la diferencia está
declarada en `apps/web/e2e/cambios-visibles.ts`. Tocarlo sería mover la vara.

### 4c. El acento sobre teal no llegaba a AA ~~**2,81**~~ · **cerrado en la #07**

Los rótulos, enlaces y flechas de las secciones teal. Era el ocre medio sobre el
teal de D6 y daba **2,51**; desde la #05 es el **ámbar del manual CFF sobre el
teal del manual** y da **2,81**. Mejoró sin acercarse: el umbral es 4,5.

Sigue siendo lo mismo que era, y por eso sigue abierto: llegar a 4,5 sobre ese
teal exige un acento tan pálido que deja de ser el ámbar de la marca. **Es una
decisión de paleta, no de contraste**, y ahora además es una decisión sobre el
manual del cliente, así que se consulta con Lucía antes que con nadie.

Lo afirma en aritmética `packages/ui/tokens.test.mjs`, escrito como igualdad
—`toBe(2.81)`— y no como «menor que»: el día que alguien lo arregle, el test se
pone rojo y lo obliga a venir hasta acá a borrar la excepción.

Los otros pares que tampoco llegaban. **La #06 cerró dos de los tres**, y no
bajándoles la exigencia sino sacando de la página lo que los producía:

| dónde | #05 | #06 | |
|---|--:|--:|---|
| el rótulo del menú, al 50 % de opacidad | 1,46 | — | **cerrado**: el rótulo `ARMANDODUARTE.COM` del overlay ya no existe (orden #06, C) |
| el ámbar sobre el velo del menú (`a.pr`) | 4,27 | — | **cerrado**: el pie del menú pasó a crema al 65 %, que da **7,13** (orden #06, D) |
| el ámbar sobre teal del **header** | 2,81 | **3,10** | **cerrado**: el botón del header sobre oscuro pasó a crema con borde al 50 % (orden #06, F) |
| la tapa del libro (`small` al 80 %) | 3,72 | 3,72 | sigue abierto — es contenido, lo mira la **#07** |

**La #07 lo cerró.** El ámbar dejó de usarse como texto sobre teal: los
eyebrows, los enlaces y las firmas sobre fondo oscuro pasaron a **crema al 70 %**
—el primer valor medido que pasa 4,5 sobre teal (4,66) y sobre tinta (7,27)— y el
pill de la franja «Ahora» pasó a crema 70 % con texto teal. El ámbar se quedó
donde D25 lo permite: el hover.

Con eso el barrido de contraste da **cero pares por debajo de AA en las cuatro
páginas**, por primera vez desde que existe. La tapa del libro, que era el otro
par abierto, desapareció con la portada real (#07, decisión 4).

### 5. Performance: el bundle costaba 17 puntos · **cerrado en la #02**

Dirección decidió **no hidratar la web pública**. React sigue siendo la fuente
—componentes, i18n, tokens, prerender—, pero el HTML que se sirve no lo carga:
`index.html` dejó de ser entrada de Vite y lo único que baja el navegador son
**1.790 bytes** con los tres comportamientos. Medido con Lighthouse móvil sobre
`dist/` servido local, tres corridas, la peor:

| página | estático | #01 (con bundle) | #02 |
|---|--:|--:|--:|
| inicio | 87 | 70 | **86** |
| taller | 90 | 73 | **92** |
| privacidad | 99 | 81 | **99** |
| terminos | 99 | 81 | **99** |

Accesibilidad (96/96/96/95), SEO (100/100/66/66) y prácticas recomendadas (100)
quedaron idénticas a la #01 y al estático.

### 5b. El punto que falta en el inicio · **CERRADO en la #09: se midió y no convenía**

El inicio da **86 contra los 87 del estático**, reproducible: cinco corridas
pareadas dieron 86 y 87 sin una sola excepción. El mismo sitio estático servido
desde dos puertos distintos da 87 las seis veces, así que no es ruido de medición.

FCP (1,80 s), TBT (0 ms) y CLS son **idénticos** en los dos. Lo único que difiere
es el LCP —la foto del hero—: 3,98 s contra 3,90. Y la causa está localizada: el
sitio estático parte su CSS en **dos** archivos, `fuentes/local.css` (3,1 KB, solo
los `@font-face`) y `estilo.css` (28,1 KB); el monorepo sirve **uno** de 28,2 KB.
En el enlace estrangulado de Lighthouse (1,6 Mbit/s) la hoja va con prioridad
`VeryHigh` y la imagen con `High`, así que 25 KB más de hoja por delante retrasan
a la foto unos 120 ms.

Igualarlo es partir el CSS en dos como el estático, o sea sacar el
`@import "./fuentes/fonts.css"` de `packages/ui/styles.css` y servir las fuentes
por separado. Eso toca el contrato de `@codice/ui` —«un solo import y el producto
tiene la marca»— y lo van a heredar el consultorio, la academia y el asistente:
no es una decisión de una orden de la web. Queda medido y anotado.

**La #05 le puso un segundo caso al mismo pendiente.** `terminos` bajó de 99 a 98
—tres corridas de cada lado, sin una sola excepción— y la causa está aislada:
`terminos.html` pesa **exactamente lo mismo** en las dos ramas (6.299 bytes, byte
por byte, porque lo único que cambió en esa página es el teléfono del pie y los
dos números tienen los mismos dígitos). La única variable es la hoja, que creció
de 28.237 a **29.601 bytes** con las reglas de los íconos y las fotografías.
`terminos` no usa ninguna y las baja igual, porque la web sirve una hoja para las
cuatro páginas.

O sea que partir el CSS ya no es sólo «el punto que le falta a la portada»:
es también lo que hace que una orden que agrega una sección le cueste un punto a
una página que no la tiene. Sigue siendo decisión de dirección y sigue tocando el
contrato de `@codice/ui`.

> Lo de arriba es el pendiente **como se escribió antes de medirlo**, y se deja
> tal cual porque es lo que la #09 fue a comprobar. El estado vivo de este caso
> está en el **§ 5e**; la hipótesis de los 25 KB que se lee más arriba quedó
> **desmentida** —el detalle, unas líneas abajo—.

Dos caminos que se midieron y **empeoraron**, para que nadie los vuelva a
intentar: mover los `<link rel="preload" as="image">` que React inyecta al
`<head>` (86/86/87) y quitarlos del todo (70, LCP 5,78 s — hacen falta).

---

#### La #09 lo hizo, lo midió, y NO entró

**Está construido y funciona; lo que no está es el beneficio.** La rama
`web/09-css-en-dos` (PR #16) partió el CSS en dos hojas y pasó la gate entera.
Dirección decidió **no mergearla** después de medir. Conviene leer por qué,
porque el trabajo no se tiró: se tiró la conclusión.

**El punto que perseguía ya no existía.** El «86 contra 87» de arriba es de
**antes de la #05**, que subió la portada a 95 cambiando las fotos. El pendiente
quedó escrito con el número viejo y nadie lo revisó. Medido hoy con el método de
la casa —Lighthouse 13.4.1 móvil, local sobre `dist/` servido por
`e2e/servidor.mjs`, **cinco corridas pareadas por página, mismo puerto, se cita
la peor**— y repetido **dos veces con días de por medio**, el puntaje es
**idéntico de los dos lados**:

| página | main | con la división |
|---|--:|--:|
| inicio | 95 | 95 |
| taller | 95 | 95 |
| privacidad | 98 | 98 |
| terminos | 98 | 98 |

Accesibilidad 100 en las cuatro de los dos lados; SEO y prácticas recomendadas
sin mover.

**El costo sí se mide, y está abajo del puntaje.** Medianas de LCP, en ms:

| página | main → división | |
|---|---|---|
| inicio | 2.554 → 2.628 / 2.702 | **+72 a +148 ms** |
| taller | 2.556 → 2.702 | **+74 a +146 ms** |
| privacidad | 1.803 → 1.803 | = |
| terminos | 1.953 → 1.803 | −150 ms |

O sea: **las dos páginas que tienen foto de portada empeoran; las dos legales,
cuyo LCP es texto, mejoran o no se mueven.** Y eso **desmiente la hipótesis** con
la que se escribió este pendiente. Decía que «25 KB de hoja por delante retrasan
a la foto»: si fuera por bytes, partir la hoja no cambiaría nada —los bytes son
los mismos, 31.353 contra 31.352— y sin embargo la foto llega más tarde. Lo que
la retrasa no es **el peso** de lo que va delante sino **cuántos pedidos de
prioridad `VeryHigh` hay antes que ella**: pasan de uno a dos, y la imagen —que
es `High`— espera detrás de los dos. Es mejor hallazgo que el punto que se iba a
buscar.

Del FCP no se dice nada, y es a propósito: la primera tanda lo mostró mejorando
y la segunda empeorando, en los mismos valores cuantizados. Era ruido.

#### Y el beneficio de caché, medido donde Lighthouse no llega

Lighthouse **siempre carga en frío**, así que no puede medir lo único que
justificaba la división. Se midió aparte: contexto persistente, enlace
estrangulado a 1,6 Mbit/s, mismo puerto, **visita 1 → deploy que cambia un color
→ visita 2** (entrando por otra página, porque una navegación a la misma URL
tiene semántica de recarga). Tres corridas por lado, idénticas las tres:

| | bytes que viajan en la 2.ª visita | LCP de la 2.ª visita |
|---|--:|--:|
| main, una hoja | **32.200** | 528 ms |
| con la división | **29.490** | 508 ms |

El ahorro es **2.710 bytes** —la hoja de fuentes, servida de caché— y **20 ms**.

**No paga.** Veinte milisegundos, y sólo para alguien que **vuelve** y sólo
**después de un deploy que tocó el CSS**, contra 72–148 ms en **cada primera
visita** a las dos páginas que importan comercialmente. Para un sitio al que se
llega desde Google, las primeras visitas son casi todas.

#### Qué queda de todo esto

- **Lo que se rescató**, ya en `main` —**PR #19, mergeado el 17/9/2026**; la rama
  `web/09b-rescate` quedó borrada y sus commits viven en la historia del merge—:
  el guardián de fidelidad pasa a mirar **las hojas de estilo enlazadas** —estuvo
  verde con un `<link>` nuevo en las cuatro páginas, y esa ceguera no dependía de
  la división— y entra
  `src/el-css-publicado-trae-lo-suyo.test.ts`, porque cortar el `@import` de
  `packages/ui/styles.css` dejaba el build **en verde** con la web sin
  tipografías.
- **Lo que no se rescató, y por qué**: los tests de paralelo y de prioridades no
  tienen sentido con una hoja sola, y los cuatro del salto de texto son del
  pendiente 5c, que dirección **decidió no abrir** el 17/9/2026 (§ 5c). Siguen
  guardados donde se escribieron, y por eso `web/09-css-en-dos` no se borra.
- **El guardián de la #02** —«ningún otro `.js` en `dist/assets`»— **no hacía
  falta rescatarlo**: en `main` nunca se rompió. Se rompió y se restauró dentro
  de la rama de la #09, que no entra.
- **El contrato de `@codice/ui` sigue siendo un solo import.** `CLAUDE.md` no
  cambia.
- **El punto de `terminos`** —el segundo caso de este pendiente, donde una orden
  que agrega una sección le cuesta un punto a una página que no la usa— **se mudó
  al § 5e** con número propio, porque algo abierto adentro de algo cerrado no se
  vuelve a leer. Dirección lo **cerró el 17/9/2026 con el mismo veredicto que
  éste**: un punto en dos páginas legales no paga la orden. Queda medido que
  partir por frecuencia de cambio no lo arregla.
- **El salto de texto** que la #09 encontró midiendo el CLS quedó en el **§ 5c**,
  que hasta acá se citaba sin existir. Dirección **no lo abre** (17/9/2026): no lo
  cobra nadie y no se mide estable. Sus cuatro tests siguen en
  `web/09-css-en-dos`, **que por eso no se borra**.

**Un pendiente cerrado con «se midió y no convenía» vale tanto como uno cerrado
con código.** Lo que no vale es dejarlo abierto con una hipótesis que ya se sabe
falsa.

### 5c. El salto de texto al cargar la tipografía · **NO SE ABRE POR AHORA** (dirección, 17/9/2026)

Hasta acá este pendiente existía **sólo como referencia**: lo citaban el § 5b y el
informe de la #09, y no tenía sección propia. Queda escrito —con su medición— y
**cerrado en el mismo movimiento**: se escribe para no volver a descubrirlo, no
para trabajarlo.

**Qué es.** Las cuatro páginas cambian la tipografía del sistema por la buena
**después** de pintar, y en ese cambio el texto salta. No lo trajo ninguna orden:
es anterior a la #09, que se lo encontró de paso mientras medía otra cosa.

**Lo que ya está medido**, y es lo que ahorra la primera mitad de la orden que
venga. La #09 pedía comprobar que «CLS sigue en 0»; la división no lo movió ni un
dígito, pero **la premisa era falsa: nunca fue 0**. Cinco corridas de Lighthouse
por lado y tres de `PerformanceObserver`, idénticas hasta el último dígito:

| página | CLS (Lighthouse) | CLS (`PerformanceObserver`) |
|---|--:|--:|
| inicio | 0,0008 | 0,00078 |
| taller | 0,0002 | 0,00015 |
| privacidad | **0,0531** | 0,00488 |
| terminos | 0,0068 | 0,00003 |

Dos lecturas honestas de esa tabla: **ninguna página pasa el umbral de 0,1 de
Google**, así que esto no cuesta puntaje hoy —el salto se ve, no se cobra—; y
`privacidad` mide **diez veces distinto** según quién mida, así que si dirección
abre la orden, el primer trabajo es decidir contra cuál de las dos cifras se mide,
no ponerse a arreglar.

**El arreglo estándar es `size-adjust` en los `@font-face`** de `packages/ui`: se
le declara a la fuente de reserva el ancho de la buena, y el intercambio deja de
correr el texto.

**Por qué es de dirección y no de una orden de la web.** `size-adjust` se escribe
en el design system, no en la web: toca `packages/ui`, que es de donde el
consultorio, la academia y el asistente van a heredar la marca. Es el mismo
motivo por el que no se mergeó la #09 — el contrato de `@codice/ui` no lo cambia
una orden de la web— y es la misma familia que el pendiente 7, los dos documentos
del design system.

#### El veredicto de dirección, 17/9/2026: no se abre

**Y lo decide la medición de arriba, que es el punto.** Dos razones, las dos en la
tabla:

1. **No lo cobra nadie.** Ninguna página pasa el umbral de 0,1 de Google. El salto
   se ve; no cuesta puntaje.
2. **No lo podemos medir estable.** `privacidad` mide **diez veces distinto** según
   Lighthouse o `PerformanceObserver`. Sin una cifra en la que confiar no hay cómo
   saber si un arreglo arregló.

**No se toca el design system que heredan tres productos por algo que no se cobra
y que no podemos medir estable.** `size-adjust` iría a `packages/ui`, de donde el
consultorio, la academia y el asistente sacan la marca: el costo del cambio no lo
paga la web, lo pagan los tres. Es el mismo criterio que dejó la #09 afuera.

Si algún día se reabre, lo que la haría reabrir es **una de las dos razones
cayéndose**: que una página pase el 0,1, o que las dos formas de medir converjan.

#### Lo que queda guardado, y por qué la rama NO se borra

Los cuatro tests del salto de texto **ya están escritos** en la rama de la #09
—**`web/09-css-en-dos`**, que no se mergeó— y **no se rescataron a propósito**,
porque son de este pendiente y no de aquél. Las dos mutaciones que los hacen
morder están anotadas en el informe de la #09 (§ C): `--lectura` de `system-ui` a
`Georgia,serif` mueve inicio (×20), privacidad y terminos (×200), y `--display`
mueve inicio y taller.

> **`web/09-css-en-dos` no se borra, y éste es el motivo escrito.** Es la única
> copia de esos cuatro guardianes y de la mutación que los prueba. La rama se ve
> como una rama muerta —su PR está cerrado sin mergear— y por eso el motivo va
> acá y no en la cabeza de nadie: el día que alguien limpie refs viejas, esto es
> lo que tiene que leer antes. Si se reabre el 5c, la orden **no arranca de
> cero**.

Las otras dos ramas vivas, para que la lista se lea de una: **`main`** y
**`web/05-cortina`** (en pausa a propósito desde el 12/9/2026).

Las cinco `codice/*` **se borraron el 17/9/2026** por decisión de dirección: una
ref muerta confunde a quien liste ramas, y éstas no guardaban **nada** que `main`
no tuviera. Se comprobó una por una que su punta fuera ancestro de `main` antes de
tocarlas, y las puntas quedan escritas acá para que el borrado sea reversible —los
commits siguen alcanzables desde `main`, así que esto es comodidad, no rescate—:

| rama borrada | punta |
|---|---|
| `codice/01a-molde` | `3b5edfa` |
| `codice/01b-port` | `635df74` |
| `codice/01c-fidelidad` | `01f7966` |
| `codice/02-sin-hidratar` | `4a72ccc` |
| `codice/03-contraste` | `8a700ca` |

Ésa es la diferencia con `web/09-css-en-dos`: aquéllas estaban **dentro** de
`main`; ésta tiene dos commits que no están en ninguna otra parte.

### 5d. `/assets/` se servía sin `Cache-Control` · **CERRADO en la #11**

`/fuentes/(.*)` y `/img/(.*)` llevaban `public, max-age=31536000, immutable`
desde el sitio estático; `/assets/(.*)` —donde viven la hoja de CSS y el script
de comportamiento— **no llevaba ninguna**. Dirección lo confirmó sobre
producción: salían con `max-age=0, must-revalidate`, o sea revalidando en cada
visita.

Lo encontró la **#09**, que se apoyaba en el beneficio de caché para justificar
partir el CSS en dos y descubrió que ese beneficio no existía. La #11 lo
arregla primero, y con la regla ya puesta se midió el beneficio de caché que la
#09 perseguía: **2.710 bytes y 20 ms** en la segunda visita, que no pagan los
72–148 ms que cuesta cada primera. La #09 **se cerró sin mergear** (§ 5b).

La regla va en los **dos** `vercel.json` —el de la raíz, que es el que Vercel
lee, y el de `apps/web/`, que es su referencia escrita— con el mismo valor que
las otras dos carpetas. Es segura porque los tres archivos de `/assets/` llevan
**hash del contenido en el nombre**: un contenido nuevo es un nombre nuevo, así
que el navegador no puede quedarse con una versión vieja. Eso ya no es una
suposición: lo afirma un test que lee `dist/assets` y exige el hash en cada
nombre.

**Y el hallazgo que hace que esta orden chica traiga diez tests: nadie vigilaba
ninguna cabecera de caché.** Antes de tocar nada se borró del `vercel.json` la
regla entera de `/fuentes/` —los 200 KB de tipografía que dejarían de
cachearse— y `pnpm test` salió **verde, 29 de 29**. Es el mismo hallazgo de la
#08 con el `noindex`, en el mismo archivo.

De paso quedó atajada la mitad irreversible, que es la que da miedo: un
`immutable` sobre `/(.*)` alcanzaría al HTML, y el HTML **no** lleva hash. Cada
visitante que recibiera esa cabecera dejaría de pedir la página hasta 2027, y no
hay despliegue que lo saque de ahí. La afirmación (3) existe sólo para eso.

Lo que estos tests **no** comprueban, declarado: que Vercel aplique las
cabeceras. Eso se mide con `curl` contra producción después del merge y va al
informe, igual que la #08 hizo con el `has` por host.

### 5e. Una orden que agrega una sección le cuesta un punto a una página que no la usa · **CERRADO: se midió y no convenía** (dirección, 17/9/2026)

Era el segundo caso del § 5b, así que sale de ahí y queda con número propio —un
pendiente adentro de uno cerrado es un pendiente que nadie vuelve a leer— y se
cierra con **el mismo veredicto que el 5b**, que es el que le corresponde: se
midió, y no convenía.

**Qué es.** La web sirve **una hoja para las cuatro páginas**, así que cada
sección nueva la engorda para todas — también para las que no la usan. El caso
medido es de la #05: `terminos` bajó de 99 a 98, tres corridas de cada lado sin
una excepción, y la causa quedó aislada sin margen de duda. `terminos.html` pesa
**exactamente lo mismo** en las dos ramas —6.299 bytes, byte por byte, porque lo
único que cambió en esa página es el teléfono del pie y los dos números tienen los
mismos dígitos—. La única variable es la hoja, que creció de 28.237 a **29.601
bytes** con las reglas de los íconos y las fotografías. `terminos` no usa ninguna
de las dos cosas y paga igual.

**Lo que la #09 descartó, y es el aporte que deja:** **partir por frecuencia de
cambio NO lo arregla.** Eso ya no es una hipótesis, está medido — separar los
`@font-face` del resto reparte los mismos bytes en dos hojas y `terminos` sigue
recibiendo las reglas que no usa. Peor: la división le costó **+72 a +148 ms de
LCP** a las dos páginas con foto, que son las que importan comercialmente (§ 5b).

**El camino que queda es partir por página** —que cada página baje sus propias
reglas— y es **explícitamente lo que la #09 dejaba afuera**. Es otra orden, con su
propia medición: hay que ver qué cuesta en pedidos de prioridad `VeryHigh`, que es
el mecanismo real que la #09 destapó —lo que retrasa a la foto no es el **peso**
de lo que va delante sino **cuántos pedidos `VeryHigh`** hay antes que ella—.

#### El veredicto de dirección, 17/9/2026: no se abre, y se cierra

**El tamaño del premio es lo que lo decide:** un punto de Lighthouse en
`/privacidad` y `/terminos`, dos páginas legales, contra una orden entera de
partir el CSS por página y remedirlo todo.

**Y el antecedente pesa más que el premio.** La #09 ya se abrió una vez
persiguiendo un punto que —medido— **ya no existía**: el «86 contra 87» se había
escrito antes de la #05 y nadie lo revisó. Abrir esta orden sería repetir el
movimiento sabiendo cómo salió: se paga el trabajo por adelantado y el punto se
mide al final.

Así que el punto **se acepta**. `/privacidad` y `/terminos` en 98 es el precio de
servir una hoja para las cuatro páginas, y es un precio que la web paga en las dos
páginas que menos importan comercialmente.

**Lo que queda escrito para el que venga**, que es el valor real de este
pendiente: partir por frecuencia de cambio **está medido y no arregla esto**; el
único camino que queda es partir por página; y el mecanismo que lo explica no es el
peso sino **cuántos pedidos `VeryHigh`** van delante de la foto. Si alguien lo
reabre, que sea con un premio más grande que un punto — y midiendo primero.

### 6. Content-Security-Policy · **CERRADO en la #10**

Se escribió mientras era corta: un solo JS propio, cero scripts en línea, cero
terceros. Va en los dos `vercel.json`, sin condición de host:

```
default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self';
font-src 'self'; connect-src 'self'; form-action 'none'; frame-ancestors 'none';
base-uri 'none'; object-src 'none'; upgrade-insecure-requests
```

**Dos cosas salieron distintas de como la orden las había escrito**, las dos
medidas:

- **`img-src` NO lleva `data:`.** La orden lo incluía «porque el favicon SVG y
  algún recurso embebido lo usan» y mandaba verificarlo. Se verificó: **no hay
  ni una `data:` URI** en el HTML publicado ni en el CSS compilado. El favicon
  es un archivo. Se sacó, como la propia orden indicaba para ese caso.
- **`style-src 'self'` rompía la web, y no se arregló con una excepción.** La
  web tenía **siete `style=` inline** —tres anchos de foto y cuatro márgenes— y
  la CSP los bloquea: medido, la foto de «Quién soy» quedaba en
  `max-width:none`. En vez de agregar `'unsafe-inline'`, los siete se movieron a
  `index.css`. La política se queda **sin una sola excepción**, que era el
  argumento entero de la orden.

  Y el traslado dejó su propia lección: el primer intento usó la escala
  `u-mt-*`, que **tiene la misma especificidad** que `.ficha` y `.sello` y por
  lo tanto pierde por orden de archivo. El guardián de fidelidad lo cazó con la
  portada 56 px más alta. Las siete reglas cuelgan del `id` de su sección, que
  gana siempre — que es lo que el `style=` hacía.

**El WhatsApp no necesitó nada**, y se comprobó clickeando y no razonando:
`wa.me` con `target="_blank"` es **navegación**, no carga de recurso, y ninguna
directiva de esta política la gobierna.

De paso, `e2e/servidor.mjs` pasó a **leer las cabeceras del `vercel.json` de la
raíz** en vez de servir sólo el contenido. Así el guardián mide la política que
se va a publicar y no una copia; es la regla que la #07 ya aplicó con
`check/acento.mjs`.

#### Lo que va a exigir cada cosa que venga

Escrito ahora para que cada excepción futura sea una decisión consciente y no un
`unsafe-inline` puesto a las tres de la mañana para destrabar un deploy:

| lo que venga | qué va a pedir |
|---|---|
| analítica (Plausible, GA…) | su dominio en `script-src` **y** en `connect-src` |
| el consultorio | el proyecto de Supabase en `connect-src` (REST y WebSocket) |
| video de cursos (Mux, D9) | `media-src` y `frame-src` del reproductor |
| Google Meet / Calendar embebidos (D8) | `frame-src` de Google |
| pagos (Paddle) | `script-src` y `frame-src` de Paddle — su checkout es un iframe |
| cualquier formulario | `form-action`, que hoy está en `'none'` **a propósito**: la web no tiene ninguno, y el día que tenga uno esta línea lo va a romper ruidosamente, que es lo que queremos |
| fuentes de Google | nada: **no se hace**. Las fuentes son locales por regla (`CLAUDE.md`) |

**Reportes de violaciones a un tercero: no.** Sería mandar datos de visitantes a
un servicio externo y es una decisión de privacidad con su propia orden.

Lo que los tests **no** comprueban, declarado: que Vercel sirva la cabecera. Eso
se mide con `curl` contra el preview y contra producción, y está en el informe.

### 7. Dos documentos del mismo design system · **de dirección**

`01 Documentos/Marca/armando-design-system.tokens.json` y
`04 Codigo/codice/packages/ui/codice-tokens.json` dicen ser el mismo design
system y ya no lo son: el de Marca venía en **1.0.0** y sin la sección `web` que
la #01 le agregó al del repo. La #03 le aplicó los tres colores nuevos y su
changelog, así que los colores coinciden otra vez, pero el resto no.

La **#05 los separó más**: `packages/ui/codice-tokens.json` pasó a 1.2.0 con la
sección `color.cff` entera —los cinco colores del manual de Construyendo
Familias Fuertes más el naranja de texto derivado— y el de `Marca/` no la tiene.
Ahora no es que difieran en el detalle: difieren en **cuál es la paleta de la
web**.

Dos verdades esperando a no coincidir. O el de Marca pasa a ser una exportación
del de `packages/ui` —que es lo que el `CLAUDE.md` del repo llama fuente de
verdad— o se declara histórico. El `CLAUDE.md` del proyecto todavía lo llama
«design system canon (D6)»: hay que elegir uno.

### 8. `pnpm lint` estaba rojo desde la #01, y nadie lo veía

Encontrado corriendo la gate de la #02. Un comentario de
`scripts/guardian-de-guardianes.mjs` empezaba con la palabra `eslint`, y un bloque
`/* eslint … */` es una **directiva de configuración en línea**: eslint intentaba
leerlo como JSON y fallaba con `ruleId: null`. El filtro del guardián solo mira
`react-hooks/rules-of-hooks`, así que lo descartaba en silencio y `pnpm test`
seguía verde; el que se ponía en 1 era `pnpm lint`, que no está en la gate.

Arreglado cambiando la primera palabra del comentario. Está fuera de la letra de
la #02 y se declara acá por eso.

### 9. El día que entre el consultorio, el repo pasa a privado — y eso cuesta plata · **de dirección**

Hoy el repo es **público** por decisión de dirección (14/9/2026), y es lo que
hace que **Vercel Hobby** despliegue los commits de cualquier autor sin pagar
nada. Está bien mientras lo único que contenga sea la web pública.

El día que entre el consultorio —fichas de pacientes, claves de Supabase, datos
de personas— el repo pasa a privado, y ahí Vercel Hobby **deja de desplegar
commits que no sean del dueño de la cuenta**. Hay que pasar a **Pro, USD 20/mes**,
que paga Armando.

Queda anotado acá para que no aparezca como sorpresa a mitad de camino: **es lo
primero que hay que resolver antes de la primera orden del consultorio**, no
durante.

Mientras tanto rige la regla sin excepciones: nada secreto entra al repo. Lo
vigila `pnpm check:secretos`, que está en la gate y falla nombrando archivo y
línea. Si una orden futura parece pedir lo contrario, está mal escrita: se frena
y se pregunta.

### 10. `qa/referencia/` ~~sigue leyéndolo tres tests~~ · **cerrado en la #05**

Dirección lo resolvió el mismo día que se abrió: **los tres se retiran**. El
motivo, con sus palabras: «comparan contra una referencia que D24 declaró
historia; un guardián que vigila contra lo que ya no es verdad no es vigilancia,
es ruido que un día se ignora».

Qué se fue, con su número:

| test | qué se retiró | tests |
|---|---|--:|
| `packages/ui/tokens.test.mjs` | el bloque que ataba la sección `web` del JSON a `estilo.css` | −8 |
| `apps/web/src/el-css-esta-entero.test.ts` | el archivo entero: comparaba regla por regla en las dos direcciones | −4 |
| `apps/web/e2e/comportamiento.spec.ts` | **sólo la mitad comparativa** (la segunda pestaña y los `toEqual`) | −0 |

El tercero es el que merece la aclaración. Sus dos tests ya afirmaban **cada
estado contra su valor literal** y encima comparaban contra el estático; se fue
la comparación y se quedaron los literales, que son los que cazan un menú muerto.
El `toEqual` nunca lo hizo: dos páginas rotas igual se parecen muchísimo. Por eso
`@codice/navegador` sigue en 14 y no baja.

De paso se fue el segundo servidor de `playwright.config.ts`, `ESTATICO_DIR` y el
`existsSync` que frenaba la corrida si faltaba la carpeta. **Hoy ningún test lee
`qa/referencia/`**, que es lo que la D24 decía y ahora es cierto.

### 11. Tres JPG viejos de Armando ~~quedaron sin usar~~ · **cerrado en la #05**

Borrados de `public/img/` los tres que ya no usaba nadie —`armando-parado.jpg`,
`armando-retrato.jpg` y `armando-sentado.jpg`, 528 KB—. Los nueve originales
siguen en `qa/referencia/img/`, que es el sitio tal como se publicó el 12/9.

### 15. `familia.svg` queda guardado sin usar, y la ficha del facilitador NO lleva íconos · **decidido por dirección**

La #07 puso íconos en las fichas de «Quién soy» y «Tres maneras». Los cuatro
nombres que la orden listaba —`familia, practica, formacion, obra`— son en
realidad las filas de **«Sobre el facilitador»**, en `/merida`, que la orden no
nombraba; las de «Quién soy» son Formación · Práctica · Obra · **Base**. Se
pusieron los tres que coinciden más `lugar` para «Base», y `familia.svg` quedó
sin usar.

**Dirección decidió (17/9) que se quede sin usar y que esa ficha no lleve
íconos**, con un motivo que conviene tener escrito porque no es de gusto: **la
ficha del facilitador está sobre teal, y los íconos son un círculo de teal claro**.

Está medido desde la #06 y afirmado en `packages/ui/tokens.test.mjs`:

    cff.tealLight sobre cff.tealDark  →  2,56

Ni siquiera llega al 3:1 que rige para un ícono. Poner esos SVG ahí sería poner
once círculos que no se ven.

O sea que el día que esa ficha lleve íconos van a necesitar **otro tratamiento**
—otro color de círculo, o el glifo sin círculo, o un fondo distinto para la
sección—, y eso es una decisión de diseño, no un renglón. El test que lo impide
ya existe y está escrito como igualdad, así que nadie puede llegar ahí por
accidente.

### 13. El guardián de fidelidad estuvo ciego a un cambio de color · **encontrado y arreglado en la #05**

Queda escrito porque es el modo de falso verde más caro que se pagó en este repo
y porque la frase que lo tapaba llevaba cuatro órdenes escrita como si fuera
cierta.

`fidelidad.spec.ts` decía desde la #01: «queda el `threshold` por píxel que trae
Playwright (0,2 en YIQ), que tolera el antialias de una máquina a otra **sin
tolerar un color distinto**». La segunda mitad es falsa.

Se descubrió cuando dirección eligió que «se construyen» quedara en teal en vez
de tinta: se cambió el color, se recompiló, y **las doce comprobaciones pasaron
en verde** con el titular de la portada pintado de otro color. `--update-snapshots`
tampoco reescribió un solo archivo. Con la hoja de vuelta en tinta también
pasaban: el guardián estaba ciego a los dos lados del cambio.

Medido con la métrica de pixelmatch que Playwright usa —`maxDelta = 35215 ×
threshold²`—:

| par de colores | delta | tope con 0,2 | |
|---|--:|--:|---|
| tinta `#2E2B25` → teal `#005761` | 1.253 | 1.409 | **no se contaba** |
| naranja `#BF3F06` → teal `#005761` | 7.356 | 1.409 | se contaba |
| antialias típico (±2 por canal) | 2 | 1.409 | no se cuenta |

La mutación de control de la #01 caía muy por encima del tope —por eso el
guardián parecía funcionar y nadie dudó de la frase— y este cambio caía justo por
debajo. Un presupuesto de «cero píxeles diferentes» no vale nada si la definición
de «diferente» deja pasar dos colores de marca distintos.

**Arreglado con `threshold: 0.05`**, que baja el tope a 88: el cambio de color se
cuenta con 14× de margen y el antialias sigue absorbido con 44×. No se puso en 0
porque ahí cualquier variación de un punto en el borde de una letra contaría y el
guardián se pondría rojo solo. Comprobado: con la captura vieja y la página nueva
da **9.807 píxeles** de diferencia, y dos corridas limpias seguidas pasan en
verde, o sea que el dibujado es determinista en esta máquina a ese umbral.

La lección, que vale más que el número: **una mutación que pasa holgada no prueba
que el guardián sirva para cambios chicos.** La de la #01 movía 7.356 de delta
sobre un tope de 1.409 y dejó creer que cualquier color distinto se cazaba. Si
una comprobación tiene un umbral, la mutación que la valida tiene que caer
**cerca** del umbral, no lejos.

### 14. El header quedó ilegible sobre el teal entre la #05 y la #06 · **encontrado y arreglado en la #06**

Estuvo **en producción desde el merge de la #05** (16/9) hasta el de la #06, y
nadie lo vio: sobre «Sobre el facilitador» el wordmark del header se dibujaba
tinta sobre teal, **1,70:1**. Medido en producción el 17/9, antes de tocar nada.

La causa es una copia. `comportamiento.ts` decidía si una sección era oscura
consultando un `Set` de dos cadenas —`'rgb(51, 88, 92)'` y `'rgb(46, 43, 37)'`,
que es el formato en que `getComputedStyle` devuelve un color— y la #05 cambió el
teal de la web de `#33585C` a `#005761` sin tocar ese `Set`.

**Lo peor es que había un test para exactamente esto** y siguió en verde. Estaba
bien pensado: recalculaba los dos valores desde los tokens y comparaba. Pero leía
`color.brand.teal`, que la #05 dejó intacto **a propósito** para la app, mientras
la web pasaba a usar `color.cff.tealDark`. El test no estaba mal escrito: estaba
**vigilando la copia equivocada**.

Arreglado quitando la copia. `esOscuro()` mide la luminancia del fondo que el
navegador realmente pintó; no hay lista que mantener, y un color nuevo o un token
renombrado funcionan sin tocar el archivo. El test pasó a afirmar la
clasificación de **los seis fondos que la web usa**, leídos de los tokens que la
web usa.

**La lección, que es la que hay que recordar:** cuando se vigila una copia, el
test tiene que apuntar a la misma fuente que usa el código — y eso es una segunda
cosa que se puede desincronizar. Si se puede medir en vez de copiar, se mide.

### 12. Los tres íconos de la franja de hechos ~~no llegan a 2×~~ · **cerrado en la #07**

Dirección los redibujó en vector el 17/9, junto con `taller.svg`, y reemplazan a
los PNG del mismo nombre. A un SVG no le importa la densidad de la pantalla, así
que el pendiente no se resolvió pidiendo archivos más grandes: se resolvió
sacándole el problema de encima al formato.

Los cuatro naranja de «Cuatro núcleos» siguen siendo los PNG de Lucía: ésos ya
llegaban a 2× y no había motivo para tocarlos.
