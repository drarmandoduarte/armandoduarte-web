import { hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@codice/ui/styles.css';
import './index.css';
import './i18n';
import { App } from './App';

/*
 * `hydrateRoot` y no `createRoot`: el HTML de cada página ya viene escrito por
 * el prerender (Fase C1) y lo que hace el cliente es tomarlo, no volver a
 * dibujarlo. Es la diferencia entre una web que se lee sin JavaScript —y que
 * Google indexa— y un `<div id="root">` vacío.
 */
hydrateRoot(
  document.getElementById('root')!,
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);
