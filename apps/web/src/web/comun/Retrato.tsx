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
 * de 520 px**: el arco del hero (520), la foto de «Quién soy» (520) y la de «Sobre
 * el facilitador» (472, desde la #20-bis). A 2× eso es 1040, y 1400 ya deja margen de sobra. Los
 * 1800 solo servían para pasarse del presupuesto: el recorte de cuerpo entero a
 * 1800 pesaba 486 KB y bajarlo a los 220 KB que la orden fija exigía calidad 45,
 * o sea publicar al cliente borroso en su propia portada. A 1400 el mismo
 * archivo entra en 217 KB con calidad 74. Se eligió el tamaño que el diseño usa
 * en vez del que la receta decía.
 */

/**
 * Los dos recortes que mandó Lucía, con la relación del archivo más grande.
 *
 * ── `medio-cuerpo` cambió de forma en la #12 (D) ─────────────────────────
 * Lucía mandó el busto corregido y no es el mismo recuadro: 1400×1690 donde el
 * de la #05 era 1400×1769. Estos dos números **no son decoración**: son lo que
 * el navegador usa para reservar el hueco antes de que la foto baje, y dejarlos
 * viejos con el archivo nuevo es exactamente un salto de maquetación —el mismo
 * que el `width`/`height` existe para evitar—. Salen del archivo, medidos, no
 * de la orden.
 */
/* `de-pie` cambió de forma en la #19 (B): 1400×**2526** donde era 2614.
   El archivo publicado tenía un degradado a transparente por abajo, así que la
   caja tocaba el borde de la sección (medido: 0 px, cierto) y lo que tocaba era
   **aire**: la #12 midió la caja, Lucía miraba los píxeles.

   El número pasó por dos manos y vale decirlo: la v1 del insumo cortaba en la
   **2320** porque se midió mal el degradado —el archivo era opaco hasta la
   **2532** y solo se desvanecía en las últimas ~70 filas—, y ese recorte tiró
   212 px de pierna sin necesidad. La v2 sale del PNG con alfa de Lucía y corta
   en la última fila opaca de verdad.

   Y la foto **termina en los muslos en todas las fuentes que existen**: no hay
   rodillas ni zapatos que recuperar. Por eso la regla es que el corte del
   archivo coincida con el borde inferior de la sección — así no se lee como un
   corte, se lee como un apoyo.

   Y en la #23 (C) pasó a **2791**: la v2 recortaba desde la fila 474 del PNG
   de Lucía y el pelo empieza en la 25, así que le cortaba la cabeza. La v3
   recorta desde la fila 0 hasta la misma última fila opaca. */
const RECORTES = {
  'de-pie': { ancho: 1400, alto: 2791 },
  'medio-cuerpo': { ancho: 1400, alto: 1690 },
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
