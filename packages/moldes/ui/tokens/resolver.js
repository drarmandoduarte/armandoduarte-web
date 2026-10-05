/**
 * El resolvedor de tokens: de un nombre a su hex, en el tema que se pida.
 *
 * Lee hojas CSS como texto —la que `@moldes/design` genera desde un `design.json`
 * y las del kit— y resuelve un alias hasta su hex, como lo haría el navegador.
 * Lo usan los tests de contraste para medir **cualquier** `design.json` contra
 * las mismas reglas: es la diferencia entre «esta paleta pasa» y «toda paleta
 * que entre al molde pasa».
 *
 * Es un módulo y no un helper dentro de una suite porque importar una función
 * desde un archivo de test vuelve a registrar los tests de ese archivo.
 *
 * ── Qué sabe resolver ──────────────────────────────────────────────────────
 *   · `#rgb` y `#rrggbb` (los normaliza a seis dígitos en mayúsculas);
 *   · cadenas de `var(--x)` de cualquier largo, con tope de saltos;
 *   · `color-mix(in srgb, A P%, B)`, incluida la proporción escrita como token;
 *   · la herencia de tema: lo que el bloque oscuro no redefine se lee del claro.
 *
 * **Qué NO sabe:** `rgb()` con alfa, `color-mix` contra `transparent`,
 * `oklch()`, `light-dark()`. Los devuelve tal cual y quien los mida va a fallar,
 * que es lo que se quiere: medir contra una línea transparente exige decir
 * contra qué fondo se compone, y este módulo no lo adivina.
 */

/**
 * Los cuerpos de **todos** los bloques `selector{…}` del texto, en orden.
 *
 * Todos y no el primero, y eso costó un rojo: al sumarle `marca.css` a
 * `semantic.css` para medir las tintas del logo, un lector que se quedara con
 * la primera aparición de `:root{` devolvía solo las de `semantic.css` y las
 * cinco de la marca resolvían a `undefined` — un test que se cae diciendo que
 * un color no contrasta cuando lo que pasa es que no se leyó. Un archivo puede
 * abrir `:root` más de una vez, y dos archivos concatenados siempre lo hacen.
 */
function bloques(css, selector) {
  const salida = [];
  let desde = css.indexOf(selector + '{');
  while (desde >= 0) {
    const abre = desde + selector.length + 1;
    const cierra = css.indexOf('}', abre);
    salida.push(css.slice(abre, cierra < 0 ? css.length : cierra));
    desde = css.indexOf(selector + '{', cierra < 0 ? css.length : cierra);
  }
  return salida;
}

/** Las declaraciones `--x: valor;` de varios cuerpos, como objeto. La última gana. */
function declaraciones(cuerpos) {
  return Object.fromEntries(
    cuerpos.flatMap((cuerpo) => [...cuerpo.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)]
      .map((m) => [m[1], m[2].trim()])),
  );
}

const CLARO = ':root';
const OSCURO = '[data-theme="dark"]';

/**
 * Arma un resolvedor sobre dos capas de hojas.
 *
 * @param {string} colorsCss    la capa cruda: la salida de `aCss(design)` de `@moldes/design`
 * @param {string} semanticCss  la capa de alias: `tokens/semantic.css` (y las que se sumen)
 */
export function resolvedor(colorsCss, semanticCss) {
  // El orden importa: lo semántico pisa a lo crudo cuando un nombre está en los
  // dos, que es lo que hace el navegador con dos declaraciones en `:root`.
  const capas = {
    claro: { ...declaraciones(bloques(colorsCss, CLARO)), ...declaraciones(bloques(semanticCss, CLARO)) },
    oscuro: { ...declaraciones(bloques(colorsCss, OSCURO)), ...declaraciones(bloques(semanticCss, OSCURO)) },
  };

  /** El texto declarado de un token en un tema, con la herencia del claro. */
  function crudo(tema, token) {
    const propio = capas[tema]?.[token];
    return propio === undefined ? capas.claro[token] : propio;
  }

  /** Reemplaza cada `var(--x)` por su texto, recursivamente. */
  function expandir(tema, texto, saltos = 0) {
    if (typeof texto !== 'string' || saltos > 12) return texto;
    if (!texto.includes('var(')) return texto;
    const expandido = texto.replace(/var\((--[a-z0-9-]+)\)/g, (todo, nombre) => {
      const valor = crudo(tema, nombre);
      return valor === undefined ? todo : valor;
    });
    return expandido === texto ? texto : expandir(tema, expandido, saltos + 1);
  }

  return {
    capas,
    crudo,
    expandir: (tema, texto) => expandir(tema, texto),
    /** El hex final de un token en un tema. */
    hex(tema, token) {
      return aHex(expandir(tema, crudo(tema, token)));
    },
    /** El hex final de un valor escrito a mano (ya en CSS), en un tema. */
    hexDeValor(tema, valor) {
      return aHex(expandir(tema, valor));
    },
  };
}

/** `#abc` → `#AABBCC`; `#AABBCC` → igual, en mayúsculas. */
function normalizar(hex) {
  const c = hex.slice(1);
  const seis = c.length === 3 ? c.split('').map((x) => x + x).join('') : c.slice(0, 6);
  return '#' + seis.toUpperCase();
}

function canales(hex) {
  const c = normalizar(hex).slice(1);
  return [0, 2, 4].map((i) => parseInt(c.substr(i, 2), 16));
}

function deCanales(v) {
  return '#' + v.map((x) => Math.round(x).toString(16).padStart(2, '0').toUpperCase()).join('');
}

/**
 * Evalúa un valor ya expandido —sin ningún `var()` adentro— a hex.
 *
 * Lo que no sea hex ni `color-mix` se devuelve tal cual: ver el alcance
 * declarado en la cabecera.
 */
export function aHex(valor) {
  if (typeof valor !== 'string') return valor;
  const texto = valor.trim();
  if (/^#[0-9A-Fa-f]{3}$/.test(texto) || /^#[0-9A-Fa-f]{6}$/.test(texto)) return normalizar(texto);
  const mezcla = /^color-mix\(\s*in\s+srgb\s*,\s*(.+?)\s+([0-9.]+)%\s*,\s*(.+?)\s*\)$/.exec(texto);
  if (!mezcla) return texto;
  const a = aHex(mezcla[1]);
  const b = aHex(mezcla[3]);
  if (!a.startsWith('#') || !b.startsWith('#')) return texto;
  const p = Number(mezcla[2]) / 100;
  const ca = canales(a);
  const cb = canales(b);
  return deCanales(ca.map((x, i) => x * p + cb[i] * (1 - p)));
}
