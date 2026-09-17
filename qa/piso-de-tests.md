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
| `@codice/ui` | 30 |
| `@codice/core` | 23 |
| `@codice/prompts` | 3 |
| `@codice/web` | 33 |
| `@codice/navegador` | 33 |

## De dónde salen estos números

Son los que dejó la orden Códice #01, Fase A, medidos contra la corrida real —no
estimados—. `@codice/ui` es el guardián de los tokens; `@codice/core`, el del
i18n y el de los enlaces de WhatsApp; `@codice/prompts`, el del perfil de estilo;
`@codice/web`, el de las rutas.

`@codice/navegador` no es un paquete: es el guardián de fidelidad, que corre en Chromium
y compara el port contra el sitio estático. Son las cuatro páginas por los tres anchos.
Entra a esta tabla por la misma puerta que los demás — un guardián que no corre no dice
nada, y desde afuera se ve igual que uno que corrió bien.

## Lo que movió la orden #09

`@codice/navegador` sube de 26 a **33** y `@codice/web` de 29 a **33**. Once
tests nuevos, y ninguno mide el número de Lighthouse: ése vive en el informe con
su método. Lo que vigilan es el **mecanismo** que la orden compró.

**Cuatro en `@codice/web`** (`src/el-css-va-en-dos-hojas.test.ts`), y existen
por el motivo más caro: **la mutación de la orden no tiraba nada.** Se devolvió
el `@import "./fuentes/fonts.css"` a `packages/ui/styles.css` —o sea el modo
exacto en que esta decisión se deshace— y el build salió **verde**: el prerender
seguía viendo dos hojas y el guardián de fidelidad seguía viendo dos `<link>`.
La web quedaba peor que antes de la orden, con los ocho `@font-face` viajando
dos veces, y nada lo decía. Miran **qué hay adentro de cada hoja**, que es la
decisión: los ocho `@font-face` de un lado, cero del otro, y ningún token ni
regla de la web del lado de las fuentes. Son baratos —leen tres archivos de
`dist/`, sin Chromium— y por eso corren antes que los siete de abajo.

**Siete en `@codice/navegador`** (`e2e/dos-hojas.spec.ts`):

- **Uno de piso**, y va primero por la regla de la casa: que las cuatro páginas
  enlacen **dos** hojas y que la de fuentes vaya primero. Los tres de abajo
  miran la portada; sin este, `/terminos` podría quedarse con una sola hoja sin
  que nada lo dijera — y `/terminos` es justo el segundo caso del pendiente 5b.
- **Uno de paralelo**: que las dos empiecen a bajar antes de que termine
  cualquiera. Es *la* afirmación de la orden. Si el navegador las pide en fila
  —un `@import` que descubre la segunda leyendo la primera, o un JavaScript que
  la agrega— partir el CSS no sirvió de nada, y desde afuera se ve idéntico.
- **Uno de prioridades**: las dos hojas en `VeryHigh` y la foto del hero en
  `High`. Se lee por CDP porque la prioridad **no está en la API de Playwright**:
  es `request.initialPriority` de `Network.requestWillBeSent`.
- **Cuatro del salto de texto**, uno por página, con el enlace estrangulado en
  los mismos 1,6 Mbit/s de Lighthouse móvil. Son la trampa de la orden: separar
  las fuentes puede hacer que el primer cuadro se pinte con la tipografía del
  sistema y salte al llegar la buena, o sea ganar LCP perdiendo CLS.

Los cuatro números del salto están escritos **como igualdad y no como «menor
que»**, igual que el contraste de `packages/ui/tokens.test.mjs`, y por el mismo
motivo: el día que alguien lo arregle o lo empeore, el test obliga a venir a
mover el número a mano con su medición al lado.

Y algo que esta orden encontró de paso, que es de la familia del pendiente 13:
**el guardián de fidelidad se quedó en verde con un `<link>` nuevo en el
`<head>` de las cuatro páginas.** Su lista no miraba las hojas de estilo. Ahora
sí —`cabeza()` devuelve las hojas enlazadas, en orden, con el hash normalizado—
así que volver a fusionarlas reescribe cuatro capturas y aparece en el diff.

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
