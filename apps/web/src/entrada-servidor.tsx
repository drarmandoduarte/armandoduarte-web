import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import './i18n';
import { App } from './App';
import { cabezaHtml, type Pagina } from './web/comun/cabeza';

/**
 * La entrada del servidor. La usa `scripts/prerender.mjs` después de `vite
 * build` para escribir un `.html` por ruta.
 *
 * No importa `index.css` ni los tokens: el CSS lo enlaza la plantilla que Vite
 * ya dejó armada en `dist/index.html`. Importarlo acá solo serviría para que
 * Node se atragante con un `.css`.
 */
export function dibujar(ruta: string, pagina: Pagina) {
  return {
    app: renderToString(
      <StaticRouter location={ruta}>
        <App />
      </StaticRouter>,
    ),
    cabeza: cabezaHtml(pagina),
  };
}
