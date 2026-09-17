/**
 * Armando, recortado sobre transparencia — orden #05, D2.
 *
 * ── Qué reemplaza, y por qué era un problema ─────────────────────────────
 * Hasta la #05 la web servía **seis JPG** con Armando ya pegado sobre un fondo:
 * `armando-parado-crema.jpg`, `armando-parado-teal.jpg`, `armando-sentado-calido.jpg`…
 * Un archivo por sección, porque un JPG no tiene canal alfa y el fondo hay que
 * hornearlo. Eso significa que el color de una sección vivía en dos lugares —el
 * CSS y el píxel de una foto— y el día que el teal cambiara, como cambió en esta
 * misma orden, el recorte se quedaba con el teal viejo **en silencio**. No es
 * hipotético: es exactamente lo que esta orden habría provocado.
 *
 * Los PNG que mandó Lucía tienen alfa real —medido: 30 % de píxeles
 * completamente transparentes y ni uno solo de borde casi-blanco—, así que una
 * sola imagen sirve sobre cualquier fondo y el color lo pone el CSS, que es de
 * donde tiene que salir.
 *
 * ── Por qué `<picture>` y no un `<img>` pelado ───────────────────────────
 * Porque WebP es el único formato razonable que conserva el alfa con peso de
 * foto —el PNG equivalente pesa siete veces más—, y aun así hace falta una
 * salida para el navegador que no lo entienda. El `<img>` de adentro es esa
 * salida: un PNG chico que hoy no baja prácticamente nadie (WebP con alfa tiene
 * soporte desde Safari 14, 2020) y que está por prolijidad, no por estadística.
 *
 * ── Los tamaños, y por qué no son los que la orden pedía ─────────────────
 * La orden pedía 900 y 1800 de ancho. Medido, **ningún hueco de esta web pasa
 * de 520 px**: el arco del hero, la foto de «Quién soy» (520) y la de «Sobre el
 * facilitador» (480). A 2× eso es 1040, y 1400 ya deja margen de sobra. Los
 * 1800 solo servían para pasarse del presupuesto: el recorte de cuerpo entero a
 * 1800 pesaba 486 KB y bajarlo a los 220 KB que la orden fija exigía calidad 45,
 * o sea publicar al cliente borroso en su propia portada. A 1400 el mismo
 * archivo entra en 217 KB con calidad 74. Se eligió el tamaño que el diseño usa
 * en vez del que la receta decía.
 */

/** Los dos recortes que mandó Lucía, con la relación del archivo más grande. */
const RECORTES = {
  'de-pie': { ancho: 1400, alto: 2614 },
  'medio-cuerpo': { ancho: 1400, alto: 1769 },
} as const;

export function Retrato({
  cual,
  alt,
  tamanos,
  prioridad = false,
}: {
  cual: keyof typeof RECORTES;
  alt: string;
  /** El `sizes` del srcset: cuánto espacio ocupa la foto en cada ancho de pantalla. */
  tamanos: string;
  prioridad?: boolean;
}) {
  const { ancho, alto } = RECORTES[cual];
  return (
    <picture>
      <source
        type="image/webp"
        srcSet={`img/armando/${cual}-900.webp 900w, img/armando/${cual}-1400.webp 1400w`}
        sizes={tamanos}
      />
      <img
        src={`img/armando/${cual}-560.png`}
        width={ancho}
        height={alto}
        alt={alt}
        loading={prioridad ? 'eager' : 'lazy'}
        {...(prioridad ? { fetchPriority: 'high' as const } : {})}
      />
    </picture>
  );
}
