# Tareas y cola de órdenes — codice

Las órdenes viven fuera del repo, en `03 Producto/codice/ordenes/`. Acá queda el
estado y lo que va quedando pendiente.

## Cola de órdenes

| # | Qué | Estado |
|---|---|---|
| #01 | Nace el monorepo, y la web pública se porta a React | cerrada (ramas `codice/01a-molde`, `01b-port`, `01c-fidelidad`) |
| #02 | La web pública no se hidrata | cerrada (rama `codice/02-sin-hidratar`, sobre `01c-fidelidad`) |
| #03 | Contraste a AA, con el número delante | en curso (rama `codice/03-contraste`, sobre `02-sin-hidratar`) |

## Pendientes abiertos

### 1. Conectar Vercel al monorepo · **es de dirección**

La orden #01 **no despliega**: no hay proyecto de Vercel para `codice` todavía.
`armandoduarte-web` sigue siendo producción hasta que dirección conecte el
monorepo. Cuando lo haga: raíz del proyecto `apps/web`, comando de build
`pnpm --filter @codice/web build`, salida `apps/web/dist`. El `vercel.json` ya
está en `apps/web`, copiado tal cual del sitio estático.

### 2. Quitar `X-Robots-Tag: noindex, nofollow` el día que se abra el dominio

Viene copiado del sitio estático y está bien mientras la web viva en una URL
`.vercel.app`. El día que `armandoduarte.com` apunte acá hay que sacarlo de
`apps/web/vercel.json`: si no, la web abre invisible para los buscadores.

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

### 4b. El bloque de contacto estaba invisible · **arreglado en la #03, y está vivo en producción**

El teléfono de WhatsApp y los enlaces a YouTube, Spotify y Facebook de la portada
se dibujaban **tinta sobre tinta** —contraste 1,00:1— por una colisión de
especificidad entre `.tinta .grande` y `.contacto .grande` en `estilo.css`. En el
monorepo está arreglado (`color:inherit`, el cambio más chico posible).

**En `armandoduarte.com` sigue roto**, porque Rodolfo no toca el sitio estático.
Mientras el monorepo no sea producción, cada visitante que baja a «Escríbeme» no
ve el teléfono. Es de dirección decidir si se corrige allá o se acelera el
cambio de producción.

### 4c. El ocre medio sobre teal no llega a AA: **2,51** · **de dirección**

Los rótulos, enlaces y flechas de las secciones teal. Llegar a 4,5 exige un ocre
`#D6C2A4` —un arena pálido— que ya no es el ámbar de la marca: es una decisión de
paleta, no de contraste, y por eso la #03 no la tomó. Con su número y sus
alternativas en `docs/informes/03/LEEME.md`, punto D.

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
