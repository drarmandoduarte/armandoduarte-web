/**
 * El perfil de estilo es un placeholder, y este guardián cuida que **se sepa**.
 *
 * ── El modo de fallar que persigue ────────────────────────────────────────
 * Que la versión `v1-placeholder` llegue a producción con cara de perfil real.
 * El día que `analyze-estilo` genere el perfil de verdad nace un archivo nuevo
 * —`estilo-armando.v2.ts`— y este test cambia con él; lo que no puede pasar es
 * que alguien edite el v1 en el lugar y nadie se entere, porque una versión ya
 * usada en producción no se edita: se sucede.
 *
 * ── Y cuida la regla de los dos registros desde el otro lado ──────────────
 * `scripts/check-estilo.mjs` mira que el voseo NO esté en la interfaz. Acá se
 * mira lo simétrico: que SÍ esté donde tiene que estar. Un guardián que solo
 * prohíbe se cumple borrando la pieza.
 */
import { describe, expect, it } from 'vitest';
import { ESTILO_ARMANDO_VERSION, estiloArmandoV1 } from './estilo-armando.v1';

describe('el perfil de estilo de escritura del doctor', () => {
  it('sigue declarándose placeholder mientras no lo genere `analyze-estilo`', () => {
    expect(ESTILO_ARMANDO_VERSION).toBe('v1-placeholder');
    expect(estiloArmandoV1.version).toBe(ESTILO_ARMANDO_VERSION);
    expect(estiloArmandoV1.fewShot).toEqual([]);
  });

  it('trae sus reglas duras escritas', () => {
    expect(estiloArmandoV1.reglasDuras.length).toBeGreaterThanOrEqual(5);
    for (const regla of estiloArmandoV1.reglasDuras) expect(regla.trim().length).toBeGreaterThan(20);
  });

  it('es el único lugar donde se vosea, y de verdad se vosea', () => {
    const texto = `${estiloArmandoV1.trato} ${estiloArmandoV1.patronAnalitico}`;
    expect(texto).toMatch(/\bvos\b|tenés|podés/i);
  });
});
