#!/usr/bin/env node
/**
 * El prerender — orden Códice #01, C1; sin hidratación desde la #02.
 *
 * ── Por qué existe ────────────────────────────────────────────────────────
 * Porque la web es **pública** y necesita HTML de verdad, no un `<div
 * id="root">` vacío. Un buscador que entra a `/taller` tiene que encontrar el
 * programa del taller escrito; una vista previa de WhatsApp tiene que encontrar
 * el `<title>` y el `og:image`; y alguien con la conexión lenta tiene que poder
 * leer antes de que baje el JavaScript. El sitio estático daba las tres cosas
 * gratis, y el port no puede perderlas: sería la única diferencia visible entre
 * las dos versiones, y de las que no se ven mirando la pantalla.
 *
 * ── Lo que cambió en la #02 ──────────────────────────────────────────────
 * Antes la plantilla era `dist/index.html` —lo que Vite dejaba al compilar
 * `index.html`— y traía puesto el `<script type="module">` del bundle de React.
 * Ahora **`index.html` no es entrada del build**: la plantilla es el archivo
 * fuente, se le quita el `<script>` que solo sirve en `vite dev`, y se le ponen
 * las dos cosas que el navegador sí baja en producción:
 *
 *   · los `<link rel="stylesheet">` del CSS compilado, y
 *   · **un** `<script defer>` de ≤ 3 KB con los tres comportamientos.
 *
 * ── Lo que cambió en la #09 ──────────────────────────────────────────────
 * Los `<link>` del CSS pasaron de uno a **dos**: primero la hoja de fuentes
 * —`assets/fuentes-<hash>.css`, que compila `scripts/hoja-de-fuentes.mjs`— y
 * después la de estilos. Es el contrato nuevo de `@codice/ui` (dos entradas) y
 * es la forma que tenía el sitio estático: `fuentes/local.css` y `estilo.css`.
 *
 * El orden entre los dos no es de gusto: un `@font-face` tiene que estar
 * declarado cuando se aplica la regla que lo usa.
 *
 * React sigue dibujando el HTML: acá, en Node, con `renderToString`. Lo que
 * desapareció es el React del navegador. La página no se hidrata.
 *
 * ── Cómo ─────────────────────────────────────────────────────────────────
 * Corre después de `vite build`. Por cada ruta se dibuja el árbol con
 * `renderToString` sobre un router estático, se mete el HTML donde está
 * `<!--app-->` y el `<head>` de esa página donde está `<!--cabeza-->`, y se
 * escribe `dist/<archivo>`.
 *
 * ── Sin framework, y por eso se lee ──────────────────────────────────────
 * React y `react-dom/server` alcanzan. La única pieza prestada es el propio
 * Vite, en modo SSR, para poder importar TypeScript y JSX sin un segundo build:
 * `ssrLoadModule` es la misma puerta que usa cualquier servidor de SSR en
 * desarrollo.
 *
 * ── Los pisos ────────────────────────────────────────────────────────────
 * Este archivo puede fallar de tres maneras silenciosas, y las tres están
 * atajadas antes de escribir nada: que el build no haya dejado los archivos que
 * se van a enlazar, que haya dejado **de más** —un bundle de React que volvió
 * sin que nadie lo note—, y que una página salga vacía. Un `renderToString` que
 * devuelve vacío escribe un archivo válido, chiquito y mudo.
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, '..');
const DIST = join(RAIZ, 'dist');
const ASSETS = join(DIST, 'assets');
const PISO_DE_BYTES = 2048;

const morir = (mensaje) => { console.error(`prerender: ${mensaje}`); process.exit(1); };

/** El único archivo de `dist/assets` que termina así, o se muere diciendo cuántos había. */
function elUnico(extension, comoEmpieza = '') {
  const encontrados = readdirSync(ASSETS)
    .filter((n) => n.endsWith(extension) && n.startsWith(comoEmpieza));
  if (encontrados.length !== 1) {
    morir(
      `esperaba exactamente un ${comoEmpieza}*${extension} en dist/assets y hay ${encontrados.length}`
      + `${encontrados.length ? ` (${encontrados.join(', ')})` : ''}. `
      + 'La plantilla enlaza por nombre: sin eso enlazaría el archivo equivocado o ninguno.',
    );
  }
  return `/assets/${encontrados[0]}`;
}

const js = elUnico('.js', 'comportamiento-');

/*
 * Y lo que NO puede estar: cualquier otro `.js`.
 *
 * Es el guardián de la decisión de la #02, puesto donde no se puede saltear.
 * El día que alguien vuelva a poner `index.html` como entrada del build —o que
 * un import arrastre React al grafo de `entrada-navegador.ts`— van a aparecer
 * más chunks en `dist/assets`, y esto se cae acá, antes de publicar, en vez de
 * descubrirse dentro de tres meses midiendo Lighthouse.
 */
const otrosJs = readdirSync(ASSETS).filter((n) => n.endsWith('.js') && `/assets/${n}` !== js);
if (otrosJs.length) {
  morir(
    `dist/assets tiene ${otrosJs.length} archivo(s) .js de más: ${otrosJs.join(', ')}. `
    + 'La web pública sirve UN script y no se hidrata; más de uno significa que algo volvió a compilar la app.',
  );
}

