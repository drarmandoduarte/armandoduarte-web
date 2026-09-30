#!/usr/bin/env node
/**
 * El barrido de alturas — orden Códice #20, A.
 *
 * ── La regla que vigila ────────────────────────────────────────────────────
 * **Ninguna sección es más alta que la pantalla.** Lo pidió dirección el 29/9
 * mirando producción a 1920: «todas las secciones nunca pueden ser más grandes
 * que 100vh teniendo en cuenta el borde del navegador». El borde del navegador
 * es la parte que importa: lo que se mide es `innerHeight` —lo que el navegador
 * deja ver, ya descontadas la barra de direcciones y la de pestañas—, no la
 * altura del monitor. En CSS eso es `100dvh`, con `100vh` de respaldo para los
 * navegadores que no lo tengan.
 *
 * ── Dónde aplica, y dónde NO ──────────────────────────────────────────────
 * **Solo a escritorio: 1440×900 y 1920×1080.** El que manda es el de 900 de
 * alto, que es el más chico de los dos. A 900 px de ancho y a 375 la regla no
 * aplica y no es un olvido: una lista de siete preguntas no entra en un
 * teléfono, y exigirlo sería pedir que el contenido desaparezca. Está escrito acá
 * y no en la cabeza de nadie.
 *
 * Mide **cada `<section>` con `id`** de la portada y de `/merida`, más el
 * `<footer>`. Sin `id` no se mide, y eso también es deliberado: una sección sin
 * `id` no es una parada de la página, es un envoltorio.
 *
 * ── Por qué mide la caja dibujada y no el CSS ────────────────────────────
 * Porque lo que se rompe no es el `min-height` que alguien escribió: es lo que
 * sale de sumar paddings, títulos con la tipografía cargada, grillas que
 * envuelven y fotos con su `aspect-ratio`. Nada de eso se lee en la hoja. Se
 * navega, se esperan las fuentes y las imágenes, y se pide
 * `getBoundingClientRect().height`.
 *
 *     node check/altura.mjs http://127.0.0.1:4180
 *     node check/altura.mjs http://127.0.0.1:4180 --tabla   (mide y no juzga)
 *
 * `--tabla` es lo que pide el punto A.5 de la orden: **primero se mide, después
 * se achica**. Imprime sección × viewport × altura × sobra sin fallar, que es lo
 * que va al informe antes de tocar una línea de CSS.
 *
 * ── Dos puertas, un barrido ──────────────────────────────────────────────
 * La otra es `e2e/altura.spec.ts`, que importa de acá las constantes y la
 * función. Dos copias de la lista de excepciones serían dos verdades que un día
 * no coinciden: el modo de falla que la #06 pagó con el token duplicado.
 */
import { chromium } from '@playwright/test';
import { QUIETAR } from './renglones.mjs';

const BASE = process.argv[2] || 'http://127.0.0.1:4180';
const SOLO_TABLA = process.argv.includes('--tabla');

/** Las dos páginas que tienen secciones. Las legales son texto corrido. */
export const RUTAS = [
  ['inicio', '/'],
  ['merida', '/merida'],
];

/**
 * Los dos viewports de escritorio, **con su alto**, que es lo que acá se mide.
 *
 * 1440×900 es el portátil de referencia de la casa y el más chico de alto: es el
 * que manda. 1920×1080 es donde dirección encontró el defecto.
 */
export const VIEWPORTS = [
  { ancho: 1440, alto: 900 },
  { ancho: 1920, alto: 1080 },
];

/**
 * El piso de secciones por ruta, **medido** el 29/9 y no estimado. `/merida`
 * pasó de 9 a 10 en la #20-bis, cuando «Lo que te llevas» salió de `#programa`
 * a su propia sección `#llevas`.
 *
 * «Ninguna sección sobra» sobre un barrido que no encontró ninguna sección se
 * escribe igual que sobre una página en orden. Es la regla de la casa sobre las
 * aserciones de cero: al lado del cero va cuántas secciones se miraron.
 */
export const PISO = { inicio: 8, merida: 10 };

/**
 * ── Las excepciones, en dos listas que NO significan lo mismo ─────────────
 *
 * El formato es `[ruta, id de la sección, motivo, cuántos px puede sobrar]`.
 *
 * El tope va en **píxeles y no en un booleano**, que es la lección de la #12: una
 * excepción sin número no es una excepción, es una puerta. Una sección excusada
 * que crezca otros 300 px vuelve a caer, y eso es lo que hace que la fila siga
 * significando algo el mes que viene.
 *
 * **Están separadas en dos listas a propósito**, igual que en
 * `check/renglones.mjs`: una lista sola se lee como «tres secciones aprobadas» y
 * no lo son. `APROBADAS` es lo que dirección decidió. `PENDIENTES` es lo que el
 * barrido midió y **no se puede arreglar con los tres resortes de la orden**
 * —paddings, `gap`, tamaño de título—, porque en las tres el que manda es otra
 * cosa. La orden #20 (A.5) es explícita: eso no lo decide Rodolfo. Están acá
 * para que la gate quede verde sin dejar de ver el defecto, y cada fila se borra
 * el día que dirección resuelve la suya. Los números y las opciones, en
 * `docs/informes/20/`.
 */
