/**
 * El CSS portado sigue siendo el CSS del sitio estático, **más el delta
 * declarado de cada orden** — orden Códice #01, ampliado por la #05.
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
/* Desde la orden #04 el sitio estático vive en `qa/referencia/` de este mismo
   repo, versionado. `ESTATICO_DIR` queda por si hay que apuntar a otro lado. */
const ESTATICO = process.env.ESTATICO_DIR || join(RAIZ, 'qa', 'referencia');

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
/*
 * ── Las de la #05: la paleta CFF ─────────────────────────────────────────
 *
 * La orden #05 cambió la paleta de la web a la del manual de Construyendo
 * Familias Fuertes, y eso toca **34 líneas** de esta hoja. Declararlas una por
 * una habría sido escribir la migración dos veces —el defecto que la misma
 * orden nombra al retirar `cambios-visibles.ts`—, así que se declaran como lo
 * que son: **dos renombres de token y nueve excepciones medidas.**
 *
 * El ocre se partió en dos porque el naranja del manual no alcanza AA como
 * texto chico: `--naranja` #DF4907 es el exacto, para líneas, aros y rayitas
 * (umbral 3:1, da 3,86); `--naranja-texto` #BF3F06 es el mismo oscurecido al
 * mínimo medido, para todo lo que sea texto (umbral 4,5, da 4,51 sobre el
 * cálido). El porqué de cada valor está en `packages/ui/codice-tokens.css`.
 *
 * Estas nueve son las líneas donde el ocre era **una línea y no una letra**, y
 * por eso se llevaron el naranja exacto. Van explícitas porque son la mitad de
 * la decisión: si alguien mueve una de acá a la otra columna, cambia el
 * contraste de esa regla y este archivo es donde se lo discute.
 */
const NARANJA_EN_LINEA: [string, string][] = [
  // el aro del foco: indicador de interfaz, umbral 3:1
  ['outline:1px solid var(--ocre)', 'outline:1px solid var(--naranja)'],
  // el filete de la cita, el de la garantía y el subrayado de los enlaces
  ['.cita{border-left:1px solid var(--ocre)', '.cita{border-left:1px solid var(--naranja)'],
  ['border-left:1px solid var(--ocre);padding-left:18px', 'border-left:1px solid var(--naranja);padding-left:18px'],
  ['.contacto .grande a{border-bottom:1px solid var(--ocre)', '.contacto .grande a{border-bottom:1px solid var(--naranja)'],
  ['.legal a{border-bottom:1px solid var(--ocre)}', '.legal a{border-bottom:1px solid var(--naranja)}'],
  // el aro del número de paso — el número de adentro es texto y va aparte
  ['letter-spacing:.06em;border:1px solid var(--ocre)', 'letter-spacing:.06em;border:1px solid var(--naranja)'],
  // la línea de arriba de cada tarjeta de «Lo que te llevas»
  ['.tres div{border-top:1px solid var(--ocre)', '.tres div{border-top:1px solid var(--naranja)'],
  // la rayita de cada ítem incluido
  ['width:8px;height:1px;background:var(--ocre)', 'width:8px;height:1px;background:var(--naranja)'],
  // el puntito del pie
  ['border-radius:50%;border:1px solid var(--ocre)', 'border-radius:50%;border:1px solid var(--naranja)'],
];

/*
 * Y las tres reglas que la #05 cambió por algo que no es la paleta.
 *
 * Las dos primeras son el pedido de Lucía —«poner estos íconos en color naranja
 * y las líneas también»— y la tercera es la mecánica del velo: cada tono de
 * sección declara con qué color se vela una fotografía puesta detrás de su
 * texto, para que la sección blanca siga leyéndose blanca. Ver `.fondo-foto`.
 */
const REGLAS_05: [string, string][] = [
  ['.paso__line{flex:1;height:1px;background:var(--hair)', '.paso__line{flex:1;height:1px;background:var(--naranja)'],
  ['.calido{background:var(--calido)}', '.calido{background:var(--calido);--velo:var(--calido)}'],
  ['.oscuro{background:var(--teal);color:var(--crema)}', '.oscuro{background:var(--teal);color:var(--crema);--velo:var(--teal)}'],
  ['.blanco{background:var(--superficie)}', '.blanco{background:var(--superficie);--velo:var(--superficie)}'],
];

