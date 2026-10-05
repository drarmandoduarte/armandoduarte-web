#!/usr/bin/env node
/**
 * El barrido de los renglones huérfanos — orden Códice #16, B.
 *
 * ── La regla que vigila ────────────────────────────────────────────────────
 * **Ningún título termina ni se parte en un renglón de una sola palabra, ni en
 * uno de menos de seis caracteres, a ningún ancho.** Sale del hero de `/merida`,
 * que quedó en tres renglones con «a tu» solo en el del medio: dos palabras
 * cortas en el título más importante del sitio, en un tercer color. Dirección no
 * quiere volver a encontrarlo mirando capturas — y mirar capturas es justamente
 * lo que no escala: son cuatro rutas por cuatro anchos por cada título.
 *
 * ── Por qué mide renglones dibujados y no markup ─────────────────────────
 * Un `<br>` y un salto natural son lo mismo para el lector, y el que importa es
 * el que el navegador eligió con la tipografía puesta. Así que no se lee el HTML:
 * se recorre cada palabra del título con un `Range`, se le pide su rectángulo y
 * se agrupan las palabras por el `top` de ese rectángulo. Eso es un renglón.
 *
 * Se toma el **primer** rect de cada palabra y no su bounding: una palabra
 * partida por guion de corte ocupa dos renglones y su bounding los abarca los
 * dos, lo que la pondría en un renglón que no existe.
 *
 * ── Y las palabras se agrupan por SOLAPE vertical, no por `top` igual ─────
 * Ésta la encontró el propio barrido, en su primera corrida, y vale escribirla
 * porque es un falso positivo con muy buena cara. Agrupando por `Math.round(top)`
 * el barrido denunció cuatro renglones huérfanos que **no existen**: las fichas
 * de «Ahora» tienen `h3 a{display:inline-flex;align-items:center}` con la flecha
 * a `font-size:.8em`, así que la flecha va **al lado** del texto pero con otro
 * `top` —es más chica y está centrada—. Dos `top` distintos, dos renglones
 * contados, y en la pantalla un solo renglón. Se llegó a «arreglar» la página con
 * un espacio duro antes de la flecha; el arreglo no cambió nada, porque un ítem
 * de flex con `flex-wrap:nowrap` no se puede ir de renglón. Lo que estaba mal era
 * la medición.
 *
 * Así que dos palabras están en el mismo renglón cuando sus cajas **se solapan
 * verticalmente**: el centro de una cae dentro de la otra. Eso tolera tamaños de
 * letra distintos, `vertical-align`, `align-items` y los superíndices, y sigue
 * separando dos renglones de verdad, que no se solapan.
 *
 * ── Qué NO mira, y está escrito para que el alcance no se lea como «todo» ──
 * · **Los títulos de un solo renglón.** Un título que entra entero no está
 *   partido, y la regla habla de cómo se parte: «Claridad» es un `h3` de una
 *   palabra y está bien. Sin esta salvedad el barrido sería un rojo permanente
 *   sobre títulos correctos, y un rojo permanente se termina apagando — la casa
 *   ya lo pagó con el piso de `check-tokens`, que bajó de 20 a 16 por lo mismo.
 * · **Los títulos invisibles.** Lo que no se ve no se parte mal; el overlay
 *   cerrado es `visibility:hidden` y sus textos no cuentan hasta que se abra.
 * · **`h4` para abajo.** La orden nombra `h1`, `h2` y `h3`. Ampliar el alcance
 *   por las dudas sería medir cosas que nadie decidió.
 *
 * ── Y las excepciones llevan tope, que es la lección de la #12 ────────────
 * Igual que en `check/acento.mjs`: una excepción sin número no es una excepción,
 * es una puerta. Cada fila de `EXCEPCIONES` dice qué título, qué renglón
 * **exacto**, por qué, y cuántas veces puede aparecer. Coincidir por el texto del
 * renglón y no solo por el selector es lo que hace que la mutación de la orden
 * —volver a poner «a tu» en su propio renglón— **caiga**: «a tu» no es el
 * renglón que dirección aprobó, aunque esté en el mismo `<h1>`.
 *
 *     node check/renglones.mjs http://127.0.0.1:4180
 *
 * ── Dos puertas, un barrido ──────────────────────────────────────────────
 * La otra puerta es `e2e/renglones.spec.ts`, que importa de acá las mismas
 * constantes y la misma función. Dos copias de la lista de excepciones serían dos
 * verdades que un día no coinciden: es el modo de falla que la #06 pagó con el
 * token duplicado y el que la #07 evitó en `acento.mjs`.
 */
