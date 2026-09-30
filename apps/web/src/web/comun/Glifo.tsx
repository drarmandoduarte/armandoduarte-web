/**
 * El dibujo de un ícono de Lucía, sin su disco, en el color del texto — orden
 * #23, D.
 *
 * ── Por qué existe, si los íconos «no se recolorean» ─────────────────────
 * `Icono.tsx` sirve los íconos como llegaron: disco naranja o teal claro con el
 * dibujo calado. La #23 pide los núcleos como «Cuatro etapas» de 512: un
 * círculo de 44 px con borde de 1 px en `--teal` y **el ícono de Lucía adentro,
 * a 20 px, en `--teal`**, y ningún naranja (D26). Un disco naranja no puede ser
 * eso, así que de cada ícono se sacó **solo el dibujo** (`glifo-*.png`, el
 * calado del disco pasado a blanco sobre transparente; `glifo-cambios.svg`,
 * los trazos del SVG sin el círculo). El dibujo es el de Lucía, sin retocar.
 *
 * ── Y el color sale del CSS, no del archivo ──────────────────────────────
 * El glifo es una **máscara** sobre un rectángulo `currentColor`: el teal lo
 * pone la regla `.nucleo__circulo{color:var(--teal)}`, del token, y no un píxel
 * horneado —que es la lección de la #05 con los JPG de fondo—. Máscara SVG en
 * línea y no `mask-image` en el CSS porque las URLs de `/img/` del CSS no
 * llevan huella (#21 A) y las del HTML sí: el `href` de acá sale del prerender
 * con su `?v=`.
 *
 * Decorativo: `aria-hidden`, como `Icono`. El texto de al lado dice qué es.
 */
const PNG = new Set(['cerebro', 'emociones', 'victorias', 'comunicacion']);

export function Glifo({ nombre, lado }: { nombre: string; lado: number }) {
  const id = `glifo-${nombre}`;
  const href = `img/iconos/glifo-${nombre}.${PNG.has(nombre) ? 'png' : 'svg'}`;
  return (
    <svg width={lado} height={lado} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <mask id={id}>
        <image href={href} width="100" height="100" />
      </mask>
      <rect width="100" height="100" fill="currentColor" mask={`url(#${id})`} />
    </svg>
  );
}
