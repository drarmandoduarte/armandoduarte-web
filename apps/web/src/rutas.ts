/**
 * Las cuatro rutas de la web pública, en un solo lugar.
 *
 * Están acá y no sueltas dentro del `<Routes>` porque **tres cosas distintas
 * tienen que estar de acuerdo sobre esta lista**: el router del cliente, el
 * prerender que escribe un `.html` por ruta (Fase C1), y el guardián de
 * fidelidad que compara página por página contra el sitio estático. Tres
 * copias de una lista de cuatro son tres oportunidades de que una quede vieja,
 * y la que quede vieja va a ser la del prerender — que falla publicando de
 * menos, sin ruido.
 *
 * `archivo` es el nombre que el prerender le da en `dist/`, y sale de
 * `cleanUrls` de Vercel: `/taller` se sirve desde `taller.html`.
 */
export interface Ruta {
  /** El camino tal como lo pide el navegador. */
  ruta: string;
  /** El archivo que el prerender escribe en `dist/`. */
  archivo: string;
  /** La clave de i18n con el `<head>` de esa página. */
  pagina: 'inicio' | 'taller' | 'privacidad' | 'terminos';
}

export const RUTAS: readonly Ruta[] = [
  { ruta: '/', archivo: 'index.html', pagina: 'inicio' },
  { ruta: '/taller', archivo: 'taller.html', pagina: 'taller' },
  { ruta: '/privacidad', archivo: 'privacidad.html', pagina: 'privacidad' },
  { ruta: '/terminos', archivo: 'terminos.html', pagina: 'terminos' },
] as const;
