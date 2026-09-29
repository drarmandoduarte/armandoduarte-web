import { expect, test } from '@playwright/test';
import { PUERTO_PORT } from '../playwright.config';
// @ts-expect-error -- `check/renglones.mjs` es JavaScript sin tipos a propósito,
// igual que `check/acento.mjs`: es una herramienta de consola que además se
// importa acá. Tiparla obligaría a compilarla, y entonces dejaría de poder
// correrse con `node` a secas.
import {
  ANCHOS, CONTAR, DE_MAS, EXCEPCIONES, MINIMO_CARACTERES, PISO, PREPARAR, RECOLECTAR, RUTAS,
} from '../check/renglones.mjs';

/**
 * Los renglones huérfanos, dentro de la gate — orden Códice #16, B.
 *
 * ── Por qué esto existe además de `pnpm check:renglones` ─────────────────
 * Por lo de siempre: **lo que hay que acordarse de correr no se corre**, y ésta
 * es de las reglas que se deshacen solas. Nadie va a romper diez títulos de un
 * saque; alguien va a alargar un texto, tres órdenes después otro va a angostar
 * una columna, y en un año la web vuelve a tener «a tu» solo en un renglón.
 * Ninguna de esas veces se va a ver mal por sí sola, y ninguna se ve en un diff.
 *
 * Es además la única comprobación de la casa que mide **cómo se parte** un
 * título. Las capturas de fidelidad lo verían —un título repartido distinto mueve
 * píxeles— pero solo después de que alguien apruebe la captura nueva, y lo que
 * dicen es «cambió», no «quedó mal».
 *
 * ── Un solo barrido, dos puertas ─────────────────────────────────────────
 * La lógica no se copia: se importa de `check/renglones.mjs`, que es el mismo
 * archivo que corre por consola — incluidas las **dos listas de excepciones**.
 * Dos copias de esas listas serían dos verdades que un día no coinciden, y
 * entonces la gate y la consola dirían cosas distintas de la misma página. Es el
 * modo de falla que la #06 pagó con el token duplicado.
 *
 * ── Cuatro tests y no dieciséis, que es una decisión con su motivo ───────
 * La orden pide cuatro rutas por cuatro anchos: dieciséis mediciones. Van
 * agrupadas **por ruta**, con una sola navegación y cuatro cambios de viewport
 * adentro, y no como dieciséis tests con dieciséis navegaciones. El motivo es el
 * precio: así cuesta **2,4 s medidos** sobre una gate que ya levanta Chromium —
 * cuatro navegaciones en vez de dieciséis—. Lo que se pierde es el nombre del ancho en
 * la lista de tests; lo que no se pierde es cuál falló, porque cada hallazgo lo
 * dice —`CONTAR()` escribe ruta, ancho, título y renglón— y las cuatro
 * afirmaciones de un test se acumulan antes de comparar, así que un rojo muestra
 * **todos** los anchos que fallaron y no solo el primero.
 */
for (const [nombre, ruta] of RUTAS as [string, string][]) {
  test(`${nombre} · ningún título se parte en un renglón huérfano`, async ({ page }) => {
    const huerfanos: string[] = [];
    const excusadosDeMas: string[] = [];
    const mirados: string[] = [];

    await PREPARAR(page, `http://127.0.0.1:${PUERTO_PORT}${ruta}`);

    for (const ancho of ANCHOS as number[]) {
      await page.setViewportSize({ width: ancho, height: 900 });
      /* Un cuadro para que el navegador rehaga el layout con el ancho nuevo: sin
         esto la primera medición después del `resize` lee la caja vieja. */
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));

      const r = await page.evaluate(RECOLECTAR, {
        excepciones: EXCEPCIONES, minimoCaracteres: MINIMO_CARACTERES,
      });
      mirados.push(`${ancho}px: ${r.mirados}`);
      /* EL PISO, ANTES DEL CERO: «cero huérfanos» sobre un barrido que no
         encontró ningún título se lee igual que sobre una casa en orden. */
      if (r.mirados < (PISO as Record<string, number>)[nombre]) {
        huerfanos.push(`${nombre} @${ancho}px · PISO: miró ${r.mirados} títulos y el piso es `
          + `${(PISO as Record<string, number>)[nombre]} — o la página no cargó, o el selector se rompió`);
      }
      for (const h of r.hallazgos) huerfanos.push(CONTAR(nombre, ancho, h));
      for (const d of DE_MAS(r.excusados) as string[]) excusadosDeMas.push(`${nombre} @${ancho}px · ${d}`);
    }

    expect(
      huerfanos,
      `ningún título termina ni se parte en un renglón de una palabra ni de menos de ${MINIMO_CARACTERES} `
      + 'caracteres, a ninguno de los cuatro anchos. Se acomoda con el ancho de la columna, con un salto '
      + 'declarado o con `text-wrap: balance`; si hace falta cambiar un texto, lo decide dirección y la '
      + `excepción se declara en \`check/renglones.mjs\`. Títulos mirados — ${mirados.join(' · ')}.`,
    ).toEqual([]);

    /* Y las excepciones dentro de su tope: una excepción sin número es una
       puerta, y se abre sola. Es la lección de la #12, y acá vale el doble
       porque la lista de pendientes es larga: cada fila excusa **un** renglón y
       no una clase de renglones. */
    expect(
      excusadosDeMas,
      'una excepción declarada excusó más renglones de los que tiene permitidos',
    ).toEqual([]);
  });
}
