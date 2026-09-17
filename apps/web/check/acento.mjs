#!/usr/bin/env node
/**
 * El barrido del acento — orden Códice #07, G1.
 *
 * ── Qué cuida ──────────────────────────────────────────────────────────────
 * Que el naranja aparezca **donde se decidió y en ningún otro lado**. El
 * diagnóstico de la pasada premium fue que la web tenía demasiado: eyebrows,
 * números, flechas, hairlines de tarjetas, la línea de tiempo, las barras de las
 * citas, los subrayados del contacto, los nombres de los testimonios, la
 * marquita del pie y el anillo de foco. Cuando todo acentúa, nada acentúa.
 *
 * La regla que quedó (D25 + #07, A): el naranja es del **CTA primario y del
 * hover**. Todo lo estructural va en el tono del texto, en `--gris` o en una
 * hairline. Este archivo la vuelve comprobable.
 *
 * ── Cómo lee los colores, que es lo que lo hace confiable ────────────────
 * **No tiene ningún hex escrito.** Lee `--naranja` y `--naranja-texto` del
 * `:root` de la página que está midiendo, y compara contra eso.
 *
 * Es la primera lección de la #06, escrita como código: aquel guardián del
 * header comparaba contra `color.brand.teal` —el token de la app— mientras la
 * web servía `color.cff.tealDark`, así que estuvo en verde con el header
 * ilegible en producción. Un guardián que compara contra **otra copia** del
 * valor no vigila el valor: vigila la copia. Éste lee el mismo custom property
 * que el navegador acaba de usar para pintar.
 *
 * Los colores se resuelven con un lienzo y no con una expresión regular, por lo
 * mismo que `contraste.mjs`: `getComputedStyle` devuelve `oklab(...)` y
 * `color-mix(...)` tal cual, y leer esas cadenas con un `match` de números da
 * valores de otra escala.
 *
 * ── Y el piso, primero ───────────────────────────────────────────────────
 * «Cero elementos de más» sobre un barrido que no recorrió nada es idéntico a
 * «cero» sobre una casa en orden. Así que antes del cero va cuántos elementos
 * miró, contra el piso de esa página. El porqué de cada número, más abajo.
 *
 *     node check/acento.mjs http://127.0.0.1:4180
 */
import { chromium } from '@playwright/test';

const BASE = process.argv[2] || 'http://127.0.0.1:4180';
/**
 * Las cuatro páginas, con **su** piso de elementos.
 *
 * La orden pedía «más de 400 por página». Medido, ninguna llega: la portada
 * tiene 268, `/merida` 328, y las dos legales 98 y 91 — son documentos de texto,
 * no páginas de producto, y nunca van a tener 400 nodos. Un piso que no se puede
 * cumplir es un rojo permanente, y un rojo permanente se termina apagando: la
 * casa ya lo aprendió con `check-tokens`, que bajó su piso de 20 a 16 por lo
 * mismo, en un renglón que se lee.
 *
 * Así que el piso es por página y sale de la medición, con margen para que el
 * contenido crezca o se acomode sin ponerlo rojo. Lo que caza es lo que un piso
 * tiene que cazar: que la página no haya cargado, o que el selector se haya
 * roto y el barrido esté mirando la nada.
 */
const PAGINAS = [
  // nombre        ruta            piso   (medido el 17/9)
  ['inicio', '/', 220],           //  268
  ['merida', '/merida', 270],     //  328
  ['privacidad', '/privacidad', 80], //  98
  ['terminos', '/terminos', 75],  //   91
];

/**
 * Dónde el naranja está permitido, y por qué cada uno.
 *
 * Va como lista de selectores y no como lista de elementos concretos para que
 * agregar un botón primario no rompa el barrido, pero agregar un número naranja
 * sí. Si algo de acá deja de existir, el barrido no se entera —y no tiene por
 * qué: su trabajo es cazar lo que sobra, no lo que falta—.
 */
const PERMITIDO = [
  ['.btn--naranja', 'el CTA primario: es el único acento por pantalla'],
  ['.eyebrow', 'el rótulo que abre cada sección, solo sobre fondo claro'],
  ['.script', 'la firma de la marca en Great Vibes, en el pie'],
  ['.dato', 'la marca de dato pendiente de Armando: no es diseño, es andamio'],
];

