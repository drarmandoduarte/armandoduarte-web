/**
 * `t(clave, variables)` — la única forma en que un texto llega a la pantalla.
 *
 * ── Las reglas (spec Kit UI + Idiomas, Parte B) ────────────────────────────
 * · Ningún texto que vea una persona está escrito en el código: todo pasa por
 *   acá. `sin-textos.test.js` lo persigue en los componentes del molde.
 * · Claves planas con punto (`auth.code.title`), iguales en los tres idiomas.
 * · Español NEUTRO por defecto. Una app con voseo (`design.json → app.espanol`)
 *   superpone `es-UY.json`, que trae SOLO lo que cambia. Nadie reescribe el
 *   archivo entero.
 * · La palabra acentuada va entre asteriscos (`Verifica tu *identidad*.`) y
 *   `t()` la deja así: la pinta `Titulo` (o `conAcento`).
 *
 * ── Las variables ───────────────────────────────────────────────────────────
 *   {app} {email} {n} …        se reemplazan por su valor;
 *   {n|intento|intentos}        plural: la primera forma si n === 1, la otra si no.
 * Los nombres de variable son los mismos en los tres idiomas (en español), y un
 * test lo comprueba: si `en.json` dijera {date} donde `es.json` dice {fecha},
 * la variable no llegaría y la persona vería la llave.
 *
 * ── Lo que falta ────────────────────────────────────────────────────────────
 * Una clave que no existe devuelve la clave misma —un hueco visible es mejor que
 * un hueco vacío— y, en desarrollo, avisa una vez por clave.
 */
import es from './es.json' with { type: 'json' };
import en from './en.json' with { type: 'json' };
import pt from './pt.json' with { type: 'json' };
import esUY from './es-UY.json' with { type: 'json' };

export const IDIOMAS = ['es', 'en', 'pt'];
export const TEXTOS = { es, en, pt };
export const VOSEO = esUY;

const yaAvisadas = new Set();

/** Reemplaza `{x}` y `{n|uno|varios}` en un texto. */
export function interpolar(texto, variables = {}) {
  return texto.replace(/\{(\w+)(?:\|([^|}]*)\|([^}]*))?\}/g, (todo, nombre, uno, varios) => {
    const valor = variables[nombre];
    if (uno !== undefined) return Number(valor) === 1 ? uno : varios;
    return valor === undefined || valor === null ? todo : String(valor);
  });
}

/**
 * Arma el `t` de un idioma.
 *
 * @param {object} o
 * @param {'es'|'en'|'pt'} [o.idioma]      el idioma elegido (ver `elegirIdioma`)
 * @param {'neutro'|'voseo'} [o.espanol]   de `design.json → app.espanol`
 * @param {object} [o.extras]              los textos propios de la app: `{ es: {…}, en: {…}, pt: {…}, 'es-UY'?: {…} }`
 * @param {object} [o.comunes]             variables que van en todos los textos (típicamente `{ app }`)
 */
export function crearT({ idioma = 'es', espanol = 'neutro', extras = {}, comunes = {} } = {}) {
  const base = TEXTOS[idioma] ? idioma : 'es';
  const tabla = {
    ...TEXTOS[base],
    ...(extras[base] || {}),
    ...(base === 'es' && espanol === 'voseo' ? { ...VOSEO, ...(extras['es-UY'] || {}) } : {}),
  };
  function t(clave, variables) {
    const texto = tabla[clave];
    if (texto === undefined) {
      if (!yaAvisadas.has(clave) && typeof console !== 'undefined') {
        yaAvisadas.add(clave);
        let dev = false;
        try { dev = Boolean(import.meta.env?.DEV); } catch { dev = false; }
        if (dev) console.warn(`[idiomas] falta la clave «${clave}» en ${base}`);
      }
      return clave;
    }
    return interpolar(texto, { ...comunes, ...variables });
  }
  t.idioma = base;
  t.existe = (clave) => tabla[clave] !== undefined;
  return t;
}

/**
 * Qué idioma usar (spec B.4): gana el del perfil; antes de entrar, el guardado
 * en el aparato; si no hay nada, el del navegador; si no es ES, EN ni PT, ES.
 */
export function elegirIdioma({ perfil, aparato, navegador } = {}) {
  for (const candidato of [perfil, aparato, navegador]) {
    const corto = String(candidato || '').slice(0, 2).toLowerCase();
    if (IDIOMAS.includes(corto)) return corto;
  }
  return 'es';
}
