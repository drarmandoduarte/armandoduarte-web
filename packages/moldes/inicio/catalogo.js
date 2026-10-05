/**
 * El catálogo de widgets de Inicio, como mecanismo (orden de la fase 1, §5).
 *
 * Extraído del Inicio de la app de origen, que ya lo tenía resuelto: un
 * catálogo CERRADO de widgets, unos defaults por rol, y una configuración por
 * persona (qué se ve, en qué orden, de qué tamaño) que se puede ajustar,
 * deshacer y volver «como al principio». Lo que cambia en el molde: el catálogo
 * y los defaults los declara la app (`registrarCatalogo`); el molde no sabe qué
 * widgets existen, sabe cómo se ordenan.
 *
 * Todo esto es dato y se prueba sin pantalla.
 *
 * ── La configuración de una persona ─────────────────────────────────────────
 *   null                    → nunca ajustó nada: ve los defaults de su rol, y si
 *                             mañana cambian, los recibe.
 *   { orden, tamanos }      → ajustó: ve exactamente eso. «Como al principio»
 *                             vuelve a null.
 *
 * ── Tamaños ─────────────────────────────────────────────────────────────────
 * La rejilla tiene 6 columnas: chico ocupa 2, mediano 3 y grande 6. Cada widget
 * dice qué tamaños admite y con cuál nace. En celular es una sola columna.
 */

export const TAMANOS = ['chico', 'mediano', 'grande'];
export const COLUMNAS = 6;
export const COLUMNAS_DE_TAMANO = { chico: 2, mediano: 3, grande: 6 };

/**
 * Arma el catálogo de una app.
 *
 * @param {Array<{ id: string, clave: string, admite?: string[], nace?: string, ruta?: string,
 *                 soloManda?: boolean, Widget: Function }>} widgets
 *        `clave` es la clave de idioma del título; `soloManda`, si solo lo ve quien manda.
 * @param {Record<string, string[]>} porRol  los ids que ve cada rol por defecto, en orden.
 */
export function registrarCatalogo(widgets, porRol = {}) {
  const lista = widgets.map((w) => {
    const admite = w.admite && w.admite.length ? w.admite.filter((x) => TAMANOS.includes(x)) : ['mediano'];
    const nace = admite.includes(w.nace) ? w.nace : admite[0];
    return { ...w, admite, nace };
  });
  const ids = new Set(lista.map((w) => w.id));
  for (const [rol, orden] of Object.entries(porRol)) {
    const ajenos = orden.filter((id) => !ids.has(id));
    if (ajenos.length) throw new Error(`[inicio] el rol «${rol}» pide widgets que el catálogo no tiene: ${ajenos.join(', ')}`);
  }
  return { widgets: lista, porRol };
}

/** Los widgets que esta persona PUEDE ver (el rol decide; quien manda ve todos). */
export function permitidos(catalogo, ctx = {}) {
  return catalogo.widgets.filter((w) => !w.soloManda || ctx.manda);
}

/** Los que ve, en orden: sus ajustes, o los defaults de su rol. */
export function widgetsDeInicio(catalogo, ctx = {}, config = null) {
  const puede = new Map(permitidos(catalogo, ctx).map((w) => [w.id, w]));
  const ids = config === null ? (catalogo.porRol[ctx.rol] || []) : config.orden;
  return ids.map((id) => puede.get(id)).filter(Boolean);
}

/** El tamaño de un widget: el que eligió la persona si lo admite, o con el que nace. */
export function tamanoDe(widget, config = null) {
  const elegido = config && config.tamanos ? config.tamanos[widget.id] : undefined;
  return elegido && widget.admite.includes(elegido) ? elegido : widget.nace;
}

/**
 * Lo que una configuración guardada tiene de basura, fuera: ids que el catálogo
 * ya no tiene, repetidos, tamaños que el widget no admite. Una configuración que
 * no se entiende vale `null` (los defaults), no una pantalla rota.
 */