import { chromium } from '@playwright/test';

const BASE = process.argv[2] || 'http://127.0.0.1:4180';

/** Las cuatro rutas de siempre. */
export const RUTAS = [
  ['inicio', '/'],
  ['merida', '/merida'],
  ['matrimonios', '/matrimonios'],
  ['privacidad', '/privacidad'],
  ['terminos', '/terminos'],
];

/**
 * Los cuatro anchos que pide la orden.
 *
 * 1440 y 900 son los dos de escritorio del guardián de fidelidad; 390 y 375 son
 * los dos teléfonos que la casa mide desde la #12 —375 es el iPhone SE, que es el
 * más angosto que se sostiene—. Un título se parte distinto en cada uno, y el
 * defecto que esta orden persigue aparecía solo en algunos.
 */
export const ANCHOS = [1440, 900, 390, 375];

/**
 * El piso de títulos por ruta, **medido** el 29/9 y no estimado.
 *
 * «Cero renglones huérfanos» sobre un barrido que no encontró ningún título se
 * escribe igual que sobre una casa en orden. Es la regla de la casa sobre las
 * aserciones de cero: al lado del cero va cuántos títulos se miraron. El número
 * es el mínimo de los cuatro anchos, con margen para que el contenido crezca; lo
 * que caza es que la página no haya cargado o que el selector se haya roto.
 */
export const PISO = { inicio: 14, merida: 18, matrimonios: 14, privacidad: 8, terminos: 8 }; // matrimonios: 17 medidos (#38)

/**
 * ── Las excepciones, en dos listas que NO significan lo mismo ─────────────
 *
 * El formato es `[selector del título, texto exacto del renglón, motivo, tope]`.
 * Los dos primeros campos tienen que coincidir los dos: el selector acota **en
 * qué título** vale la excepción y el texto, **cuál renglón**. Con el selector
 * solo, cualquier renglón huérfano de ese mismo título entraría gratis, que es el
 * agujero exacto que la #12 encontró en `acento.mjs` — y el que hace que la
 * mutación de esta orden muerda: «a tu» no es el renglón que dirección aprobó,
 * aunque esté en el mismo `<h1>`.
 *
 * Y el tope, que es la lección de la #12: una excepción sin número no es una
 * excepción, es una puerta.
 *
 * **Están separadas en dos listas a propósito**, porque mezclarlas sería la
 * mentira cómoda: una lista sola se lee como «quince renglones aprobados» y no lo
 * son. `APROBADAS` es lo que dirección decidió. `PENDIENTES` es lo que el barrido
 * de la #16 encontró en las otras páginas y que **no se puede arreglar sin
 * cambiar un texto, un tamaño o el ancho de una columna** — y la orden es
 * explícita: eso no lo decide Rodolfo. Están acá para que la gate quede verde sin
 * dejar de ver el defecto, y cada fila se borra el día que dirección resuelve la
 * suya. La lista completa, con qué tendría que pasar en cada caso, está en
 * `docs/informes/16/LEEME.md`.
 */
