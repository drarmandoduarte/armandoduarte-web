import { rutaDeComprobante } from '@codice/core';
import { supabase } from '../supabase';

/**
 * Subir el comprobante a Storage **desde el navegador, con la sesión del
 * cliente** — orden #27 C.1. Es la única excepción a «Mi espacio no le habla a
 * la base desde el navegador» (#15, A), y está declarada con su forma exacta en
 * `src/sin-base-desde-el-navegador.test.ts`.
 *
 * ── Por qué acá y no por la API ─────────────────────────────────────────
 * La API es una función de Vercel con **tope de 4,5 MB por cuerpo**, y un
 * comprobante puede pesar 5. Pasarlo por la API sería rechazar en el borde
 * fotos que el bucket acepta.
 *
 * ── Por qué no esquiva al kit ───────────────────────────────────────────
 * Lo que el guardián de la #15 cuida es que una **lectura** no se salte el
 * segundo paso. Esto no lee nada: **escribe un archivo en la carpeta de una
 * inscripción propia**, y quién puede escribir dónde lo decide la policy
 * `comprobantes_el_cliente_sube_al_suyo` (006), probada en el banco. Que el
 * archivo cuente como pago lo decide después la API (`POST /api/pagos/declarar`),
 * con el guard del kit y la policy del libro (003). Subir sin declarar no
 * cambia ningún estado.
 *
 * `upsert: false`: un archivo no se pisa. El nombre es un uuid nuevo, nunca el
 * nombre del archivo de la persona.
 */
export const BUCKET_DE_COMPROBANTES = 'comprobantes';

export async function subirComprobante(inscripcionId: string, archivo: File): Promise<string> {
  const ruta = rutaDeComprobante(inscripcionId, crypto.randomUUID(), archivo.type);
  const { error } = await supabase.storage.from(BUCKET_DE_COMPROBANTES).upload(ruta, archivo, {
    contentType: archivo.type,
    upsert: false,
  });
  if (error) throw new Error('No se pudo subir el comprobante.');
  return ruta;
}
