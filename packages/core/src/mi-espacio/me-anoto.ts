/**
 * «Me anoto»: lo que Mi espacio decide antes de pintar — orden #24 B.
 *
 * Todo lo de acá es una regla y por eso vive en `core` (regla 1 de la casa):
 * a dónde se puede ir después de entrar (`?ir=`), qué taller eligió quien llegó
 * por `/me-anoto/<slug>`, qué datos faltan para anotarse, cuándo se dice
 * «Quedan 12 lugares» y cómo se escribe la fecha en las dos zonas (D15).
 *
 * La base sigue teniendo la última palabra: el cupo, la edición abierta y el
 * duplicado los decide la 009. Esto es lo que la pantalla necesita para decirlo
 * bien y antes.
 *
 * Los errores son **claves de i18n** (`miEspacio.errores.*`), no textos.
 */
import { telefonoParaWa } from '../panel/listas';
import { TELEFONO_GABY, enlaceWhatsApp } from '../web/contacto';
import { PATRON_DE_SLUG } from '../panel/cursos';
import { ciudadDeZona, esZonaValida, horaCorta, horaDeParedDe } from '../panel/zonas';

/* ── A dónde se va después de entrar (`/entrar?ir=…`) ───────────────────── */

/**
 * La ruta de `?ir=` si es **de esta app**, o `null`.
 *
 * Lo que entra: una ruta que empieza con una sola `/`. Lo que no, y por qué
 * cada uno:
 *   · `https://otro.sitio`, `javascript:…` — un esquema es salir de la app;
 *   · `//otro.sitio` — sin esquema, el navegador lo lee como «mismo protocolo,
 *     otro sitio»;
 *   · `/\otro.sitio` — los navegadores tratan `\` como `/`, así que es `//`
 *     disfrazado;
 *   · espacios y caracteres de control — un `\t` o un salto de línea en el medio
 *     de una URL los saca el navegador, y lo que queda puede ser otra cosa.
 * Con `null`, quien llama manda a Mi espacio, que es lo que pide la orden.
 */
export function rutaInternaSegura(ir: string | null | undefined): string | null {
  if (typeof ir !== 'string' || ir.length === 0 || ir.length > 512) return null;
  if (!ir.startsWith('/')) return null;
  if (ir.startsWith('//')) return null;
  if (ir.includes('\\')) return null;
  // eslint-disable-next-line no-control-regex
  if (/[\s\u0000-\u001f\u007f]/.test(ir)) return null;
  return ir;
}

/** La ruta de «Me anoto» con un taller ya elegido: `/me-anoto/<slug>`. */
export const PREFIJO_ME_ANOTO = '/me-anoto/';

/** El slug de `/me-anoto/<slug>`, o `null` si la ruta no es ésa o el slug no tiene forma de slug. */
export function slugDeMeAnoto(ruta: string): string | null {
  if (!ruta.startsWith(PREFIJO_ME_ANOTO)) return null;
  const slug = ruta.slice(PREFIJO_ME_ANOTO.length).replace(/\/$/, '');
  return PATRON_DE_SLUG.test(slug) ? slug : null;
}

/* ── Los datos que hacen falta para anotarse ──────────────────────────────── */

export const DATOS_PARA_ANOTARSE = ['nombre', 'apellido', 'whatsapp'] as const;
export type DatoParaAnotarse = (typeof DATOS_PARA_ANOTARSE)[number];
export type DatosParaAnotarse = Record<DatoParaAnotarse, string>;

/**
 * Cuáles de los tres faltan en la ficha. Un WhatsApp que no sirve (menos de 8
 * dígitos) cuenta como faltante: sin él no hay forma de avisarle del taller.
 */
export function datosQueFaltan(
  persona: { nombre?: string | null; apellido?: string | null; whatsapp?: string | null } | null,
): DatoParaAnotarse[] {
  const faltan: DatoParaAnotarse[] = [];
  if (!persona?.nombre?.trim()) faltan.push('nombre');
  if (!persona?.apellido?.trim()) faltan.push('apellido');
  if (!telefonoParaWa(persona?.whatsapp)) faltan.push('whatsapp');
  return faltan;
}

/** Lo que se pidió en el paso de «Me anoto»: solo los campos que faltaban. */
export function validarDatosParaAnotarse(
  entrada: Partial<DatosParaAnotarse>,
  pedidos: readonly DatoParaAnotarse[],
): Partial<Record<DatoParaAnotarse, string>> {
  const errores: Partial<Record<DatoParaAnotarse, string>> = {};
  for (const campo of pedidos) {
    const valor = (entrada[campo] ?? '').trim();
    if (campo === 'whatsapp') {
      if (!telefonoParaWa(valor)) errores.whatsapp = 'miEspacio.errores.whatsapp';
    } else if (valor.length === 0) {
      errores[campo] = `miEspacio.errores.${campo}`;
    } else if (valor.length > 80) {
      errores[campo] = 'miEspacio.errores.largo';
    }
  }
  return errores;
}

/** Lo que viaja a la API: los pedidos, recortados; nada que no se haya pedido. */
export function datosParaEnviar(
  entrada: Partial<DatosParaAnotarse>,
  pedidos: readonly DatoParaAnotarse[],
): Partial<DatosParaAnotarse> {
  const salida: Partial<DatosParaAnotarse> = {};
  for (const campo of pedidos) salida[campo] = (entrada[campo] ?? '').trim();
  return salida;
}

/* ── Los lugares ──────────────────────────────────────────────────────────── */

/** «Quedan 12 lugares» se dice **solo** desde acá para abajo (orden #24 B). */
export const UMBRAL_DE_LUGARES = 15;

