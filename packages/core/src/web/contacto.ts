/**
 * Los contactos de la web pública. **Dos teléfonos, y cada uno con su nombre.**
 *
 * ── Por qué una constante y no el número escrito en cada botón ────────────
 * En el sitio estático el teléfono aparece **nueve veces** entre los cuatro
 * HTML: cabecera, menú, hero, cierre, pie de cada página, y dos veces dentro
 * del aviso de privacidad. Nueve copias de un dato que un día cambia son ocho
 * oportunidades de que quede uno viejo, y el que quede viejo va a ser
 * justamente el que nadie mira.
 *
 * ── Y por qué desde la #05 son dos ───────────────────────────────────────
 * Lo pidió Armando: «en la web principal poner el celular de Gaby; para el
 * evento de Mérida es correcto el que ya aparece». Son dos personas atendiendo
 * dos cosas distintas, así que el dato no es «el teléfono» sino «el teléfono de
 * quién», y los nombres de estas constantes lo dicen. Un `TELEFONO_1` y un
 * `TELEFONO_2` habrían sido el mismo error con otra cara.
 *
 * El reparto es por página y no por botón: **la portada entera** —header, menú,
 * hero, contacto, pie y el aviso de privacidad— usa el de Gaby; **el taller
 * entero**, el de Mérida. Lo afirma `contacto.test.ts` con los dos números
 * cruzados, que es la manera de que un botón que se copie de una página a la
 * otra no pase en silencio.
 *
 * El texto de cada mensaje NO vive acá: vive en i18n, con el resto de lo que se
 * lee (`comun.mensajes.*`). Esto es el número y la forma del enlace.
 */

/** Gaby, que atiende la web principal (Armando, 16/9/2026). */
export const TELEFONO_GABY = '524621993143';

/** El mismo número como se muestra escrito en la página. */
export const TELEFONO_GABY_VISIBLE = '+52 462 199 3143';

/** El del evento de Mérida, que es el que la página del taller ya tenía. */
export const TELEFONO_TALLER = '525555015641';

/** El mismo número como se muestra escrito en la página. */
export const TELEFONO_TALLER_VISIBLE = '+52 55 5501 5641';

/**
 * El enlace a WhatsApp con el mensaje ya escrito.
 *
 * `encodeURIComponent` y no otra cosa: es lo que produjo los `text=` del sitio
 * estático, carácter por carácter. Los mensajes no cambiaron en la #05 — lo que
 * cambió es a qué número llegan—, así que la codificación sigue siendo la misma
 * y sus pruebas siguen valiendo.
 *
 * `telefono` va explícito y sin valor por omisión **a propósito**: un valor por
 * omisión acá sería el número que se cuela en la página equivocada el día que
 * alguien agregue un botón y no se acuerde de pasarlo. Si falta, no compila.
 */
export function enlaceWhatsApp(telefono: string, mensaje: string): string {
  return `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
}

/**
 * Qué teléfono le toca a cada página.
 *
 * Está acá y no repartido por los componentes porque el reparto **es** la
 * decisión de Armando, y una decisión vive en un lugar. El header, el menú y el
 * pie salen de `Marco`, que ya sabe en qué página está: con este mapa no tiene
 * que recibir el número por prop desde cada página —que sería cuatro lugares
 * donde equivocarse— y las secciones que arman su propio botón importan la
 * constante con nombre, que se lee sola.
 *
 * Las dos legales van con el de Gaby: son de la web principal, y el aviso de
 * privacidad da un teléfono para ejercer derechos ARCO. Ése tiene que ser el de
 * quien de verdad atiende, no el del evento de una ciudad.
 */
export const CONTACTO_DE_PAGINA = {
  inicio: { numero: TELEFONO_GABY, visible: TELEFONO_GABY_VISIBLE },
  taller: { numero: TELEFONO_TALLER, visible: TELEFONO_TALLER_VISIBLE },
  privacidad: { numero: TELEFONO_GABY, visible: TELEFONO_GABY_VISIBLE },
  terminos: { numero: TELEFONO_GABY, visible: TELEFONO_GABY_VISIBLE },
} as const;
