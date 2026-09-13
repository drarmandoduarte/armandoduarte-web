import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    /*
     * El CSS sale a un archivo, no adentro del JavaScript.
     *
     * Sin esto —está medido— Vite mete las 28 KB de CSS **adentro** del bundle y
     * las inyecta con un `<style>` al ejecutarse: el archivo pasa de 2 a 30 KB y,
     * peor, la página queda sin estilos hasta que el script corre. Es lo que Vite
     * hace cuando la entrada es un `.ts` y no un `.html`, porque sin HTML no
     * tiene dónde poner el `<link>`. Acá el `<link>` lo pone el prerender.
     */
    cssCodeSplit: false,
    rollupOptions: {
      /*
       * ── La entrada del build NO es `index.html` (orden Códice #02) ────────
       * Es `src/entrada-navegador.ts`: las dos hojas de estilo y los tres
       * comportamientos, sin React. La clave del objeto —`comportamiento`— es
       * de donde sale el nombre del archivo: `assets/comportamiento-[hash].js`.
       *
       * Que `index.html` haya dejado de ser entrada es **la orden entera en una
       * línea**. Mientras lo era, Vite seguía su `<script>` hasta `main.tsx` y
       * compilaba React: 354 KB que el navegador bajaba para no ejecutar nada
       * —TBT 0 ms— y que costaban 17 puntos de Lighthouse móvil por competir
       * con el CSS en el enlace estrangulado. Ahora React vive en el grafo del
       * prerender, que corre en Node, y en el de `vite dev`, que no se compila.
       * No hay una regla que recordar: no hay camino de la web pública a React.
       *
       * `index.html` sigue existiendo para dos cosas: es lo que sirve
       * `vite dev`, y es la plantilla que el prerender rellena —al que le quita
       * el `<script>` de dev y le pone el `<script defer>` de acá—.
       */
      input: { comportamiento: fileURLToPath(new URL('./src/entrada-navegador.ts', import.meta.url)) },
      output: {
        /*
         * `iife` y no `es`, para que el HTML lo pueda pedir con `defer`.
         *
         * Un `<script type="module">` se descarga con CORS y se parsea como
         * módulo; un `<script defer>` clásico, no. Con una sola entrada y sin
         * imports dinámicos no hay nada que un módulo aporte acá, y el sitio
         * estático servía exactamente esto: un archivo, diferido, sin ceremonia.
         * El formato y el atributo tienen que ir de la mano: un archivo ESM
         * cargado como script clásico corre en el ámbito global y sin modo
         * estricto, que es la clase de diferencia que no da error y se paga
         * después.
         */
        format: 'iife',
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