/*
 * Lo que la #05 **agregó**, declarado por selector y no línea por línea.
 *
 * La otra mitad de este guardián exige que el port no traiga reglas de más, y
 * eso sigue valiendo: lo que no esté en esta lista y no esté en el estático, es
 * una regla que apareció sin que nadie la pidiera. Por prefijo y no por texto
 * completo a propósito — así una de estas reglas se puede ajustar sin volver
 * acá, y una regla nueva de otra familia se sigue poniendo roja.
 */
const AGREGADAS_05 = [
  '.fuerte{',            // «se construyen» en negritas (B)
  '.eyebrow--icono',     // el ícono del rótulo del hero del taller (C)
  '.hechos div img',     // los tres íconos de la franja de hechos (C)
  '.paso__icono',        // los cuatro íconos de los núcleos (C)
  '.con-fondo',          // la sección que lleva una fotografía de fondo (D)
  '.fondo-foto',         // la fotografía y su velo (D)
  '.foto-tarjeta',       // la fotografía en tarjeta (D)
  '.tres figure',        // las tres fotografías de «Lo que te llevas» (D)
];

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

/**
 * Saca los comentarios antes de comparar — la regla de la casa.
 *
 * ── El caso, que es de esta orden ────────────────────────────────────────
 * `CLAUDE.md` lo dice así: «un guardián que lee la prosa como si fuera código
 * aprueba el arreglo borrado». Acá se pagó en la otra dirección, que es igual de
 * mala: la #05 agregó seis bloques de comentario a `index.css` explicando por
 * qué el velo va al 94 % y por qué los íconos no se recolorean, y este guardián
 * informó **31 «reglas que el sitio estático no tiene»** — todas renglones de
 * prosa envueltos. Un rojo que no era un defecto, sobre un archivo correcto.
 *
 * El filtro por línea que había antes —descartar lo que empieza con `/*` o `*`—
 * no alcanza: una línea de prosa envuelta empieza con una palabra cualquiera.
 * Hay que sacar el bloque entero, y sobre el texto, no sobre las líneas.
 */
const soloCodigo = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '');

/**
 * Lleva un texto del sitio estático a lo que la web dibuja hoy.
 *
 * **El orden no es indiferente y por eso está escrito**: las nueve excepciones
 * de línea van ANTES del renombre global del ocre. Al revés, el global se
 * llevaría también las nueve y las dejaría en `--naranja-texto`: la hoja
 * seguiría pasando el test con nueve líneas del color equivocado, que es
 * exactamente el defecto que las nueve excepciones existen para vigilar.
 */
const normalizar = (texto: string) => {
  let t = texto;
  for (const [de, a] of [...PERMITIDAS, ...NARANJA_EN_LINEA, ...REGLAS_05]) t = t.split(de).join(a);
  /* Y recién ahora los dos renombres globales. */
  t = t.split('var(--ocre-medio)').join('var(--ambar)');
  t = t.split('var(--ocre)').join('var(--naranja-texto)');
  t = t.split('.btn--ocre').join('.btn--naranja');
  t = t.split('.tapa.ocre').join('.tapa.naranja');
  return t;
};

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
    const desdeElReset = soloCodigo(original.slice(original.indexOf('*{box-sizing:border-box')));
    const faltan = desdeElReset
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map(normalizar)
      .filter((linea) => !soloCodigo(portado).includes(linea));

    expect(faltan, 'estas reglas del sitio estático no llegaron al port').toEqual([]);
  });

  it('y no se agregó ninguna regla que el sitio estático no tuviera', () => {
    /* La otra mitad: el port tampoco puede traer reglas de más. Se mira el
       cuerpo —de `*{box-sizing` en adelante—, que es lo que se copió; la
       cabecera de comentarios y las tres líneas de `@tailwind` son de acá. */
    const cuerpoPortado = soloCodigo(portado.slice(portado.indexOf('*{box-sizing:border-box')));
    const originalNormalizado = normalizar(soloCodigo(original));
    const sobran = cuerpoPortado
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .filter((linea) => !AGREGADAS_05.some((sel) => linea.startsWith(sel)))
      .filter((linea) => !originalNormalizado.includes(linea));

    expect(sobran, 'estas reglas no existen en el sitio estático: el port no agrega').toEqual([]);
  });
});
