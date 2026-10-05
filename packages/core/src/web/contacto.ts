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
 * ── Los dos del taller de matrimonios (orden #38) ────────────────────────
 * Armando, 5/10: «México +52 462 199 3143 · otros países +52 462 251 1017».
 * El de México es **el mismo número que el de Gaby**, y aun así va con nombre
 * propio: es «el de México para el taller de matrimonios», que hoy coincide
 * con el de la portada y mañana puede no coincidir. Si un día cambia uno, el
 * otro no se arrastra.
 */
export const TELEFONO_MATRIMONIOS_MEXICO = '524621993143';
export const TELEFONO_MATRIMONIOS_MEXICO_VISIBLE = '+52 462 199 3143';
/** El de quien escribe desde fuera de México. */
export const TELEFONO_MATRIMONIOS_OTROS_PAISES = '524622511017';
export const TELEFONO_MATRIMONIOS_OTROS_PAISES_VISIBLE = '+52 462 251 1017';

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
  /* #38: la cabecera, el menú y el pie de `/matrimonios` llaman al de México;
     «Desde otro país» lo arma cada botón con su constante. */
  matrimonios: { numero: TELEFONO_MATRIMONIOS_MEXICO, visible: TELEFONO_MATRIMONIOS_MEXICO_VISIBLE },
  privacidad: { numero: TELEFONO_GABY, visible: TELEFONO_GABY_VISIBLE },
  terminos: { numero: TELEFONO_GABY, visible: TELEFONO_GABY_VISIBLE },
} as const;

/**
 * La clave de i18n del mensaje con el que se reserva el taller.
 *
 * Vive acá, al lado del teléfono, y no suelta en cada componente, porque
 * **teléfono y mensaje son un solo dato**: «el enlace para reservar». Separados,
 * lo que pasa es lo que pasó — el mismo enlace calculado en dos lugares, y el
 * día que cambie el mensaje va a cambiar en uno.
 */
export const CLAVE_MENSAJE_RESERVA = 'comun.mensajes.reservar';

/** El del taller de matrimonios (#38): el mismo para los dos números. */
export const CLAVE_MENSAJE_MATRIMONIOS = 'matrimonios.mensaje';

/**
 * El enlace de «reservar el taller», y es **el único lugar donde se arma**.
 *
 * ── Por qué se unifica en la orden #14 ────────────────────────────────────
 * Hasta acá el mismo enlace se calculaba en dos componentes: el botón del hero
 * de `/merida` (`taller/Hero.tsx`) y el `mensaje` que `taller/Taller.tsx` le pasa
 * al `Marco` para la cabecera y el menú. Los dos hacían
 * `enlaceWhatsApp(TELEFONO_TALLER, t('comun.mensajes.reservar'))` por separado.
 * Con el pie sumando un tercero, la orden #14 (B.3) pide una sola fuente, y ésta
 * es: el teléfono y la clave del mensaje se eligen una vez.
 *
 * ── Y por qué recibe `t` en vez de recibir el texto ya traducido ──────────
 * Recibir el texto dejaría la mitad de la decisión afuera: quien llama seguiría
 * eligiendo **qué** mensaje, que es justo lo que se desincronizó. Recibiendo `t`,
 * lo único que el componente aporta es el idioma de su sesión, y el enlace
 * —número y texto— sale entero de este archivo.
 *
 * El texto en sí sigue en i18n, como todo lo que se lee: acá vive la clave, no
 * la frase.
 */
export function enlaceReservaDelTaller(t: (clave: string) => string): string {
  return enlaceWhatsApp(TELEFONO_TALLER, t(CLAVE_MENSAJE_RESERVA));
}
