/**
 * Los textos de los dos correos de pagos — orden #27 C.3.
 *
 * ── Por qué hay una copia acá, y quién la vigila ────────────────────────
 * La fuente es `familia.json` (`correos.*`), que es donde se revisa todo texto
 * de la app. Pero la API **no puede importar `@codice/core`**: exporta su
 * fuente `.ts` y la función de Vercel no compila los paquetes del workspace (lo
 * vigila `apps/familia/src/la-api-llega-compilada.test.ts`; está en el informe
 * de la #24 B como decisión de dirección). Así que el texto vive dos veces, y
 * `correo.spec.ts` compara esta copia con `familia.json` **campo por campo**:
 * si alguien edita uno y no el otro, cae.
 *
 * Tuteo mexicano. Sin «voz»: es un correo escrito por el equipo.
 */
export const TEXTOS_DE_CORREO = {
  saludo: 'Hola, {{nombre}}:',
  saludoSinNombre: 'Hola:',
  firma: 'Equipo de Armando Duarte',
  confirmado: {
    asunto: 'Tu lugar en {{curso}} está confirmado · {{referencia}}',
    cuerpo:
      'Recibimos tu pago y tu lugar en «{{curso}}» está confirmado.\n\n'
      + 'Referencia: {{referencia}}\n'
      + 'Cuándo: {{fecha}}, {{horario}} (hora de {{ciudad}})\n'
      + 'Dónde: {{sede}}\n\n'
      + 'Todo lo de tu taller está en Mi espacio: {{enlace}}\n\n'
      + 'Nos vemos pronto.',
  },
  rechazado: {
    asunto: 'Revisamos tu comprobante de {{curso}} · {{referencia}}',
    cuerpo:
      'Revisamos el comprobante que subiste para «{{curso}}» (referencia {{referencia}}) y no pudimos confirmarlo:\n\n'
      + '{{motivo}}\n\n'
      + 'Puedes subir otro desde Mi espacio: {{enlace}}\n\n'
      + 'Si tienes dudas, escríbenos por WhatsApp.',
  },
} as const;

/** `{{clave}}` → valor. Una clave sin valor queda vacía, nunca como `{{clave}}`. */
export function rellenar(plantilla: string, valores: Record<string, string>): string {
  return plantilla.replace(/\{\{(\w+)\}\}/g, (_, clave: string) => valores[clave] ?? '');
}