export const APROBADAS = [
  /* ── La excepción declarada de la #12, que la #16 no cambia ───────────────
     «ADOLESCENTE» va en su propio renglón y en `--naranja-texto`: lo pidió
     Lucía el 28/9 y entra por D23. Es una palabra sola por diseño.

     La #16 le quitó el vecino: hasta aquella orden el `<h1>` tenía **dos**
     renglones huérfanos, «a tu» y «ADOLESCENTE», y solo el segundo estaba
     decidido. Ahora «a tu» viaja pegado a «amar» y este archivo cae si vuelve a
     quedarse solo — eso es la mutación de aquella orden.

     ── Y la #19 le quitó el punto, que es por lo que esta fila se tocó ──────
     La captura de Lucía dice «ADOLESCENTE» sin punto. El punto es estilo de la
     casa en los títulos, pero acá cierra una palabra sola en mayúsculas y
     naranja, y no lo pidió nadie (#19, C). Al quitarlo, **este guardián se puso
     rojo solo**: la excepción nombraba «ADOLESCENTE.» y dejó de excusar ningún
     renglón, así que la denunció como permiso que sobra. Es exactamente para lo
     que esa comprobación existe —un permiso que sobra es una mentira con
     formato de tabla— y vale dejarlo escrito: nadie tuvo que acordarse. */
  ['#inicio h1', 'ADOLESCENTE', 'la excepción declarada de la #12 y sin punto desde la #19: la palabra que pidió Lucía, en su renglón y en naranja', 1],
  /* ── Los títulos de los núcleos, aprobados en la auditoría del PR #35 ─────
     Con la #23 (D) los núcleos van cinco en fila, a 24 px en columnas de 227:
     «Estudiar la adolescencia» y «Realizar los cambios» no entran en un
     renglón, y en dos cualquier corte deja una palabra sola. Dirección (CEO,
     30/9 13:05): el último renglón es una palabra larga, no una viuda de dos
     letras; a 24 px y cinco columnas es la mejor lectura. */
  ['#programa h3', 'adolescencia', 'cola del Núcleo 1, «Estudiar la adolescencia»: una palabra larga, aprobada en la auditoría del PR #35. A 1440, 390 y 375', 1],
  ['#programa h3', 'cambios', 'cola del Núcleo 5, «Realizar los cambios»: una palabra larga, aprobada en la auditoría del PR #35. A 1440', 1],
];

/**
 * Lo que el barrido encontró y **espera decisión de dirección**.
 *
 * Ninguna de estas filas es una aprobación. Cada una dice qué haría falta para
 * borrarla, y son tres cosas distintas:
 *
 *   · **un salto declarado que quedó de una palabra** — «Construyendo» y
 *     «Escríbeme.» son el primer renglón de un `<br>` que alguien escribió a
 *     propósito. Se arreglan cambiando dónde cae ese `<br>`, que es mover texto;
 *   · **una palabra larga que cae sola al final de un título que envuelve** —
 *     «desconocido?», «silencio.», «Comprender» (y «adolescencia» y «cambios» hasta la #20-bis, que los arregló con la grilla 3 + 2).
 *     Se arreglan acortando el texto, bajando el tamaño o ensanchando la
 *     columna, y las tres son decisiones de diseño;
 *   · **un título que no cabe de ninguna manera** — el cierre de `#reservar` mide
 *     **siete** renglones a 375 px, y `text-wrap: balance` de Chromium deja de
 *     trabajar arriba de seis: por eso los dos últimos quedan sueltos. Ése no se
 *     arregla repartiendo, se arregla con menos palabras o menos tamaño.
 */
