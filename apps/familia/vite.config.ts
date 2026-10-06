import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * `apps/familia` — Mi espacio.
 *
 * ── Por qué esta app SÍ carga React y la pública no ──────────────────────
 * `apps/web` le sacó React al navegador en la #02 porque es una web de lectura:
 * cuatro páginas quietas que solo tenían que dibujarse rápido. Acá la pantalla
 * **es** la aplicación —un código de seis dígitos, un QR, un reloj de treinta
 * minutos, una sesión que puede caerse— y no hay nada que prerenderizar: sin
 * sesión no hay contenido. Así que la entrada es `index.html`, como en
 * cualquier SPA, y el `dist/` que sale es el que Vercel sirve estático.
 *
 * ── Y no se comparte el `vite.config` con `apps/web` ─────────────────────
 * Aquel tiene `cssCodeSplit:false`, una entrada que no es el HTML, salida
 * `iife` y las fuentes sin hash: **todo eso existe por el prerender y por las
 * reglas de caché del `vercel.json` de la web**. Heredarlo acá sería heredar
 * las razones de otra app.
 */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    /* Kit de Acceso 1.3.0 (fase-2 §7.8, orden #37 PR 2): `useAalWindow.test.tsx`
       del núcleo usa `@testing-library/react`, que limpia lo dibujado después de
       cada test solo si `afterEach` es global. */
    globals: true,
    exclude: ['**/node_modules/**', '**/dist/**', 'e2e/**'],
    setupFiles: ['./src/prueba/entorno.ts'],
  },
});
