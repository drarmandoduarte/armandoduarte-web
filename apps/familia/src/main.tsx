import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './i18n';
/* #37 · el molde: su Kit UI primero, para que las reglas de Mi espacio (que
   vienen después) sigan ganando donde ya decían algo. Las variables del
   design.json no se importan: las enlaza `arrancarElMolde()` como archivos de
   `public/` (la CSP es `style-src 'self'`). */
import '@moldes/ui/styles.css';
import { arrancarElMolde } from './molde/arranque';
/* El orden importa y es el contrato de la #09: primero la marca —las fuentes
   locales y los tokens, que vienen juntos en `styles.css`— y después el CSS de
   esta app, que usa esos tokens. Al revés, las reglas de la app se escribirían
   antes de que las variables existan. */
import '@codice/ui/styles.css';
import './estilos.css';
/* #35: las pantallas de acceso del guion v1 del Kit 512, vestidas con el design.json. */
import './acceso/design.css';
import './acceso/acceso.css';
import { App } from './App';

arrancarElMolde();

const raiz = document.getElementById('raiz');
if (!raiz) throw new Error('Falta #raiz en index.html');

createRoot(raiz).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
