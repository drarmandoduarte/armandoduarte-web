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

/**
 * Los dos correos del rescate solo — orden #37, PR 2 (fase-2 §8), en los tres
 * idiomas de la entrada.
 *
 * Mismo trato que los de pagos: la fuente es `familia.json`
 * (`auth.reset.mail.*`, donde `check:i18n` exige la paridad es↔en↔pt) y esto
 * es su copia, porque la API no puede importar `@codice/core`.
 * `rescate.spec.ts` compara las dos, idioma por idioma.
 *
 *   · `confirm` — a la persona: el enlace para confirmar, y cuándo vence.
 *   · `notice` — el aviso, con el enlace para cancelar. Va al mismo correo (es
 *     el único canal que llega a todos los aparatos de la persona), y es el que
 *     frena un pedido que no hizo ella.
 */
export const TEXTOS_DEL_RESCATE = {
  es: {
    confirm: {
      subject: 'Confirma el reseteo de tu autenticador',
      body:
        'Hola:\n\nPediste resetear el autenticador de tu cuenta. Para confirmarlo, abre este enlace:\n\n{{enlace}}\n\n'
        + 'Pasadas 48 horas, el {{fecha}}, vas a poder entrar con el código por correo y configurar un autenticador nuevo.\n\n'
        + 'Si no lo pediste tú, no hagas nada: sin confirmar, el reseteo no sigue.\n\nEquipo de Armando Duarte',
    },
    notice: {
      subject: 'Aviso: se pidió resetear tu autenticador',
      body:
        'Hola:\n\nSe pidió resetear el autenticador de tu cuenta. Si fuiste tú, solo tienes que confirmarlo desde el otro correo.\n\n'
        + 'Si NO fuiste tú, cancélalo desde este enlace y tu autenticador sigue como está:\n\n{{enlace}}\n\nEquipo de Armando Duarte',
    },
  },
  en: {
    confirm: {
      subject: 'Confirm the reset of your authenticator',
      body:
        'Hello,\n\nYou asked to reset the authenticator of your account. To confirm it, open this link:\n\n{{enlace}}\n\n'
        + 'After 48 hours, on {{fecha}}, you will be able to sign in with the email code and set up a new authenticator.\n\n'
        + "If you didn't ask for it, do nothing: without confirmation, the reset does not go ahead.\n\nArmando Duarte's team",
    },
    notice: {
      subject: 'Notice: a reset of your authenticator was requested',
      body:
        'Hello,\n\nSomeone asked to reset the authenticator of your account. If it was you, just confirm it from the other email.\n\n'
        + "If it was NOT you, cancel it from this link and your authenticator stays as it is:\n\n{{enlace}}\n\nArmando Duarte's team",
    },
  },
  pt: {
    confirm: {
      subject: 'Confirme a redefinição do seu autenticador',
      body:
        'Olá,\n\nVocê pediu para redefinir o autenticador da sua conta. Para confirmar, abra este link:\n\n{{enlace}}\n\n'
        + 'Depois de 48 horas, em {{fecha}}, você poderá entrar com o código por e-mail e configurar um novo autenticador.\n\n'
        + 'Se não foi você quem pediu, não faça nada: sem confirmação, a redefinição não segue.\n\nEquipe de Armando Duarte',
    },
    notice: {
      subject: 'Aviso: pediram para redefinir seu autenticador',
      body:
        'Olá,\n\nAlguém pediu para redefinir o autenticador da sua conta. Se foi você, basta confirmar pelo outro e-mail.\n\n'
        + 'Se NÃO foi você, cancele por este link e seu autenticador continua como está:\n\n{{enlace}}\n\nEquipe de Armando Duarte',
    },
  },
} as const;

export type IdiomaDelCorreo = keyof typeof TEXTOS_DEL_RESCATE;
