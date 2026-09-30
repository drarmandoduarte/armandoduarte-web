/**
 * El token se verifica de verdad, y se verifica **en el empaquetado**.
 *
 * ── Por qué este archivo no importa el fuente ───────────────────────────
 * Porque el fuente ya andaba. El 29/9/2026 a las 12:29 la función devolvió
 * `401 Token inválido o vencido` sobre un token válido, y el log de Vercel de
 * esa invocación decía **«External APIs: No outgoing requests»**: `jose` tiró
 * antes de salir a buscar el JWKS. Lo que se despliega no es `src/`, es
 * `dist/funcion.cjs` —`tsc` a CommonJS y después esbuild, que mete `jose`
 * adentro porque es ESM puro— y ese archivo pasa por dos herramientas que el
 * fuente no conoce. Un test que importa `src/` no puede decir nada sobre él.
 *
 * Es la misma lección de la #15 que ya cobró dos veces en el mismo día: **las
 * herramientas que podían verlo no se ejecutan contra lo que falla.** Acá se
 * ejecuta contra lo que falla.
 *
 * ── Qué hace ────────────────────────────────────────────────────────────
 * Levanta un JWKS **de verdad** en un servidor HTTP efímero —una clave ES256
 * generada en el test, publicada en `/auth/v1/.well-known/jwks.json`, que es la
 * ruta exacta que `SupabaseService` construye— y le apunta `SUPABASE_URL` ahí.
 * Después le pide al `SupabaseService` **del empaquetado** que verifique un
 * token firmado con esa clave.
 *
 * Que el token viaje firmado y la clave viaje como JWK por HTTP es el punto: es
 * lo único que ejercita a la vez el `fetch` global del runtime, el `jose` que
 * quedó adentro del bundle y la URL que se arma con `SUPABASE_URL`. Los tres
 * fueron sospechosos del 401, y ninguno de los tres existe en `src/`.
 *
 * ── Lo que NO prueba ────────────────────────────────────────────────────
 *   · **No es Supabase.** Las claves son de este test. Que `armandoduarte-familia`
 *     publique su JWKS donde se espera se mide en F.4, contra el preview.
 *   · **No prueba la revocación.** Un token revocado sigue validando hasta que
 *     expira; está dicho y explicado en `supabase.service.ts`.
 *   · **No prueba el camino de respaldo** (`auth.getUser()` cuando el proyecto
 *     firma con secreto compartido). Ese sale a Supabase por definición.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createServer, type Server } from 'node:http';
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SignJWT, exportJWK, generateKeyPair, type JWK } from 'jose';

const APP = dirname(dirname(fileURLToPath(import.meta.url)));
const EMPAQUETADO = join(APP, 'dist', 'funcion.cjs');

/** Una persona cualquiera: lo único que el token tiene que decir es a quién. */
const SUB = '11111111-2222-3333-4444-555555555555';

interface Clave {
  firmar: (sub: string) => Promise<string>;
  firmarSinSub: () => Promise<string>;
  firmarVencido: (sub: string) => Promise<string>;
}

interface ServicioDelEmpaquetado {
  getUserFromToken(token: string | undefined): Promise<{ id: string }>;
  cual(): 'jwks' | 'getUser' | null;
}

let servidor: Server;
let laClaveBuena: Clave;
let laClaveAjena: Clave;
let servicio: ServicioDelEmpaquetado;

/** Una clave ES256 nueva, con su JWK público y una forma de firmar con ella. */
async function clave(kid: string): Promise<Clave & { jwk: JWK }> {
  const { privateKey, publicKey } = await generateKeyPair('ES256', { extractable: true });
  const jwk: JWK = { ...(await exportJWK(publicKey)), kid, alg: 'ES256', use: 'sig' };
  const base = () => new SignJWT({ role: 'authenticated', aal: 'aal1' })
    .setProtectedHeader({ alg: 'ES256', kid });
  const ahora = () => Math.floor(Date.now() / 1000);

  return {
    jwk,
    firmar: (sub) => base().setSubject(sub).setIssuedAt().setExpirationTime('1h').sign(privateKey),
    firmarSinSub: () => base().setIssuedAt().setExpirationTime('1h').sign(privateKey),
    firmarVencido: (sub) => base().setSubject(sub)
      .setIssuedAt(ahora() - 7200).setExpirationTime(ahora() - 3600).sign(privateKey),
  };
}

