#!/usr/bin/env node
/**
 * El barrido de contraste — orden Códice #03, A.
 *
 * ── Por qué existe, y por qué no alcanzaba con Lighthouse ────────────────
 * Lighthouse dice **que** algo falla y nombra unos pocos ejemplos; no dice
 * cuántos pares distintos hay ni cuál es el peor, y solo mira lo que está
 * visible en el momento en que corre —así que el menú de pantalla completa, que
 * arranca oculto, no lo ve nunca—. Para decidir «el cambio más chico de valor
 * que llegue al umbral» hace falta la lista entera con sus números.
 *
 * Este archivo la produce: recorre las cuatro páginas a 1440 y a 390, con el
 * menú cerrado y abierto, y de cada elemento que contiene texto saca el color
 * efectivo, el fondo efectivo, el tamaño, el peso, el umbral que le corresponde
 * (4,5:1 normal · 3:1 para ≥ 24 px o ≥ 18,7 px en negrita) y el cociente.
 *
 *     node check/contraste.mjs http://127.0.0.1:4180 /tmp/pares.json
 *
 * ── Las dos cosas que hay que hacer bien, y que costaron dos corridas ─────
 * **Los colores se resuelven con un lienzo, no con una expresión regular.**
 * `getComputedStyle` devuelve `color-mix()` y `oklab()` tal cual —el overlay del
 * menú y los dos fondos «suaves» los usan—, y leer esas cadenas con
 * `match(/[\d.]+/g)` da números de otra escala: la primera corrida informó un
 * fondo casi negro que no existe en la paleta. Pintando el color sobre negro y
 * sobre blanco se despejan el color y el alfa exactos, sea cual sea la sintaxis.
 *
 * **Las transiciones se apagan antes de medir.** La primera corrida informó 207
 * pares en rojo, casi todos con alfas de 0,05 y 0,3: eran los bloques a mitad
 * del fundido de entrada. Un estado de 600 ms no es un par de color del diseño.
 *
 * ── El texto sobre fotografía, desde la #05 ──────────────────────────────
 * La #03 declaró que este barrido **no** miraba texto sobre fotos, «porque en
 * esta web no hay texto encima de ninguna foto». La #05 puso una: la sección
 * «¿El niño dulce que criaste…?» lleva una fotografía de fondo bajo un velo. O
 * sea que aquella frase dejó de ser cierta, y un alcance que deja de ser cierto
 * no se corrige borrándolo: se amplía el barrido.
 *
 * Contra qué se mide ahora: **el píxel de verdad**. `backgroundColor` de un
 * elemento sobre una foto devuelve `rgba(0,0,0,0)` y el barrido subía por los
 * padres hasta encontrar un color — el de la sección— e informaba un contraste
 * que no existe, porque entre ese color y el texto hay una foto. Así que además
 * del fondo declarado se mide el fondo **dibujado**:
 *
 *   1 · se vuelve todo el texto transparente y se saca una captura de página
 *       completa: eso es el lienzo sin letras, o sea exactamente lo que queda
 *       detrás de cada palabra;
 *   2 · esa captura vuelve a entrar a la página como imagen y se promedia el
 *       rectángulo de cada elemento con texto.
 *
 * El promedio es lo que pide la orden y es lo que se usa para el umbral. Al lado
 * va el **percentil 5** de luminancia del mismo rectángulo, que es el trozo más
 * oscuro: un promedio que pasa con un rincón oscuro adentro sigue teniendo un
 * rincón donde la palabra no se lee, y esconderlo detrás de la media sería
 * fabricar un verde. Los dos números salen en la tabla.
 *
 * ── Por qué las hojas van por CSSOM y no con `addStyleTag` (orden #12) ───
 * Porque desde la #10 el servidor de QA sirve la CSP de verdad, y
 * `style-src 'self'` **bloquea una hoja en línea**. Este barrido la usaba en dos
 * lugares y los dos fallaban de maneras distintas:
 *
 *   · `addStyleTag` —el que apaga las transiciones— tira una excepción y el
 *     barrido no arranca. Eso al menos se ve: es lo que pasó al correrlo en la
 *     #12, y es la razón por la que este arreglo entró acá.
 *   · la captura volvía a la página como `data:image/png;base64,…` y
 *     `img-src 'self'` **no admite `data:`**, así que el `decode()` tiraba
 *     «The source image cannot be decoded». Ahora los bytes entran como `Blob`
 *     y se decodifican con `createImageBitmap`, que no pide ninguna URL y por lo
 *     tanto no pasa por ninguna directiva de la política. La política no se
 *     ablanda para que pase una herramienta nuestra — esa es la regla de la #10.
 *   · el `<style id="sin-letras">` de `medirElLienzo` **falla en silencio**. El
 *     elemento entra al DOM, la política le prohíbe aplicar, y la captura sale
 *     *con las letras puestas*. O sea que el «fondo dibujado» de cada elemento
 *     habría sido el promedio de sus propias letras y el guardián habría
 *     informado un contraste inventado, en verde. Nadie lo habría notado: el
 *     número existe y es plausible.
 *
 * Una hoja construida con `CSSStyleSheet` + `replaceSync` es CSSOM puro —no hay
 * markup que analizar— y la CSP no la gobierna. Es el mismo arreglo que
 * `check/acento.mjs` ya tenía escrito desde la #10; este archivo se quedó atrás
 * porque nadie lo corrió entre aquella orden y ésta. **Y el silencioso lleva
 * ahora su propio piso**: antes de sacar la captura se comprueba que el texto se
 * haya vuelto transparente de verdad, y si no, el barrido se cae diciéndolo.
 *
 * ── Lo que este barrido NO mira, dicho ───────────────────────────────────
 * Los estados `:hover` y `:focus` y los pseudo-elementos. Lo primero porque no
 * hay hover en un teléfono y la hoja no cambia de color al enfocar; lo segundo
 * porque `::before` y `::after` de esta hoja no llevan texto. Si algo de eso
 * cambia, este barrido deja de ser completo y hay que ampliarlo — por eso está
 * escrito.
 */