export type EstadoDelTaller =
  | { tipo: 'anotado'; referencia: string }
  | { tipo: 'sin-lugares' }
  | { tipo: 'disponible'; quedan: number | null };

/**
 * Qué se le dice a la persona de un taller. Anotada gana a todo: quien tiene
 * su lugar lo ve aunque el taller se haya llenado después. `quedan` viene en
 * `null` cuando no hay que decir el número (sin tope, o más de 15).
 */
export function estadoDelTaller(t: { lugares: number | null; mi_referencia: string | null }): EstadoDelTaller {
  if (t.mi_referencia) return { tipo: 'anotado', referencia: t.mi_referencia };
  if (t.lugares !== null && t.lugares <= 0) return { tipo: 'sin-lugares' };
  return { tipo: 'disponible', quedan: t.lugares !== null && t.lugares <= UMBRAL_DE_LUGARES ? t.lugares : null };
}

/* ── La fecha, en la zona de la edición y en la de la persona (D15) ───────── */

/**
 * «jueves, 5 de noviembre de 2026» + «8:30 a 13:00» en la zona de la edición;
 * y, si la persona vive en otra zona **cuya hora de pared es distinta**, la
 * suya al lado. Se compara la hora y no el nombre de la zona: `America/Merida`
 * y `America/Mexico_City` son dos nombres con la misma hora en noviembre, y
 * escribir dos veces «8:30» no le dice nada a nadie.
 */
export function fechasDelTaller(
  t: { inicio: string; fin: string; zona: string; ciudad?: string | null },
  zonaDeLaPersona: string | null | undefined,
  idioma = 'es-MX',
): { dia: string; horario: string; ciudad: string; enTuZona: { dia: string; horario: string } | null } {
  /* «Jueves, 5 de noviembre de 2026»: mayúscula solo en la primera letra, porque
     abre el renglón. Con `text-transform:capitalize` en el CSS salía «5 De
     Noviembre De», que se vio en la primera captura de la #24 B. */
  const dia = conMayuscula(new Intl.DateTimeFormat(idioma, {
    timeZone: t.zona, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(t.inicio)));
  const horario = `${horaCorta(t.inicio, t.zona)} a ${horaCorta(t.fin, t.zona)}`;
  const ciudad = t.ciudad?.trim() || ciudadDeZona(t.zona);

  let enTuZona: { dia: string; horario: string } | null = null;
  if (zonaDeLaPersona && esZonaValida(zonaDeLaPersona)
      && horaDeParedDe(t.inicio, zonaDeLaPersona) !== horaDeParedDe(t.inicio, t.zona)) {
    enTuZona = {
      dia: new Intl.DateTimeFormat(idioma, {
        timeZone: zonaDeLaPersona, weekday: 'long', day: 'numeric', month: 'long',
      }).format(new Date(t.inicio)),
      horario: `${horaCorta(t.inicio, zonaDeLaPersona)} a ${horaCorta(t.fin, zonaDeLaPersona)}`,
    };
  }
  return { dia, horario, ciudad, enTuZona };
}

function conMayuscula(texto: string): string {
  return texto.charAt(0).toLocaleUpperCase('es') + texto.slice(1);
}

/* ── Qué taller se abre al llegar por `/me-anoto/<slug>` ──────────────────── */

/**
 * La edición que se abre sola: la primera **disponible** del curso del slug.
 * Si ese curso no tiene ninguna disponible (lleno, o ya anotada), se devuelve
 * la primera que haya de ese curso, para que la persona vea por qué; y si el
 * curso no está en la lista, `null` y la pantalla lo dice.
 */
export function edicionElegida<T extends { edicion_id: string; curso_slug: string; lugares: number | null; mi_referencia: string | null }>(
  talleres: readonly T[],
  slug: string | null,
): T | null {
  if (!slug) return null;
  const delCurso = talleres.filter((t) => t.curso_slug === slug);
  return delCurso.find((t) => estadoDelTaller(t).tipo === 'disponible') ?? delCurso[0] ?? null;
}

/**
 * La edición cuyo «Me anoto» va en naranja: la elegida si está disponible, si no
 * la primera disponible. **Una por pantalla** (D26): las demás van en contorno.
 */
export function edicionPrincipal<T extends { edicion_id: string; lugares: number | null; mi_referencia: string | null }>(
  talleres: readonly T[],
  elegida: string | null,
): string | null {
  const disponible = (t: T) => estadoDelTaller(t).tipo === 'disponible';
  const laElegida = talleres.find((t) => t.edicion_id === elegida);
  if (laElegida && disponible(laElegida)) return laElegida.edicion_id;
  return talleres.find(disponible)?.edicion_id ?? null;
}

/* ── El estado de una inscripción, como clave de texto ────────────────────── */

export const ESTADOS_DE_INSCRIPCION = ['pendiente_de_pago', 'en_revision', 'confirmada', 'anulada'] as const;

/** La clave de i18n del estado que deriva `estado_inscripcion()` (003). */
export function claveDeEstado(estado: string): string {
  return (ESTADOS_DE_INSCRIPCION as readonly string[]).includes(estado)
    ? `miEspacio.estados.${estado}`
    : 'miEspacio.estados.desconocido';
}

/* ── Sin datos de cobro cargados: el enlace a Gaby ────────────────────────── */

/**
 * Si `datos_de_cobro` está vacía, la confirmación no inventa una cuenta: dice
 * «te mandamos los datos por WhatsApp» y ofrece escribirle a Gaby con la
 * referencia ya puesta. Los datos reales los carga el CEO por SQL en Supabase,
 * **nunca en el repo** (es público).
 */
export function enlaceParaPedirLosDatosDeCobro(mensaje: string): string {
  return enlaceWhatsApp(TELEFONO_GABY, mensaje);
}
