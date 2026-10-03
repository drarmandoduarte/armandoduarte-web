/**
 * Lo que dice la web es lo que mandó Armando — orden Códice #19, D.
 *
 * ── Por qué hace falta, si «ya está bien» ───────────────────────────────
 * Porque **ya estuvo bien una vez y se auditó mal**. El PASA de la #12 dio por
 * buenas dos cosas leyendo el informe en vez de lo que el cliente había
 * mandado, y las dos estaban mal. La lección quedó escrita en la corrección de
 * esa auditoría: *lo que pidió el cliente se verifica contra lo que el cliente
 * mandó.* Un test es la única forma de que esa frase siga siendo cierta dentro
 * de seis meses, cuando nadie se acuerde de qué mandó Armando.
 *
 * El modo de falla que caza no es un error de tipeo: es una **mejora**. Alguien
 * lee «Comprender los cambios biológicos, cerebrales y emocionales propios de
 * esta etapa de la vida» y le parece que queda mejor sin «de la vida». Tiene
 * razón, probablemente. Pero eso lo escribió Armando en
 * `aaMODELO ORIENTADO A LA MADUREZ.docx` y no lo cambia la web: lo cambia él.
 *
 * ── Contra qué se mide, que es la mitad del asunto ──────────────────────
 * Contra `03 Producto/web/insumos/2026-09-28-taller-merida/LEEME.md`, que es
 * donde dirección dejó por escrito lo que llegó por WhatsApp el 28/9. **No**
 * contra otro string de i18n ni contra una copia en este archivo: una copia es
 * una segunda verdad que coincide justo hasta el día que importa. Es la lección
 * de la #06 —un guardián que compara contra otra copia vigila la copia—
 * aplicada a un texto de cliente.
 *
 * ── Lo que NO comprueba ─────────────────────────────────────────────────
 * Que el `LEEME.md` diga lo que Armando mandó. Eso es de dirección, y es el
 * único eslabón que un test no puede cerrar: el `.docx` original no está en el
 * repo. Lo que este archivo garantiza es que **entre el insumo y la pantalla no
 * se pierde ni un carácter**.
 */
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RECURSOS_I18N } from '@codice/core';
import { RUTAS } from './rutas';

/* El proyecto vive dos niveles por encima del repo: `04 Codigo/<repo>`. Los
   insumos no son del repo —son lo que mandó el cliente— y por eso están afuera:
   el repo es público y esa carpeta tiene material sin publicar. */
const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const INSUMOS = join(REPO, '..', '..', '03 Producto', 'web', 'insumos', '2026-09-28-taller-merida', 'LEEME.md');
/**
 * ── El guardia, que es lo que faltaba ───────────────────────────────────
 * Este archivo vive **fuera del repo**, y el repo es **público**. Tal como
 * estaba, un `readFileSync` a nivel de módulo hacía que en cualquier clon
 * ajeno a esta carpeta el archivo entero **reventara al importar** —no se
 * saltaba: se caía, y con un `ENOENT` que no explica nada—.
 *
 * Con el guardia, la suite se salta **declarándose**: aparece como saltada en
 * el reporte, el guardián de guardianes la ve, y `qa/skips-permitidos.md` es el
 * único lugar donde eso se puede autorizar. Un test que no corre no grita; éste
 * al menos dice su nombre.
 */
/* ── El pedido del 2/10 (orden #33) ──────────────────────────────────────
   Tres textos nuevos de Armando —la sede, la modalidad y el receso— llegaron
   por WhatsApp a Germán y dirección los dejó escritos en la orden #33, entre
   comillas latinas. Esa orden es el insumo: Rodolfo no produce insumos, y una
   copia acá sería la segunda verdad que este archivo existe para evitar. */
const PEDIDO_DEL_2_10 = join(REPO, '..', '..', '03 Producto', 'codice', 'ordenes', 'orden-33-la-web-sin-mi-espacio-por-ahora.md');
const HAY_INSUMO = existsSync(INSUMOS) && existsSync(PEDIDO_DEL_2_10);
const LEEME = HAY_INSUMO ? readFileSync(INSUMOS, 'utf8') : '';
const PEDIDO = HAY_INSUMO ? readFileSync(PEDIDO_DEL_2_10, 'utf8') : '';
const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');

/**
 * Los cinco núcleos tal como están escritos en el `LEEME.md`, en el formato en
 * que dirección los copió: `N. Título — Texto`.
 *
 * La raya es la **em dash** (—) y no un guion: se extrae con ella a propósito,
 * porque si alguien reescribiera el `LEEME.md` con un guion corto este lector
 * devolvería una lista vacía y los tests de abajo pasarían sobre la nada. Por
 * eso el piso cuenta cinco antes de comparar ninguno.
 */
