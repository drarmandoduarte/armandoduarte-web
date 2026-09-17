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

### 5b. El punto que falta en el inicio · **de dirección, y chico**

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

Dos caminos que se midieron y **empeoraron**, para que nadie los vuelva a
intentar: mover los `<link rel="preload" as="image">` que React inyecta al
`<head>` (86/86/87) y quitarlos del todo (70, LCP 5,78 s — hacen falta).

### 6. Content-Security-Policy

No hay CSP todavía, igual que en el sitio estático. Con el port desapareció el
`<script>` en línea que la complicaba —todo el JavaScript es un archivo con su
hash, y desde la #02 es **uno solo de 1,8 KB**—, así que el día que se escriba es
más fácil que antes. Va junto con la apertura del dominio.

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
