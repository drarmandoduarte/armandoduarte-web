/**
 * ¿Este `design.json` cumple el esquema v1? — devuelve la lista de problemas.
 *
 * Una lista vacía es «sí». Cada problema es una frase que dice qué clave y qué
 * pasa, para que quien arma una app lo arregle sin abrir el esquema.
 *
 * Se escribe a mano y no con un validador de JSON Schema porque el esquema es
 * chico y fijo (nueve colores dos veces, tres tipografías, tres radios, tres
 * datos de la app) y porque los mensajes tienen que estar en el idioma de quien
 * los lee. `design.schema.json` existe igual, para el editor.
 *
 * Además del formato, mide lo que el esquema no puede decir: que el texto y el
 * texto secundario se lean (AA) sobre el fondo y el papel, en los dos temas.
 * Un `design.json` que no pasa eso no se puede pintar sin ilegibles, y es mejor
 * enterarse acá que en una pantalla.
 */
import { razonDeContraste } from './contraste.js';

export const COLORES = ['fondo', 'papel', 'texto', 'texto2', 'linea', 'acento', 'error', 'ok', 'aviso'];
export const TIPOGRAFIAS = ['sans', 'serif', 'mono'];
export const RADIOS = ['boton', 'campo', 'tarjeta'];
const HEX = /^#[0-9A-Fa-f]{6}$/;
const AA = 4.5;

export const IDIOMAS_DE_FRASE = ['es', 'en', 'pt'];
const ACENTUADA = /\*[^*]+\*/;

/* La frase de marca: un texto (se toma como español) o `{ es, en, pt }` con al
   menos uno. Cada una marca su palabra acentuada entre asteriscos. */
function problemasDeFrase(frase) {
  if (typeof frase === 'string') {
    return ACENTUADA.test(frase) ? [] : ['app.frase: no marca la palabra acentuada entre asteriscos'];
  }
  if (!frase || typeof frase !== 'object' || Array.isArray(frase)) {
    return ['app.frase: falta (un texto, o { "es": …, "en": …, "pt": … })'];
  }
  const p = [];
  const claves = Object.keys(frase);
  if (claves.length === 0) p.push('app.frase: el objeto está vacío');
  for (const c of claves) {
    if (!IDIOMAS_DE_FRASE.includes(c)) p.push(`app.frase.${c}: no es un idioma del molde (es, en, pt)`);
    else if (typeof frase[c] !== 'string' || !ACENTUADA.test(frase[c])) p.push(`app.frase.${c}: no marca la palabra acentuada entre asteriscos`);
  }
  return p;
}

/**
 * Lo que no rompe nada pero conviene saber. A diferencia de `validar`, un aviso
 * no impide usar el `design.json`.
 *
 * Hoy uno solo: la frase de marca en un solo idioma. En las pantallas de los
 * otros dos se ve el título genérico del molde («Entra a {app}.») en vez de la
 * frase: no se rompe, pero la marca se pierde.
 */
export function avisos(design) {
  const frase = design?.app?.frase;
  if (frase === undefined || problemasDeFrase(frase).length) return [];
  const tiene = typeof frase === 'string' ? ['es'] : Object.keys(frase);
  const faltan = IDIOMAS_DE_FRASE.filter((i) => !tiene.includes(i));
  return faltan.length
    ? [`app.frase: está solo en ${tiene.map((i) => `«${i}»`).join(', ')}; en ${faltan.map((i) => `«${i}»`).join(' y ')} la pantalla de entrada muestra el título genérico del molde`]
    : [];
}

/**
 * La frase de marca en un idioma, o `null` si no la tiene en ese idioma.
 * Un texto suelto cuenta como español. Con `null`, la pantalla usa el título
 * genérico del molde en ESE idioma (`t('auth.login.titleDefault')`), nunca la
 * frase en otro idioma.
 */
export function fraseDeMarca(design, idioma = 'es') {
  const frase = design?.app?.frase;
  if (typeof frase === 'string') return idioma === 'es' ? frase : null;
  return (frase && typeof frase[idioma] === 'string') ? frase[idioma] : null;
}

export function validar(design) {
  const p = [];
  if (!design || typeof design !== 'object') return ['el archivo no es un objeto JSON'];

  const app = design.app ?? {};
  if (typeof app.nombre !== 'string' || !app.nombre.trim()) p.push('app.nombre: falta el nombre de la app');
  p.push(...problemasDeFrase(app.frase));
  if (!['voseo', 'neutro'].includes(app.espanol)) p.push('app.espanol: tiene que ser "voseo" o "neutro"');

  for (const bloque of ['color', 'colorOscuro']) {
    const c = design[bloque] ?? {};
    for (const nombre of COLORES) {
      if (!HEX.test(c[nombre] ?? '')) p.push(`${bloque}.${nombre}: falta o no es un hex de seis cifras`);
    }
    for (const sobra of Object.keys(c)) {
      if (!COLORES.includes(sobra)) p.push(`${bloque}.${sobra}: no es una clave del esquema`);
    }
  }

  const t = design.tipografia ?? {};
  for (const nombre of TIPOGRAFIAS) {
    if (typeof t[nombre] !== 'string' || !t[nombre].trim()) p.push(`tipografia.${nombre}: falta el nombre de la fuente`);
  }

  const r = design.radio ?? {};
  for (const nombre of RADIOS) {
    const v = r[nombre];
    if (!Number.isInteger(v) || v < 0 || v > 999) p.push(`radio.${nombre}: tiene que ser un entero entre 0 y 999`);
  }

  // Lo legible, solo si los colores están bien escritos (si no, ya se dijo arriba).
  if (p.some((x) => x.startsWith('color'))) return p;
  for (const [bloque, tema] of [['color', 'claro'], ['colorOscuro', 'oscuro']]) {
    const c = design[bloque];
    for (const tinta of ['texto', 'texto2']) {
      for (const papel of ['fondo', 'papel']) {
        const razon = razonDeContraste(c[tinta], c[papel]);
        if (razon < AA) {
          p.push(`${bloque}: ${tinta} sobre ${papel} da ${razon.toFixed(2)}:1 en tema ${tema} (AA pide ${AA}:1)`);
        }
      }
    }
  }
  return p;
}
