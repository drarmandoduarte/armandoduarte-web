#!/usr/bin/env node
/**
 * La hoja de fuentes, en su archivo propio — orden Códice #09.
 *
 * ── Qué hace ──────────────────────────────────────────────────────────────
 * Compila `@codice/ui/fuentes` —los ocho `@font-face`— a
 * `dist/assets/fuentes-<hash>.css`, y con ella los `.woff2` que enlaza, a
 * `dist/fuentes/`. Corre **después** de `vite build` y **antes** del prerender,
 * que es el que las enlaza a las dos.
 *
 * ── Por qué un segundo build y no un `import` más ─────────────────────────
 * Porque el build principal **no puede** emitir dos hojas, y no es una opinión:
 * son dos errores de Vite 6 que se chocaron al intentarlo.
 *
 *   · Con `cssCodeSplit: false` —que es lo que hoy saca el CSS afuera del
 *     JavaScript en vez de inyectarlo con un `<style>`— **todo el CSS del build
 *     va a una sola hoja**. Un `import` más de las fuentes en
 *     `entrada-navegador.ts` las vuelve a fusionar, que es justo lo que esta
 *     orden deshace. Y pasarle la hoja como segunda entrada da:
 *     «When "build.cssCodeSplit: false" is set, "rollupOptions.input" should
 *     not include CSS files».
 *   · Con `cssCodeSplit: true` y dos entradas: «Invalid value for option
 *     "output.inlineDynamicImports" — multiple inputs are not supported». Lo
 *     obliga el `format: 'iife'` de la #02, que es lo que permite pedir el
 *     script con `defer` en vez de como módulo. Renunciar al `iife` para
 *     partir el CSS sería pagar una decisión medida con otra.
 *
 * Y el camino corto —copiar `fonts.css` a `public/`— está descartado por algo
 * medido: `OpenSans-600-latin.woff2` y `OpenSans-400-latin.woff2` son **el
 * mismo archivo byte por byte** (Open Sans es variable), y Vite lo nota y emite
 * uno solo para los dos `@font-face`. El sitio estático de `qa/referencia/`
 * trae los ocho y baja 73 KB de más. Sacar la hoja del pipeline de Vite sería
 * perder esa deduplicación **y** el `url()` reescrito a `/fuentes/`.
 *
 * O sea: el pipeline de CSS de Vite se conserva entero; lo único que cambia es
 * que esta hoja sale de su propio build, donde es la única entrada y no tiene
 * con qué fusionarse.
 *
 * ── `configFile: false`, que no es cosmético ──────────────────────────────
 * Sin eso, `build()` carga `vite.config.ts` y **suma** su entrada a la de acá:
 * dos entradas, y vuelve el error del `iife`. Este build es CSS solo: no
 * necesita el plugin de React ni nada de ese archivo.
 *
 * ── Los pisos ────────────────────────────────────────────────────────────
 * Puede fallar de dos maneras calladas —que no escriba la hoja, o que escriba
 * una vacía— y las dos terminan igual: una web sin tipografía, que se ve rara
 * pero funciona. Las dos se atajan acá, antes de que el prerender enlace nada.
 */
import { readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, '..');
const ASSETS = join(RAIZ, 'dist', 'assets');
const FUENTES = fileURLToPath(new URL('../../../packages/ui/fuentes/fonts.css', import.meta.url));

/* Los ocho `@font-face` ocupan 2,7 KB minificados. El piso está en 1 KB: una
   hoja que salga por debajo de eso perdió rules, no bytes de formato. */
const PISO_DE_BYTES = 1024;

const morir = (mensaje) => { console.error(`hoja-de-fuentes: ${mensaje}`); process.exit(1); };

await build({
  root: RAIZ,
  configFile: false,
  logLevel: 'warn',
  build: {
    /* NO vacía `dist/`: el build principal ya corrió y todo lo suyo está ahí. */
    emptyOutDir: false,
    /* Acá sí, y es lo que permite que una entrada `.css` sea una entrada. */
    cssCodeSplit: true,
    rollupOptions: {
      input: { fuentes: FUENTES },
      output: {
        /* Las mismas dos reglas que `vite.config.ts`, y por el mismo motivo:
           `vercel.json` le pone `immutable` a `/fuentes/(.*)`, así que los
           `.woff2` salen ahí con su nombre de siempre y sin hash. La hoja sí
           lleva hash —cambia cuando cambian las fuentes— y va a `/assets/`. */
        assetFileNames: (info) => (
          info.name?.endsWith('.woff2') ? 'fuentes/[name][extname]' : 'assets/[name]-[hash][extname]'
        ),
      },
    },
  },
});

const hojas = readdirSync(ASSETS).filter((n) => n.startsWith('fuentes-') && n.endsWith('.css'));
if (hojas.length !== 1) {
  morir(
    `esperaba exactamente una fuentes-*.css en dist/assets y hay ${hojas.length}`
    + `${hojas.length ? ` (${hojas.join(', ')})` : ''}. `
    + 'El prerender enlaza por nombre: sin eso la web sale sin tipografía.',
  );
}

const bytes = statSync(join(ASSETS, hojas[0])).size;
if (bytes < PISO_DE_BYTES) {
  morir(
    `${hojas[0]} salió en ${bytes} bytes y el piso es ${PISO_DE_BYTES}. `
    + 'Una hoja de fuentes vacía enlaza bien y no declara ninguna: la web se ve con la tipografía del sistema.',
  );
}

console.log(`hoja-de-fuentes: assets/${hojas[0]}  ${(bytes / 1024).toFixed(1)} KB`);