export const PENDIENTES = [
  /* ── `/` (la portada) ─────────────────────────────────────────────────── */
  ['#programa h2', 'Construyendo', 'salto declarado: el `<br>` de `inicio.programa.titulo1/2` parte la marca en «Construyendo» / «Familias Fuertes.». A los cuatro anchos', 1],
  ['#contacto h2', 'Escríbeme.', 'salto declarado: el `<br>` de `inicio.contacto.titulo1/2`. A los cuatro anchos', 1],
  ['#contacto h2', 'y yo.', 'cola del envolvido de `inicio.contacto.titulo2` («Te responde mi equipo, y yo.») a 1440 y 390', 1],
  ['#libros h3', 'Construyendo', 'el título del libro «Construyendo Familias Fuertes» envuelve así a 390 y 375', 1],
  ['#libros h3', 'Padres', 'el título «Padres digitalmente responsables» entra en tres renglones de una palabra a 375', 1],
  ['#libros h3', 'digitalmente', 'el mismo título, renglón del medio, a 375', 1],
  ['#libros h3', 'responsables', 'el mismo título, cola, a 390 y 375', 1],
  /* ── `/merida` ─────────────────────────────────────────────────────────── */
  ['#suena h2', 'desconocido?', 'cola de «¿El niño dulce que criaste se volvió un desconocido?» a 1440, 390 y 375', 1],
  ['#preguntas h2', 'silencio.', 'cola de «Siete preguntas que te haces en silencio.» a 390 y 375', 1],
  ['#programa h3', 'Comprender', 'renglón del medio del Núcleo 3, «Comprender nuestra familia», a 1440 y 900', 1],
  ['#reservar h2', 'padres', 'el cierre («El amor incondicional no es la ausencia de límites…») mide siete renglones a 375, y `text-wrap: balance` de Chromium sólo trabaja hasta seis', 1],
  ['#reservar h2', 'conscientes.', 'el mismo cierre, último renglón, a 375', 1],
  /* ── `/matrimonios` (orden #38) ───────────────────────────────────────── */
  /* El hero: la orden pide «MATRIMONIO HERIDO» en su renglón y en naranja,
     «como ADOLESCENTE», y a 80 px las dos palabras no entran juntas en la
     columna del hero (que no se toca, #23). Quedan una por renglón, que es
     además la forma del póster. Se arregla aprobándolo como «ADOLESCENTE» o
     cambiando el tamaño del titular; las dos son de dirección. */
  ['#inicio h1', 'MATRIMONIO', '/matrimonios: «MATRIMONIO HERIDO» no entra en un renglón a 80 px; la forma de la orden y del póster. A los cuatro anchos', 1],
  ['#inicio h1', 'HERIDO', '/matrimonios: el mismo titular, segunda palabra. A los cuatro anchos', 1],
  /* Las fortalezas: la misma columna de 227 px a 24 px de los núcleos de
     `/merida` (que tienen dos aprobados y uno pendiente por lo mismo). */
  ['#programa h3', 'Desarmar', '/matrimonios: «Desarmar la energía destructiva» en tres renglones a 1440', 1],
  ['#programa h3', 'destructiva', '/matrimonios: la misma fortaleza, cola, a 1440', 1],
  ['#programa h3', 'profundas', '/matrimonios: cola de «Sanar heridas profundas» a 1440, 390 y 375', 1],
  ['#programa h3', 'Reactivar', '/matrimonios: «Reactivar lo positivo», primer renglón, a 1440', 1],
];

/** Las dos listas juntas es lo que el barrido aplica. */
export const EXCEPCIONES = [...APROBADAS, ...PENDIENTES];

/**
 * El barrido, que corre **dentro** del navegador.
 *
 * Devuelve cuántos títulos miró, los renglones huérfanos que encontró y cuántos
 * elementos excusó cada excepción — la misma forma de tres partes que
 * `check/acento.mjs`, para que las dos puertas la lean igual.
 */