export const APROBADAS = [];

/**
 * Lo que sobra y **espera decisión de dirección**.
 *
 * Ninguna de estas filas es una aprobación. La #20-bis aplicó las tres
 * decisiones de dirección (A.5) y **midió después**, y lo que quedó es esto:
 *
 *   · **`#quien` — manda el texto, no la foto.** El informe del #30 decía que
 *     mandaba la foto y se equivocaba: la columna de texto mide 944 px más los
 *     90 del padding, y eso da 1034 con la foto a 520 **o** a 470. La foto a 470
 *     se aplicó porque es lo decidido, pero no compra ningún píxel. Achicar los
 *     `margin` entre bloques (40 → 28, 28 → 20) la deja en 994: tampoco entra;
 *   · **`#facilitador` — lo mismo, por 6 px.** Con la foto a 472 bajó de 911 a
 *     906, no a 897: acá también manda el texto (816 px). `margin-top` de la
 *     ficha 40 → 32 la deja en 898;
 *   · **`#llevas` — la sección nueva.** Sola mide 1023 a 1440×900 y 1085 a
 *     1920×1080: la manda la foto 4:5 de cada columna (405×507). En 5:4 la
 *     sección queda en 841; en 1:1, en 922 (no entra).
 *
 * `#programa` salió de la lista: con los núcleos en 3 + 2 mide 844.
 */
export const PENDIENTES = [
  ['inicio', 'quien', 'manda la columna de texto (944 + 90 de padding = 1034), no la foto: a 520 o a 470 mide lo mismo. A 1920×1080 entra (−28)', 134],
  ['merida', 'facilitador', 'manda la columna de texto (816 + 90 = 906); la foto a 472 compró 5 px de los 11. `margin-top` de la ficha 40 → 32 la deja en 898. A 1920×1080 entra (−156)', 6],
  ['merida', 'llevas', 'la foto 4:5 de cada columna (405×507) mide 1023 a 1440×900 y 1085 (+5) a 1920×1080. Fotos en 5:4: 841', 123],
];

/** Las dos listas juntas es lo que el barrido aplica. */
export const EXCEPCIONES = [...APROBADAS, ...PENDIENTES];

/**
 * El barrido, que corre **dentro** del navegador.
 *
 * Devuelve cuántas secciones miró y la altura de cada una, con su sobra. Juzgar
 * es de afuera: acá solo se mide, porque la misma medición sirve para la tabla
 * del informe y para la gate.
 */
export const RECOLECTAR = () => {
  const alto = window.innerHeight;
  const piezas = [
    ...document.querySelectorAll('section[id]'),
    ...document.querySelectorAll('footer'),
  ];

  const medidas = [];
  for (const el of piezas) {
    const caja = el.getBoundingClientRect();
    /* Lo que no se ve no se mide: el overlay del menú es `visibility:hidden` y
       su caja existe igual. Sin esto el barrido denunciaría una sección que
       nadie ve. */
    const estilo = getComputedStyle(el);
    if (estilo.visibility === 'hidden' || estilo.display === 'none') continue;

    medidas.push({
      id: el.id || el.tagName.toLowerCase(),
      alto: Math.round(caja.height),
      sobra: Math.round(caja.height - alto),
    });
  }

  return { alto, mirados: medidas.length, medidas };
};

/**
 * Lo que hay que esperar antes de medir.
 *
 * `QUIETAR` y el revelado se importan de `check/renglones.mjs` en vez de
 * copiarse: es la misma preparación, y dos copias de «cómo se deja quieta esta
 * página» son dos verdades que un día miden distinto.
 *
 * Lo que acá se agrega es **bajar la página entera y volver**: las fotos con
 * `loading="lazy"` no reservan su alto hasta que entran en pantalla, y una
 * sección con una foto sin cargar mide de menos. Ese verde sería una mentira
 * sobre justamente lo que este barrido existe para medir.
 */
