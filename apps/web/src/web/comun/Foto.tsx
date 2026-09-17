/**
 * Una de las cinco fotografías de Lucía — orden #05, D.
 *
 * WebP con respaldo JPG, los dos generados desde el original de Pexels y
 * anotados en `public/img/fotos/LEEME.md` con su licencia y su autor. El JPG no
 * es decoración defensiva: es lo que ve el navegador que no entiende WebP, y
 * pesa lo mismo que pesaría si fuera el único.
 *
 * `ancho` y `alto` van siempre y son los del archivo. Sin ellos el navegador no
 * reserva el espacio y la página salta cuando la foto carga — que es medio punto
 * de Lighthouse y, peor, un salto debajo del dedo de alguien que ya empezó a
 * leer.
 *
 * `loading` por omisión es `lazy`: ninguna de las cinco está en el primer
 * pliegue de su página.
 */
export function Foto({
  nombre,
  alt,
  ancho,
  alto,
  clase,
  tamanos,
}: {
  /** El nombre del archivo sin extensión, dentro de `public/img/fotos/`. */
  nombre: string;
  alt: string;
  ancho: number;
  alto: number;
  clase?: string;
  tamanos?: string;
}) {
  return (
    <picture>
      <source type="image/webp" srcSet={`img/fotos/${nombre}.webp`} sizes={tamanos} />
      <img
        src={`img/fotos/${nombre}.jpg`}
        width={ancho}
        height={alto}
        alt={alt}
        className={clase}
        loading="lazy"
      />
    </picture>
  );
}
