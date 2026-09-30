import { useEffect, useState } from 'react';

/**
 * El corte de la orden #18 (A): a partir de acá, `/entrar` se parte en dos.
 * Es el mismo número que el `@media (min-width:1100px)` de `estilos.css`.
 */
export const ANCHO_DE_DOS_MITADES = '(min-width: 1100px)';

/**
 * Si la pantalla cumple una media query, y se entera cuando cambia.
 *
 * ── Por qué el panel no se esconde solo con CSS ─────────────────────────
 * Medido con Lighthouse móvil el 30/9: con el panel en `display:none`, el
 * navegador **igual descargaba el busto** —42 KB, y con `fetchpriority="high"`—
 * en un teléfono que no lo iba a mostrar nunca. Competía con las dos fuentes por
 * la red simulada y corría el LCP de 4,2 s a 5,0 s: performance de 76 a 71.
 * Un `<img>` escondido por CSS se descarga igual; uno que no se monta, no.
 *
 * Así que el panel (≥ 1100) y el retrato chico (< 1100) se montan según esto,
 * y cada ancho baja solo su imagen. Es seguro hacerlo en JS porque esta app no
 * tiene nada que pintar antes de que corra React (`vite.config.ts`).
 */
export function usarAncho(consulta: string): boolean {
  const [cumple, setCumple] = useState(() => window.matchMedia(consulta).matches);
  useEffect(() => {
    const mq = window.matchMedia(consulta);
    const alCambiar = () => setCumple(mq.matches);
    alCambiar();
    mq.addEventListener('change', alCambiar);
    return () => mq.removeEventListener('change', alCambiar);
  }, [consulta]);
  return cumple;
}
