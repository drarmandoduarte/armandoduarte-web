/**
 * Lo que devuelve `/api/equipo/*` — la forma de las funciones de la migración
 * 008 (`panel_cursos`, `panel_inscriptos`, `panel_clientes`). Si una columna
 * cambia allá, cambia acá.
 */

export interface EdicionDelPanel {
  id: string;
  inicio: string;
  fin: string;
  zona: string;
  sede: string | null;
  ciudad: string | null;
  pais: string | null;
  cupo: number | null;
  precio_monto: number | null;
  precio_moneda: string | null;
  inscripciones_hasta: string | null;
  estado: string;
  /** Todas las de la edición, sin mirar territorio: el cupo es uno solo. */
  inscriptos: number | null;
}

export interface CursoDelPanel {
  id: string;
  slug: string;
  titulo: string;
  bajada: string | null;
  descripcion: string | null;
  modalidad: string;
  estado: string;
  ediciones: EdicionDelPanel[];
}

export interface Inscripto {
  inscripcion_id: string;
  referencia: string;
  nombre: string | null;
  apellido: string | null;
  email: string;
  whatsapp: string | null;
  pais: string | null;
  inscripto_el: string;
  estado: string;
  /* #27 C: el libro de la inscripción, de `libro_de_edicion()` (010). Nulos si no tiene renglones. */
  ultimo_tipo: string | null;
  ultimo_el: string | null;
  ultimo_por: string | null;
  ultima_nota: string | null;
  monto_declarado: number | string | null;
  moneda_declarada: string | null;
  fecha_transferencia: string | null;
  banco: string | null;
  ultimos4_o_folio: string | null;
  comprobante_path: string | null;
  monto_confirmado: number | string | null;
  moneda_confirmada: string | null;
}

export interface Cliente {
  persona_id: string;
  nombre: string | null;
  apellido: string | null;
  email: string;
  whatsapp: string | null;
  pais: string | null;
  alta: string;
  cursos: number;
  ultimo_curso: string | null;
  ultima_inscripcion: string | null;
  rol: string | null;
  territorio: string | null;
  activo: boolean | null;
}

/** «Ana López», o el correo si todavía no completó su nombre. */
export function nombreCompleto(p: { nombre: string | null; apellido: string | null }, respaldo: string): string {
  const nombre = [p.nombre, p.apellido].filter(Boolean).join(' ').trim();
  return nombre || respaldo;
}
