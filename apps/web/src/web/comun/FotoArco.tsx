/**
 * La foto con el arco: el radio de 260px arriba y 12px abajo, sobre fondo
 * cálido. Es la firma visual de la casa — la foto no es un rectángulo, es una
 * ventana.
 *
 * `ancho` y `alto` van siempre, y son los del archivo: sin ellos el navegador
 * no reserva el espacio y la página salta cuando la foto carga. En el hero,
 * además, `loading="eager"` y `fetchpriority="high"`, que es la única imagen
 * que se pide con prioridad en toda la página.
 */
export function FotoArco({
  src,
  alt,
  ancho,
  alto,
  prioridad = false,
  clase = 'foto foto--arco reveal',
  demora,
  estilo,
}: {
  src: string;
  alt: string;
  ancho: number;
  alto: number;
  prioridad?: boolean;
  clase?: string;
  demora?: string;
  estilo?: React.CSSProperties;
}) {
  return (
    <figure className={clase} data-d={demora} style={estilo}>
      <img
        src={src}
        width={ancho}
        height={alto}
        alt={alt}
        loading={prioridad ? 'eager' : 'lazy'}
        {...(prioridad ? { fetchPriority: 'high' as const } : {})}
      />
    </figure>
  );
}
