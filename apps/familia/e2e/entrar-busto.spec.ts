import { expect, test } from '@playwright/test';
import { PUERTO } from '../playwright.config';

/**
 * `/entrar`: Armando más chico, entero, encuadrado por la cabecera — orden #28 (4).
 *
 * A 1440×900 y 1920×1080 afirma:
 *
 *   · el borde de arriba de la figura = el borde de abajo de la línea de la
 *     cabecera (`.cab__dentro`), ±1 px;
 *   · el borde de abajo de la figura = el borde de abajo del panel, ±1 px;
 *   · **el busto entero**: el rectángulo pintado (natural × escala de
 *     `contain`, ubicado según `object-position`) cabe en la figura, ±1 px, y
 *     se apoya abajo;
 *   · el rectángulo de la firma no se cruza con el rectángulo pintado.
 *
 * El rectángulo pintado se calcula de los estilos computados y no de la caja
 * del `<img>`: con `contain` la caja es más grande que lo que se ve, y con
 * `cover` es más chica. Esa diferencia es justamente lo que el test mira.
 *
 * Qué NO mira: debajo de 1100 px el panel no se monta (`usarAncho`), y la
 * transparencia de la foto (el rectángulo pintado incluye el aire del PNG).
 *
 * Corre contra el build de `apps/familia` con una URL de Supabase cualquiera:
 *
 *   VITE_SUPABASE_URL=https://x.supabase.co VITE_SUPABASE_ANON_KEY=x pnpm --filter @codice/familia build
 *   pnpm --filter @codice/familia test:e2e e2e/entrar-busto.spec.ts
 */
const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
] as const;

for (const vp of VIEWPORTS) {
  test(`/entrar a ${vp.width}×${vp.height}: el busto entero, de la línea de la cabecera al borde del panel, sin tocar la firma`, async ({ page }) => {
    await page.setViewportSize(vp);
    await page.goto(`http://127.0.0.1:${PUERTO}/entrar`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() => {
      const img = document.querySelector('.panel__busto') as HTMLImageElement | null;
      return !!img?.complete && img.naturalHeight > 0;
    });

    const m = await page.evaluate(() => {
      const caja = (el: Element) => {
        const r = el.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height };
      };
      const img = document.querySelector('.panel__busto') as HTMLImageElement;
      const ri = caja(img);
      const cs = getComputedStyle(img);
      const escala = cs.objectFit === 'cover'
        ? Math.max(ri.width / img.naturalWidth, ri.height / img.naturalHeight)
        : Math.min(ri.width / img.naturalWidth, ri.height / img.naturalHeight);
      const ancho = img.naturalWidth * escala;
      const alto = img.naturalHeight * escala;
      /* `object-position` computado en porcentajes o px: «50% 100%». */
      const [px, py] = cs.objectPosition.split(' ').map((v, i) => {
        const libre = i === 0 ? ri.width - ancho : ri.height - alto;
        return v.endsWith('%') ? (parseFloat(v) / 100) * libre : parseFloat(v);
      });
      const left = ri.left + px;
      const top = ri.top + py;
      return {
        ajuste: cs.objectFit,
        pintado: { left, top, right: left + ancho, bottom: top + alto, width: ancho, height: alto },
        figura: caja(document.querySelector('.panel__foto')!),
        panel: caja(document.querySelector('.panel')!),
        linea: caja(document.querySelector('.cab__dentro')!),
        firma: caja(document.querySelector('.panel__firma')!),
      };
    });

    /* EL PISO, PRIMERO: que haya un panel, una figura y un busto que medir. */
    expect(m.panel.width, 'no hay panel de Armando: ¿el ancho es de dos mitades?').toBeGreaterThan(400);
    expect(m.figura.height, 'la figura mide 0').toBeGreaterThan(300);
    expect(m.pintado.height, 'el busto no se pinta').toBeGreaterThan(300);
    expect(m.firma.height, 'no está la firma').toBeGreaterThan(20);

    expect(Math.abs(m.figura.top - m.linea.bottom), `la figura arranca en ${m.figura.top}, la línea de la cabecera en ${m.linea.bottom}`).toBeLessThanOrEqual(1);
    expect(Math.abs(m.figura.bottom - m.panel.bottom), `la figura termina en ${m.figura.bottom}, el panel en ${m.panel.bottom}`).toBeLessThanOrEqual(1);

    /* El busto entero: lo pintado cabe en la figura. Con `cover` se sale por
       los costados o por abajo: ahí cae. */
    const sale = {
      arriba: m.figura.top - m.pintado.top,
      abajo: m.pintado.bottom - m.figura.bottom,
      izquierda: m.figura.left - m.pintado.left,
      derecha: m.pintado.right - m.figura.right,
    };
    for (const [lado, px] of Object.entries(sale)) {
      expect(px, `el busto (${m.ajuste}) se sale ${px.toFixed(1)} px por ${lado}: no se ve entero`).toBeLessThanOrEqual(1);
    }
    expect(Math.abs(m.pintado.bottom - m.figura.bottom), 'el busto no se apoya en el borde de abajo').toBeLessThanOrEqual(1);
    expect(
      Math.abs((m.pintado.left + m.pintado.right) / 2 - (m.figura.left + m.figura.right) / 2),
      'el busto no está centrado en el panel',
    ).toBeLessThanOrEqual(1);

    const cruza = m.firma.bottom > m.pintado.top && m.firma.top < m.pintado.bottom
      && m.firma.right > m.pintado.left && m.firma.left < m.pintado.right;
    expect(cruza, `la firma (${m.firma.top.toFixed(0)}–${m.firma.bottom.toFixed(0)}) se cruza con el busto (desde ${m.pintado.top.toFixed(0)})`).toBe(false);

    console.log(`${vp.width}: busto ${m.pintado.width.toFixed(0)}×${m.pintado.height.toFixed(0)} desde y=${m.pintado.top.toFixed(0)} · firma ${m.firma.top.toFixed(0)}–${m.firma.bottom.toFixed(0)} · figura ${m.figura.top.toFixed(0)}–${m.figura.bottom.toFixed(0)}`);
  });
}