export const RECOLECTAR = ({ excepciones, minimoCaracteres }) => {
  /** Las palabras de un elemento, agrupadas por el renglón donde cayeron. */
  const renglonesDe = (el) => {
    const caminante = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const cajas = [];
    let nodo;
    while ((nodo = caminante.nextNode())) {
      const texto = nodo.nodeValue ?? '';
      for (const m of texto.matchAll(/\S+/g)) {
        const r = document.createRange();
        r.setStart(nodo, m.index);
        r.setEnd(nodo, m.index + m[0].length);
        const caja = [...r.getClientRects()][0];
        if (!caja || (!caja.width && !caja.height)) continue;
        cajas.push({ top: caja.top, fondo: caja.bottom, medio: caja.top + caja.height / 2, x: caja.left, palabra: m[0] });
      }
    }

    /* Agrupadas por solape vertical y no por `top` idéntico: el porqué, con el
       falso positivo que lo obligó, está en la cabecera del archivo. Se recorre
       de arriba hacia abajo y una palabra entra al renglón abierto si su centro
       cae dentro de él o el centro del renglón cae dentro de ella — las dos
       direcciones, porque una palabra puede ser más alta que el resto. */
    cajas.sort((a, b) => a.top - b.top || a.x - b.x);
    const renglones = [];
    for (const c of cajas) {
      const actual = renglones[renglones.length - 1];
      const mismo = actual
        && ((c.medio >= actual.top && c.medio <= actual.fondo)
          || (actual.medio >= c.top && actual.medio <= c.fondo));
      if (mismo) {
        actual.palabras.push([c.x, c.palabra]);
        actual.top = Math.min(actual.top, c.top);
        actual.fondo = Math.max(actual.fondo, c.fondo);
        actual.medio = (actual.top + actual.fondo) / 2;
      } else {
        renglones.push({ top: c.top, fondo: c.fondo, medio: c.medio, palabras: [[c.x, c.palabra]] });
      }
    }
    return renglones.map(({ palabras }) => palabras.sort((a, b) => a[0] - b[0]).map(([, w]) => w));
  };

  /** Un nombre corto y estable para decir en el rojo de qué título se habla. */
  const nombrar = (el) => el.tagName.toLowerCase()
    + (typeof el.className === 'string' && el.className.trim()
      ? '.' + el.className.trim().split(/\s+/).filter((c) => c !== 'reveal' && c !== 'in').join('.')
      : '');

  const titulos = [...document.querySelectorAll('h1, h2, h3')];
  const hallazgos = [];
  /* Cuántos renglones excusó cada fila. Se cuenta por título + texto para que un
     mismo renglón medido dos veces no infle el número; el tope habla de
     renglones distintos, no de mediciones. */
  const excusados = new Map(excepciones.map((e) => [`${e[0]}|${e[1]}`, new Set()]));
  let mirados = 0;

  for (const el of titulos) {
    if (!el.getClientRects().length) continue;
    if (getComputedStyle(el).visibility === 'hidden') continue;
    mirados += 1;

    const renglones = renglonesDe(el);
    /* Un título de un renglón no está partido: la regla habla de cómo se parte.
       Ver el alcance escrito en la cabecera del archivo. */
    if (renglones.length < 2) continue;

    for (const [i, palabras] of renglones.entries()) {
      const texto = palabras.join(' ');
      const unaPalabra = palabras.length === 1;
      const cortito = texto.replace(/\s/g, '').length < minimoCaracteres;
      if (!unaPalabra && !cortito) continue;

      const fila = excepciones.find(([sel, esperado]) => texto === esperado && el.closest(sel));
      if (fila) {
        excusados.get(`${fila[0]}|${fila[1]}`).add(`${nombrar(el)}#${i}`);
        continue;
      }

      hallazgos.push({
        titulo: nombrar(el),
        renglon: i + 1,
        de: renglones.length,
        texto,
        porque: unaPalabra
          ? (cortito ? 'una sola palabra, y de menos de seis caracteres' : 'una sola palabra')
          : 'menos de seis caracteres',
        completo: renglones.map((p) => p.join(' ')).join(' / '),
      });
    }
  }

  return {
    mirados,
    hallazgos,
    excusados: Object.fromEntries([...excusados].map(([k, v]) => [k, v.size])),
  };
};

