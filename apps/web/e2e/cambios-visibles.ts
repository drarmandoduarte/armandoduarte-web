/**
 * El delta visible de la orden #03, escrito una sola vez — y ejecutable.
 *
 * ── El problema que resuelve ─────────────────────────────────────────────
 * El guardián de fidelidad de la #01 compara el port contra **el sitio estático
 * en vivo**, y exige cero píxeles de diferencia. La #03 es la primera orden que
 * cambia algo que se ve, así que ese cero se rompe por definición. La salida
 * fácil sería guardar capturas de referencia en el repo y comparar contra ellas;
 * la #01 ya explicó por qué no: una captura guardada envejece, y al mes nadie
 * sabe si el rojo es un defecto o la imagen vieja.
 *
 * ── Lo que se hace en vez de eso ─────────────────────────────────────────
 * La referencia se sigue sacando del sitio estático en vivo, pero **con este
 * delta aplicado encima**. Lo que el guardián afirma pasa a ser más fuerte que
 * antes, no más débil:
 *
 *   «el port dibuja exactamente el sitio estático MÁS estas seis líneas, y
 *    nada más»
 *
 * Si la orden hubiera movido un cuarto valor sin querer —o si un token de más se
 * hubiera colado—, el guardián se pone rojo igual que antes. El presupuesto de
 * diferencia sigue siendo **cero**; lo que se declaró es qué cambió, no cuánto
 * se tolera.
 *
 * ── Y por eso esto es también la lista que dirección aprueba ─────────────
 * Son seis líneas. Se leen. Si una no le gusta, se borra de acá y del token, y
 * el guardián vuelve a exigir el estático tal cual.
 */
export const CAMBIOS_VISIBLES_03 = `
/* Los tres tokens, al mínimo medido que llega a 4,5:1 sobre el fondo más
   exigente en el que cada uno se usa (v1.1.1 de codice-tokens). */
:root{
  --gris:#716A60;        /* era #7A7267 · sobre --calido 4,00 → 4,51 */
  --ocre:#866539;        /* era #8F6B3D · sobre --calido 4,09 → 4,51 */
  --ocre-medio:#B18C54;  /* era #B08A52 · sobre --tinta  4,44 → 4,53 */
}

/* El bloque de contacto de la portada se dibujaba tinta sobre tinta —contraste
   1:1, el teléfono invisible— porque esta regla pisaba a \`.tinta .grande\`. */
.contacto .grande{color:inherit}

/* El rótulo de la ficha del taller sobre teal: 60 % daba 3,77; 70 % da 4,52. */
.oscuro .ficha li span:first-child{color:rgba(250,247,241,.7)}

/* Las cuatro claves del facilitador llevan ese mismo 60 % escrito en un
   \`style=\` en línea, que le gana a la regla de arriba. En el port el atributo
   se borró; acá, sobre el HTML del estático, la única manera de ganarle a un
   \`style=\` es \`!important\`. Es el único de esta lista y por eso se dice. */
.oscuro .ficha li span:first-child[style]{color:rgba(250,247,241,.7)!important}
`;