export function sanear(catalogo, crudo) {
  if (!crudo || typeof crudo !== 'object' || !Array.isArray(crudo.orden)) return null;
  const porId = new Map(catalogo.widgets.map((w) => [w.id, w]));
  const orden = [...new Set(crudo.orden.filter((x) => typeof x === 'string' && porId.has(x)))];
  const tamanos = {};
  if (crudo.tamanos && typeof crudo.tamanos === 'object') {
    for (const [id, t] of Object.entries(crudo.tamanos)) {
      if (porId.has(id) && porId.get(id).admite.includes(t)) tamanos[id] = t;
    }
  }
  return Object.keys(tamanos).length ? { orden, tamanos } : { orden };
}

/* Toda edición parte de lo que la persona VE: si nunca ajustó, de los defaults. */
function base(catalogo, ctx, config) {
  return config ?? { orden: widgetsDeInicio(catalogo, ctx, null).map((w) => w.id) };
}

/** Mostrar u ocultar un widget. Al mostrarlo, va al final. */
export function alternar(catalogo, ctx, config, id) {
  const b = base(catalogo, ctx, config);
  const orden = b.orden.includes(id) ? b.orden.filter((x) => x !== id) : [...b.orden, id];
  return { ...b, orden };
}

/** Mover un widget un lugar (`-1` sube, `+1` baja). En los bordes no hace nada. */
export function mover(catalogo, ctx, config, id, paso) {
  const b = base(catalogo, ctx, config);
  const i = b.orden.indexOf(id);
  const j = i + paso;
  if (i < 0 || j < 0 || j >= b.orden.length) return b;
  const orden = [...b.orden];
  [orden[i], orden[j]] = [orden[j], orden[i]];
  return { ...b, orden };
}

/** Cambiar el tamaño de un widget, si lo admite. */
export function conTamano(catalogo, ctx, config, id, tamano) {
  const b = base(catalogo, ctx, config);
  const w = catalogo.widgets.find((x) => x.id === id);
  if (!w || !w.admite.includes(tamano)) return b;
  return { ...b, tamanos: { ...(b.tamanos || {}), [id]: tamano } };
}

/** «Como al principio»: los defaults del rol, y los que vengan. */
export const deFabrica = () => null;

/**
 * El panel de ajustar: todos los que puede ver, los puestos primero (en su
 * orden) y después los que no, apagados.
 */
export function panelDeAjuste(catalogo, ctx, config) {
  const puestos = widgetsDeInicio(catalogo, ctx, config);
  const ids = new Set(puestos.map((w) => w.id));
  return [
    ...puestos.map((widget) => ({ widget, visible: true })),
    ...permitidos(catalogo, ctx).filter((w) => !ids.has(w.id)).map((widget) => ({ widget, visible: false })),
  ];
}

/**
 * Cuántas columnas ocupa cada widget, con las filas llenas (de la app de
 * origen: «llenar las filas»). Se ponen en orden; cuando el siguiente no entra
 * en lo que queda de la fila, el último de la fila se estira hasta cerrarla. El
 * último de todos también: un hueco al final de la rejilla se lee como algo que
 * falta.
 *
 * @param {number[]} anchos  las columnas de cada widget, en orden
 * @returns {number[]}       las columnas que termina ocupando cada uno
 */
export function llenarFilas(anchos, columnas = COLUMNAS) {
  const salida = anchos.map((a) => Math.min(Math.max(1, a), columnas));
  let usadas = 0;
  for (let i = 0; i < salida.length; i += 1) {
    if (usadas + salida[i] > columnas) {
      salida[i - 1] += columnas - usadas;
      usadas = 0;
    }
    usadas += salida[i];
    if (usadas === columnas) usadas = 0;
  }
  if (usadas > 0 && salida.length) salida[salida.length - 1] += columnas - usadas;
  return salida;
}
