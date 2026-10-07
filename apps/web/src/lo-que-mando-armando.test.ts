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
import { inflateRawSync } from 'node:zlib';
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
/* ── El pedido del 3/10 (orden #36) ──────────────────────────────────────
   «Libros publicados» con el tercer libro y la miniatura del taller. Llegó por
   WhatsApp a Germán y dirección lo dejó escrito en la orden #36, entre comillas
   latinas: esa orden es el insumo, por la misma razón que la #33. */
const PEDIDO_DEL_3_10 = join(REPO, '..', '..', '03 Producto', 'codice', 'ordenes', 'orden-36-libros-publicados-y-miniatura.md');
const HAY_INSUMO = existsSync(INSUMOS) && existsSync(PEDIDO_DEL_2_10) && existsSync(PEDIDO_DEL_3_10);
const LEEME = HAY_INSUMO ? readFileSync(INSUMOS, 'utf8') : '';
const PEDIDO = HAY_INSUMO ? readFileSync(PEDIDO_DEL_2_10, 'utf8') : '';
const PEDIDO_36 = HAY_INSUMO ? readFileSync(PEDIDO_DEL_3_10, 'utf8') : '';
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

  it('#36: «Libros publicados» con los tres, «3 libros» en el hero y el alt de la miniatura', () => {
    const LIBROS = 'Construyendo Familias Fuertes · Padres digitalmente responsables · Inteligencias Múltiples en la Familia';
    const CLAVE = 'Libros publicados';
    const ALT = 'Taller · El arte de amar a tu hijo adolescente';
    for (const valor of [LIBROS, CLAVE, ALT, '3 LIBROS']) {
      expect(PEDIDO_36, `«${valor}» no está en el pedido del 3/10`).toContain(`«${valor}»`);
    }
    /* Las dos fichas. La de #quien arma el valor con tres <em>, así que se
       compara la suma de sus partes: el texto que lee la persona. */
    const quien = web.inicio.quien;
    expect(quien.fichaLibrosClave).toBe(CLAVE);
    expect([quien.fichaLibrosLibro1, quien.fichaLibrosLibro2, quien.fichaLibrosLibro3].join(quien.fichaLibrosEntre)).toBe(LIBROS);
    expect(web.taller.facilitador.librosClave).toBe(CLAVE);
    expect(web.taller.facilitador.librosValor).toBe(LIBROS);
    /* El hero lo pone en mayúsculas por CSS; el texto es «3 libros». */
    expect(web.inicio.hero.micro3.toUpperCase()).toBe('3 LIBROS');
    expect(web.taller.head.ogImageAlt).toBe(ALT);

    /* Lo publicado: «Obra» no queda como rótulo en ninguna página, ni «2 libros». */
    for (const { archivo } of RUTAS) {
      const ruta = join(DIST, archivo);
      const html = existsSync(ruta) ? readFileSync(ruta, 'utf8') : '';
      expect(html.length, `${archivo} no está en dist: corre el build antes`).toBeGreaterThan(1000);
      expect(html, `${archivo} todavía tiene el rótulo «Obra»`).not.toMatch(/>\s*Obra\s*</);
      expect(html, `${archivo} todavía dice «2 libros»`).not.toMatch(/>\s*2 libros\s*</i);
    }
    const inicio = readFileSync(join(DIST, 'index.html'), 'utf8');
    expect(inicio, 'la ficha de #quien, con los tres en cursiva').toContain(
      `<em>${quien.fichaLibrosLibro1}</em> · <em>${quien.fichaLibrosLibro2}</em> · <em>${quien.fichaLibrosLibro3}</em>`,
    );
    const merida = readFileSync(join(DIST, 'merida.html'), 'utf8');
    expect(merida, 'la ficha de #facilitador').toContain(LIBROS);
    expect(merida, 'el og:image:alt de /merida').toContain(`property="og:image:alt" content="${ALT}"`);
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

/* ═══ /matrimonios · contra el `.docx` de Armando (orden #38) ═════════════
   Acá el insumo **es el archivo que mandó Armando**, no una transcripción:
   `landing SANAR MATRIMONIO HERIDO.docx`, en la carpeta de insumos del 5/10.
   Se lee el `.docx` de verdad —un zip con `word/document.xml` adentro— con
   `node:zlib`, sin dependencias: un párrafo por `<w:p>`, el texto de sus
   `<w:t>` pegado.

   Las únicas diferencias permitidas, declaradas en la orden #38 y aplicadas
   por `aLaCasa()` antes de comparar —nada más se normaliza—:
     · sin el emoji 👉 (D6: sin emojis);
     · las comillas tipográficas de la casa: "…" y “…” pasan a «…»;
     · «(Foto)» delante de la biografía es una indicación de Armando para el
       diseño, no texto: se quita.
   Y dos que no son del texto sino de la forma, también declaradas:
     · los dos títulos que en el `.docx` terminan en «:» porque presentan una
       lista («Las fortalezas…», «Frases poderosas…») se publican sin los dos
       puntos, como los escribe la orden;
     · en la ficha del cierre y en las fortalezas, «Clave: valor» se parte en
       dos piezas de la pantalla; se compara la suma. */
const INSUMOS_38 = join(REPO, '..', '..', '03 Producto', 'web', 'insumos', '2026-10-05-matrimonios');
const DOCX = join(INSUMOS_38, 'landing SANAR MATRIMONIO HERIDO.docx');
const ORDEN_38 = join(REPO, '..', '..', '03 Producto', 'codice', 'ordenes', 'orden-38-landing-matrimonios.md');
const HAY_DOCX = existsSync(DOCX) && existsSync(ORDEN_38);

/** `word/document.xml` de un `.docx`, leído del zip a mano (directorio central). */
export function documentoDe(docx: Buffer): string {
  let fin = docx.length - 22;
  while (fin >= 0 && docx.readUInt32LE(fin) !== 0x06054b50) fin -= 1;
  if (fin < 0) throw new Error('no es un zip: no encontré el fin del directorio central');
  const entradas = docx.readUInt16LE(fin + 10);
  let p = docx.readUInt32LE(fin + 16);
  for (let i = 0; i < entradas; i += 1) {
    const metodo = docx.readUInt16LE(p + 10);
    const comprimido = docx.readUInt32LE(p + 20);
    const largoNombre = docx.readUInt16LE(p + 28);
    const largoExtra = docx.readUInt16LE(p + 30);
    const largoComentario = docx.readUInt16LE(p + 32);
    const local = docx.readUInt32LE(p + 42);
    const nombre = docx.toString('utf8', p + 46, p + 46 + largoNombre);
    if (nombre === 'word/document.xml') {
      const desde = local + 30 + docx.readUInt16LE(local + 26) + docx.readUInt16LE(local + 28);
      const datos = docx.subarray(desde, desde + comprimido);
      return (metodo === 8 ? inflateRawSync(datos) : datos).toString('utf8');
    }
    p += 46 + largoNombre + largoExtra + largoComentario;
  }
  throw new Error('el .docx no tiene word/document.xml');
}

const desescapar = (x: string) => x
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');

/** Los párrafos del documento, con su texto tal cual (sin normalizar). */
export function parrafosDe(xml: string): string[] {
  return [...xml.matchAll(/<w:p[ >][\s\S]*?<\/w:p>/g)]
    .map(([p]) => [...p.matchAll(/<w:t(?: [^>]*)?>([\s\S]*?)<\/w:t>/g)].map((m) => desescapar(m[1])).join(''));
}

/** Las diferencias declaradas arriba, y ninguna otra. */
export const aLaCasa = (x: string) => x
  .replace(/👉\s*/gu, '')
  .replace(/^\(Foto\)\s*/, '')
  .replace(/"([^"]*)"/g, '«$1»')
  .replace(/“([^”]*)”/g, '«$1»')
  .trim();

const PARRAFOS_38 = HAY_DOCX ? parrafosDe(documentoDe(readFileSync(DOCX))).map(aLaCasa).filter(Boolean) : [];
const ORDEN = HAY_DOCX ? readFileSync(ORDEN_38, 'utf8') : '';
const suite38 = HAY_DOCX ? describe : describe.skip;

/* La biografía del `.docx`, que la #41 reemplazó. Está escrita acá y no leída
   de i18n porque i18n ya no la tiene: es el párrafo que el test de abajo
   espera encontrar en el `.docx` y no en la página. */
const BIO_DEL_DOCX = 'Armando Duarte es un experto en familia. Casado y padre de 7 hijos. Dedica 1000 horas al año para atender '
  + 'en sesiones de consultoría familiar a parejas que pasan por dificultades. Cuenta con estudios de Licenciatura en '
  + 'Ciencias de la Familia, Maestría en Educación y Doctorado en Liderazgo.';

suite38('/matrimonios dice lo que mandó Armando en el .docx (#38)', () => {
  const m = (web as Record<string, any>).matrimonios;
  const f = m.fortalezas;
  const c = m.cierre;
  const conDosPuntos = (clave: string, valor: string) => `${clave}: ${valor}`;

  /** Lo que se publica y tiene que ser, ENTERO, un párrafo del `.docx`. */
  const publicados: [string, string][] = [
    ['hero.sub', m.hero.sub],
    ['mirarse.titulo', m.mirarse.titulo],
    ['mirarse.bajada', m.mirarse.bajada],
    ...(['uno', 'dos', 'tres', 'cuatro', 'cinco'] as const).map((k): [string, string] => [`mirarse.${k}`, m.mirarse[k]]),
    ['mirarse.cita', m.mirarse.cita],
    ['dolor.titulo', m.dolor.titulo],
    ['dolor.cuerpo1', m.dolor.cuerpo1],
    ['dolor.hijos + hijosFuerte', m.dolor.hijos + m.dolor.hijosFuerte],
    ['dolor.rival', m.dolor.rival],
    ['dolor.cita', m.dolor.cita],
    ['giro.titulo1 + titulo2', `${m.giro.titulo1} ${m.giro.titulo2}`],
    ['giro.cuerpo', m.giro.cuerpo],
    ['giro.cita', m.giro.cita],
    ['fortalezas.titulo (+ «:»)', `${f.titulo}:`],
    ['fortalezas.bajada', f.bajada],
    ...(['uno', 'dos', 'tres', 'cuatro', 'cinco'] as const).map((k): [string, string] => [`fortalezas.${k}`, conDosPuntos(f[k].titulo, f[k].texto)]),
    ['frases.titulo (+ «:»)', `${m.frases.titulo}:`],
    ...(['uno', 'dos', 'tres', 'cuatro'] as const).map((k): [string, string] => [`frases.${k}`, m.frases[k]]),
    ['facilitador.cita', m.facilitador.cita],
    ['cierre.titulo', c.titulo],
    ['cierre.cuerpo', c.cuerpo],
    ...(['modalidad', 'duracion', 'inicia', 'inversion'] as const).map((k): [string, string] => [`cierre.${k}`, conDosPuntos(c[`${k}Clave`], c[`${k}Valor`])]),
    ['cierre.incluyeClave', c.incluyeClave],
    ...([1, 2, 3, 4] as const).map((i): [string, string] => [`cierre.incluye${i}`, c[`incluye${i}`]]),
    ['cierre.llamado', c.llamado],
  ];

  it('EL PISO, PRIMERO: el .docx se leyó y trae lo que tiene que traer', () => {
    expect(PARRAFOS_38.length, `no se pudo leer ${DOCX}`).toBeGreaterThanOrEqual(40);
    expect(PARRAFOS_38).toContain('¿Están listos para luchar?');
    expect(publicados.length, 'la lista de lo publicado (la biografía salió con la #41)').toBe(42);
  });

  it('cada texto publicado es, carácter por carácter, un párrafo del .docx', () => {
    const faltan = publicados
      .filter(([, valor]) => !PARRAFOS_38.includes(valor))
      .map(([clave, valor]) => `${clave}: «${valor}» no es ningún párrafo del .docx`);
    expect(
      faltan,
      'Lo que Armando escribió no se edita en la web: se le pide a él. Las únicas diferencias son las '
      + 'declaradas arriba (emoji, comillas, «(Foto)», los «:» de dos títulos).',
    ).toEqual([]);
  });

  it('y al revés: ningún párrafo del .docx quedó sin publicar', () => {
    const publicado = new Set(publicados.map(([, v]) => v));
    /* Lo que el `.docx` trae y no es texto de la página, cada uno con su
       motivo: el título del documento (el titular sale de la orden, abajo),
       las dos indicaciones de botón y el encabezado del facilitador, que es el
       rótulo de la sección. */
    const NO_SON_TEXTO = new Map([
      ['CÓMO SANAR A UN MATRIMONIO HERIDO', 'el título del documento; el hero dice lo que fija la orden'],
      ['BOTON [ ASEGURAR MI LUGAR EN EL TALLER ]', 'una indicación de botón: es «Asegurar mi lugar en el taller»'],
      ['Sobre el Facilitador', 'el rótulo de la sección, «Sobre el facilitador»'],
      ['Todo lo que necesitas para fortalecer tu relación', 'la bajada del hero (ya está en la lista)'],
      [BIO_DEL_DOCX, 'Armando la tachó el 6/10 y mandó otra: la #41, que se mide abajo contra su insumo'],
    ]);
    const sueltos = PARRAFOS_38.filter((p) => !publicado.has(p) && !NO_SON_TEXTO.has(p));
    expect(sueltos, 'un párrafo de Armando que la página no dice').toEqual([]);
    expect(m.reservar.toUpperCase(), 'el botón').toBe('ASEGURAR MI LUGAR EN EL TALLER');
    expect(PARRAFOS_38, 'la indicación del botón sigue en el .docx').toContain('BOTON [ ASEGURAR MI LUGAR EN EL TALLER ]');
    expect(m.facilitador.eyebrow.toLowerCase()).toBe('sobre el facilitador');
  });

  it('lo que no está en el .docx sale de la orden #38, entre sus comillas', () => {
    /* El titular, los datos del hero y de la banda de hechos, el mensaje de
       WhatsApp y la línea de los dos números: los fija la orden, no el `.docx`
       (el horario no está en el `.docx`: está en el póster y en la orden). */
    expect(ORDEN).toContain(`«${m.hero.titulo1} / ${m.hero.titulo2Palabra}»`);
    expect(ORDEN).toContain(`«${m.hero.eyebrow.toUpperCase()}»`);
    expect(ORDEN).toContain(`«${[m.hero.micro1, m.hero.micro2, m.hero.micro3].join(' · ').toUpperCase()}»`);
    const h = m.hechos;
    for (const [clave, valor] of [[h.iniciaClave, h.iniciaValor], [h.horarioClave, h.horarioValor], [h.modalidadClave, h.modalidadValor], [h.duracionClave, h.duracionValor]]) {
      expect(ORDEN, `la banda de hechos: ${clave}`).toContain(`${clave} · ${valor}`);
    }
    expect(ORDEN).toContain(`«${m.mensaje}»`);
    expect(ORDEN).toContain(`«${c.telefonos}»`);
    expect(ORDEN).toContain(`**«${m.reservar}»**`);
    expect(ORDEN).toContain(`**«${m.otroPais}»**`);
    expect(ORDEN).toContain(`«${m.head.title}»`);
    expect(ORDEN).toContain(`«${m.head.ogImageAlt}»`);
  });

  it('lo publicado: sin el emoji, con los textos, y el precio literal', () => {
    const archivo = join(DIST, 'matrimonios.html');
    const html = existsSync(archivo) ? readFileSync(archivo, 'utf8') : '';
    expect(html.length, 'matrimonios.html no está en dist: corre el build antes').toBeGreaterThan(1000);
    expect(html, 'D6: sin emojis').not.toContain('👉');
    for (const [clave, valor] of publicados) {
      /* Los «Clave: valor» se publican en dos piezas: se busca el valor. */
      const pieza = valor.includes(': ') && /^(cierre\.|fortalezas\.(uno|dos|tres|cuatro|cinco))/.test(clave)
        ? valor.slice(valor.indexOf(': ') + 2)
        : valor;
      const visible = clave.endsWith('(+ «:»)') ? valor.slice(0, -1) : pieza;
      const enHtml = clave === 'dolor.hijos + hijosFuerte' || clave.startsWith('giro.titulo')
        ? null
        : visible;
      if (enHtml) expect(html, `${clave} no está en la página`).toContain(enHtml);
    }
    expect(html).toContain('$1,170 MXN (6 mensualidades)');
  });

  it('y el lector del .docx distingue lo que tiene que distinguir', () => {
    /* El autoexamen: las tres normalizaciones hacen solo lo suyo. */
    expect(aLaCasa('👉 ¡Hola!')).toBe('¡Hola!');
    expect(aLaCasa('"Uno." y “dos”')).toBe('«Uno.» y «dos»');
    expect(aLaCasa('(Foto) Armando')).toBe('Armando');
    expect(aLaCasa('Una foto (Foto) adentro')).toBe('Una foto (Foto) adentro');
    expect(parrafosDe('<w:p><w:r><w:t>Uno</w:t></w:r><w:r><w:t xml:space="preserve"> dos</w:t></w:r></w:p><w:p><w:r><w:t>&amp;</w:t></w:r></w:p>'))
      .toEqual(['Uno dos', '&']);
  });
});

/* ═══ /matrimonios · los ajustes del 6/10 (orden #41) ═══════════════════
   Armando mandó por WhatsApp el texto del enlace, una biografía nueva y la
   ficha sin las edades. Dirección los transcribió, literal, en el `LEEME.md`
   de los insumos del 6/10: ése es el insumo, y de ahí se leen —no de una
   copia en este archivo—. Cada sección `## N.` trae su texto como cita (`> `);
   la de las edades lo trae en la cita que empieza con «quedaría:». */
const AJUSTES_41 = join(REPO, '..', '..', '03 Producto', 'web', 'insumos', '2026-10-06-matrimonios-ajustes', 'LEEME.md');
const HAY_41 = existsSync(AJUSTES_41);
const LEEME_41 = HAY_41 ? readFileSync(AJUSTES_41, 'utf8') : '';
const suite41 = HAY_41 ? describe : describe.skip;

/** La sección `## N.` del insumo, sin su título. */
export function seccionDe(leeme: string, n: number): string {
  return leeme.split(/^## /m).find((s) => s.startsWith(`${n}. `))?.split('\n').slice(1).join('\n') ?? '';
}
/** Las líneas citadas (`> `) de una sección, en un solo texto. */
export const citaDe = (seccion: string) => seccion.split('\n')
  .filter((l) => l.startsWith('> ')).map((l) => l.slice(2).trim()).join(' ');

suite41('/matrimonios dice lo que Armando pidió el 6/10 (#41)', () => {
  const m = (web as Record<string, any>).matrimonios;
  const t = (web as Record<string, any>).taller;
  const ENLACE = citaDe(seccionDe(LEEME_41, 1));
  const BIO = citaDe(seccionDe(LEEME_41, 2));
  const FAMILIA = /^> quedaría: (.+)$/m.exec(seccionDe(LEEME_41, 3))?.[1].trim() ?? '';
  const leer = (archivo: string) => {
    const ruta = join(DIST, archivo);
    return existsSync(ruta) ? readFileSync(ruta, 'utf8') : '';
  };
  const html = leer('matrimonios.html');

  it('EL PISO, PRIMERO: el insumo trae los tres textos y la página está en dist', () => {
    expect(ENLACE).toMatch(/^¿Se apagó el amor en tu relación\? .+ ¡Abre esta liga para conocer más!$/);
    expect(BIO).toMatch(/^Es fundador y director del Instituto Familias Fuertes\. .+ en Youtube\.$/);
    expect(FAMILIA).toBe(FAMILIA.trim());
    expect(FAMILIA.length).toBeGreaterThan(10);
    expect(html.length, 'matrimonios.html no está en dist: corre el build antes').toBeGreaterThan(1000);
    /* El autoexamen del lector: una cita de dos líneas es un texto. */
    expect(citaDe('> Uno.\nnada\n> Dos.')).toBe('Uno. Dos.');
    expect(seccionDe('## 1. A\n> x\n## 2. B\n> y', 2)).toBe('> y');
  });

  it('el texto del enlace: og:description y twitter:description, literal; la description no cambia', () => {
    expect(m.head.descripcionAlCompartir).toBe(ENLACE);
    expect(html).toContain(`<meta property="og:description" content="${ENLACE}">`);
    expect(html).toContain(`<meta name="twitter:description" content="${ENLACE}">`);
    /* La que lee Google sigue con la fecha y Zoom. */
    expect(html).toContain(`<meta name="description" content="${m.head.description}">`);
    expect(m.head.description).toContain('Zoom');
    expect(m.head.description).toContain('29 de octubre');
    /* Y las otras páginas no ganaron un twitter:description. */
    for (const otra of ['index.html', 'merida.html']) {
      expect(leer(otra).length, `${otra} en dist`).toBeGreaterThan(1000);
      expect(leer(otra), otra).not.toContain('twitter:description');
    }
  });

  it('la biografía de «Sobre el facilitador» es la nueva, entera, sin el nombre en negrita', () => {
    expect(m.facilitador.bio).toBe(BIO);
    expect(m.facilitador).not.toHaveProperty('bioNombre');
    expect(html).toContain(`>${BIO}</p>`);
    expect(html).not.toContain('es un experto en familia. Casado y padre de 7 hijos');
  });

  it('la ficha dice «Casado y padre de siete hijos.» y «23 a 7» no queda en matrimonios.html; /merida y la portada no cambian', () => {
    expect(m.facilitador.familiaValor).toBe(FAMILIA);
    expect(html).toContain(`<span>${FAMILIA}</span>`);
    expect(html).not.toContain('23 a 7');
    /* La clave compartida sigue con las edades, y las dos páginas que la usan también. */
    expect(t.facilitador.familiaValor).toContain('de 23 a 7 años');
    expect(leer('merida.html')).toContain('23 a 7');
    expect(leer('index.html')).toContain('23 a 7');
  });
});
