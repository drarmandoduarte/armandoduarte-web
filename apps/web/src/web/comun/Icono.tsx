/**
 * Uno de los ocho íconos que mandó Lucía — orden #05, C.
 *
 * ── Decorativos, y por eso `alt=""` ──────────────────────────────────────
 * Los ocho van siempre pegados a un texto que ya dice lo mismo: el ícono del
 * reloj está al lado de «Horario · 9:00 a 13:30». Un `alt="reloj"` ahí hace que
 * un lector de pantalla diga la cosa dos veces, que es peor que no decirla. Van
 * con `alt=""` **y** `aria-hidden`, que es el par que los saca del árbol de
 * accesibilidad sin dejarlos como imagen sin describir.
 *
 * ── No se recolorean ─────────────────────────────────────────────────────
 * Vienen del manual de marca en su propio naranja y su propio teal claro
 * —medido píxel a píxel: son de un solo color plano cada uno— que son
 * exactamente `--naranja` y `--teal-medio`, los dos que la orden #05 puso en los
 * tokens. Los valores están allá y solo allá: acá escribirlos otra vez sería la
 * tercera copia de un color, y `check:tokens` la caza —cazó estas dos líneas—.
 * Teñirlos con un filtro CSS sería pintar encima de lo que ya está bien.
 *
 * ── Cuatro son PNG y once son SVG, y la lista está acá ──────────────────
 * Los cuatro naranja de «Cuatro núcleos» son los PNG que mandó Lucía: llegan a
 * 2× en el tamaño en que se muestran, así que no había motivo para redibujarlos.
 * Los otros once son SVG —los siete nuevos y los cuatro que la #05 dejó cortos,
 * redibujados en vector—, y a un SVG no le importa la densidad de pantalla.
 *
 * La lista vive acá y no en cada llamada porque el formato es una propiedad del
 * archivo, no de dónde se lo usa: quien pone un ícono en una sección nueva no
 * tiene por qué saber de qué tipo es.
 *
 * ── `ancho` y `alto` explícitos, siempre ─────────────────────────────────
 * Es lo que evita el salto de maquetación cuando cargan. Los de la franja de
 * hechos y los del hero se muestran a menos de la mitad de su tamaño real, que
 * es lo que los deja nítidos en una pantalla de densidad doble.
 */
/** Los cuatro de Lucía que siguen siendo PNG. El resto son SVG. */
const PNG = new Set(['cerebro', 'emociones', 'victorias', 'comunicacion']);

export function Icono({
  nombre,
  ancho,
  alto,
  clase,
}: {
  /** El nombre del archivo sin extensión, dentro de `public/img/iconos/`. */
  nombre: string;
  ancho: number;
  alto: number;
  clase?: string;
}) {
  return (
    <img
      src={`img/iconos/${nombre}.${PNG.has(nombre) ? 'png' : 'svg'}`}
      width={ancho}
      height={alto}
      alt=""
      aria-hidden="true"
      className={clase}
      loading="lazy"
    />
  );
}