import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';

const BASE = process.argv[2] || 'http://127.0.0.1:4180';
const SALIDA = process.argv[3] || '/tmp/pares.json';
const PAGINAS = [['inicio','/'],['taller','/merida'],['privacidad','/privacidad'],['terminos','/terminos']];
/* La orden #19 (E) pide las tres de su sección A —1440, 900 y 375— y la casa
   venía midiendo a 390. Se suman, no se cambian: 390 es el ancho con el que se
   midieron todas las órdenes anteriores y quitarlo dejaría sin vigilar lo que
   esas mediciones afirmaron. */
const ANCHOS = [1440, 900, 390, 375];

const RECOLECTAR = () => {
  /* Los colores se resuelven con un lienzo y no con una expresión regular.
     `getComputedStyle` devuelve `color-mix()` y `oklab()` tal cual —el overlay del
     menú y los dos fondos «suaves» los usan—, y leerlos con un `match(/[\d.]+/g)`
     da números de otra escala: la primera versión de este barrido informó un
     fondo casi negro que no existe en la paleta. Pintando sobre negro y sobre
     blanco se despeja el color y el alfa exactos, sea cual sea la sintaxis. */
  const lienzo = document.createElement('canvas');
  lienzo.width = lienzo.height = 1;
  const cx = lienzo.getContext('2d', { willReadFrequently: true });
  const aRgba = (str) => {
    cx.fillStyle = 'rgb(0,0,0)'; cx.fillRect(0, 0, 1, 1);
    cx.fillStyle = str;    cx.fillRect(0, 0, 1, 1);
    const n = cx.getImageData(0, 0, 1, 1).data;
    cx.fillStyle = 'rgb(255,255,255)'; cx.fillRect(0, 0, 1, 1);
    cx.fillStyle = str;    cx.fillRect(0, 0, 1, 1);
    const b = cx.getImageData(0, 0, 1, 1).data;
    const a = Math.max(0, Math.min(1, 1 - (b[0] - n[0]) / 255));
    const c = a === 0 ? [0, 0, 0] : [0, 1, 2].map((i) => Math.min(255, Math.round(n[i] / a)));
    return [...c, a];
  };

  const sobre = (fg, bg) => [0, 1, 2].map((i) => Math.round(fg[i] * fg[3] + bg[i] * (1 - fg[3])));
  const lum = ([r, g, b]) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const ratio = (a, b) => {
    const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
    return (l1 + 0.05) / (l2 + 0.05);
  };
  const hex = ([r, g, b]) => '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();

  const fondoDe = (el) => {
    const capas = [];
    for (let n = el; n; n = n.parentElement) {
      const c = aRgba(getComputedStyle(n).backgroundColor);
      if (c[3] === 0) continue;
      capas.push(c);
      if (c[3] >= 0.999) break;
    }
    let bg = [255, 255, 255];
    while (capas.length) bg = sobre(capas.pop(), bg);
    return bg;
  };

  const opacidadDe = (el) => {
    let o = 1;
    for (let n = el; n; n = n.parentElement) o *= Number(getComputedStyle(n).opacity);
    return o;
  };

  const salida = [];
  for (const el of document.querySelectorAll('body *')) {
    const texto = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim();
    if (!texto) continue;
    if (!el.getClientRects().length) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden') continue;
    const bg = fondoDe(el);
    const fg = aRgba(cs.color);
    const alfa = fg[3] * opacidadDe(el);
    if (alfa < 0.999 && alfa > 0.99) continue;
    const fgEf = sobre([fg[0], fg[1], fg[2], alfa], bg);
    const px = parseFloat(cs.fontSize);
    const peso = Number(cs.fontWeight);
    const grande = px >= 24 || (px >= 18.66 && peso >= 700);
    const r = el.getBoundingClientRect();
    salida.push({
      fg: hex(fgEf), bg: hex(bg), px: Math.round(px * 10) / 10, peso,
      alfa: Math.round(alfa * 100) / 100,
      umbral: grande ? 3 : 4.5,
      ratio: Math.round(ratio(fgEf, bg) * 100) / 100,
      /* El rectángulo en coordenadas del documento, para poder promediar el
         lienzo de abajo. `scrollX/Y` porque la captura es de página completa. */
      caja: { x: r.x + scrollX, y: r.y + scrollY, w: r.width, h: r.height },
      /* Si algún ancestro tiene imagen de fondo o hay un `.fondo-foto` detrás,
         el `bg` de arriba es una suposición y hay que medir el píxel. */
      sobreFoto: !!el.closest('.con-fondo'),
      donde: el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className.trim()
        ? '.' + el.className.trim().split(/\s+/).filter((c) => c !== 'reveal' && c !== 'in').join('.') : ''),
      texto: texto.replace(/\s+/g, ' ').slice(0, 34),
    });
  }
  return salida;
};

