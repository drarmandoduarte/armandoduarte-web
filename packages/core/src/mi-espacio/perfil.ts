/**
 * El perfil del cliente — orden #27 D.
 *
 * País, ciudad, año de nacimiento y nivel educativo: **todos opcionales**, para
 * la analítica agregada que pidió Lucía. Se guarda el año y no la fecha
 * (minimización, LFPDPPP); la edad se calcula y nunca se muestra el año crudo en
 * el panel. Los límites son los mismos que los `check` de la migración 011: si
 * cambian allá, cambian acá (lo dicen los dos tests).
 */
import { whatsappE164, whatsappValido } from './whatsapp';

/** Los 33 países de América Latina y el Caribe (CELAC), **México primero**. */
export const PAISES_LATAM = [
  'MX', 'AG', 'AR', 'BS', 'BB', 'BZ', 'BO', 'BR', 'CL', 'CO', 'CR', 'CU', 'DM', 'DO', 'EC', 'SV', 'GD',
  'GT', 'GY', 'HT', 'HN', 'JM', 'NI', 'PA', 'PY', 'PE', 'KN', 'LC', 'VC', 'SR', 'TT', 'UY', 'VE',
] as const;

/** ISO 3166-1 alfa-2: los 249 códigos asignados. */
export const PAISES_ISO = (
  'AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ '
  + 'CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO '
  + 'FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE '
  + 'JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO '
  + 'MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW '
  + 'PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM '
  + 'TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW'
).split(' ');

export function esPais(codigo: string): boolean {
  return PAISES_ISO.includes(codigo);
}

/**
 * La lista para el `<select>`, con los nombres en el idioma de la pantalla
 * (`es`, `en` o `pt`) que da el propio navegador (`Intl.DisplayNames`): no se
 * mantiene una tabla de 249 nombres por idioma. **México primero**, después el
 * resto de América Latina por nombre, después todos los demás por nombre.
 */
export function paisesParaElegir(idioma = 'es'): { codigo: string; nombre: string }[] {
  let nombres: Intl.DisplayNames | null = null;
  try {
    nombres = new Intl.DisplayNames([idioma], { type: 'region' });
  } catch {
    nombres = null;
  }
  const nombre = (c: string) => nombres?.of(c) ?? c;
  const porNombre = (a: { nombre: string }, b: { nombre: string }) => a.nombre.localeCompare(b.nombre, idioma);
  const latam = new Set<string>(PAISES_LATAM);
  const resto = PAISES_ISO.filter((c) => !latam.has(c)).map((codigo) => ({ codigo, nombre: nombre(codigo) })).sort(porNombre);
  const deLatam = PAISES_LATAM.slice(1).map((codigo) => ({ codigo, nombre: nombre(codigo) })).sort(porNombre);
  return [{ codigo: 'MX', nombre: nombre('MX') }, ...deLatam, ...resto];
}

/** Los niveles de la migración 011, en orden. «Prefiero no decir» es una respuesta, no un vacío. */
export const NIVELES_EDUCATIVOS = ['primaria', 'secundaria', 'preparatoria', 'licenciatura', 'posgrado', 'prefiero_no_decir'] as const;
export type NivelEducativo = (typeof NIVELES_EDUCATIVOS)[number];

export const ANIO_MINIMO = 1920;
/** El año más reciente que se acepta: 14 años atrás, como el `check` de la 011. */
export const anioMaximo = (hoy: Date = new Date()) => hoy.getFullYear() - 14;

/** «42»: el año actual menos el de nacimiento. `null` sin año. Nunca se muestra el año crudo en el panel. */
export function edadDesdeAnio(anio: number | null | undefined, hoy: Date = new Date()): number | null {
  if (anio === null || anio === undefined || !Number.isInteger(anio)) return null;
  return hoy.getFullYear() - anio;
}

/** Lo que «Tus datos» manda: todo texto, como sale del formulario. */
export interface PerfilEntrada {
  nombre: string;
  apellido: string;
  whatsapp: string;
  pais: string;
  ciudad: string;
  anio_nacimiento: string;
  nivel_educativo: string;
}
export type CampoDelPerfil = keyof PerfilEntrada;

/** Errores por campo, como claves de `familia.json`. Vacío nunca es error: nada es obligatorio. */
export function validarPerfil(d: PerfilEntrada, hoy: Date = new Date()): Partial<Record<CampoDelPerfil, string>> {
  const errores: Partial<Record<CampoDelPerfil, string>> = {};
  for (const campo of ['nombre', 'apellido'] as const) {
    if (d[campo].trim().length > 80) errores[campo] = 'miEspacio.errores.largo';
  }
  if (d.whatsapp.trim() !== '' && !whatsappValido(d.whatsapp)) errores.whatsapp = 'miEspacio.errores.whatsappPais';
  if (d.pais !== '' && !esPais(d.pais)) errores.pais = 'miEspacio.perfil.errores.pais';
  if (d.ciudad.trim().length > 120) errores.ciudad = 'miEspacio.errores.largo';
  if (d.anio_nacimiento.trim() !== '') {
    const anio = Number(d.anio_nacimiento.trim());
    if (!/^\d{4}$/.test(d.anio_nacimiento.trim()) || anio < ANIO_MINIMO || anio > anioMaximo(hoy)) {
      errores.anio_nacimiento = 'miEspacio.perfil.errores.anio';
    }
  }
  if (d.nivel_educativo !== '' && !(NIVELES_EDUCATIVOS as readonly string[]).includes(d.nivel_educativo)) {
    errores.nivel_educativo = 'miEspacio.perfil.errores.nivel';
  }
  return errores;
}

/** El cuerpo de `POST /api/yo`: vacío viaja como `null` (así se borra un dato), el año como número. */
export function perfilParaEnviar(d: PerfilEntrada) {
  const texto = (v: string) => (v.trim() === '' ? null : v.trim());
  return {
    nombre: texto(d.nombre),
    apellido: texto(d.apellido),
    /* #32: se guarda E.164 (`+529991234567`). */
    whatsapp: d.whatsapp.trim() === '' ? null : (whatsappE164(d.whatsapp) ?? d.whatsapp.trim()),
    pais: d.pais === '' ? null : d.pais,
    ciudad: texto(d.ciudad),
    anio_nacimiento: d.anio_nacimiento.trim() === '' ? null : Number(d.anio_nacimiento.trim()),
    nivel_educativo: d.nivel_educativo === '' ? null : d.nivel_educativo,
  };
}

/** ¿Falta alguno de los cuatro datos del perfil? Para la tarjeta suave «Completa tu perfil». */
export function perfilIncompleto(p: {
  pais?: string | null; ciudad?: string | null; anio_nacimiento?: number | null; nivel_educativo?: string | null;
} | null | undefined): boolean {
  if (!p) return true;
  return !p.pais || !p.ciudad || p.anio_nacimiento === null || p.anio_nacimiento === undefined || !p.nivel_educativo;
}
