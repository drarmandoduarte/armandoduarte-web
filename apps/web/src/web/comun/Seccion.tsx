import type { ReactNode } from 'react';

/** Los cinco tonos de fondo del ritmo de la página (`web.surfaces` en tokens). */
export type Tono = 'crema' | 'calido' | 'blanco' | 'oscuro' | 'tinta';

const CLASE: Record<Tono, string> = {
  crema: '',
  calido: 'calido',
  blanco: 'blanco',
  oscuro: 'oscuro',
  tinta: 'tinta',
};

/**
 * Una sección de la página: el aire de arriba y abajo, el fondo, y el
 * contenedor centrado.
 *
 * `crema` no agrega clase porque es el fondo del `body`: en el sitio estático
 * una sección crema es `<section class="section">` a secas. Portar eso como
 * `class="section crema"` habría sido inventar una clase que el CSS no tiene.
 */
export function Seccion({
  id,
  tono = 'crema',
  clase = '',
  contenedor = true,
  children,
}: {
  id?: string;
  tono?: Tono;
  clase?: string;
  contenedor?: boolean;
  children: ReactNode;
}) {
  const clases = ['section', CLASE[tono], clase].filter(Boolean).join(' ');
  return (
    <section className={clases} id={id}>
      {contenedor ? <div className="container">{children}</div> : children}
    </section>
  );
}
