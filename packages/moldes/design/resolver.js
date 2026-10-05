/**
 * De `design.json` a variables CSS — la única puerta por la que la marca de una
 * app entra al molde.
 *
 * ── Qué sale ───────────────────────────────────────────────────────────────
 * Tres grupos de variables, y nada más:
 *
 *   --c-*   los nueve colores del `design.json`, en claro (`:root`) y en oscuro
 *           (`[data-theme="dark"]`), más los que se DERIVAN de ellos (abajo).
 *   --f-*   las tres tipografías, con su pila de respaldo.
 *   --r-*   los tres radios, en píxeles.
 *
 * Los tokens del kit (`@moldes/ui/tokens/*.css`) leen SOLO estas variables. Lo
 * demás —espaciado, escala de letra, movimiento, sombras— es del molde y no
 * cambia por app.
 *
 * ── Lo que se deriva, y por qué se calcula acá y no con `color-mix` en vivo ─
 * Un color de marca pleno sirve para un borde o un punto, pero no siempre para
 * escribir: un terracota medio sobre papel crema puede dar 3,8:1. Las apps de
 * origen lo resolvieron a mano, color por color, eligiendo «el escalón hondo» de cada
 * familia y anotando la medición. El molde no puede elegir a mano porque no
 * conoce los colores de antemano, así que hace lo mismo **midiendo**:
 *
 *   escalón de letra = el color más parecido al original que pasa AA (4,5:1)
 *                      contra el fondo, el papel y su propio suave (el chip), y
 *                      que no se confunde con la tinta. Si ya cumple, es el
 *                      mismo color. Ver `escalonDeLetra`.
 *
 * Se escribe el hex ya resuelto y no un `color-mix` porque un hex se puede
 * medir en un test y buscar con un `grep`; una mezcla en vivo la redondea cada
 * navegador a su manera.
 *
 * ── Lo que NO hace ─────────────────────────────────────────────────────────
 * No baja fuentes: `urlDeFuentes()` arma la dirección de Google Fonts y quien
 * aplica el diseño (`aplicar.js`) decide si la pide. Una app que autoaloja sus
 * fuentes declara sus `@font-face` y no llama a esa función.
 */
import { distanciaPerceptual, razonDeContraste, sobreColor } from './contraste.js';

const AA = 4.5;
const PASO = 0.04;
/** La banda en la que un color deja de leerse como color y se lee como tinta (OKLab). */
const DISTANCIA_TINTA = 0.18;
/** La proporción del «suave» de un color (el fondo de un chip): la del kit. */
const MEZCLA_SUAVE = 0.22;

export const SELECTOR_CLARO = ':root';
export const SELECTOR_OSCURO = '[data-theme="dark"]';

/* Las pilas de respaldo: lo que se ve el segundo antes de que llegue la fuente,
   y para siempre si no llega. La serif cae en Georgia y no en la sans, porque
   un título que pierde la serif pierde la jerarquía. */
const RESPALDO = {
  sans: '"Segoe UI",ui-sans-serif,system-ui,-apple-system,Roboto,sans-serif',
  serif: 'Georgia,"Times New Roman",ui-serif,serif',
  mono: 'ui-monospace,SFMono-Regular,Menlo,Consolas,monospace',
};

function canales(hex) {
  const c = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(c.substr(i, 2), 16));
}

/** `p` de `a` y el resto de `b`, en sRGB — lo mismo que `color-mix(in srgb, a p%, b)`. */
export function mezclar(a, b, p) {
  const ca = canales(a);
  const cb = canales(b);
  return '#' + ca.map((x, i) => Math.round(x * p + cb[i] * (1 - p)).toString(16).padStart(2, '0')).join('').toUpperCase();
}

/**
 * El escalón de letra de `color`: el más parecido al original que cumple dos
 * cosas a la vez —
 *
 *   1. pasa AA (4,5:1) contra todos los `fondos`;
 *   2. se distingue de la `tinta` (0,18 en OKLab): un color de estado que se
 *      lee como tinta deja de decir su estado.
 *
 * Se busca en las dos direcciones, de a 4 %: hacia la tinta (gana contraste) y
 * hacia el fondo (se aleja de la tinta). De noche suele hacer falta la segunda:
 * un ámbar claro sobre oscuro pasa AA de sobra pero queda pegado a una tinta
 * crema. Si ninguna mezcla cumple las dos, se queda con la primera que pasa AA
 * —leerse es innegociable; distinguirse, lo mejor posible— y el test
 * `contra-la-tinta` lo avisa.
 */
