/**
 * Las cabeceras de Mi espacio — orden Códice #15, E.
 *
 * ── Por qué un test y no «se ve en el `curl`» ───────────────────────────
 * Porque una cabecera que se cae no rompe nada visible. La app carga igual, las
 * pantallas se ven igual y Lighthouse no dice una palabra: lo único que cambia
 * es que la política que impide que un script ajeno corra en la página de
 * entrada **ya no está**. Es el mismo perfil de defecto que el `X-Robots-Tag`
 * de la #08 y el `Cache-Control` de la #11, y las dos veces la casa descubrió
 * que ninguna comprobación miraba el `vercel.json`.
 *
 * ── Lo que NO comprueba, y está dicho ───────────────────────────────────
 * Que Vercel **aplique** estas cabeceras. Eso se mide con `curl -I` contra el
 * preview y es parte de F.4, que necesita el proyecto de Vercel. Acá se
 * comprueba lo que se va a publicar, no lo que Vercel hace con eso.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RUTAS } from './rutas';

const APP = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONFIG = JSON.parse(readFileSync(join(APP, 'vercel.json'), 'utf8')) as {
  headers: { source: string; headers: { key: string; value: string }[] }[];
  rewrites: { source: string; destination: string }[];
  redirects?: { source: string; destination: string; permanent?: boolean }[];
};

/** Las cabeceras que aplican a TODA respuesta, por nombre. */
const deTodas = new Map(
  (CONFIG.headers.find((h) => h.source === '/(.*)')?.headers ?? []).map((h) => [h.key, h.value]),
);

/** La CSP, partida en directivas: `{ 'script-src': ["'self'"] }`. */
const csp = (): Record<string, string[]> => {
  const crudo = deTodas.get('Content-Security-Policy') ?? '';
  const salida: Record<string, string[]> = {};
  for (const trozo of crudo.split(';').map((t) => t.trim()).filter(Boolean)) {
    const [nombre, ...valores] = trozo.split(/\s+/);
    salida[nombre] = valores;
  }
  return salida;
};