/*
 * Las dos hojas, y exactamente dos — orden Códice #09.
 *
 * La de fuentes se busca **por nombre** (`fuentes-`), que es la clave de la
 * entrada en `scripts/hoja-de-fuentes.mjs`, o sea un nombre que este repo
 * eligió. La de estilos es «la otra», y se busca así a propósito: su
 * `style-<hash>.css` se lo pone Vite —no sale de ninguna línea de este repo— y
 * atarse a ese nombre sería atarse a un detalle interno de la herramienta.
 *
 * Que sean dos y no tres es el guardián de esta orden, puesto donde no se puede
 * saltear. Se enlazan por nombre: una tercera hoja —un `cssCodeSplit` que
 * volvió a `true`, una entrada que nadie declaró— no llegaría al navegador, y
 * la página saldría sin esas reglas. Callado, y sólo en producción.
 */
const cssFuentes = elUnico('.css', 'fuentes-');
const todasCss = readdirSync(ASSETS).filter((n) => n.endsWith('.css'));
if (todasCss.length !== 2) {
  morir(
    `esperaba exactamente dos hojas en dist/assets —fuentes y estilos— y hay ${todasCss.length}`
    + `${todasCss.length ? ` (${todasCss.join(', ')})` : ''}. `
    + 'El HTML las enlaza a las dos por nombre: la que sobre no llega al navegador, y la que falte se lleva sus reglas.',
  );
}
const cssEstilos = `/assets/${todasCss.find((n) => `/assets/${n}` !== cssFuentes)}`;

/*
 * La plantilla es `index.html` —el archivo fuente, el mismo que sirve `vite
 * dev`— y no una segunda copia: dos plantillas se separan, y la que se queda
 * vieja es siempre la que nadie mira.
 *
 * Lo único que se le saca es su `<script type="module" src="/src/…">`, que en
 * producción no existe. Se exige que haya **exactamente uno** y que apunte a
 * `/src/`: si mañana `index.html` cambia de forma, esto se cae con el motivo en
 * vez de publicar una página sin estilos.
 */
const plantillaCruda = readFileSync(join(RAIZ, 'index.html'), 'utf8');
for (const marca of ['<!--app-->', '<!--cabeza-->']) {
  if (!plantillaCruda.includes(marca)) {
    morir(`la plantilla index.html no tiene ${marca}. Sin eso no hay dónde inyectar.`);
  }
}

const scriptsDeDev = [...plantillaCruda.matchAll(/[ \t]*<script[^>]*src="\/src\/[^"]*"[^>]*><\/script>\n?/g)];
if (scriptsDeDev.length !== 1) {
  morir(
    `index.html tiene ${scriptsDeDev.length} <script src="/src/…"> y esperaba exactamente uno `
    + '(el de `vite dev`, que en producción se quita).',
  );
}

/*
 * El CSS arriba y el script abajo, que es donde el sitio estático los tenía.
 *
 * Lo del CSS es obvio —bloquea el dibujo, cuanto antes se pida, mejor—. Lo del
 * script **está medido**, y la primera versión de esta orden lo tuvo en el
 * `<head>` hasta que Lighthouse lo dijo: con el `<script defer>` arriba, el
 * inicio daba 86 contra los 87 del estático y el FCP subía de 1,65 s a 1,80 s;
 * bajándolo al final del `<body>` da 87–88 y el FCP vuelve a 1,65. Son 1,8 KB,
 * pero en el enlace estrangulado de Lighthouse (1,6 Mbit/s) compiten con las
 * 28 KB del CSS, que es lo único que separa a la pantalla en blanco de la
 * página.
 *
 * `defer` no cambia de significado por estar abajo: sigue ejecutándose después
 * de que el documento se terminó de parsear y antes de `DOMContentLoaded`. Y es,
 * literalmente, el lugar donde el sitio estático ponía su `<script>` en línea.
 */
const plantilla = plantillaCruda
  .replace(scriptsDeDev[0][0], '')
  .replace('</head>', `<link rel="stylesheet" href="${cssFuentes}">\n<link rel="stylesheet" href="${cssEstilos}">\n</head>`)
  .replace('</body>', `<script defer src="${js}"></script>\n</body>`);

const vite = await createServer({
  root: RAIZ,
  logLevel: 'warn',
  server: { middlewareMode: true },
  appType: 'custom',
});

try {
  const { RUTAS } = await vite.ssrLoadModule('/src/rutas.ts');
  const { dibujar } = await vite.ssrLoadModule('/src/entrada-servidor.tsx');

  for (const { ruta, archivo, pagina } of RUTAS) {
    const { app, cabeza } = dibujar(ruta, pagina);
    const html = plantilla.replace('<!--cabeza-->', cabeza).replace('<!--app-->', app);

    if (Buffer.byteLength(html, 'utf8') < PISO_DE_BYTES) {
      morir(
        `${ruta} salió en ${Buffer.byteLength(html, 'utf8')} bytes y el piso es ${PISO_DE_BYTES}. `
        + 'Un render vacío escribe un archivo válido y mudo: no se publica.',
      );
    }

    writeFileSync(join(DIST, archivo), html);
    console.log(`prerender: ${archivo.padEnd(16)} ${ruta.padEnd(12)} ${(Buffer.byteLength(html, 'utf8') / 1024).toFixed(1)} KB`);
  }
  console.log(`prerender: sin hidratar · css ${cssFuentes} + ${cssEstilos} · script ${js}`);
} finally {
  await vite.close();
}
