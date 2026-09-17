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
 * ── Las hojas que salen de acá, y la que NO (orden Códice #09) ────────────
 * De este grafo salen **dos** de las tres cosas que el navegador enlaza: los
 * tokens de la marca y el CSS de la web, que se compilan juntos en
 * `assets/style-<hash>.css`. El orden entre ellos importa y es el de siempre:
 * primero los tokens, después el CSS que los usa.
 *
 * La **hoja de fuentes** —`@codice/ui/fuentes`— ya no está acá, y es la orden
 * #09 entera: sale en su archivo propio, `assets/fuentes-<hash>.css`, que
 * compila `scripts/hoja-de-fuentes.mjs` y enlaza el prerender. No es que se
 * haya olvidado: **un `import` más en este archivo la volvería a fusionar con
 * las otras dos**, que es exactamente lo que la orden vino a deshacer. El
 * motivo técnico, con los dos errores de Vite que lo obligan, está en la cabeza
 * de ese script.
 *
 * En `vite dev` sí se importan las dos, y ahí el literal del contrato se lee
 * como está escrito: ver `main.tsx`.
 */
import '@codice/ui/styles';
import './index.css';
import { comportamiento } from './web/comun/comportamiento';

comportamiento();