describe('las cabeceras de Mi espacio', () => {
  it('EL PISO: el bloque que aplica a todas las respuestas existe y trae varias', () => {
    /* Sin esto, cada «la cabecera X está» de abajo podría estar leyendo un mapa
       vacío y fallando por la razón equivocada — o peor, un `.not.toContain()`
       pasaría sobre la nada. */
    expect(
      [...deTodas.keys()].sort(),
      'el bloque `/(.*)` de vercel.json cambió de forma: si las cabeceras se movieron a otro '
      + '`source`, este test dejó de mirar lo que cree que mira.',
    ).toEqual([
      'Content-Security-Policy',
      'Permissions-Policy',
      'Referrer-Policy',
      'X-Content-Type-Options',
      'X-Frame-Options',
      'X-Robots-Tag',
    ]);
  });

  it('(1) las cinco de seguridad son las mismas que las de la web pública', () => {
    expect(deTodas.get('X-Content-Type-Options')).toBe('nosniff');
    expect(deTodas.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    expect(deTodas.get('Permissions-Policy')).toBe('camera=(), microphone=(), geolocation=()');
    expect(deTodas.get('X-Frame-Options')).toBe('DENY');
  });

  it('(2) `noindex, nofollow` en TODA la app, sin condición de host', () => {
    /* Y acá está la diferencia con la web pública, que vale escribirla: allá el
       `X-Robots-Tag` está condicionado al host de Vercel (`has`), porque el
       dominio propio SÍ tiene que indexarse. Mi espacio es privado entero: la
       condición sería un agujero, no una precisión. */
    expect(deTodas.get('X-Robots-Tag')).toBe('noindex, nofollow');
    const conHost = CONFIG.headers.filter((h) => 'has' in h);
    expect(conHost, 'ninguna cabecera de esta app se condiciona al host').toEqual([]);
  });

  it('(3) la CSP no tiene `unsafe-inline` ni `unsafe-eval` en ninguna directiva', () => {
    const flojas = Object.entries(csp())
      .filter(([, valores]) => valores.some((v) => v === "'unsafe-inline'" || v === "'unsafe-eval'"))
      .map(([nombre]) => nombre);
    expect(
      flojas,
      'la orden dice «sin unsafe-inline». Si algo no anda sin eso, se arregla el algo — la '
      + 'política no se ablanda para que pase una herramienta nuestra (lección de la #10).',
    ).toEqual([]);
  });

  it('(4) `connect-src` deja hablar con Supabase, y con nadie más', () => {
    /* Es la única apertura respecto de la web pública, y tiene que ser exacta:
       `https:` a secas dejaría a la app hablar con cualquier servidor del
       mundo, que es justo lo que una CSP existe para impedir. */
    expect(csp()['connect-src']).toEqual([
      "'self'",
      'https://jrscpjdscgycetyvenco.supabase.co',
    ]);
  });

  it('(5) `form-action self`, `frame-ancestors none`, `object-src none`, `base-uri none`', () => {
    expect(csp()['form-action']).toEqual(["'self'"]);
    expect(csp()['frame-ancestors']).toEqual(["'none'"]);
    expect(csp()['object-src']).toEqual(["'none'"]);
    expect(csp()['base-uri']).toEqual(["'none'"]);
  });

  it('(6) `/api/*` va a la función y el resto al index, POR ORDEN y sin negaciones', () => {
    /* ── Lo que este test decía antes, y por qué estaba en verde sobre un 404 ──
       Hasta el 29/9/2026 acá se afirmaba `/((?!api/).*)`, la forma con negación
       adelantada que se lee en medio internet. El test pasaba —el `vercel.json`
       decía eso— y en el preview de Vercel **ese rewrite no matcheaba nunca**:
       `/entrar` y `/cualquier-cosa` devolvían 404 mientras `/api/(.*)`, sin
       negación, andaba. Vercel no compila el `source` como una expresión
       regular cualquiera. El test miraba la forma del archivo y no lo que la
       forma hace, que es el defecto de la casa repetido una vez más.

       Ahora la regla es el ORDEN, que Vercel sí respeta: gana el primero que
       matchea. `/api/(.*)` arriba se lleva la API; el comodín de abajo se queda
       con todo lo demás. Los archivos de verdad (`/assets/…`) no llegan hasta
       acá: el sistema de archivos se revisa antes que los rewrites. */
    expect(CONFIG.rewrites).toEqual([
      { source: '/api/(.*)', destination: '/api' },
      { source: '/(.*)', destination: '/index.html' },
    ]);

    /* Y la regla escrita como regla, no como igualdad, para que valga también
       para el rewrite que alguien agregue mañana. */
    const conNegacion = CONFIG.rewrites.filter((r) => r.source.includes('(?!'));
    expect(
      conNegacion.map((r) => r.source),
      'un `source` con negación adelantada no matchea en Vercel: la ruta cae en 404 y el archivo '
      + 'se lee perfecto. Lo que separa la API del resto es el orden, no la negación.',
    ).toEqual([]);

    /* Que el comodín vaya ÚLTIMO, o se comería la API. */
    expect(
      CONFIG.rewrites.at(-1),
      'el comodín tiene que ser el último rewrite: arriba de `/api/(.*)` mandaría la API al index.',
    ).toEqual({ source: '/(.*)', destination: '/index.html' });

    /* Y que cubra las rutas que la app declara de verdad, no una lista suelta:
       el día que nazca `/ajustes`, `RUTAS` lo sabe y esto lo comprueba. */
    const comodin = new RegExp(`^${CONFIG.rewrites.at(-1)?.source.replace('(.*)', '.*')}$`);
    const sinCubrir = Object.values(RUTAS).filter((ruta) => !comodin.test(ruta));
    expect(
      sinCubrir,
      'hay rutas de `src/rutas.ts` que ningún rewrite manda al index: en Vercel son un 404, y en el '
      + 'servidor de QA andan — la peor clase de diferencia entre los dos.',
    ).toEqual([]);
  });

  it('(7) la API no se cachea nunca', () => {
    /* Una respuesta de `/api/yo` cacheada por un intermediario es la sesión de
       una persona servida a otra. */
    const api = CONFIG.headers.find((h) => h.source === '/api/(.*)');
    expect(api?.headers.find((h) => h.key === 'Cache-Control')?.value).toBe('no-store');
  });

  it('(8) y el robots.txt dice lo mismo que la cabecera', () => {
    const robots = readFileSync(join(APP, 'public', 'robots.txt'), 'utf8');
    expect(robots).toMatch(/^User-agent: \*$/m);
    expect(robots).toMatch(/^Disallow: \/$/m);
  });

  it('(9) #34: /mis-datos es un 308 a /ajustes/perfil — y es la única redirección', () => {
    /* «Mis datos» pasó a Ajustes → Perfil. Un enlace guardado o un correo viejo
       a `/mis-datos` no cae en un lugar que ya no existe. 308 y no 301: el
       navegador no cambia el método. */
    expect(CONFIG.redirects).toEqual([{ source: RUTAS.misDatos, destination: RUTAS.ajustesPerfil, permanent: true }]);
  });
});