/**
 * Mide el fondo **dibujado** detrás de cada elemento que está sobre una foto.
 *
 * Se vuelve todo el texto transparente, se saca una captura de página completa
 * —que es el lienzo sin letras— y esa captura vuelve a entrar a la página como
 * imagen para promediar el rectángulo de cada elemento con un canvas. Es la
 * única manera de saber qué hay detrás de una palabra cuando lo que hay es una
 * fotografía: `getComputedStyle` no lo sabe, y subir por los padres buscando un
 * color devuelve el de la sección, que está **debajo** de la foto.
 *
 * Devuelve los mismos pares con `bg`, `ratio` y `umbral` recalculados contra el
 * píxel real, más `p5` —el percentil 5 de luminancia del rectángulo, o sea el
 * rincón más oscuro— para que un promedio cómodo no tape un punto ilegible.
 */
async function medirElLienzo(p, pares) {
  const conFoto = pares.filter((x) => x.sobreFoto);
  if (!conFoto.length) return pares;

  /* El `<style>` se pone y se saca con `evaluate` y no con `addStyleTag`, que
     **ignora el `id`**: la primera versión de esto creía estar quitándolo y la
     hoja quedaba puesta, así que la segunda pasada —la del menú abierto— medía
     la página entera con el texto transparente e informaba 1,04:1 en sesenta y
     siete pares. Un barrido que se rompe a sí mismo a mitad de camino. */
  const aplico = await p.evaluate(() => {
    const hoja = new CSSStyleSheet();
    hoja.replaceSync('*{color:transparent!important}');
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, hoja];
    window.__sinLetras = hoja;
    /* EL PISO, ANTES DE LA CAPTURA: que el texto se haya vuelto transparente de
       verdad. Si la hoja no aplicó, la captura sale con las letras puestas y
       todo lo que se mida abajo es un número inventado con cara de medición. */
    const alguno = document.querySelector('p, h1, h2, h3, li, span');
    return alguno ? getComputedStyle(alguno).color : null;
  });
  if (aplico !== 'rgba(0, 0, 0, 0)') {
    throw new Error(
      `el lienzo se iba a capturar CON las letras puestas: el texto quedó en «${aplico}» y tenía que `
      + 'quedar transparente. Sin eso, el «fondo dibujado» de cada elemento sería el promedio de sus '
      + 'propias letras y este barrido informaría un contraste que no existe, en verde.',
    );
  }
  const lienzo = (await p.screenshot({ fullPage: true, animations: 'disabled' })).toString('base64');
  await p.evaluate(() => {
    document.adoptedStyleSheets = document.adoptedStyleSheets.filter((h) => h !== window.__sinLetras);
    delete window.__sinLetras;
  });

  const medidos = await p.evaluate(async ({ lienzo, cajas, dpr }) => {
    /* Los bytes, no una URL: `img-src 'self'` no admite `data:` y un `<img>`
       con la captura adentro no carga. Un `Blob` + `createImageBitmap` no pide
       nada por red, así que no hay directiva que lo gobierne. */
    const crudo = Uint8Array.from(atob(lienzo), (c) => c.charCodeAt(0));
    const img = await createImageBitmap(new Blob([crudo], { type: 'image/png' }));
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const cx = c.getContext('2d', { willReadFrequently: true });
    cx.drawImage(img, 0, 0);

    const lum = ([r, g, b]) => {
      const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };

    return cajas.map(({ x, y, w, h }) => {
      const X = Math.max(0, Math.round(x * dpr));
      const Y = Math.max(0, Math.round(y * dpr));
      const W = Math.max(1, Math.min(Math.round(w * dpr), c.width - X));
      const H = Math.max(1, Math.min(Math.round(h * dpr), c.height - Y));
      if (X >= c.width || Y >= c.height) return null;
      const d = cx.getImageData(X, Y, W, H).data;
      let r = 0, g = 0, b = 0, n = 0;
      const lums = [];
      for (let i = 0; i < d.length; i += 4) {
        r += d[i]; g += d[i + 1]; b += d[i + 2]; n++;
        lums.push(lum([d[i], d[i + 1], d[i + 2]]));
      }
      lums.sort((p1, p2) => p1 - p2);
      return {
        medio: [Math.round(r / n), Math.round(g / n), Math.round(b / n)],
        p5: lums[Math.floor(lums.length * 0.05)],
      };
    });
  }, { lienzo, cajas: conFoto.map((x) => x.caja), dpr: 1 });

  const lum = ([r, g, b]) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const ratio = (a, b) => { const [l1, l2] = [a, b].sort((x, y) => y - x); return (l1 + 0.05) / (l2 + 0.05); };
  const deHex = (h) => h.replace('#', '').match(/../g).map((x) => parseInt(x, 16));
  const aHex = ([r, g, b]) => '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();

  let i = 0;
  return pares.map((x) => {
    if (!x.sobreFoto) return x;
    const m = medidos[i++];
    if (!m) return x;
    const lFg = lum(deHex(x.fg));
    return {
      ...x,
      bg: aHex(m.medio),
      bgDeclarado: x.bg,
      ratio: Math.round(ratio(lFg, lum(m.medio)) * 100) / 100,
      ratioPeor: Math.round(ratio(lFg, m.p5) * 100) / 100,
    };
  });
}

