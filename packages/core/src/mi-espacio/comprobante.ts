/**
 * «Ya transferí, subo mi comprobante» — orden #27 C.1.
 *
 * Las reglas del paso de subir, fuera del `.tsx` (regla 1 de la casa): qué
 * archivo se acepta, a qué ruta va, qué fecha se propone y qué dice cada error.
 * Que la persona pueda subir a esa carpeta lo decide la policy de la 006; que
 * pueda declarar, la de la 003. Esto solo dice en español lo que va a pasar
 * **antes** de gastar una subida.
 */

/** Los tres tipos del bucket `comprobantes` (006), con su extensión. */
export const TIPOS_DE_COMPROBANTE = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'application/pdf': 'pdf',
} as const;
export type TipoDeComprobante = keyof typeof TIPOS_DE_COMPROBANTE;

/** 5 MB exactos, como el `file_size_limit` del bucket (5 × 1024 × 1024). */
export const TOPE_DE_COMPROBANTE = 5 * 1024 * 1024;

/** Lo que el `<input type="file">` acepta: lo mismo que el bucket. */
export const ACEPTA_COMPROBANTE = '.jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf';

const esTipo = (tipo: string): tipo is TipoDeComprobante => tipo in TIPOS_DE_COMPROBANTE;

/**
 * La clave de `familia.json` del problema del archivo, o `null` si sirve.
 * Vacío cuenta como falta: un archivo de 0 bytes no es un comprobante.
 */
export function validarArchivoDeComprobante(
  archivo: { type: string; size: number } | null | undefined,
): string | null {
  if (!archivo || archivo.size === 0) return 'miEspacio.comprobante.errores.falta';
  if (!esTipo(archivo.type)) return 'miEspacio.comprobante.errores.tipo';
  if (archivo.size > TOPE_DE_COMPROBANTE) return 'miEspacio.comprobante.errores.pesado';
  return null;
}

/**
 * `<inscripcion_id>/<uuid>.<ext>`: la forma que la policy
 * `comprobantes_el_cliente_sube_al_suyo` (006) lee — la primera carpeta es la
 * inscripción — y que la API vuelve a comprobar (`RUTA_AJENA`). El nombre es un
 * uuid nuevo: nunca el nombre del archivo de la persona, que puede decir cosas.
 */
export function rutaDeComprobante(inscripcionId: string, uuid: string, tipo: string): string {
  if (!esTipo(tipo)) throw new Error(`tipo de comprobante no admitido: ${tipo}`);
  return `${inscripcionId}/${uuid}.${TIPOS_DE_COMPROBANTE[tipo]}`;
}

/** «2026-10-01» en la zona que se pide: la fecha de hoy **para la persona** (D15). */
export function fechaDeHoyEn(zona: string | null, ahora: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: zona ?? undefined, year: 'numeric', month: '2-digit', day: '2-digit' })
      .format(ahora);
  } catch {
    return ahora.toISOString().slice(0, 10);
  }
}

/** Lo que la persona escribe en el paso de subir. Todo texto: así llega del formulario. */
export interface DeclaracionEntrada {
  fecha_transferencia: string;
  monto: string;
  banco: string;
  ultimos4_o_folio: string;
}
export type CampoDeDeclaracion = keyof DeclaracionEntrada;

/** «1,170.50», «1170», «$1 170»: se queda con dígitos y un punto decimal. */
export function montoDesdeTexto(texto: string): number | null {
  const limpio = texto.replace(/[$\s,]/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(limpio)) return null;
  const n = Number(limpio);
  return Number.isFinite(n) ? n : null;
}

/**
 * Los errores del paso, por campo, como claves de `familia.json`. La fecha no
 * puede ser de mañana en adelante **en la zona de la persona** (`hoy`), y el
 * monto tiene que ser mayor que cero. El folio es opcional.
 */
export function validarDeclaracion(
  d: DeclaracionEntrada,
  hoy: string,
): Partial<Record<CampoDeDeclaracion, string>> {
  const errores: Partial<Record<CampoDeDeclaracion, string>> = {};
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.fecha_transferencia)) errores.fecha_transferencia = 'miEspacio.comprobante.errores.fecha';
  else if (d.fecha_transferencia > hoy) errores.fecha_transferencia = 'miEspacio.comprobante.errores.fechaFutura';
  const monto = montoDesdeTexto(d.monto);
  if (monto === null || monto <= 0) errores.monto = 'miEspacio.comprobante.errores.monto';
  if (d.banco.trim() === '') errores.banco = 'miEspacio.comprobante.errores.banco';
  else if (d.banco.trim().length > 80) errores.banco = 'miEspacio.errores.largo';
  if (d.ultimos4_o_folio.trim().length > 40) errores.ultimos4_o_folio = 'miEspacio.errores.largo';
  return errores;
}

/** El cuerpo de `POST /api/pagos/declarar`, a partir de lo escrito (ya validado). */
export function declaracionParaEnviar(
  d: DeclaracionEntrada,
  inscripcionId: string,
  ruta: string,
  moneda: string | null,
) {
  return {
    inscripcion_id: inscripcionId,
    comprobante_path: ruta,
    fecha_transferencia: d.fecha_transferencia,
    monto: montoDesdeTexto(d.monto) ?? 0,
    moneda: moneda ?? 'MXN',
    banco: d.banco.trim(),
    ultimos4_o_folio: d.ultimos4_o_folio.trim() || null,
  };
}

/**
 * ¿Se le ofrece «Ya transferí»? Solo cuando falta el pago —que incluye
 * después de un rechazo, porque `rechazado` vuelve a `pendiente_de_pago`
 * (003)—. Con uno en revisión no: no se suben dos por la misma declaración.
 */
export function puedeDeclarar(estado: string): boolean {
  return estado === 'pendiente_de_pago';
}

/**
 * La acción principal de Mi espacio (D26: un naranja por pantalla).
 *
 * Si la persona llegó por `/me-anoto/<slug>` y hay un «Me anoto» para darle, es
 * ése: vino a eso. Si no, **pagar lo que debe** va antes que anotarse a otro, y
 * anotarse antes que «Guardar». Devuelve qué cosa lleva el naranja.
 */
export function principalDeMiEspacio(c: {
  vinoAAnotarse: boolean;
  hayMeAnoto: boolean;
  hayPagoPendiente: boolean;
}): 'me-anoto' | 'pago' | 'guardar' {
  if (c.vinoAAnotarse && c.hayMeAnoto) return 'me-anoto';
  if (c.hayPagoPendiente) return 'pago';
  if (c.hayMeAnoto) return 'me-anoto';
  return 'guardar';
}
