/**
 * Cursos y ediciones: lo que el panel valida antes de guardar — orden #24 A.
 *
 * Las reglas copian las de la base (migración 002) y agregan lo que la base no
 * puede decir en español al lado de cada campo. **La base sigue siendo la que
 * manda**: si esto se equivoca, el `check` de Postgres rechaza igual. Lo que se
 * gana acá es el mensaje claro antes de ir y volver.
 *
 * Los errores son **claves de i18n** (`equipo.errores.*`), no textos: el texto
 * es de `familia.json`.
 */
import { esZonaValida, instanteDesdeHoraDePared } from './zonas';

export const ESTADOS_DE_CURSO = ['borrador', 'publicado', 'archivado'] as const;
export type EstadoDeCurso = (typeof ESTADOS_DE_CURSO)[number];

export const MODALIDADES = ['presencial', 'en_linea'] as const;
export type Modalidad = (typeof MODALIDADES)[number];

export const ESTADOS_DE_EDICION = ['abierta', 'cerrada', 'realizada'] as const;
export type EstadoDeEdicion = (typeof ESTADOS_DE_EDICION)[number];

/** La zona por defecto de una edición nueva: la de Armando (orden #24 A.1). */
export const ZONA_POR_DEFECTO = 'America/Merida';
export const MONEDA_POR_DEFECTO = 'MXN';

/** El mismo patrón que el `check` de `cursos.slug` en la 002. */
export const PATRON_DE_SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * El slug que se propone desde el título: minúsculas, sin acentos, la «ñ» como
 * «n» y guiones simples. «El arte de amar a tu adolescente» →
 * `el-arte-de-amar-a-tu-adolescente`. Es una propuesta: el campo se puede editar.
 */
export function slugDesdeTitulo(titulo: string): string {
  return titulo
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');
}

export type Errores<K extends string> = Partial<Record<K, string>>;

export interface CursoEntrada {
  titulo: string;
  bajada: string;
  descripcion: string;
  modalidad: string;
  slug: string;
  estado: string;
}

export function validarCurso(e: CursoEntrada): Errores<keyof CursoEntrada> {
  const errores: Errores<keyof CursoEntrada> = {};
  const titulo = e.titulo.trim();
  if (titulo.length === 0) errores.titulo = 'equipo.errores.tituloFalta';
  else if (titulo.length > 140) errores.titulo = 'equipo.errores.tituloLargo';
  if (e.bajada.trim().length > 280) errores.bajada = 'equipo.errores.bajadaLarga';
  if (!e.slug) errores.slug = 'equipo.errores.slugFalta';
  else if (!PATRON_DE_SLUG.test(e.slug)) errores.slug = 'equipo.errores.slugForma';
  if (!(MODALIDADES as readonly string[]).includes(e.modalidad)) errores.modalidad = 'equipo.errores.modalidad';
  if (!(ESTADOS_DE_CURSO as readonly string[]).includes(e.estado)) errores.estado = 'equipo.errores.estado';
  return errores;
}

/** Lo que se manda a guardar: recortado y con nulo en vez de cadena vacía. */
export function cursoParaGuardar(e: CursoEntrada) {
  const opcional = (v: string) => (v.trim() === '' ? null : v.trim());
  return {
    titulo: e.titulo.trim(),
    bajada: opcional(e.bajada),
    descripcion: opcional(e.descripcion),
    modalidad: e.modalidad as Modalidad,
    slug: e.slug,
    estado: e.estado as EstadoDeCurso,
  };
}

/**
 * Una edición como la escribe el panel: horas de pared en la zona de la
 * edición (`AAAA-MM-DDTHH:mm`) y números como texto, que es lo que dan los
 * campos.
 */
export interface EdicionEntrada {
  inicio: string;
  fin: string;
  zona: string;
  sede: string;
  ciudad: string;
  pais: string;
  cupo: string;
  precio: string;
  inscripcionesHasta: string;
  estado: string;
}

const ENTERO = /^\d+$/;
const MONTO = /^\d+(\.\d{1,2})?$/;

export function validarEdicion(e: EdicionEntrada): Errores<keyof EdicionEntrada> {
  const errores: Errores<keyof EdicionEntrada> = {};
  const zonaValida = esZonaValida(e.zona);
  if (!zonaValida) errores.zona = 'equipo.errores.zona';

  const inicio = zonaValida ? instanteDesdeHoraDePared(e.inicio, e.zona) : null;
  const fin = zonaValida ? instanteDesdeHoraDePared(e.fin, e.zona) : null;
  if (!e.inicio) errores.inicio = 'equipo.errores.inicioFalta';
  else if (zonaValida && !inicio) errores.inicio = 'equipo.errores.fechaForma';
  if (!e.fin) errores.fin = 'equipo.errores.finFalta';
  else if (zonaValida && !fin) errores.fin = 'equipo.errores.fechaForma';
  else if (inicio && fin && Date.parse(fin) <= Date.parse(inicio)) errores.fin = 'equipo.errores.finAntes';

  if (e.inscripcionesHasta) {
    const hasta = zonaValida ? instanteDesdeHoraDePared(e.inscripcionesHasta, e.zona) : null;
    if (zonaValida && !hasta) errores.inscripcionesHasta = 'equipo.errores.fechaForma';
    else if (hasta && fin && Date.parse(hasta) > Date.parse(fin)) {
      errores.inscripcionesHasta = 'equipo.errores.hastaDespues';
    }
  }

  if (e.pais && !/^[A-Z]{2}$/.test(e.pais)) errores.pais = 'equipo.errores.pais';
  if (e.cupo && (!ENTERO.test(e.cupo) || Number(e.cupo) < 1)) errores.cupo = 'equipo.errores.cupo';
  if (e.precio && !MONTO.test(e.precio)) errores.precio = 'equipo.errores.precio';
  if (!(ESTADOS_DE_EDICION as readonly string[]).includes(e.estado)) errores.estado = 'equipo.errores.estado';
  return errores;
}

/** La fila como la guarda la base. Solo se llama con una entrada sin errores. */
export function edicionParaGuardar(e: EdicionEntrada) {
  const opcional = (v: string) => (v.trim() === '' ? null : v.trim());
  return {
    inicio: instanteDesdeHoraDePared(e.inicio, e.zona),
    fin: instanteDesdeHoraDePared(e.fin, e.zona),
    zona: e.zona,
    sede: opcional(e.sede),
    ciudad: opcional(e.ciudad),
    pais: opcional(e.pais.toUpperCase()),
    cupo: e.cupo ? Number(e.cupo) : null,
    precio_monto: e.precio ? Number(e.precio) : null,
    precio_moneda: e.precio ? MONEDA_POR_DEFECTO : null,
    inscripciones_hasta: e.inscripcionesHasta ? instanteDesdeHoraDePared(e.inscripcionesHasta, e.zona) : null,
    estado: e.estado as EstadoDeEdicion,
  };
}

/** «23 / 60», o «23» si la edición no tiene tope. `null` si no se sabe. */
export function ocupacion(inscriptos: number | null, cupo: number | null): string {
  if (inscriptos === null) return '—';
  return cupo ? `${inscriptos} / ${cupo}` : String(inscriptos);
}

/** «$1,170 MXN»: sin centavos cuando es entero, con el código al lado. */
export function formatearPrecio(monto: number | null, moneda: string | null, idioma = 'es-MX'): string {
  if (monto === null || moneda === null) return '—';
  const n = new Intl.NumberFormat(idioma, {
    minimumFractionDigits: Number.isInteger(monto) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(monto);
  return `$${n} ${moneda}`;
}
