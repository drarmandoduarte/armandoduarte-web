/**
 * Armando no flota: la última fila del archivo es opaca — orden #19, B.
 *
 * ── El defecto, que pasó **dos** auditorías ──────────────────────────────
 * Lucía pidió que la orilla del recorte tocara la orilla del bloque teal. La
 * #12 (E) lo dio por hecho midiendo `bottom` de la imagen contra `bottom` de la
 * sección: **0 px a 1440, 900 y 375**, y era cierto. Pero el PNG tenía unos
 * **300 px de degradado a transparente** por abajo —el alfa caía desde la fila
 * ~2330 hasta 0 en la 2614—, así que lo que tocaba el borde era aire. Desde
 * afuera, Armando seguía flotando.
 *
 * La lección es de la casa y vale más que este archivo: **se midió la caja, no
 * lo que se ve**. Un `getBoundingClientRect` de una imagen con alfa mide el
 * rectángulo del elemento, y un rectángulo con 300 px de nada adentro se mide
 * igual que uno lleno.
 *
 * ── Las dos mitades, y por qué ninguna alcanza sola ──────────────────────
 * Este archivo se ocupa de **los píxeles**: la última fila del recorte tiene
 * que ser opaca a lo ancho del cuerpo. De que esa fila **llegue** al borde de
 * la sección se ocupa `e2e/armando-al-borde.spec.ts`, que necesita un navegador.
 * Un archivo opaco colgado a 40 px del borde flota igual; una caja al borde con
 * el archivo viejo adentro, también. Se prueban por separado a propósito —la
 * regla de la casa— porque un piso que sobrevive porque la otra mitad lo
 * sostiene no está sosteniendo nada.
 *
 * ── Por qué el PNG y no el WebP ──────────────────────────────────────────
 * Porque un PNG se decodifica con `zlib`, que viene con Node, y un WebP con
 * alfa no: haría falta una dependencia que la orden no pide. Los tres archivos
 * salen del **mismo** recorte (lo dice el `LEEME.md` de los insumos), así que
 * medir el PNG mide el recorte. Lo que este test NO comprueba, dicho para que
 * el verde no se lea de más: que el `.webp` de 1400 —que es el que baja casi
 * todo el mundo— tenga la misma alfa. Eso lo dice la comprobación de tamaño de
 * abajo, que es lo que se puede afirmar sin decodificarlo: los tres archivos
 * declaran el mismo alto en `Retrato.tsx` y ese alto es el del recorte nuevo.
 */
import { describe, expect, it } from 'vitest';
import { inflateSync } from 'node:zlib';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const APP = dirname(dirname(fileURLToPath(import.meta.url)));
const PNG = join(APP, 'public', 'img', 'armando', 'de-pie-560.png');

/**
 * Un lector de PNG de ocho bits con alfa, lo justo para esta pregunta.
 *
 * Devuelve `{ ancho, alto, alfaDeLaFila(y) }`. Soporta color type 6 (RGBA) y
 * **tira si el archivo no es eso**, en vez de devolver ceros: un lector que
 * falla en silencio sobre un formato que no entiende informa «todo
 * transparente» y este test saldría rojo por la razón equivocada — o peor,
 * verde, si la afirmación estuviera al revés.
 */
