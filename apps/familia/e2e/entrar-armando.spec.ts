import { expect, test } from '@playwright/test';
import { PUERTO } from '../playwright.config';

/**
 * `/entrar`: Armando de pie debajo de la firma, cortado por el panel — orden #28
 * (4), con la corrección de la auditoría del PR #46.
 *
 * A 1440×900 y 1920×1080 afirma:
 *
 *   · la imagen es **`de-pie`** (la silueta con alfa), no el busto recortado
 *     en rectángulo —que dejaba a la vista los cortes de los brazos—;
 *   · **la fila 55 del archivo** (donde arranca el pelo) cae en el borde de
 *     arriba de la figura, ±1 px;
 *   · el ancho de la imagen = el 78 % del ancho del panel, ±1 px, y centrada
 *     (auditoría del PR #46: así los brazos terminan dentro del panel);
 *   · la figura llega al borde de abajo del panel y la imagen sigue más abajo:
 *     **el corte es el borde del panel**;
 *   · **la cara entera**: de la fila 55 a la 755 (escaladas) queda dentro del
 *     panel;
 *   · la firma no se cruza con Armando: el pelo (fila 55) arranca debajo de
 *     la firma. Lo de arriba de la fila 55 es el halo del archivo (alfa ≤ 30),
 *     una sombra suave que no se recorta a propósito (ver `estilos.css`).
 *
 * Qué NO mira: debajo de 1100 px el panel no se monta (`usarAncho`).
 *
 * No corre en la gate (el guardián solo levanta Chromium para `apps/web`;
 * pendiente en `docs/tareas.md`). Se corre a mano contra el build:
 *
 *   VITE_SUPABASE_URL=https://x.supabase.co VITE_SUPABASE_ANON_KEY=x pnpm --filter @codice/familia build
 *   pnpm --filter @codice/familia test:e2e e2e/entrar-armando.spec.ts
 */
const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
] as const;

/** Las filas del archivo `de-pie` (1400×2791): el pelo y lo que se pide ver de la cara. */
const ALTO_DEL_ARCHIVO = 2791;
const FILA_DEL_PELO = 55;
const FILAS_DE_LA_CARA = 700;

for (const vp of VIEWPORTS) {
  test(`/entrar a ${vp.width}×${vp.height}: Armando de pie, a todo el ancho del panel, debajo de la firma`, async ({ page }) => {
    await page.setViewportSize(vp);
    await page.goto(`http://127.0.0.1:${PUERTO}/entrar`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() => {
      const img = document.querySelector('.panel img') as HTMLImageElement | null;
      return !!img?.complete && img.naturalHeight > 0;
    });

    const m = await page.evaluate(() => {
      const caja = (el: Element) => {
        const r = el.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height };
      };
      const img = document.querySelector('.panel img') as HTMLImageElement;
      return {
        src: img.currentSrc,
        natural: { ancho: img.naturalWidth, alto: img.naturalHeight },
        ajuste: getComputedStyle(img).objectFit,
        img: caja(img),
        figura: caja(img.parentElement!),
        recorta: getComputedStyle(document.querySelector('.panel')!).overflow,
        panel: caja(document.querySelector('.panel')!),
        firma: caja(document.querySelector('.panel__firma')!),
      };
    });

    /* EL PISO, PRIMERO: que haya un panel, una figura y una foto que medir. */
    expect(m.panel.width, 'no hay panel de Armando: ¿el ancho es de dos mitades?').toBeGreaterThan(400);
    expect(m.figura.height, 'la figura mide 0').toBeGreaterThan(300);
    expect(m.img.height, 'la foto no se pinta').toBeGreaterThan(300);
    expect(m.firma.height, 'no está la firma').toBeGreaterThan(20);

    expect(m.src, 'la foto del panel tiene que ser `de-pie` (la silueta con alfa), no el busto').toMatch(/\/img\/armando\/de-pie-1400\.webp$/);
    expect(m.natural, 'el archivo `de-pie` es 1400×2791').toEqual({ ancho: 1400, alto: ALTO_DEL_ARCHIVO });
    /* La caja es lo pintado: sin `contain` ni `cover` que la separen de lo que se ve. */
    expect(m.ajuste, 'la foto se pinta a su caja').toBe('fill');
    expect(Math.abs(m.img.height / m.img.width - ALTO_DEL_ARCHIVO / 1400), 'la foto está deformada').toBeLessThan(0.002);

    const escala = m.img.height / ALTO_DEL_ARCHIVO;
    const pelo = m.img.top + FILA_DEL_PELO * escala;
    expect(Math.abs(pelo - m.figura.top), `la fila ${FILA_DEL_PELO} (el pelo) cae en ${pelo.toFixed(1)}, el borde de la figura en ${m.figura.top.toFixed(1)}`).toBeLessThanOrEqual(1);
    expect(Math.abs(m.img.width - 0.78 * m.panel.width), `la foto mide ${m.img.width.toFixed(1)} de ancho y el 78 % del panel es ${(0.78 * m.panel.width).toFixed(1)}`).toBeLessThanOrEqual(1);
    expect(
      Math.abs((m.img.left + m.img.right) / 2 - (m.panel.left + m.panel.right) / 2),
      'la foto no está centrada en el panel',
    ).toBeLessThanOrEqual(1);

    expect(Math.abs(m.figura.bottom - m.panel.bottom), `la figura termina en ${m.figura.bottom}, el panel en ${m.panel.bottom}`).toBeLessThanOrEqual(1);
    expect(m.recorta, 'el panel tiene que recortar: el corte de abajo es su borde').toBe('hidden');
    expect(m.img.bottom, 'la foto termina antes del borde del panel: el corte no es el del panel').toBeGreaterThan(m.panel.bottom);

    const finDeLaCara = pelo + FILAS_DE_LA_CARA * escala;
    expect(finDeLaCara, `la cara no entra entera: la fila ${FILA_DEL_PELO + FILAS_DE_LA_CARA} cae en ${finDeLaCara.toFixed(0)} y el panel termina en ${m.panel.bottom.toFixed(0)}`).toBeLessThanOrEqual(m.panel.bottom);

    expect(m.firma.bottom, `la firma (${m.firma.top.toFixed(0)}–${m.firma.bottom.toFixed(0)}) se cruza con Armando (desde ${m.figura.top.toFixed(0)})`).toBeLessThanOrEqual(m.figura.top);

    console.log(`${vp.width}: foto ${m.img.width.toFixed(0)} de ancho (panel ${m.panel.width.toFixed(0)}, ${(100 * m.img.width / m.panel.width).toFixed(1)} %) desde x=${m.img.left.toFixed(0)} · pelo y=${pelo.toFixed(1)} · figura ${m.figura.top.toFixed(0)}–${m.figura.bottom.toFixed(0)} · cara hasta ${finDeLaCara.toFixed(0)} · firma ${m.firma.top.toFixed(0)}–${m.firma.bottom.toFixed(0)}`);
  });
}
