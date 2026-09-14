import type { ReactNode } from 'react';
import { Cabecera } from './Cabecera';
import { Pie } from './Pie';
import { useCabeza, type Pagina } from './cabeza';

/**
 * El esqueleto que las cuatro páginas comparten: header, `<main>` y pie.
 *
 * El fundido de entrada ya no se pide desde acá: desde la orden #02 lo hace
 * `comportamiento.ts`, que corre sin React sobre el HTML que el prerender dejó
 * escrito. Lo que sí queda es el `<head>`, que en dev cambia al navegar.
 *
 * Está acá y no repetido en cada página porque en el sitio estático era
 * literalmente el mismo bloque de HTML copiado cuatro veces y el mismo
 * `<script>` copiado cuatro veces. Eso funcionaba mientras las cuatro páginas se
 * editaran juntas; la orden web #02 mostró el costo cuando no: hubo que sacar el
 * enlace de Instagram del pie **de las cuatro**, una por una.
 *
 * `mensaje` es lo único que cambia entre páginas: el texto con el que se abre
 * WhatsApp desde el header y desde el menú. En `/taller` dice que quiere
 * reservar; en las otras tres, saluda.
 */
export function Marco({
  pagina,
  mensaje,
  children,
}: {
  pagina: Pagina;
  mensaje: string;
  children: ReactNode;
}) {
  useCabeza(pagina);

  return (
    <>
      <Cabecera mensaje={mensaje} />
      <main>{children}</main>
      <Pie />
    </>
  );
}
