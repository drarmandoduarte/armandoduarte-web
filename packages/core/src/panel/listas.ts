/**
 * Buscar, exportar y escribir por WhatsApp: lo que hacen Inscriptos y Clientes
 * sobre las filas que la base ya dejó ver — orden #24 A.2 y A.3.
 *
 * Nada de acá decide **quién** ve una fila: eso es la RLS. Buscar achica lo que
 * ya llegó; exportar escribe lo que ya llegó.
 */
import { enlaceWhatsApp } from '../web/contacto';

/** Minúsculas y sin acentos: «López» se encuentra escribiendo «lopez». */
export function normalizarParaBuscar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/**
 * ¿Alguno de los campos contiene lo que se buscó? Con la consulta vacía, todo
 * coincide. Cada palabra de la consulta tiene que aparecer en algún campo:
 * «ana lopez» encuentra a Ana López aunque nombre y apellido sean dos campos.
 */
export function coincide(campos: (string | null | undefined)[], consulta: string): boolean {
  const palabras = normalizarParaBuscar(consulta).split(/\s+/).filter(Boolean);
  if (palabras.length === 0) return true;
  const pajar = normalizarParaBuscar(campos.filter(Boolean).join(' '));
  return palabras.every((p) => pajar.includes(p));
}

/**
 * Un CSV que Excel abre bien: UTF-8 **con BOM** (sin él, Excel en español lee
 * «MÃ©rida»), fin de línea `\r\n` y comillas cuando hacen falta.
 *
 * Y una celda que empieza con `=`, `+`, `-`, `@`, tabulador o retorno se
 * escribe con un apóstrofo delante: Excel la ejecutaría como fórmula. Un nombre
 * que alguien escribió en su registro no tiene que poder correr nada en la
 * computadora de Armando.
 */
export function aCsv(encabezados: string[], filas: (string | number | null | undefined)[][]): string {
  const celda = (v: string | number | null | undefined) => {
    let texto = v === null || v === undefined ? '' : String(v);
    if (/^[=+\-@\t\r]/.test(texto)) texto = `'${texto}`;
    return /[",\r\n;]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
  };
  const lineas = [encabezados, ...filas].map((fila) => fila.map(celda).join(','));
  return `\uFEFF${lineas.join('\r\n')}\r\n`;
}

/** El nombre del archivo: `inscriptos-el-arte-de-amar-2026-09-30.csv`. */
export function nombreDeArchivo(prefijo: string, hoy: Date): string {
  const fecha = hoy.toISOString().slice(0, 10);
  return `${prefijo}-${fecha}.csv`;
}

/**
 * El número para `wa.me`: solo dígitos, entre 8 y 15 (E.164 sin el `+`). Un
 * número que no tiene esa forma no arma enlace: se muestra como texto.
 */
export function telefonoParaWa(whatsapp: string | null | undefined): string | null {
  if (!whatsapp) return null;
  const digitos = whatsapp.replace(/\D/g, '');
  return digitos.length >= 8 && digitos.length <= 15 ? digitos : null;
}

/** El enlace al chat, con el saludo ya escrito. `null` si el número no sirve. */
export function enlaceDeSaludo(whatsapp: string | null | undefined, mensaje: string): string | null {
  const telefono = telefonoParaWa(whatsapp);
  return telefono ? enlaceWhatsApp(telefono, mensaje) : null;
}
