import { expect, test } from '@playwright/test';
import { PUERTO } from '../playwright.config';

/**
 * `/entrar`: todo dentro de los márgenes, Armando más chico — orden #30.
 *
 * (Antes, #28 B: la silueta `de-pie` a todo el ancho de un panel que sangraba
 * hasta el borde de la pantalla.) A 1440×900 y 1920×1080 afirma:
 *
 *   · **el panel no sangra**: su borde izquierdo es el del contenedor, el de
 *     la línea de la cabecera;
 *   · 80 px del panel a la columna del formulario;
 *   · 24 px de aire, como mínimo, contra la línea de la cabecera, y **el panel
 *     llega siempre a 24 px ±1 de la línea del pie** (auditoría del PR #49);
 *   · esquinas de 12 px;
 *   · Armando (`de-pie`) escalado por alto, centrado: **el corte del archivo
 *     apoyado en el borde del panel ±1, o el ancho en su tope del 70 %**;
 *   · **el pelo** (fila 55 del archivo) a **48 px ±1** del borde de abajo de la
 *     firma, mientras el tope no mande;
 *   · nada se cruza: la firma con el pelo, el panel con el formulario.
 *
 * Qué NO mira: `/empezar`, que usa el mismo molde (`Pantalla conArmando`) pero
 * necesita una sesión simulada (lo muestra `check/capturas-29.mjs`); y debajo
 * de 1100 px, donde no hay panel (lo prueba `la-entrada-a-la-altura.test.tsx`).
 *
 * No corre en la gate (pendiente 16 de `docs/tareas.md`). A mano, contra el build:
 *
 *   VITE_SUPABASE_URL=https://x.supabase.co VITE_SUPABASE_ANON_KEY=x pnpm --filter @codice/familia build
 *   pnpm --filter @codice/familia test:e2e e2e/entrar-armando.spec.ts
 */
const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
] as const;

/** El archivo `de-pie` (1400×2791) y la fila donde arranca el pelo. */
const ALTO_DEL_ARCHIVO = 2791;
const FILA_DEL_PELO = 55;

for (const vp of VIEWPORTS) {
  test(`/entrar a ${vp.width}×${vp.height}: el panel dentro del contenedor, hasta el pie, y Armando apoyado en su borde`, async ({ page }) => {
    await page.setViewportSize(vp);
    await page.goto(`http://127.0.0.1:${PUERTO}/entrar`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() => {
      const img = document.querySelector('.panel img') as HTMLImageElement | null;
      return !!img?.complete && img.naturalHeight > 0;
    });

    const m = await page.evaluate(() => {
      const caja = (sel: string) => {
        const r = document.querySelector(sel)!.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height };
      };
      const img = document.querySelector('.panel img') as HTMLImageElement;
      return {
        src: img.currentSrc,
        panel: caja('.panel'),
        radio: getComputedStyle(document.querySelector('.panel')!).borderTopLeftRadius,
        cabecera: caja('.cab__dentro'),
        pie: caja('.pie__dentro'),
        columna: caja('.columna'),
        firma: caja('.panel__firma'),
        img: caja('.panel img'),
        ajuste: getComputedStyle(img).objectFit,
      };
    });

    /* EL PISO, PRIMERO: que haya un panel, una foto y una columna que medir. */
    expect(m.panel.width, 'no hay panel de Armando: ¿el ancho es de dos mitades?').toBeGreaterThan(300);
    expect(m.img.height, 'la foto no se pinta').toBeGreaterThan(200);
    expect(m.columna.width, 'no hay columna del formulario').toBeGreaterThan(300);
    expect(m.src, 'la foto es la silueta `de-pie`').toMatch(/\/img\/armando\/de-pie-1400\.webp$/);

    expect(Math.abs(m.panel.left - m.cabecera.left), `el panel sangra fuera del contenedor: arranca en x=${m.panel.left.toFixed(1)} y la línea de la cabecera en x=${m.cabecera.left.toFixed(1)}`).toBeLessThanOrEqual(0.5);
    expect(Math.abs(m.columna.left - (m.panel.right + 80)), `del panel (${m.panel.right.toFixed(1)}) al formulario (${m.columna.left.toFixed(1)}) no hay 80 px`).toBeLessThanOrEqual(1);
    expect(m.panel.top, `el panel arranca ${(m.panel.top - m.cabecera.bottom).toFixed(1)} px debajo de la línea de la cabecera (mínimo 24)`).toBeGreaterThanOrEqual(m.cabecera.bottom + 24 - 0.5);
    expect(Math.abs(m.panel.bottom - (m.pie.top - 24)), `el panel termina ${(m.pie.top - m.panel.bottom).toFixed(1)} px arriba de la línea del pie (tiene que llegar a 24)`).toBeLessThanOrEqual(1);
    expect(m.radio, 'las esquinas del panel').toBe('12px');

    /* Lo pintado y no la caja: con `contain`, si el tope del 70 % manda, la
       caja es más alta que Armando. */
    const escala = m.ajuste === 'contain'
      ? Math.min(m.img.width / 1400, m.img.height / ALTO_DEL_ARCHIVO)
      : m.img.height / ALTO_DEL_ARCHIVO;
    const pintado = { width: 1400 * escala, height: ALTO_DEL_ARCHIVO * escala, bottom: m.img.bottom };
    const enElTope = Math.abs(pintado.width - 0.7 * m.panel.width) <= 1;
    expect(pintado.width, `Armando mide ${pintado.width.toFixed(1)} de ancho y el tope es el 70 % (${(0.7 * m.panel.width).toFixed(1)})`).toBeLessThanOrEqual(0.7 * m.panel.width + 1);
    expect(
      Math.abs(pintado.bottom - m.panel.bottom) <= 1 || enElTope,
      `el corte del archivo no se apoya en el borde del panel: termina en ${pintado.bottom.toFixed(1)} y el panel en ${m.panel.bottom.toFixed(1)}`,
    ).toBe(true);
    expect(Math.abs((m.img.left + m.img.right) / 2 - (m.panel.left + m.panel.right) / 2), 'Armando no está centrado en el panel').toBeLessThanOrEqual(1);

    const pelo = pintado.bottom - pintado.height + FILA_DEL_PELO * escala;
    if (!enElTope) {
      expect(Math.abs(pelo - (m.firma.bottom + 48)), `el pelo está ${(pelo - m.firma.bottom).toFixed(1)} px debajo de la firma (48)`).toBeLessThanOrEqual(1);
    }

    expect(m.firma.bottom, 'la firma se cruza con el pelo').toBeLessThanOrEqual(pelo);
    expect(m.panel.right, 'el panel se cruza con el formulario').toBeLessThan(m.columna.left);

    console.log(`${vp.width}: panel x ${m.panel.left.toFixed(0)}–${m.panel.right.toFixed(0)}, y ${m.panel.top.toFixed(0)}–${m.panel.bottom.toFixed(0)} · cabecera ${m.cabecera.left.toFixed(0)}/${m.cabecera.bottom.toFixed(0)} · pie ${m.pie.top.toFixed(0)} · formulario x ${m.columna.left.toFixed(0)} · Armando ${pintado.width.toFixed(0)}×${pintado.height.toFixed(0)} (${(100 * pintado.width / m.panel.width).toFixed(1)} %${enElTope ? ', en el tope' : ''}), corte en ${pintado.bottom.toFixed(1)} · pelo ${(pelo - m.firma.bottom).toFixed(1)} bajo la firma`);
  });
}