/** Cuántos caracteres tiene que tener un renglón para no ser huérfano. */
export const MINIMO_CARACTERES = 6;

/**
 * Las filas que **no excusaron nada en todo el barrido**: sobran.
 *
 * Es la otra mitad de una lista de excepciones, y la casa la aprendió por las
 * malas en `qa/skips-permitidos.md`: *un permiso que sobra es una mentira con
 * formato de tabla* — cada línea era cierta el día que se escribió. Acá importa
 * el doble, porque `PENDIENTES` es una lista de catorce cosas que dirección va a
 * ir resolviendo: el día que alguien acorte «Estudiar la adolescencia», la fila
 * de «adolescencia» queda describiendo un defecto que ya no existe, y nadie se
 * entera nunca.
 *
 * ── Y por qué esto corre por consola y NO en el spec ─────────────────────
 * Porque «sobra» solo se puede decir **después de mirar las cuatro rutas por los
 * cuatro anchos**: la fila de «silencio.» no excusa nada a 1440 y sí a 390, y la
 * de `#libros` no excusa nada en `/merida`. `e2e/renglones.spec.ts` tiene un test
 * por ruta, así que ninguno de los cuatro ve el barrido entero y cualquiera de
 * ellos declararía sobrantes las filas de las otras tres.
 *
 * Así que esta comprobación vive en `pnpm check:renglones`, que recorre todo de
 * una, y **está dicho acá que la gate no la corre**: un alcance que no está
 * escrito se lee como «todo». Es la herramienta que hay que correr al resolver un
 * pendiente, no un guardián de la deriva — de la deriva se ocupa el spec.
 */
export const SOBRAN = (excusadosTotales, excepciones = EXCEPCIONES) => excepciones
  .filter(([sel, texto]) => (excusadosTotales[`${sel}|${texto}`] ?? 0) === 0)
  .map(([sel, texto, motivo]) =>
    `la excepción «${sel}» → «${texto}» no excusó ningún renglón en todo el barrido: `
    + `o el defecto se arregló —y entonces la fila se borra— o el título cambió y la fila ya no lo `
    + `nombra. Decía: «${motivo}».`);

/**
 * Las excepciones que excusaron más renglones de los que tenían permitidos.
 *
 * Vive acá y no en cada puerta por lo de siempre: dos copias de la misma
 * comprobación son dos verdades que un día no coinciden.
 */
export const DE_MAS = (excusados, excepciones = EXCEPCIONES) => excepciones
  .filter(([sel, texto, , tope]) => (excusados[`${sel}|${texto}`] ?? 0) > tope)
  .map(([sel, texto, motivo, tope]) =>
    `la excepción «${sel}» → «${texto}» excusó ${excusados[`${sel}|${texto}`]} renglones y solo `
    + `puede excusar ${tope}: es una excepción (${motivo}), no una puerta.`);

/** Cómo se lee un hallazgo, igual en la consola y en el test. */
export const CONTAR = (ruta, ancho, h) =>
  `${ruta} @${ancho}px · ${h.titulo} · renglón ${h.renglon} de ${h.de}: «${h.texto}» — ${h.porque}`
  + ` · el título entero: «${h.completo}»`;

/**
 * Sin transiciones, por CSSOM y no con un `<style>`: desde la #10 el servidor de
 * QA sirve la CSP de verdad y `style-src 'self'` bloquea una hoja en línea. Es la
 * misma función que `acento.mjs` necesita, por el mismo motivo.
 */
const SIN_MOVIMIENTO = '*,*::before,*::after{transition:none!important;animation:none!important}';

export const QUIETAR = (p) => p.evaluate((css) => {
  const hoja = new CSSStyleSheet();
  hoja.replaceSync(css);
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, hoja];
}, SIN_MOVIMIENTO);

