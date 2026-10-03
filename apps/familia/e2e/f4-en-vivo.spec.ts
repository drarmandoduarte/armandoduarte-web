import { expect, test } from '@playwright/test';

/**
 * F.4 — la prueba en vivo del preview, la parte que se puede automatizar.
 *
 * ── No corre en la gate, y es a propósito ───────────────────────────────
 * Necesita un despliegue de verdad, con las variables cargadas, y eso lo crea
 * dirección. Se salta solo si no hay `URL_PREVIEW`, así que `pnpm test` en una
 * máquina cualquiera no se pone rojo por algo que no puede tener.
 *
 *   URL_PREVIEW="https://…vercel.app" CORREO_CLIENTE="alguien@ejemplo.mx" \
 *     npx playwright test e2e/f4-en-vivo.spec.ts
 *
 * ── Lo que NO automatiza, y por qué ─────────────────────────────────────
 * El código de seis dígitos llega **por correo**, y leerlo desde un test
 * exigiría credenciales de un buzón: no entran a este repo (es público) ni a un
 * CI. Así que el spec deja la pantalla pidiendo el código y **espera dos
 * minutos** a que alguien lo escriba a mano. Es media prueba automatizada y
 * media asistida, y está dicho para que nadie lea el verde como más de lo que
 * es. Los 31 minutos de (d) tampoco se automatizan: un test que duerme media
 * hora es un test que nadie corre.
 *
 * El guion completo, con los cinco pasos y lo que hay que mirar en cada uno,
 * está en `03 Producto/mi-espacio/prueba-en-vivo-F4.md`.
 */

const URL_PREVIEW = process.env.URL_PREVIEW;
const CORREO_CLIENTE = process.env.CORREO_CLIENTE;

test.skip(!URL_PREVIEW, 'F.4 necesita URL_PREVIEW: el preview lo crea dirección (§H de la orden #15).');

test.describe('F.4 · contra el preview de verdad', () => {
  test('las cabeceras llegan enteras, y la CSP deja hablar solo con Supabase', async ({ request }) => {
    /* Desde la #35 la entrada es /login (guion v1 del Kit 512); /entrar es un 308 hacia ella. */
    const respuesta = await request.get(`${URL_PREVIEW}/login`);
    expect(respuesta.status(), 'la pantalla de entrada tiene que responder').toBe(200);

    const h = respuesta.headers();
    expect(h['x-content-type-options']).toBe('nosniff');
    expect(h['x-frame-options']).toBe('DENY');
    expect(h['referrer-policy']).toBe('strict-origin-when-cross-origin');
    /* Mi espacio es privado ENTERO: el `noindex` no va condicionado al host,
       como sí lo está en la web pública. */
    expect(h['x-robots-tag']).toBe('noindex, nofollow');

    const csp = h['content-security-policy'] ?? '';
    expect(csp, 'la CSP no llegó').toContain("default-src 'self'");
    expect(csp, 'sin unsafe-inline, dijo la orden').not.toContain('unsafe-inline');
    expect(csp).toContain('connect-src');
    expect(csp, 'la única apertura es Supabase, y es exacta').toContain(
      'https://jrscpjdscgycetyvenco.supabase.co',
    );
  });

  test('la API está viva y no cuenta nada de nadie', async ({ request }) => {
    const respuesta = await request.get(`${URL_PREVIEW}/api/salud`);
    expect(respuesta.status(), 'si esto no es 200, la función de Vercel no arrancó').toBe(200);
    expect(await respuesta.json()).toEqual({ ok: true });
  });

  test('la API rechaza sin token, y con 401 y no con 403', async ({ request }) => {
    /* Los dos códigos significan cosas distintas y la pantalla los trata
       distinto: 401 es «vuelve a entrar», 403 con `AAL2_REQUIRED` es «escribe
       el código». Un 403 acá sería el guard confundiendo «no hay sesión» con
       «falta el segundo paso». */
    const respuesta = await request.get(`${URL_PREVIEW}/api/yo`);
    expect(respuesta.status()).toBe(401);
  });

  test('(a) una persona nueva entra con código y queda como CLIENTE', async ({ page }) => {
    test.skip(!CORREO_CLIENTE, 'hace falta CORREO_CLIENTE: un correo que NO esté en `miembros`.');
    test.setTimeout(3 * 60 * 1000);

    const violaciones: string[] = [];
    page.on('console', (m) => {
      if (m.type() === 'error' && /Content Security Policy/i.test(m.text())) violaciones.push(m.text());
    });

    await page.goto(`${URL_PREVIEW}/login`);
    await page.fill('#correo', CORREO_CLIENTE!);
    await page.getByRole('button', { name: /enviar código/i }).click();

    /* Acá entra la persona: escribe el código que le llegó al correo. El test
       espera hasta dos minutos a que la pantalla cambie. */
    await expect(page.locator('#codigo')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /hola/i }),
      'no llegó a Mi espacio: escribí el código del correo cuando la pantalla lo pida',
    ).toBeVisible({ timeout: 2 * 60 * 1000 });

    /* Lo que de verdad se está probando: que a un CLIENTE no se le imponga el
       segundo paso. Si esta sección apareciera, el guard no vio su rol. */
    await expect(
      page.getByRole('heading', { name: /seguridad/i }),
      'a un cliente NO se le muestra Seguridad ni se le pide autenticador',
    ).toHaveCount(0);

    expect(violaciones, 'la consola tiene que quedar sin violaciones de CSP').toEqual([]);
  });
});