export function leerPng(bytes: Buffer) {
  const firma = [137, 80, 78, 71, 13, 10, 26, 10];
  for (const [i, b] of firma.entries()) {
    if (bytes[i] !== b) throw new Error('no es un PNG');
  }

  let ancho = 0; let alto = 0; let profundidad = 0; let tipo = -1;
  const trozos: Buffer[] = [];
  let i = 8;
  while (i < bytes.length) {
    const largo = bytes.readUInt32BE(i);
    const nombre = bytes.toString('latin1', i + 4, i + 8);
    const datos = bytes.subarray(i + 8, i + 8 + largo);
    if (nombre === 'IHDR') {
      ancho = datos.readUInt32BE(0);
      alto = datos.readUInt32BE(4);
      profundidad = datos[8];
      tipo = datos[9];
      if (datos[12] !== 0) throw new Error('PNG entrelazado: este lector no lo sabe leer');
    } else if (nombre === 'IDAT') {
      trozos.push(datos);
    } else if (nombre === 'IEND') {
      break;
    }
    i += 12 + largo;
  }
  if (profundidad !== 8 || tipo !== 6) {
    throw new Error(`este lector solo entiende PNG de 8 bits RGBA (profundidad ${profundidad}, tipo ${tipo})`);
  }

  /* Desfiltrado. Cada fila del PNG lleva un byte de filtro al principio y se
     reconstruye contra la fila de arriba y el píxel de la izquierda. Están los
     cinco filtros porque un PNG real los mezcla fila por fila: quedarse con
     «ninguno» y «arriba» alcanza hasta el archivo que no. */
  const crudo = inflateSync(Buffer.concat(trozos));
  const bpp = 4;
  const largoFila = ancho * bpp;
  const pixeles = Buffer.alloc(alto * largoFila);
  for (let y = 0; y < alto; y += 1) {
    const filtro = crudo[y * (largoFila + 1)];
    const entrada = crudo.subarray(y * (largoFila + 1) + 1, (y + 1) * (largoFila + 1));
    const fila = pixeles.subarray(y * largoFila, (y + 1) * largoFila);
    const arriba = y > 0 ? pixeles.subarray((y - 1) * largoFila, y * largoFila) : null;
    for (let x = 0; x < largoFila; x += 1) {
      const a = x >= bpp ? fila[x - bpp] : 0;
      const b = arriba ? arriba[x] : 0;
      const c = arriba && x >= bpp ? arriba[x - bpp] : 0;
      let valor = entrada[x];
      if (filtro === 1) valor += a;
      else if (filtro === 2) valor += b;
      else if (filtro === 3) valor += Math.floor((a + b) / 2);
      else if (filtro === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a); const pb = Math.abs(p - b); const pc = Math.abs(p - c);
        valor += (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
      } else if (filtro !== 0) throw new Error(`filtro de PNG desconocido: ${filtro}`);
      fila[x] = valor & 0xff;
    }
  }

  const alfaDeLaFila = (y: number) => {
    const fila = pixeles.subarray(y * largoFila, (y + 1) * largoFila);
    const salida: number[] = [];
    for (let x = 0; x < ancho; x += 1) salida.push(fila[x * bpp + 3]);
    return salida;
  };
  return { ancho, alto, alfaDeLaFila };
}

