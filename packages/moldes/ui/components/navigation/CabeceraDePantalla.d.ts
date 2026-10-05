import * as React from 'react';

/**
 * La cabecera de una pantalla: la frase con voz y una línea de contexto.
 *
 * La usan las once pantallas del menú. Que sea una sola pieza es su razón de
 * existir: once encabezados escritos a mano se desalinean solos.
 * @startingPoint section="Navigation" subtitle="La cabecera de una pantalla" viewport="900x200"
 */
export interface CabeceraDePantallaProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * La frase — el titular con voz de la casa («Lo que hay que mirar hoy.»).
   * Nunca la palabra del menú: eso ya lo dicen la barra de arriba y la fila
   * marcada del riel.
   */
  titulo: React.ReactNode;
  /**
   * El dato de la pantalla —un conteo, un avance, un contacto—, en la MISMA
   * línea del titular y en gris. No pide su propio renglón.
   */
  dato?: React.ReactNode;
  /**
   * Una línea que enseña algo que la pantalla no muestra sola. Si repite el
   * titular con más palabras, no va: la casa explica una vez.
   */
  contexto?: React.ReactNode;
  /** El bloque de la derecha: la acción primaria de la pantalla, o ninguna. */
  acciones?: React.ReactNode;
  /**
   * Lo que cuelga debajo del texto: pestañas, fila de control, pastillas. Es de
   * la pantalla, no de la cabecera — su aire interno lo compone quien lo pasa.
   */
  children?: React.ReactNode;
}
export declare function CabeceraDePantalla(props: CabeceraDePantallaProps): React.JSX.Element;
