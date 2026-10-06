import { describe, expect, it } from 'vitest';
import { codigoReciente } from './codigo-reciente';

/** Un JWT de mentira: `codigoReciente` lee claims de un token que ya se verificó. */
const jwt = (payload: Record<string, unknown>) => {
  const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${b64({ alg: 'HS256' })}.${b64(payload)}.firma`;
};
const AHORA = Date.UTC(2026, 9, 6, 16, 0, 0);
const seg = (antes: number) => Math.floor(AHORA / 1000) - antes;

describe('codigoReciente — borrar la cuenta (#37 PR 3)', () => {
  it('EL CASO: el código del correo de hace un minuto sirve; el de hace seis, no', () => {
    expect(codigoReciente(jwt({ aal: 'aal1', amr: [{ method: 'otp', timestamp: seg(60) }] }), 'correo', 5, AHORA)).toBe(true);
    expect(codigoReciente(jwt({ aal: 'aal1', amr: [{ method: 'otp', timestamp: seg(360) }] }), 'correo', 5, AHORA)).toBe(false);
  });

  it('el del autenticador pide además aal2', () => {
    const amr = [{ method: 'totp', timestamp: seg(30) }];
    expect(codigoReciente(jwt({ aal: 'aal2', amr }), 'autenticador', 5, AHORA)).toBe(true);
    expect(codigoReciente(jwt({ aal: 'aal1', amr }), 'autenticador', 5, AHORA)).toBe(false);
  });

  it('un método no sirve por el otro: Google (oauth) no es un código', () => {
    expect(codigoReciente(jwt({ aal: 'aal1', amr: [{ method: 'oauth', timestamp: seg(10) }] }), 'correo', 5, AHORA)).toBe(false);
    expect(codigoReciente(jwt({ aal: 'aal2', amr: [{ method: 'otp', timestamp: seg(10) }] }), 'autenticador', 5, AHORA)).toBe(false);
  });

  it('ante la duda, no: sin amr, con un amr raro, con una hora del futuro o con un token roto', () => {
    expect(codigoReciente(jwt({ aal: 'aal1' }), 'correo', 5, AHORA)).toBe(false);
    expect(codigoReciente(jwt({ aal: 'aal1', amr: 'otp' }), 'correo', 5, AHORA)).toBe(false);
    expect(codigoReciente(jwt({ aal: 'aal1', amr: [{ method: 'otp', timestamp: seg(-120) }] }), 'correo', 5, AHORA)).toBe(false);
    expect(codigoReciente('esto-no-es-un-jwt', 'correo', 5, AHORA)).toBe(false);
  });
});
