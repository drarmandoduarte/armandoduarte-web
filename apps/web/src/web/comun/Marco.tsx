import type { ReactNode } from 'react';
import { CONTACTO_DE_PAGINA } from '@codice/core';
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
 * `mensaje` es el texto con el que se abre WhatsApp desde el header y desde el
 * menú: en `/merida` dice que quiere reservar; en las otras tres, saluda.
 *
 * El **número** ya no es el mismo en las cuatro (orden #05, E): sale de
 * `CONTACTO_DE_PAGINA`, en `@codice/core`, indexado por la página que este
 * componente ya recibía. No se pasa por prop desde cada página a propósito —
 * serían cuatro lugares donde poner el de la otra— y el pie lo hereda de acá,
 * que es lo que hace que el pie del taller lleve el de Mérida sin que nadie se
 * acuerde de decírselo.
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
  const contacto = CONTACTO_DE_PAGINA[pagina];

  return (
    <>
      <Cabecera pagina={pagina} telefono={contacto.numero} mensaje={mensaje} />
      <main>{children}</main>
      <Pie telefono={contacto.numero} visible={contacto.visible} />
    </>
  );
}
