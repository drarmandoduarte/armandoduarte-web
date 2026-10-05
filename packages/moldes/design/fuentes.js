/**
 * Fuentes AUTOALOJADAS — la parte que no toca la red.
 *
 * ── Por qué autoalojar ─────────────────────────────────────────────────────
 * Decisión de Dirección (PR 2): toda app sirve sus fuentes desde su propio
 * dominio. Tres razones, las mismas que ya tenían las apps de origen:
 *   · privacidad: pedir la fuente a Google le pasa la IP de cada visita a un
 *     tercero (riesgo legal en la UE);
 *   · independencia: si la conexión es mala o Google cambia algo, la app se ve
 *     igual;
 *   · métricas congeladas: la fuente no cambia bajo los pies del diseño.
 *
 * Google Fonts se usa UNA vez, al armar la app (`bajar-fuentes.mjs`), para
 * bajar los `.woff2`. El storybook es la única excepción: pide a Google en vivo
 * porque cambia de `design.json` con un clic.
 *
 * ── Qué hay acá ────────────────────────────────────────────────────────────
 * Lo puro, que se prueba sin red: leer la hoja que devuelve Google, quedarse
 * con los subconjuntos que hacen falta para es/en/pt, ponerle nombre a cada
 * archivo y escribir el `@font-face` que apunta a ellos. La descarga vive en
 * `bajar-fuentes.mjs`.
 */
import { urlDeFuentes } from './resolver.js';

/** Los subconjuntos de Unicode que cubren español, inglés y portugués. */
export const SUBCONJUNTOS = ['latin', 'latin-ext'];

/**
 * Las caras de una hoja de Google Fonts (`css2`, pedida con un navegador que
 * entiende woff2). Google antepone a cada `@font-face` un comentario con su
 * subconjunto: `/* latin *\/`.
 */
export function leerHojaDeGoogle(css) {
  const caras = [];
  const patron = /\/\*\s*([a-z0-9-]+)\s*\*\/\s*@font-face\s*\{([^}]*)\}/g;
  let m;
  while ((m = patron.exec(css))) {
    const cuerpo = m[2];
    const prop = (nombre) => new RegExp(`${nombre}\\s*:\\s*([^;]+);`).exec(cuerpo)?.[1].trim();
    const url = /url\((['"]?)([^)'"]+)\1\)\s*format\(['"]woff2['"]\)/.exec(cuerpo)?.[2];
    if (!url) continue;
    caras.push({
      subconjunto: m[1],
      familia: prop('font-family').replace(/^['"]|['"]$/g, ''),
      estilo: prop('font-style') || 'normal',
      peso: prop('font-weight') || '400',
      rango: prop('unicode-range') || null,
      url,
    });
  }
  return caras;
}

/** `Instrument Serif` → `instrument-serif`. */
export const aArchivo = (familia) => familia.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** El nombre del `.woff2` de una cara: familia, estilo, peso y subconjunto. */
export function nombreDeArchivo(cara) {
  return `${aArchivo(cara.familia)}-${cara.estilo}-${String(cara.peso).replace(/\s+/g, '_')}-${cara.subconjunto}.woff2`;
}

/**
 * Le pone a cada cara su `archivo`. Una fuente VARIABLE devuelve la misma URL
 * para cada peso (400, 500, 600 y 700 son un solo archivo): esas caras
 * comparten archivo, y se baja una vez.
 */
export function asignarArchivos(caras) {
  const porUrl = new Map();
  return caras.map((c) => {
    if (!porUrl.has(c.url)) porUrl.set(c.url, nombreDeArchivo(c));
    return { ...c, archivo: porUrl.get(c.url) };
  });
}

/** Solo las caras de los subconjuntos que hacen falta. */
export function filtrarCaras(caras, subconjuntos = SUBCONJUNTOS) {
  return caras.filter((c) => subconjuntos.includes(c.subconjunto));
}

/**
 * El `@font-face` de las caras ya bajadas, apuntando a `prefijo/archivo`.
 * Sin `local()` a propósito: con `local()` se dibuja la versión que tenga
 * instalada cada computadora, y las métricas dejan de estar congeladas.
 */
export function hojaDeFuentes(caras, prefijo = '/fuentes') {
  const cabeza = '/* Generado por @moldes/design · bajar-fuentes.mjs. No se edita a mano: se vuelve a correr el script. */\n';
  return cabeza + caras.map((c) => [
    `/* ${c.familia} · ${c.estilo} ${c.peso} · ${c.subconjunto} */`,
    '@font-face{',
    `font-family:'${c.familia}';`,
    `font-style:${c.estilo};`,
    `font-weight:${c.peso};`,
    'font-display:swap;',
    `src:url('${prefijo.replace(/\/$/, '')}/${c.archivo || nombreDeArchivo(c)}') format('woff2');`,
    c.rango ? `unicode-range:${c.rango};` : '',
    '}',
  ].filter(Boolean).join('\n')).join('\n') + '\n';
}

/** Lo que hay que pedirle a Google para un `design.json` (null si son todas `system`). */
export { urlDeFuentes };
