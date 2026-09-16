import type { ReactNode } from 'react';

/**
 * La foto con el arco: el radio de 260px arriba y 12px abajo, sobre fondo
 * cálido. Es la firma visual de la casa — la foto no es un rectángulo, es una
 * ventana.
 *
 * ── Por qué desde la #05 recibe la imagen en vez de dibujarla ────────────
 * Porque la imagen dejó de ser un `<img>`. Los recortes de Armando llegaron con
 * transparencia real, y servirlos bien es un `<picture>` con WebP, srcset y un
 * respaldo PNG — eso vive en `Retrato`, que sabe de formatos, y no acá, que sabe
 * de la forma del hueco. Antes este componente recibía un `src` y armaba el
 * `<img>`; hubiera tenido que aprenderse los cuatro archivos de cada recorte
 * para no perder nada, y son dos trabajos distintos.
 *
 * Lo que dibuja sigue siendo exactamente lo mismo: el `<figure>` con sus clases,
 * su `data-d` y su estilo. El arco es del CSS y no cambió.
 */
export function FotoArco({
  clase = 'foto foto--arco reveal',
  demora,
  estilo,
  children,
}: {
  clase?: string;
  demora?: string;
  estilo?: React.CSSProperties;
  children: ReactNode;
}) {
  return (
    <figure className={clase} data-d={demora} style={estilo}>
      {children}
    </figure>
  );
}