describe('Armando no flota: el archivo termina en cuerpo, no en aire', () => {
  const png = leerPng(readFileSync(PNG));
  const ultima = png.alfaDeLaFila(png.alto - 1);
  const opacos = ultima.filter((a) => a === 255).length;

  it('EL PISO, PRIMERO: el lector leyó una imagen de verdad', () => {
    /* Sin esto, «la última fila es opaca» sobre un lector que devuelve una
       fila vacía es una afirmación sobre la nada. */
    expect(png.ancho, 'el PNG no mide lo que el recorte dice medir').toBe(560);
    expect(png.alto).toBeGreaterThan(400);
    expect(ultima.length, 'la fila leída no tiene el ancho de la imagen').toBe(png.ancho);
    /* Y que el archivo TENGA transparencia: es un recorte sobre alfa. Si todo
       fuera opaco, el test de abajo pasaría sobre un JPG con fondo horneado,
       que es justo lo que la #05 sacó de esta web. */
    const arriba = png.alfaDeLaFila(0);
    expect(
      arriba.filter((a) => a === 0).length,
      'la primera fila no tiene ni un píxel transparente: esto no es un recorte sobre alfa.',
    ).toBeGreaterThan(png.ancho / 4);
  });

  it('la ÚLTIMA fila tiene alfa 255, y el archivo viejo daba CERO', () => {
    /* ── Los números son medidos, no elegidos ────────────────────────────
       Archivo publicado hoy, la **v2** del insumo (560×1011): **321 de 560
       píxeles opacos** en la última fila —el 57,3 %—, tramo contiguo mayor 164
       (29,3 %) y alfa máxima 255. El archivo que estaba antes de la #19
       (560×1045): **0 opacos**, alfa máxima **0** — la última fila del recorte
       publicado era enteramente transparente.

       (La v1 del insumo, que este PR llegó a publicar, daba 319/163: los mismos
       números, con 212 px de pierna de menos. Cortaba en la fila 2320 porque se
       midió mal el degradado del original, que era opaco hasta la 2532. Se
       cambió por la v2 sin tocar ninguna afirmación de este archivo: cambió el
       número declarado en `Retrato.tsx`, no la idea.)

       El tramo contiguo es 29 % y no 57 % por un motivo que conviene dejar
       escrito, porque a primera vista parece poco: la última fila son **las dos
       piernas**, y entre ellas hay aire. Un umbral sobre el tramo contiguo más
       largo mide una pierna, no el cuerpo; el que mide el apoyo es el total.
       Los dos van, con sus pisos debajo de lo medido y bien por encima del cero
       del archivo viejo.

       Y no hay zapatos que buscar: la foto **termina en los muslos en todas las
       fuentes que existen**. Por eso el corte del archivo tiene que coincidir
       con el borde de la sección — así no se lee como un corte. */
    expect(
      Math.max(...ultima),
      'la última fila del recorte no tiene ni un píxel opaco. El archivo termina en un degradado a '
      + 'transparente, así que aunque la caja toque el borde de la sección lo que toca es aire y '
      + 'Armando se ve flotando. Es lo que Lucía marcó y lo que la #12 no vio por medir la caja en '
      + 'vez de los píxeles.',
    ).toBe(255);

    expect(
      opacos,
      `la última fila tiene ${opacos} píxeles opacos de ${png.ancho}; medido sobre el recorte de la `
      + '#19 son 321. Si bajó, el archivo volvió a tener degradado abajo.',
    ).toBeGreaterThan(png.ancho * 0.4);

    /* Y que ese apoyo sea cuerpo y no motitas del recorte. */
    let mayorTramo = 0; let tramo = 0;
    for (const a of ultima) {
      tramo = a === 255 ? tramo + 1 : 0;
      if (tramo > mayorTramo) mayorTramo = tramo;
    }
    expect(
      mayorTramo,
      `el tramo opaco contiguo más largo es ${mayorTramo} px; medido son 164 (una pierna). `
      + 'Píxeles opacos sueltos no son un cuerpo llegando al borde.',
    ).toBeGreaterThan(png.ancho * 0.2);
  });

  it('la PRIMERA fila es transparente en todo el ancho: la cabeza está entera (#23, C)', () => {
    /* La v2 recortaba desde la fila 474 del PNG de Lucía y el pelo empieza en
       la 25: la primera fila del archivo publicado **era pelo**, y en la web
       Armando aparecía con la cabeza cortada. La v3 recorta desde la fila 0, y
       sobre el pelo queda aire (medido en el 560: el pelo empieza en la fila 6).
       La afirmación es sobre todo el ancho: un solo píxel con alfa en la fila 0
       es un corte. */
    const primera = png.alfaDeLaFila(0);
    const conAlfa = primera.filter((a) => a > 0).length;
    expect(
      conAlfa,
      `la primera fila del recorte tiene ${conAlfa} píxeles con alfa: el archivo arranca en el pelo `
      + 'y Armando se ve con la cabeza cortada. Es lo que tenía la v2 de `de-pie`.',
    ).toBe(0);
  });

  it('y `Retrato.tsx` declara el alto del archivo nuevo, no el del viejo', () => {
    /* El `width`/`height` es lo que el navegador usa para reservar el hueco
       antes de que la foto baje. Con el archivo nuevo y el alto viejo, el
       recorte entra y la página salta — el mismo CLS que esos dos atributos
       existen para evitar. */
    const fuente = readFileSync(join(APP, 'src', 'web', 'comun', 'Retrato.tsx'), 'utf8');
    expect(
      fuente,
      '`Retrato.tsx` no declara el alto del recorte publicado. El archivo de la v3 mide 1400×2791.',
    ).toContain("'de-pie': { ancho: 1400, alto: 2791 }");
    /* La relación del PNG chico tiene que ser la misma que la declarada: si
       alguien reemplaza un archivo y no el otro, esto lo dice. */
    const relacionArchivo = png.ancho / png.alto;
    const relacionDeclarada = 1400 / 2791;
    expect(
      Math.abs(relacionArchivo - relacionDeclarada),
      `el PNG de 560 tiene relación ${relacionArchivo.toFixed(4)} y el recorte declara `
      + `${relacionDeclarada.toFixed(4)}: los dos archivos no salieron del mismo recorte.`,
    ).toBeLessThan(0.002);
  });
});