beforeAll(async () => {
  /* EL PISO, Y VA PRIMERO: sin el empaquetado no hay nada que probar, y un
     archivo que no existe daría un rojo hablando de módulos en vez de decir
     qué falta hacer. */
  expect(
    existsSync(EMPAQUETADO),
    `no está ${EMPAQUETADO}. Esto se prueba sobre el empaquetado a propósito: corré \`pnpm --filter @codice/api build\`.`,
  ).toBe(true);

  const buena = await clave('la-del-proyecto');
  const ajena = await clave('la-de-otro');
  laClaveBuena = buena;
  laClaveAjena = ajena;

  /* El JWKS publica SOLO la buena: una clave ajena no está en el juego de
     llaves del proyecto, que es exactamente el caso del atacante. */
  servidor = createServer((pedido, respuesta) => {
    if (pedido.url === '/auth/v1/.well-known/jwks.json') {
      respuesta.writeHead(200, { 'content-type': 'application/json' });
      respuesta.end(JSON.stringify({ keys: [buena.jwk] }));
      return;
    }
    respuesta.writeHead(404).end();
  });
  await new Promise<void>((listo) => servidor.listen(0, '127.0.0.1', listo));
  const puerto = (servidor.address() as { port: number }).port;

  /* La variable se pone ANTES de construir el servicio: el constructor arma la
     URL del JWKS una sola vez, que es lo que hace que `jose` la cachee. */
  process.env.SUPABASE_URL = `http://127.0.0.1:${puerto}`;
  process.env.SUPABASE_ANON_KEY = 'no-se-usa-en-este-archivo';

  const requerir = createRequire(import.meta.url);
  const { SupabaseService } = requerir(EMPAQUETADO) as {
    SupabaseService: new () => ServicioDelEmpaquetado;
  };
  servicio = new SupabaseService();
});

afterAll(async () => {
  await new Promise<void>((listo) => servidor.close(() => listo()));
});

describe('getUserFromToken, sobre `dist/funcion.cjs`', () => {
  it('un token ES256 firmado con la clave del JWKS vale, y dice a quién pertenece', async () => {
    const usuario = await servicio.getUserFromToken(await laClaveBuena.firmar(SUB));
    expect(usuario).toEqual({ id: SUB });
    /* Y que haya sido por el camino corto: si esto dijera `getUser`, el token
       se habría validado saliendo a Supabase y el JWKS no probaría nada. */
    expect(servicio.cual()).toBe('jwks');
  });

  it('un token firmado con otra clave no vale', async () => {
    /* La mutación de la orden, escrita como test: mismo algoritmo, mismo
       formato, misma expiración — otra clave. */
    await expect(servicio.getUserFromToken(await laClaveAjena.firmar(SUB)))
      .rejects.toThrow('Token inválido o vencido.');
  });

  it('un token vencido no vale, aunque la firma sea la buena', async () => {
    await expect(servicio.getUserFromToken(await laClaveBuena.firmarVencido(SUB)))
      .rejects.toThrow('Token inválido o vencido.');
  });

  it('sin token, el mensaje lo dice y no se sale a la red', async () => {
    await expect(servicio.getUserFromToken(undefined)).rejects.toThrow('Falta el token de acceso.');
    await expect(servicio.getUserFromToken('   ')).rejects.toThrow('Falta el token de acceso.');
  });

  it('un token con la firma buena pero sin `sub` no pasa, y con su propio mensaje', async () => {
    /* Es el caso que el `catch` nuevo deja salir tal cual en vez de disfrazarlo
       de un error de `jose`: la firma está bien —el token es de la clave del
       JWKS— y lo que falta es a quién pertenece. Antes salía como «Token
       inválido o vencido», que manda a mirar el lugar equivocado. */
    await expect(servicio.getUserFromToken(await laClaveBuena.firmarSinSub()))
      .rejects.toThrow('El token no dice a quién pertenece.');
  });
});
