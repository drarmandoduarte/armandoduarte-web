#!/usr/bin/env node
/**
 * El barrido de alturas — orden Códice #20, A.
 *
 * ── La regla que vigila, desde la #23 ────────────────────────────────────
 * Dos afirmaciones, y ninguna es «toda sección cabe en la pantalla»:
 *
 *   1. **Los héroes miden exactamente la pantalla** (`section.hero`, con ±1 px
 *      de redondeo). Es lo que dirección pidió en la #20 mirando producción a
 *      1920 —«en el hero hay dos colores por la sección que le sigue»— y eso no
 *      cambió.
 *   2. **Ninguna otra sección pasa de 1,6 pantallas.** Es un tope contra lo
 *      desproporcionado, no contra el aire.
 *
 * La regla de la #20 A decía «ninguna sección más alta que la pantalla» y bajó
 * el aire de todas a `clamp(40px,5vh,64px)` para cumplirla: todo se veía
 * apretado. Dirección la acotó en la #23 con 512 como vara —160 px arriba y
 * abajo, y «Cuatro etapas» mide 976 en una pantalla de 900—. Desde entonces las
 * secciones llevan su aire y **ninguna se aprieta para caber**.
 *
 * ── Dónde aplica, y dónde NO ──────────────────────────────────────────────
 * **Solo a escritorio: 1440×900 y 1920×1080.** Abajo de 900 de ancho el hero
 * apila y no mide la pantalla, y una sección de teléfono es más alta que la
 * pantalla por naturaleza.
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
 * `--tabla` imprime sección × viewport × altura sin fallar, que es lo que va al
 * informe.
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
 * a su propia sección `#llevas`, y a 11 en la #23 con la banda `#hechos`.
 *
 * «Ninguna sección sobra» sobre un barrido que no encontró ninguna sección se
 * escribe igual que sobre una página en orden. Es la regla de la casa sobre las
 * aserciones de cero: al lado del cero va cuántas secciones se miraron.
 */
export const PISO = { inicio: 8, merida: 11 };

/** El tope de una sección que no es hero, en pantallas (#23). */
export const TOPE_PANTALLAS = 1.6;

/**
 * Las excepciones, con su número: `[ruta, id, motivo, px por encima del tope]`.
 *
 * **Vacía desde la #23.** La única fila que había, `#quien` (1034 contra 900),
 * era una excepción a la regla vieja; con el tope de 1,6 pantallas mide 1160
 * contra 1440 y no excusa nada. La lista se queda, vacía, porque el día que una
 * sección pase el tope la salida no es subir el tope: es declararla acá, con su
 * número, y que decida dirección.
 */
export const PENDIENTES = [];

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
      hero: el.classList.contains('hero'),
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

/**
 * El juicio, compartido por la consola y la gate: devuelve los hallazgos de
 * una medición. Un hero que no mide la pantalla, o una sección que pasa de
 * `TOPE_PANTALLAS` más lo que su fila de `PENDIENTES` excuse.
 *
 * EL PISO, ANTES DE LAS AFIRMACIONES: «ningún hallazgo» sobre un barrido que no
 * encontró secciones se lee igual que sobre una página en orden. Y la página
 * tiene que tener **un** hero: sin él, la afirmación 1 se cumple sola.
 */
export const JUZGAR = (ruta, ancho, r) => {
  const hallazgos = [];
  const donde = `${ruta} @${ancho}×${r.alto}`;
  if (r.mirados < PISO[ruta]) {
    hallazgos.push(`${donde} · PISO: miró ${r.mirados} secciones y el piso es ${PISO[ruta]} — `
      + 'o la página no cargó, o el selector se rompió');
  }
  const heroes = r.medidas.filter((m) => m.hero);
  if (heroes.length !== 1) hallazgos.push(`${donde} · PISO: encontró ${heroes.length} héroes y tiene que haber uno`);

  const tope = Math.round(r.alto * TOPE_PANTALLAS);
  for (const m of r.medidas) {
    if (m.hero) {
      if (Math.abs(m.sobra) > 1) {
        hallazgos.push(`${donde} · el hero #${m.id} mide ${m.alto}px y la pantalla ${r.alto}px: `
          + 'tiene que medirla exactamente');
      }
      continue;
    }
    const fila = PENDIENTES.find((e) => e[0] === ruta && e[1] === m.id);
    if (m.alto > tope + (fila ? fila[3] : 0)) {
      hallazgos.push(`${donde} · #${m.id} mide ${m.alto}px: pasa el tope de ${TOPE_PANTALLAS} pantallas (${tope}px)`);
    }
  }
  return hallazgos;
};

/* ── La puerta de consola ─────────────────────────────────────────────────── */

/* `endsWith` y no `import.meta.url === file://…`: la carpeta del proyecto lleva
   espacios y un punto, y la URL viene percent-encoded. La comparación directa da
   siempre falso y el barrido se calla — que es exactamente el silencio que esta
   casa persigue. Es la misma forma que usan `acento.mjs` y `renglones.mjs`. */
if (process.argv[1] && process.argv[1].endsWith('altura.mjs')) {
  const navegador = await chromium.launch();
  const page = await navegador.newPage();
  const problemas = [];
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
          const mal = m.hero ? Math.abs(m.sobra) > 1 : m.alto > r.alto * TOPE_PANTALLAS;
          const pantallas = (m.alto / r.alto).toFixed(2);
          console.log(`${mal ? '  ✗' : '  ·'} ${m.id.padEnd(14)} ${String(m.alto).padStart(5)}px  ${pantallas} pantallas${m.hero ? '  (hero)' : ''}`);
        }
        continue;
      }

      problemas.push(...JUZGAR(nombre, ancho, r));
    }
  }

  await navegador.close();

  if (SOLO_TABLA) {
    console.log('\ncheck-altura: tabla impresa, nada juzgado (--tabla).');
    process.exit(0);
  }
  if (problemas.length) {
    console.error(`\n✗ check-altura: ${problemas.length} hallazgo(s).\n`);
    for (const p of problemas) console.error(`  · ${p}`);
    console.error('\nUn hero mide la pantalla, exactamente. Una sección que pasa el tope no se');
    console.error('aprieta: se declara en `PENDIENTES` con su número y lo decide dirección (#23).\n');
    process.exit(1);
  }
  console.log(`✓ check-altura: ${mirados} secciones medidas en ${RUTAS.length} rutas × ${VIEWPORTS.length} viewports: `
    + `los héroes miden la pantalla y ninguna sección pasa de ${TOPE_PANTALLAS} pantallas.`);
}
