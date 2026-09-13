import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        /*
         * Las fuentes salen a `/fuentes/` con su nombre de siempre, sin hash.
         *
         * No es estética: `vercel.json` le pone `Cache-Control: immutable` a
         * `/fuentes/(.*)` y a `/img/(.*)`, que son las dos reglas que el sitio
         * estático ya tenía. Si Vite las mandara a `/assets/Montserrat-a1b2c3.woff2`
         * esa regla dejaría de tocar nada —en silencio, porque una cabecera que
         * no se aplica no da error— y la web quedaría pidiendo 200 KB de tipografía
         * en cada visita. Los nombres son estables porque los archivos lo son:
         * una fuente nueva es un archivo nuevo, no el mismo con otro contenido.
         */
        assetFileNames: (info) => (
          info.name?.endsWith('.woff2') ? 'fuentes/[name][extname]' : 'assets/[name]-[hash][extname]'
        ),
      },
    },
  },
  test: {
    exclude: ['**/node_modules/**', '**/dist/**', 'e2e/**'],
    /*
     * `index.css` se puede leer desde un test.
     *
     * Vitest viene con `css: false`, y eso no significa «no apliques estilos»:
     * significa que toda importación de un `.css` devuelve cadena vacía, `?raw`
     * incluido. Un test que lea el CSS así pasa en verde sin haber mirado nada,
     * que es peor que no tenerlo. El guardián del port —`el-css-esta-entero`—
     * necesita el archivo de verdad. El `include` va SIN `$`: el id que Vitest
     * evalúa trae la consulta pegada (`…/index.css?raw`).
     */
    css: { include: [/index\.css/] },
  },
});