export const PREPARAR = async (page, url) => {
  await page.goto(url, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await QUIETAR(page);
  await page.evaluate(() => document.querySelectorAll('.reveal').forEach((e) => e.classList.add('in')));

  await page.evaluate(async () => {
    const paso = window.innerHeight;
    for (let y = 0; y < document.body.scrollHeight; y += paso) {
      window.scrollTo(0, y);
      await new Promise((r) => requestAnimationFrame(r));
    }
    window.scrollTo(0, 0);
  });
  /* ── Y se espera a la imagen que **puede mover el alto**, nada más ───────
     Una imagen con `width` y `height` declarados ya tiene su caja reservada
     antes de bajar: su alto es el mismo cargada que pendiente, y eso es
     precisamente lo que esos dos atributos existen para garantizar (es la regla
     de CLS que las órdenes #12 y #16 dejaron escrita). Así que esperarla no
     cambia ni un píxel de lo que este barrido mide.

     La que sí hay que esperar es la que **no** declara su caja: ahí el navegador
     no sabe cuánto reservar y la sección crece cuando la foto llega. Por eso la
     condición no es «todas cargadas» sino «ninguna sin caja pendiente».

     ── Y por qué no era un detalle de eficiencia ───────────────────────────
     El sello CFF de `#programa` es `loading="lazy"` y **nunca se carga** en este
     barrido: medido, sigue con `naturalWidth: 0` tres segundos después de haber
     pasado por pantalla. Esperarlo costaba el tope completo en cada corrida —3,0
     s por viewport, 6,7 s por archivo— y en la gate entera el guardián se pasaba
     de los 30 s de Playwright y **moría por timeout**, que es la peor forma de
     fallar: no habla del sitio, habla del reloj. Declara `width` y `height`, así
     que su hueco ya está reservado y no hay nada que esperar.

     El tope queda igual, por lo de siempre: una imagen que no llega no puede
     colgar el barrido. Un guardián que se cuelga es peor que uno que falla. */
  await page.waitForFunction(
    () => [...document.images].every((i) => i.complete
      || !i.checkVisibility({ checkVisibilityCSS: true })
      || (i.getAttribute('width') && i.getAttribute('height'))),
    undefined,
    { timeout: 1500 },
  ).catch(() => {});

  await page.waitForTimeout(150);
};

/** Cuánto puede sobrarle a esta sección según las excepciones. */
export const TOPE_DE = (ruta, id) => {
  const fila = EXCEPCIONES.find((e) => e[0] === ruta && e[1] === id);
  return fila ? fila[3] : 0;
};

/** El renglón de un hallazgo, con todo lo que hace falta para ir a arreglarlo. */
export const CONTAR = (ruta, ancho, alto, m) =>
  `${ruta} @${ancho}×${alto} · #${m.id} mide ${m.alto}px y la pantalla ${alto}px: sobran ${m.sobra}px`;

/* ── La puerta de consola ─────────────────────────────────────────────────── */

/* `endsWith` y no `import.meta.url === file://…`: la carpeta del proyecto lleva
   espacios y un punto, y la URL viene percent-encoded. La comparación directa da
   siempre falso y el barrido se calla — que es exactamente el silencio que esta
   casa persigue. Es la misma forma que usan `acento.mjs` y `renglones.mjs`. */
if (process.argv[1] && process.argv[1].endsWith('altura.mjs')) {
  const navegador = await chromium.launch();
  const page = await navegador.newPage();
  const problemas = [];
  const excusadas = new Set();
  let mirados = 0;

  for (const [nombre, ruta] of RUTAS) {
    await PREPARAR(page, `${BASE}${ruta}`);
    for (const { ancho, alto } of VIEWPORTS) {
      await page.setViewportSize({ width: ancho, height: alto });
      await PREPARAR(page, `${BASE}${ruta}`);
      const r = await page.evaluate(RECOLECTAR);
      mirados += r.mirados;

      if (SOLO_TABLA) {
        console.log(`\n── ${nombre} @${ancho}×${alto} (innerHeight ${r.alto}) ──`);
        for (const m of r.medidas) {
          const marca = m.sobra > 0 ? '  ✗' : '  ·';
          console.log(`${marca} ${m.id.padEnd(14)} ${String(m.alto).padStart(5)}px  sobra ${String(m.sobra).padStart(5)}px`);
        }
        continue;
      }

      if (r.mirados < PISO[nombre]) {
        problemas.push(`${nombre} @${ancho}×${alto} · PISO: miró ${r.mirados} secciones y el piso es `
          + `${PISO[nombre]} — o la página no cargó, o el selector se rompió`);
      }
      for (const m of r.medidas) {
        const tope = TOPE_DE(nombre, m.id);
        if (m.sobra > tope) problemas.push(CONTAR(nombre, ancho, r.alto, m));
        else if (m.sobra > 0) excusadas.add(`${nombre}#${m.id}`);
      }
    }
  }

  await navegador.close();

  if (SOLO_TABLA) {
    console.log('\ncheck-altura: tabla impresa, nada juzgado (--tabla).');
    process.exit(0);
  }
  if (problemas.length) {
    console.error(`\n✗ check-altura: ${problemas.length} sección(es) más altas que la pantalla.\n`);
    for (const p of problemas) console.error(`  · ${p}`);
    console.error('\nSe achica en este orden y sin sacar contenido: paddings verticales, `gap` de');
    console.error('grillas, tamaño de título dentro de la sección que sobra. Si no entra, se');
    console.error('declara cuánto sobra y lo decide dirección (orden #20, A.5).\n');
    process.exit(1);
  }
  /* El verde dice **también** lo que excusó. Un «ninguna más alta que la
     pantalla» sobre tres secciones que sí lo son es una mentira con cara de
     verde, y esta casa ya sabe cómo termina eso. */
  const cola = excusadas.size
    ? ` · ${excusadas.size} excusada(s) esperando decisión de dirección: ${[...excusadas].join(', ')}`
    : '';
  console.log(`✓ check-altura: ${mirados} secciones medidas en ${RUTAS.length} rutas × ${VIEWPORTS.length} viewports, `
    + `ninguna más alta que la pantalla salvo las declaradas${cola}.`);
}
