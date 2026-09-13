/**
 * El contacto de la web pública. Un número, un lugar.
 *
 * ── Por qué una constante y no el número escrito en cada botón ────────────
 * En el sitio estático el teléfono aparece **nueve veces** entre los cuatro
 * HTML: cabecera, menú, hero, cierre, pie de cada página, y dos veces dentro
 * del aviso de privacidad. Nueve copias de un dato que un día cambia son ocho
 * oportunidades de que quede uno viejo, y el que quede viejo va a ser
 * justamente el que nadie mira. Acá es uno.
 *
 * El texto de cada mensaje NO vive acá: vive en i18n, con el resto de lo que se
 * lee (`comun.mensajes.*`). Esto es el número y la forma del enlace.
 */

/** El WhatsApp de Armando, en formato internacional sin signos. */
export const TELEFONO_WHATSAPP = '525555015641';

/** El mismo número como se muestra escrito en la página. */
export const TELEFONO_VISIBLE = '+52 55 5501 5641';

/**
 * El enlace a WhatsApp con el mensaje ya escrito.
 *
 * `encodeURIComponent` y no otra cosa: es lo que produjo los `text=` del sitio
 * estático, carácter por carácter, y el guardián de fidelidad compara los
 * `href` en orden — si esto codificara distinto, se pondría rojo.
 */
export function enlaceWhatsApp(mensaje: string): string {
  return `https://wa.me/${TELEFONO_WHATSAPP}?text=${encodeURIComponent(mensaje)}`;
}