export function nucleosDelLeeme(md: string) {
  const salida: { titulo: string; texto: string }[] = [];
  for (const linea of md.split('\n')) {
    const m = /^\d+\.\s+(.+?)\s+—\s+(.+?)\s*$/.exec(linea.trim());
    if (m) salida.push({ titulo: m[1], texto: m[2] });
  }
  return salida;
}

const NUCLEOS = nucleosDelLeeme(LEEME);
const CLAVES = ['uno', 'dos', 'tres', 'cuatro', 'cinco'] as const;
/* Se lee del mismo sitio del que lo lee la pantalla —`RECURSOS_I18N`— y no del
   archivo JSON directo: si mañana el `web.json` cambia de ruta, la pantalla y
   este test se mueven juntos. Un test que lee el archivo por su camino queda
   vigilando un archivo que ya no se publica. */
const web = RECURSOS_I18N.es.web as Record<string, any>;
const programa = web.taller.programa;
const hechos = web.taller.hechos;
const fichaDeLaPortada = web.inicio.taller;
const ahora = web.inicio.ahora;

const suite = HAY_INSUMO ? describe : describe.skip;

suite('la web dice lo que mandó Armando, carácter por carácter', () => {
  it('EL PISO, PRIMERO: el LEEME de los insumos se leyó y trae los cinco', () => {
    /* Sin esto, un `LEEME.md` movido de carpeta o un formato distinto darían
       cero núcleos y las comparaciones de abajo —que recorren esa lista— no
       compararían nada. Un `for` sobre una lista vacía sale en verde. */
    expect(LEEME.length, `no se pudo leer ${INSUMOS}`).toBeGreaterThan(500);
    expect(
      NUCLEOS.length,
      'el LEEME.md de los insumos ya no tiene los cinco núcleos con la forma «N. Título — Texto». '
      + 'Si cambió de formato, este archivo dejó de comparar contra nada.',
    ).toBe(5);
  });

  it('los cinco núcleos son EXACTAMENTE los del insumo', () => {
    const diferencias: string[] = [];
    for (const [i, clave] of CLAVES.entries()) {
      const mando = NUCLEOS[i];
      const publicado = programa[clave];
      if (publicado.titulo !== mando.titulo) {
        diferencias.push(`núcleo ${i + 1} · título\n    mandó:    «${mando.titulo}»\n    publica:  «${publicado.titulo}»`);
      }
      if (publicado.texto !== mando.texto) {
        diferencias.push(`núcleo ${i + 1} · texto\n    mandó:    «${mando.texto}»\n    publica:  «${publicado.texto}»`);
      }
    }
    expect(
      diferencias,
      'Lo que Armando escribió no se edita en la web: se le pide a él que lo cambie. Tildes, '
      + 'comillas y espacios cuentan — una «mejora» de estilo es exactamente el defecto que este '
      + 'test existe para cazar.',
    ).toEqual([]);
  });

  it('la fecha y el horario salen del insumo del 28/9, y la sede del pedido del 2/10', () => {
    /* Los tres viven en el LEEME.md en una frase de prosa, así que se buscan
       dentro de ella en vez de parsearla: lo que importa es que el valor
       publicado ESTÉ ahí, no cómo esté redactada la frase. */
    const faltan: string[] = [];
    const enElInsumo = (valor: string, que: string) => {
      if (!LEEME.includes(valor)) faltan.push(`${que}: la web publica «${valor}» y el insumo no lo dice`);
    };
    enElInsumo('5 de noviembre de 2026'.slice(0, 15), 'fecha');
    enElInsumo(hechos.horarioValor, 'horario');
    if (!PEDIDO.includes(`«${hechos.dondeValor}»`)) faltan.push(`sede: la web publica «${hechos.dondeValor}» y el pedido del 2/10 no lo dice`);
    expect(
      faltan,
      'La fecha, la sede y el horario que publica la web tienen que estar en el insumo del 28/9. '
      + 'Si alguien los cambia acá, esto se pone rojo — que es justo lo que se quiere: los datos del '
      + 'taller los pone Armando.',
    ).toEqual([]);

    /* Y al revés, que es la mitad que falta: el insumo dice 8:30 a 13:00, así
       que si la web dijera otra cosa el `includes` de arriba ya lo habría
       cazado — pero sólo porque el valor es literal. Esto lo ancla. */
    expect(hechos.horarioValor, 'el horario del insumo es «8:30 a 13:00»').toBe('8:30 a 13:00');
    /* La sede pasó a «Fiesta Inn CORDEMEX» en la #33 y volvió a «Fiesta Inn
       Mérida» la misma tarde (#33 ter, pedido de Diana). Es la del insumo del
       28/9, así que se ancla también contra él. */
    expect(hechos.dondeValor, 'la sede, desde la #33 ter, es «Fiesta Inn Mérida»').toBe('Fiesta Inn Mérida');
    enElInsumo(hechos.dondeValor, 'sede');
    expect(faltan, 'la sede tiene que estar en el insumo del 28/9').toEqual([]);
  });

  it('los tres textos del 2/10 (sede, modalidad, receso) están en todos lados, y los de antes en ninguno', () => {
    /* Contra el pedido, entre comillas latinas, como lo escribió dirección.
       La modalidad la ajustó Armando el mismo 2/10 a las 13:31 (orden #33 bis,
       llegada por chat a Rodolfo): de «Modalidad Presencial» a «Presencial».
       Ese ajuste no está escrito en la orden #33, así que se ancla como
       literal y no se busca en el pedido. */
    const NUEVOS = {
      sede: 'Fiesta Inn Mérida',
      modalidad: 'Presencial',
      receso: 'Con un receso de 20 minutos',
    };
    for (const [que, valor] of Object.entries({ sede: NUEVOS.sede, receso: NUEVOS.receso })) {
      expect(PEDIDO, `${que}: «${valor}» no está en el pedido del 2/10`).toContain(`«${valor}»`);
    }
    /* Cada lugar de i18n donde aparecen. */
    expect(hechos.dondeValor).toBe(NUEVOS.sede);
    expect(hechos.dondeAria.startsWith(`${NUEVOS.sede} ·`), 'el aria del mapa nombra la sede').toBe(true);
    expect(fichaDeLaPortada.fichaLugarValor, 'la ficha del taller de la portada').toBe(NUEVOS.sede);
    expect(ahora.meta1, 'la banda AHORA').toBe(NUEVOS.sede);
    expect(web.taller.head.description, 'la descripción de /merida (la de OG)').toContain(NUEVOS.sede);
    expect(hechos.modalidadValor).toBe(NUEVOS.modalidad);
    expect(fichaDeLaPortada.fichaModalidadValor, 'la ficha del taller de la portada').toBe(NUEVOS.modalidad);
    expect(programa.receso).toBe(NUEVOS.receso);

    /* Y lo publicado: ningún texto de antes en ningún HTML de dist (JSON-LD y
       meta incluidos), y el `Place` del Event con la sede nueva. */
    /* «CORDEMEX» suelto y no «Fiesta Inn CORDEMEX»: que no quede la palabra en
       ninguna forma (#33 ter). */
    const VIEJOS = ['CORDEMEX', 'Sesión privada en vivo', 'entre el núcleo 2 y el 3', 'Modalidad Presencial'];
    const paginas = RUTAS.map(({ archivo }) => ({ archivo, html: existsSync(join(DIST, archivo)) ? readFileSync(join(DIST, archivo), 'utf8') : '' }));
    for (const { archivo, html } of paginas) {
      expect(html.length, `${archivo} no está en dist: corre el build antes`).toBeGreaterThan(1000);
      for (const viejo of VIEJOS) expect(html, `${archivo} todavía dice «${viejo}»`).not.toContain(viejo);
    }
    const merida = paginas.find((p) => p.archivo === 'merida.html')!.html;
    expect(merida, 'el Place del Event').toContain(`"name":"${NUEVOS.sede}"`);
    expect(merida, 'el receso en /merida').toContain(NUEVOS.receso);
  });

  it('#32: los términos dicen que se reserva por WhatsApp, no en Mi espacio', () => {
    /* Dirección, 2/10 (cierre de la #32): con la web sin «Mi espacio» (#33),
       los términos seguían diciendo que los lugares se reservan ahí. El texto
       es literal de dirección. */
    const RESERVAS = 'Los lugares en los talleres se reservan por WhatsApp con el equipo de Armando, que confirma cupo, '
      + 'forma de pago y condiciones de cada actividad. En este sitio no se cobra nada ni se procesan pagos.';
    expect(web.terminos.reservasTexto).toBe(RESERVAS);
    const archivo = join(DIST, 'terminos.html');
    const html = existsSync(archivo) ? readFileSync(archivo, 'utf8') : '';
    expect(html.length, 'terminos.html no está en dist: corre el build antes').toBeGreaterThan(1000);
    expect(html, 'lo publicado').toContain(RESERVAS);
    expect(html, 'el texto de antes').not.toContain('se reservan en Mi espacio');
  });

  it('y el lector de núcleos distingue una línea de núcleo de la prosa de al lado', () => {
    /* El autoexamen que hace valer al piso: si el regex matcheara cualquier
       línea, los cinco se «encontrarían» en cualquier documento. */
    expect(nucleosDelLeeme('1. Título — Texto')).toEqual([{ titulo: 'Título', texto: 'Texto' }]);
    expect(nucleosDelLeeme('- Título — Texto'), 'una viñeta no es un núcleo numerado').toEqual([]);
    expect(nucleosDelLeeme('1. Título - Texto'), 'con guion corto no es la forma del insumo').toEqual([]);
    expect(nucleosDelLeeme('**Los datos del taller** (Armando, 28/9): jueves')).toEqual([]);
  });
});
