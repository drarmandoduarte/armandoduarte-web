/**
 * El montaje de React — **solo en desarrollo** (orden Códice #02, A).
 *
 * ── Por qué ya no hidrata ─────────────────────────────────────────────────
 * Porque en producción no hay nada que hidratar: el HTML lo escribe el
 * prerender y el navegador **no baja React**. Este archivo no entra al build:
 * `index.html` dejó de ser entrada de Vite, así que lo único que lo carga es el
 * servidor de `vite dev`.
 *
 * Y sigue existiendo por una sola razón, que es la que lo justifica: poder
 * editar un componente y verlo en la pantalla sin recompilar el sitio entero.
 * Esa —y no el navegador de nadie— es la razón por la que React sigue en
 * `dependencies`.
 *
 * ── `createRoot` y no `hydrateRoot` ───────────────────────────────────────
 * En dev el contenedor llega **vacío** (`<div id="root"><!--app--></div>`): el
 * prerender no corrió. `hydrateRoot` sobre un contenedor vacío es un error de
 * hidratación con la pantalla en blanco, así que se dibuja del lado del cliente,
 * que es lo que corresponde cuando no hay HTML previo.
 *
 * ── Y el comportamiento, después del primer commit ────────────────────────
 * Los tres comportamientos son **el mismo archivo** que corre en producción; acá
 * se los llama a mano porque en dev el DOM no existe hasta que React lo dibuja.
 * El `flushSync` es lo que vuelve determinista ese «hasta que»: sin él,
 * `render()` agenda el trabajo y `comportamiento()` saldría a buscar un `#hd`
 * que todavía no está. No hay dos implementaciones de los comportamientos —hubo
 * tres hooks y ya no están—, hay una sola llamada en dos momentos distintos.
 */
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { BrowserRouter } from 'react-router';
import '@codice/ui/fuentes';
import '@codice/ui/styles';
import './index.css';
import './i18n';
import { App } from './App';
import { comportamiento } from './web/comun/comportamiento';

const raiz = createRoot(document.getElementById('root')!);
flushSync(() => {
  raiz.render(
    <BrowserRouter>
      <App />
    </BrowserRouter>,
  );
});
comportamiento();