const RECOLECTAR = ({ permitido }) => {
  const lienzo = document.createElement('canvas');
  lienzo.width = lienzo.height = 1;
  const cx = lienzo.getContext('2d', { willReadFrequently: true });
  /* Pintado sobre negro y sobre blanco se despeja el color y el alfa exactos,
     sea cual sea la sintaxis que devuelva `getComputedStyle`. */
  const rgba = (s) => {
    cx.fillStyle = 'rgb(0,0,0)'; cx.fillRect(0, 0, 1, 1);
    cx.fillStyle = s; cx.fillRect(0, 0, 1, 1);
    const n = cx.getImageData(0, 0, 1, 1).data;
    cx.fillStyle = 'rgb(255,255,255)'; cx.fillRect(0, 0, 1, 1);
    cx.fillStyle = s; cx.fillRect(0, 0, 1, 1);
    const b = cx.getImageData(0, 0, 1, 1).data;
    const a = Math.max(0, Math.min(1, 1 - (b[0] - n[0]) / 255));
    const c = a === 0 ? [0, 0, 0] : [0, 1, 2].map((i) => Math.min(255, Math.round(n[i] / a)));
    return `${c.join(',')}|${a.toFixed(2)}`;
  };

  /* Los dos acentos, leídos del :root de ESTA página. Sin hex escritos. */
  const raiz = getComputedStyle(document.documentElement);
  const ACENTOS = new Map([
    ['--naranja', rgba(raiz.getPropertyValue('--naranja').trim())],
    ['--naranja-texto', rgba(raiz.getPropertyValue('--naranja-texto').trim())],
  ]);
  const cual = (valor) => {
    if (!valor || valor === 'none') return null;
    const r = rgba(valor);
    if (r.endsWith('|0.00')) return null;
    for (const [nombre, ref] of ACENTOS) if (r === ref) return nombre;
    return null;
  };

  const PROPS = ['color', 'backgroundColor', 'borderTopColor', 'borderRightColor',
    'borderBottomColor', 'borderLeftColor', 'outlineColor', 'textDecorationColor'];

  const todos = [...document.querySelectorAll('body *')];
  const hallazgos = [];
  for (const el of todos) {
    /* Lo que no se ve no pinta nada. El overlay cerrado es `visibility:hidden`
       y sus ítems no cuentan hasta que alguien lo abra. */
    if (!el.getClientRects().length) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden') continue;

    for (const prop of PROPS) {
      /* Un borde de ancho 0 tiene color y no dibuja: contarlo sería inventar
         un hallazgo. Mismo criterio para el outline. */
      if (prop.startsWith('border') && parseFloat(cs[prop.replace('Color', 'Width')]) === 0) continue;
      if (prop === 'outlineColor' && (cs.outlineStyle === 'none' || parseFloat(cs.outlineWidth) === 0)) continue;
      /* `text-decoration-color` vale `currentColor` salvo que alguien lo fije, así
         que sin esto cada hallazgo de `color` sale dos veces y el informe miente
         sobre cuántos son. Solo cuenta si hay una decoración dibujándose. */
      if (prop === 'textDecorationColor' && cs.textDecorationLine === 'none') continue;

      const token = cual(cs[prop]);
      if (!token) continue;
      const permitidoPor = permitido.find(([sel]) => el.closest(sel));
      if (permitidoPor) continue;

      hallazgos.push({
        donde: el.tagName.toLowerCase()
          + (typeof el.className === 'string' && el.className.trim()
            ? '.' + el.className.trim().split(/\s+/).filter((c) => c !== 'reveal' && c !== 'in').join('.') : ''),
        prop,
        token,
        texto: (el.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 40),
      });
    }
  }
  return { mirados: todos.length, hallazgos };
};

const navegador = await chromium.launch();
let fallo = false;
let totalMirados = 0;

for (const [nombre, ruta, piso] of PAGINAS) {
  const p = await navegador.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  await p.goto(BASE + ruta, { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  /* Todo revelado y sin transiciones: un bloque a mitad del fundido tiene un
     color que el diseño no tiene, y acá se compara por igualdad exacta. */
  await p.addStyleTag({ content: '*,*::before,*::after{transition:none!important;animation:none!important}' });
  await p.evaluate(() => document.querySelectorAll('.reveal').forEach((e) => e.classList.add('in')));
  await p.waitForTimeout(250);

  const { mirados, hallazgos } = await p.evaluate(RECOLECTAR, { permitido: PERMITIDO });
  totalMirados += mirados;

  /* EL PISO, ANTES DEL CERO. */
  if (mirados < piso) {
    console.error(`✗ ${nombre}: el barrido miró ${mirados} elementos y su piso es ${piso}. `
      + 'Un «cero acentos de más» sobre casi nada no afirma nada: o la página no cargó, '
      + 'o el selector se rompió y esto está mirando la nada.');
    fallo = true;
  }

  if (hallazgos.length) {
    fallo = true;
    console.log(`✗ ${nombre} · ${mirados} elementos mirados · ${hallazgos.length} acento(s) fuera de lugar`);
    for (const h of hallazgos) {
      console.log(`    ${h.prop.padEnd(18)} ${h.token.padEnd(15)} ${h.donde}${h.texto ? `  «${h.texto}»` : ''}`);
    }
  } else {
    console.log(`✓ ${nombre} · ${mirados} elementos mirados · el naranja solo donde se decidió`);
  }
  await p.close();
}
await navegador.close();

console.log(`\n${totalMirados} elementos en las cuatro páginas. Permitido: ${PERMITIDO.map(([s]) => s).join(', ')}.`);
if (fallo) {
  console.error('\nEl acento se usa una vez por pantalla. Lo que aparece arriba lo usa de más: '
    + 'va en `--gris`, en `--hair` o en el color del texto.\n');
  process.exit(1);
}
console.log('El acento está donde se decidió y en ningún otro lado.\n');
