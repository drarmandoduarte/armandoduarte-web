import { Injectable, Logger } from '@nestjs/common';

/**
 * El correo al cliente cuando el equipo confirma o rechaza su pago — orden #27 C.3.
 *
 * ── Resend por `fetch`, sin dependencia nueva ───────────────────────────
 * Es un `POST` a `https://api.resend.com/emails` con la clave en el header:
 * para eso no hace falta el SDK, y CLAUDE.md pide justificar cada dependencia.
 * El remitente es **el mismo de los códigos de entrada**, pero esos los manda
 * Supabase por SMTP con su propia configuración; la API no la lee. Por eso son
 * dos variables de Vercel, que carga dirección y el repo solo nombra:
 *
 *   · `RESEND_API_KEY`  — la clave de Resend.
 *   · `CORREO_REMITENTE` — «Armando Duarte <…@…>», la misma dirección que usa
 *     el SMTP de Supabase.
 *
 * ── El correo es cortesía; el libro es la verdad ────────────────────────
 * `enviar()` **nunca tira**. Si falta una variable, si Resend contesta mal o si
 * la red falla, devuelve `false` y anota un warn — y la confirmación, que ya
 * quedó escrita en el libro, queda igual. El controlador no espera nada de
 * acá para contestar «listo».
 *
 * Y el log no lleva la dirección de nadie, ni el cuerpo del correo: solo qué
 * pasó (CLAUDE.md, PII).
 */
export interface Correo {
  para: string;
  asunto: string;
  texto: string;
}

@Injectable()
export class CorreoService {
  private readonly logger = new Logger(CorreoService.name);

  async enviar(correo: Correo): Promise<boolean> {
    const clave = process.env.RESEND_API_KEY?.trim();
    const remitente = process.env.CORREO_REMITENTE?.trim();
    if (!clave || !remitente) {
      this.logger.warn('El correo no salió: falta RESEND_API_KEY o CORREO_REMITENTE en el entorno.');
      return false;
    }
    try {
      const respuesta = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${clave}`, 'Content-Type': 'application/json' },
        /* Solo texto: sin HTML pesado y sin imágenes externas (orden #27 C.3). */
        body: JSON.stringify({ from: remitente, to: [correo.para], subject: correo.asunto, text: correo.texto }),
      });
      if (!respuesta.ok) {
        this.logger.warn(`El correo no salió: Resend contestó ${respuesta.status}.`);
        return false;
      }
      return true;
    } catch (error) {
      this.logger.warn(`El correo no salió: ${(error as { name?: string })?.name ?? 'error de red'}.`);
      return false;
    }
  }
}
