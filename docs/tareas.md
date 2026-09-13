# Tareas y cola de órdenes — codice

Las órdenes viven fuera del repo, en `03 Producto/codice/ordenes/`. Acá queda el
estado y lo que va quedando pendiente.

## Cola de órdenes

| # | Qué | Estado |
|---|---|---|
| #01 | Nace el monorepo, y la web pública se porta a React | en curso (ramas `codice/01a-molde`, `01b-port`, `01c-fidelidad`) |

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

### 3. Las plantillas `check/og-*.html` todavía apuntan a la carpeta vieja

Se trajeron **sin cambios**, como pedía la orden. Eso significa que sus rutas
relativas (`../estilo.css`, `../fuentes/local.css`, `../img/…`) y la salida de
`og-capturar.mjs` describen la anatomía de `armandoduarte-web`, no la de este
repo. Las imágenes `og.jpg` y `og-home.jpg` están copiadas y son las buenas; lo
que no corre hoy es **regenerarlas desde acá**. Es media hora y una orden chica,
y conviene hacerla junto con la fecha del taller, que es lo que va a obligar a
regenerar la del taller.

### 4. Contraste de color: 96/100 en accesibilidad · **decisión de dirección**

Lighthouse móvil da **96** en el inicio y el taller y **95** en las dos legales,
en el port **y en el sitio estático por igual** — el único audit que falla es
`color-contrast`. No lo trajo el port: es del diseño, y viene de la paleta de D6
(el gris `#7A7267` sobre crema, y el crema al 60–75 % sobre teal y tinta).

No se tocó, y no se puede tocar desde esta orden: subir el contraste es cambiar
un color, y la orden #01 no cambia nada visible. Va a dirección con dos caminos:
dejarlo como está —es una decisión estética consciente y el texto se lee— o
abrir una orden que suba el gris apenas, mida los dos sitios y decida con el
número delante.

### 5. Performance: el bundle cuesta 17 puntos · **decisión de dirección**

Medido con Lighthouse móvil sobre `dist/` servido local, y contra el sitio
estático servido igual:

| página | estático | port | port sin el bundle |
|---|--:|--:|--:|
| inicio | 87 | 70 | 87 |
| taller | 90 | 73 | 94 |
| privacidad | 99 | 81 | 99 |
| terminos | 99 | 81 | 99 |

La diferencia es **una sola cosa y está aislada**: los 354 KB del bundle de React
compitiendo por ancho de banda con el CSS en el enlace estrangulado de Lighthouse
(1,6 Mbit/s). El FCP pasa de 1,8 s a 3,8 s en las cuatro páginas por igual, y el
TBT es **0 ms**: no es JavaScript ejecutándose, es JavaScript bajando. Con el
`<script>` quitado de una copia descartable de `dist/`, el port vuelve a los
números del estático o los mejora.

Se descartó la primera hipótesis midiéndola: los `<link rel="preload" as="image">`
que React 19 inyecta al dibujar del lado del servidor **no** son la causa —
sacarlos no movió ni un punto.

Lo que compra ese bundle son **tres comportamientos**: el menú de pantalla
completa, el tinte del header y el fundido de entrada. En el sitio estático eso
eran dos kilobytes de JavaScript a mano.

Dos caminos, y es de dirección:

- **dejarlo.** La plataforma va a cargar React igual, y el día que la academia
  viva en el mismo dominio el bundle está cacheado para todo el recorrido;
- **no hidratar la web pública.** El HTML ya sale escrito del prerender; los tres
  comportamientos se podrían servir con un script chico, y React quedaría para
  las pantallas de la plataforma. Es una orden aparte, y no es gratis: sería la
  primera vez que el repo tiene dos maneras de dibujar.

No se «arregló» quitando cosas, como pide la orden: se midió y se informa.

### 6. Content-Security-Policy

No hay CSP todavía, igual que en el sitio estático. Con el port desaparece el
`<script>` en línea que la complicaba —ahora todo el JavaScript es un archivo con
su hash—, así que el día que se escriba es más fácil que antes. Va junto con la
apertura del dominio.
