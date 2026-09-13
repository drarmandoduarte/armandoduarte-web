/**
 * El CSS portado sigue siendo el CSS del sitio estático — orden Códice #01.
 *
 * ── Qué cuida, y por qué no alcanza con el guardián de fidelidad ──────────
 * Playwright compara **lo que se ve**: dos capturas y su diferencia de píxeles.
 * Eso caza una regla rota, pero no caza una regla que se perdió en una parte de
 * la página que la captura no llega a mostrar en ese ancho, ni una que solo
 * aplica en `:hover`, ni una de un `@media` intermedio. Este test compara el
 * texto: **cada regla de `estilo.css` tiene que estar acá**, y las únicas dos
 * diferencias permitidas son las que la Fase B declaró.
 *
 * Es barato —lee dos archivos— y corre en cada commit, mientras que el de
 * navegador levanta Chromium. El caro confirma; el barato avisa primero.
 *
 * ── El piso, antes que nada ──────────────────────────────────────────────
 * Vitest devuelve **cadena vacía** para cualquier import de `.css` si no está
 * `css: { include }` en su config — `?raw` incluido, y sin avisar. Un test que
 * compare contra la nada pasa en verde habiendo mirado nada. Por eso lo primero
 * que se afirma es que los dos archivos pesan; recién después se comparan.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import portado from './index.css?raw';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, '..', '..', '..');
const ESTATICO = process.env.ESTATICO_DIR || join(RAIZ, '..', 'armandoduarte-web');

let original = '';
try {
  original = readFileSync(join(ESTATICO, 'estilo.css'), 'utf8');
} catch { /* se cae en el piso, con el nombre a la vista */ }

/**
 * Las sustituciones declaradas, y las únicas que puede haber.
 *
 * ── La de la #01 ─────────────────────────────────────────────────────────
 * `#fff` → `var(--superficie)`: el único hex que el port no podía dejar escrito,
 * porque ningún hex vive fuera de `codice-tokens.css`.
 *
 * ── Las dos de la #03, que son cambios de verdad y por eso están acá ──────
 * Son las **dos únicas reglas** que la orden del contraste tocó fuera de los
 * tokens, y las dos se miden:
 *
 *   · `.contacto .grande` pasaba `color:var(--tinta)` **encima** de
 *     `.tinta .grande{color:var(--crema)}` —misma especificidad, línea
 *     posterior—, así que el bloque de contacto de la portada se dibujaba
 *     tinta sobre tinta: contraste **1:1**, el teléfono de Armando invisible.
 *     `inherit` es el cambio más chico que lo arregla: en un fondo claro
 *     hereda la tinta del `<body>` y no cambia nada; en la sección oscura
 *     hereda el crema, que es lo que la regla de al lado siempre quiso.
 *
 *   · `.oscuro .ficha li span:first-child` al 60 % de crema sobre teal daba
 *     **3,77**; al 70 % da **4,52**. Es el rótulo de la ficha del taller
 *     («Horario», «Lugar», «Modalidad», «Inversión»), 12 px.
 *
 * Las tres del design system —el gris, el ocre y el ocre medio— **no** están
 * acá y es correcto: viven en `codice-tokens.css`, y este guardián se saltea el
 * bloque `:root` a propósito.
 */
const PERMITIDAS: [string, string][] = [
  ['#fff', 'var(--superficie)'],
  [
    '.contacto .grande{font-family:var(--display);font-weight:300;font-size:clamp(24px,2.6vw,36px);line-height:1.25;color:var(--tinta)}',
    '.contacto .grande{font-family:var(--display);font-weight:300;font-size:clamp(24px,2.6vw,36px);line-height:1.25;color:inherit}',
  ],
  [
    '.oscuro .ficha li span:first-child{color:rgba(250,247,241,.6)}',
    '.oscuro .ficha li span:first-child{color:rgba(250,247,241,.7)}',
  ],
];

describe('el CSS portado', () => {
  it(`piso · se leyeron los dos archivos (${join(ESTATICO, 'estilo.css')})`, () => {
    expect(original.length, 'no se pudo leer estilo.css: es la especificación del port').toBeGreaterThan(10_000);
    expect(
      portado.length,
      'index.css llegó vacío. Vitest devuelve "" para todo .css sin `css: { include }` en vite.config, '
      + 'y un test que compara contra la nada pasa en verde sin haber mirado nada.',
    ).toBeGreaterThan(10_000);
  });

  it('el bloque :root no está acá: los tokens viven en @codice/ui', () => {
    expect(portado).not.toContain(':root{--crema');
  });

  it('cada regla del sitio estático está, salvo las dos sustituciones declaradas', () => {
    /* Se compara línea por línea y no en bloque: un diff de 280 líneas no dice
       nada, y la línea que falta sí. Se saltea el bloque `:root` —que se mudó a
       los tokens— y las líneas en blanco. */
    const desdeElReset = original.slice(original.indexOf('*{box-sizing:border-box'));
    const faltan = desdeElReset
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((linea) => PERMITIDAS.reduce((l, [de, a]) => l.split(de).join(a), linea))
      .filter((linea) => !portado.includes(linea));

    expect(faltan, 'estas reglas del sitio estático no llegaron al port').toEqual([]);
  });

  it('y no se agregó ninguna regla que el sitio estático no tuviera', () => {
    /* La otra mitad: el port tampoco puede traer reglas de más. Se mira el
       cuerpo —de `*{box-sizing` en adelante—, que es lo que se copió; la
       cabecera de comentarios y las tres líneas de `@tailwind` son de acá. */
    const cuerpoPortado = portado.slice(portado.indexOf('*{box-sizing:border-box'));
    const originalNormalizado = PERMITIDAS.reduce((t, [de, a]) => t.split(de).join(a), original);
    const sobran = cuerpoPortado
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .filter((linea) => !originalNormalizado.includes(linea));

    expect(sobran, 'estas reglas no existen en el sitio estático: el port no agrega').toEqual([]);
  });
});
