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
 * `cleanUrls` de Vercel: `/merida` se sirve desde `merida.html`.
 *
 * ── Por qué `/merida` y no `/taller` (orden #05, F) ──────────────────────
 * Lo pidió Armando: «que como elemento distintivo del URL diga .merida, vamos a
 * ir teniendo eventos en otras ciudades y las distinguiremos con el nombre de la
 * ciudad». Dirección lo leyó como **ruta** y no como subdominio: un
 * `merida.armandoduarte.com` pediría un registro DNS por evento, y hoy ni
 * siquiera está apuntado el dominio. Con la ruta, la segunda ciudad es copiar
 * esta página y agregar un renglón acá.
 *
 * `pagina` sigue diciendo `taller` a propósito: es la clave de i18n y la
 * identidad del contenido, que no cambió. Lo que cambió es la dirección postal.
 * El día que haya `/guadalajara`, va a ser otra `pagina`, no otra ruta de ésta.
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
  { ruta: '/merida', archivo: 'merida.html', pagina: 'taller' },
  { ruta: '/privacidad', archivo: 'privacidad.html', pagina: 'privacidad' },
  { ruta: '/terminos', archivo: 'terminos.html', pagina: 'terminos' },
] as const;
