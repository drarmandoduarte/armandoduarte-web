/**
 * La entrada del navegador en producción — orden Códice #02, A.
 *
 * ── Las tres entradas de este repo, para no confundirlas ──────────────────
 *   · `main.tsx`            → **solo `vite dev`**. Monta React para poder editar
 *                             componentes con recarga en caliente. No se compila
 *                             nunca: `index.html` no es entrada del build.
 *   · `entrada-servidor.tsx`→ el prerender, en Node. Escribe el HTML.
 *   · éste                  → **lo único que baja el navegador en producción**.
 *
 * Es la entrada del build (`build.rollupOptions.input`, con la clave
 * `comportamiento`, que es de donde sale el nombre del archivo). Su grafo de
 * módulos tiene exactamente tres cosas: las dos hojas de estilo y el
 * comportamiento. **React no está en este grafo**, y por eso no puede
 * colarse al bundle por descuido: no es una regla que alguien tenga que
 * recordar, es que no hay camino.
 *
 * El orden de las dos hojas importa y es el mismo de siempre: primero la marca
 * —fuentes y tokens—, después el CSS de la web, que usa esos tokens.
 */
import '@codice/ui/styles.css';
import './index.css';
import { comportamiento } from './web/comun/comportamiento';

comportamiento();
