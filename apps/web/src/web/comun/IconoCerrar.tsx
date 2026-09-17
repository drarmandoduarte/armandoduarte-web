/**
 * La ✕ del menú, dibujada — orden Códice #06, C.
 *
 * ── Por qué un SVG y no el carácter `✕` ──────────────────────────────────
 * Porque `✕` (U+2715) es un **glifo de la tipografía**, y Montserrat no lo
 * trae: el navegador cae a una fuente del sistema, así que la cruz llega con
 * otro grosor, otro tamaño óptico y otra alineación que el texto que tiene al
 * lado — y distinta en cada sistema operativo. Es la clase de detalle que no se
 * nota mirando una captura y se nota mirando la pantalla.
 *
 * Dibujada, mide 22 × 22 como en el motor de 512, el trazo es el mismo
 * `currentColor` que el texto «CERRAR» y las puntas van redondeadas
 * (`stroke-linecap:round`), que es lo que la distingue de una cruz de error.
 *
 * `aria-hidden`: el botón ya se anuncia con su `aria-label` y con la palabra
 * «CERRAR» al lado. Un tercer nombre sería el mismo ruido que un `alt` que
 * repite el pie de foto.
 */
export function IconoCerrar() {
  return (
    <svg viewBox="0 0 22 22" fill="none" aria-hidden="true" focusable="false">
      <path
        d="M4.5 4.5 17.5 17.5M17.5 4.5 4.5 17.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