const navegador = await chromium.launch();
const todo = [];
for (const [nombre, ruta] of PAGINAS) {
  for (const ancho of ANCHOS) {
    const p = await navegador.newPage({ viewport: { width: ancho, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
    await p.goto(BASE + ruta, { waitUntil: 'load' });
    await p.evaluate(() => document.fonts.ready);
    await p.evaluate((css) => {
      const hoja = new CSSStyleSheet();
      hoja.replaceSync(css);
      document.adoptedStyleSheets = [...document.adoptedStyleSheets, hoja];
    }, '*,*::before,*::after{transition:none!important;animation:none!important}.reveal{opacity:1!important}');
    await p.evaluate(() => document.querySelectorAll('.reveal').forEach((e) => e.classList.add('in')));
    for (const conMenu of [false, true]) {
      if (conMenu) await p.evaluate(() => {
        document.getElementById('ov')?.classList.add('open');
        /* Y la clase del `<body>` que aparta el header (orden #06, C): sin ella
           el barrido mediría el header debajo del telón, que en la web real no
           existe — y no mediría que, por estar apartado, deja de contar. */
        document.body.classList.add('ov-abierto');
      });
      await p.waitForTimeout(250);
      let pares = await p.evaluate(RECOLECTAR);

      /* ── El fondo dibujado, para lo que está sobre una fotografía ────────
         Solo si hay algo sobre foto: la captura de página completa y su vuelta
         a la página cuestan casi un segundo, y en tres de las cuatro páginas no
         hay nada que medir así. */
      if (pares.some((x) => x.sobreFoto)) {
        pares = await medirElLienzo(p, pares);
      }
      for (const x of pares) todo.push({ ...x, pagina: nombre, ancho });
    }
    await p.close();
  }
}
await navegador.close();

const mapa = new Map();
for (const x of todo) {
  const k = `${x.fg}|${x.bg}|${x.px}|${x.peso}`;
  if (!mapa.has(k)) mapa.set(k, { ...x, veces: 0, ejemplos: new Set(), textos: new Set() });
  const e = mapa.get(k);
  e.veces++; e.ejemplos.add(x.donde); e.textos.add(x.texto);
}
const filas = [...mapa.values()]
  .map((e) => ({ ...e, ejemplos: [...e.ejemplos].slice(0, 3), textos: [...e.textos].slice(0, 2) }))
  .sort((a, b) => (a.ratio / a.umbral) - (b.ratio / b.umbral));

writeFileSync(SALIDA, JSON.stringify(filas, null, 2));
const fallan = filas.filter((f) => f.ratio < f.umbral);
console.log(`${filas.length} pares distintos · ${fallan.length} por debajo del umbral\n`);
for (const f of fallan) {
  console.log(`✗ ${f.fg} sobre ${f.bg}  ${String(f.px).padStart(5)}px/${f.peso}  a${f.alfa}  ` +
    `${String(f.ratio).padStart(5)} < ${f.umbral}   ${f.ejemplos.join(' , ')}` +
    (f.sobreFoto ? `   [sobre foto · rincón más oscuro ${f.ratioPeor}]` : ''));
}

const sobreFoto = filas.filter((f) => f.sobreFoto);
if (sobreFoto.length) {
  console.log(`\n— los ${sobreFoto.length} pares sobre fotografía, medidos contra el píxel dibujado —`);
  for (const f of sobreFoto.slice(0, 12)) {
    console.log(`  ${f.fg} sobre ${f.bg} (declarado ${f.bgDeclarado})  ${String(f.px).padStart(5)}px  ` +
      `medio ${String(f.ratio).padStart(5)} ${f.ratio >= f.umbral ? '≥' : '<'} ${f.umbral}  ` +
      `· peor rincón ${String(f.ratioPeor).padStart(5)}   ${f.ejemplos[0]}`);
  }
}
console.log('\n— los más justos que SÍ pasan —');
for (const f of filas.filter((x) => x.ratio >= x.umbral).slice(0, 8)) {
  console.log(`  ${f.fg} sobre ${f.bg}  ${String(f.px).padStart(5)}px/${f.peso}  a${f.alfa}  ${String(f.ratio).padStart(5)} ≥ ${f.umbral}   ${f.ejemplos[0]}`);
}