/** Deja la página quieta, revelada y con la tipografía puesta antes de medir. */
export const PREPARAR = async (p, url) => {
  await p.goto(url, { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  await QUIETAR(p);
  /* Los bloques con `.reveal` arrancan en `opacity:0` y **igual tienen caja**,
     así que medirían bien; se revelan de todos modos porque un título dentro de
     un bloque que nunca se revela es un título que nadie va a ver mal. */
  await p.evaluate(() => document.querySelectorAll('.reveal').forEach((e) => e.classList.add('in')));
  await p.waitForTimeout(150);
};

async function porConsola() {
  const navegador = await chromium.launch();
  let fallo = false;
  let total = 0;
  /* Lo que cada excepción excusó **en todo el barrido**, para poder decir al
     final cuáles sobran. Ver `SOBRAN()`. */
  const excusadosTotales = {};

  for (const [nombre, ruta] of RUTAS) {
    for (const ancho of ANCHOS) {
      const p = await navegador.newPage({
        viewport: { width: ancho, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce',
      });
      await PREPARAR(p, BASE + ruta);

      const { mirados, hallazgos, excusados } = await p.evaluate(RECOLECTAR, {
        excepciones: EXCEPCIONES, minimoCaracteres: MINIMO_CARACTERES,
      });
      total += mirados;
      for (const [k, n] of Object.entries(excusados)) {
        excusadosTotales[k] = (excusadosTotales[k] ?? 0) + n;
      }

      /* EL PISO, ANTES DEL CERO. */
      if (mirados < PISO[nombre]) {
        console.error(`✗ ${nombre} @${ancho}px: el barrido miró ${mirados} títulos y su piso es `
          + `${PISO[nombre]}. Un «cero huérfanos» sobre casi nada no afirma nada: o la página no `
          + 'cargó, o el selector se rompió y esto está mirando la nada.');
        fallo = true;
      }

      const deMas = DE_MAS(excusados);
      if (deMas.length) {
        fallo = true;
        console.log(`✗ ${nombre} @${ancho}px · una excepción declarada se usó de más`);
        for (const d of deMas) console.log(`    ${d}`);
      }

      if (hallazgos.length) {
        fallo = true;
        console.log(`✗ ${nombre} @${ancho}px · ${mirados} títulos · ${hallazgos.length} renglón(es) huérfano(s)`);
        for (const h of hallazgos) console.log(`    ${CONTAR(nombre, ancho, h)}`);
      } else {
        console.log(`✓ ${nombre} @${ancho}px · ${mirados} títulos · ningún renglón huérfano`);
      }
      await p.close();
    }
  }
  await navegador.close();

  console.log(`\n${total} títulos medidos en ${RUTAS.length} rutas por ${ANCHOS.length} anchos. `
    + `Un renglón es huérfano si tiene una sola palabra o menos de ${MINIMO_CARACTERES} caracteres.`);
  console.log(`${APROBADAS.length} excepción(es) aprobada(s) por dirección y ${PENDIENTES.length} `
    + 'pendiente(s) de su decisión — ver `docs/tareas.md`.');

  /* Y las que sobran, que solo se pueden ver desde acá: el spec mira una ruta por
     test y ninguno ve el barrido entero. */
  const sobran = SOBRAN(excusadosTotales);
  if (sobran.length) {
    fallo = true;
    console.log(`\n✗ ${sobran.length} excepción(es) que sobran`);
    for (const x of sobran) console.log(`    ${x}`);
  }

  if (fallo) {
    console.error('\nNingún título termina ni se parte en un renglón de una palabra. Lo de arriba sí: '
      + 'se acomoda con el ancho de la columna, con `text-wrap: balance` o con un salto declarado — '
      + 'y si hay que cambiar un texto, lo decide dirección.\n');
    process.exit(1);
  }
  console.log('Ningún título se parte en un renglón huérfano, a ninguno de los cuatro anchos.\n');
}

if (process.argv[1] && process.argv[1].endsWith('renglones.mjs')) await porConsola();