export function escalonDeLetra(color, fondos, tinta, fondo = fondos[0]) {
  const pasaAA = (c) => fondos.every((f) => razonDeContraste(c, f) >= AA);
  const seDistingue = (c) => distanciaPerceptual(c, tinta) >= DISTANCIA_TINTA;
  let soloAA = null;
  for (let t = 0; t <= 1 + 1e-9; t += PASO) {
    const p = Math.min(t, 1);
    for (const candidato of [mezclar(tinta, color, p), mezclar(fondo, color, p)]) {
      if (!pasaAA(candidato)) continue;
      if (seDistingue(candidato)) return candidato;
      soloAA ??= candidato;
    }
  }
  return soloAA ?? tinta.toUpperCase();
}

function tema(c) {
  const mayus = Object.fromEntries(Object.entries(c).map(([k, v]) => [k, v.toUpperCase()]));
  const { fondo, papel, texto, texto2 } = mayus;
  const letra = (color) => escalonDeLetra(color, [fondo, papel, mezclar(color, papel, MEZCLA_SUAVE)], texto, fondo);
  return {
    ...mayus,
    // Lo hundido (campos, cabeceras de tabla): el fondo, un paso hacia la tinta.
    hundido: mezclar(texto, fondo, 0.05),
    'acento-texto': letra(mayus.acento),
    'error-texto': letra(mayus.error),
    'ok-texto': letra(mayus.ok),
    'aviso-texto': letra(mayus.aviso),
    // Lo que informa sin color de marca: el gris de la app.
    info: texto2,
    'info-texto': letra(texto2),
    // Lo que se escribe ENCIMA de un relleno: de las dos tintas de la app, la que mejor se lee.
    'sobre-acento': sobreColor(mayus.acento, papel, texto),
    'sobre-error': sobreColor(letra(mayus.error), papel, texto),
    'sobre-aviso': sobreColor(mayus.aviso, papel, texto),
  };
}

function familia(nombre, respaldo) {
  if (nombre === 'system') return respaldo;
  return `"${nombre}",${respaldo}`;
}

/** Las variables, por grupo: `{ claro, oscuro, comunes }`, cada uno `{ '--x': valor }`. */
export function aVariables(design) {
  const conGuion = (prefijo, obj) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [`--${prefijo}-${k}`, v]));
  return {
    claro: conGuion('c', tema(design.color)),
    oscuro: conGuion('c', tema(design.colorOscuro)),
    comunes: {
      ...conGuion('f', {
        sans: familia(design.tipografia.sans, RESPALDO.sans),
        serif: familia(design.tipografia.serif, RESPALDO.serif),
        mono: familia(design.tipografia.mono, RESPALDO.mono),
      }),
      ...conGuion('r', Object.fromEntries(Object.entries(design.radio).map(([k, v]) => [k, `${v}px`]))),
    },
  };
}

/**
 * La hoja entera, lista para un `<style>`. Los selectores se escriben sin
 * espacio antes de la llave (`:root{`) a propósito: es la forma que lee el
 * resolvedor de tokens del kit, así un test puede medir esta salida tal cual.
 */
export function aCss(design) {
  const { claro, oscuro, comunes } = aVariables(design);
  const bloque = (vars) => Object.entries(vars).map(([k, v]) => `${k}:${v};`).join('\n');
  return `${SELECTOR_CLARO}{\n${bloque({ ...comunes, ...claro })}\n}\n${SELECTOR_OSCURO}{\n${bloque(oscuro)}\n}\n`;
}

/**
 * `design.css`: la hoja que escribe `generar-css.mjs` en la carpeta pública de
 * la app. Es `aCss()` con una cabecera que dice de dónde sale. La app la sirve
 * desde su dominio y `aplicarDesign()` la enlaza: con `style-src 'self'` la
 * CSP no deja escribir un `<style>`, y un archivo propio sí.
 */
export function hojaDeDesign(design) {
  return `/* Generado por @moldes/design · generar-css.mjs a partir del design.json de ${design.app.nombre}. No se edita a mano: se vuelve a correr el script. */\n${aCss(design)}`;
}

/** La dirección de Google Fonts para las tres tipografías (sin las `system`). */
export function urlDeFuentes(design) {
  const pedidos = {
    sans: 'wght@400;500;600;700',
    serif: 'ital,wght@0,400;1,400',
    mono: 'wght@400;500',
  };
  const familias = Object.entries(design.tipografia)
    .filter(([, nombre]) => nombre !== 'system')
    .map(([clave, nombre]) => `family=${nombre.trim().replace(/ /g, '+')}:${pedidos[clave]}`);
  if (familias.length === 0) return null;
  return `https://fonts.googleapis.com/css2?${familias.join('&')}&display=swap`;
}
