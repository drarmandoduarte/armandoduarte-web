import { describe, expect, it } from 'vitest';
import { RECURSOS_I18N } from '../i18n/recursos';
import { INTENTOS_POR_CODIGO, intentosQueQuedan, partirTituloDeAcceso, rellenar } from './acceso';

describe('intentosQueQuedan (§3)', () => {
  it('cuenta hacia abajo desde el tope y nunca baja de cero', () => {
    expect(intentosQueQuedan(0)).toBe(INTENTOS_POR_CODIGO);
    expect(intentosQueQuedan(1)).toBe(INTENTOS_POR_CODIGO - 1);
    expect(intentosQueQuedan(INTENTOS_POR_CODIGO)).toBe(0);
    expect(intentosQueQuedan(99)).toBe(0);
    expect(intentosQueQuedan(-3)).toBe(INTENTOS_POR_CODIGO);
  });
});

describe('rellenar (las variables de una llave del guion)', () => {
  it('EL CASO: «Te quedan {n} intentos.» y «← {app}»', () => {
    expect(rellenar('Código incorrecto. Te quedan {n} intentos.', { n: 4 })).toBe('Código incorrecto. Te quedan 4 intentos.');
    expect(rellenar('← {app}', { app: 'Armando Duarte' })).toBe('← Armando Duarte');
  });
  it('una variable que no viene queda escrita; las de dos llaves no se tocan', () => {
    expect(rellenar('a {email}', {})).toBe('a {email}');
    expect(rellenar('{{x}}', { x: 1 })).toBe('{{x}}');
  });
});

describe('partirTituloDeAcceso (§2)', () => {
  it('parte en antes, la palabra y después', () => {
    expect(partirTituloDeAcceso('Verifica tu *identidad*.')).toEqual({ antes: 'Verifica tu ', palabra: 'identidad', despues: '.' });
    expect(partirTituloDeAcceso('Activa tu *segundo paso*.')).toEqual({ antes: 'Activa tu ', palabra: 'segundo paso', despues: '.' });
  });
  it('sin asteriscos, entero', () => {
    expect(partirTituloDeAcceso('Hola')).toEqual({ antes: 'Hola', palabra: null, despues: '' });
  });
  it('todos los títulos propios de Mi espacio (el rescate, #37 PR 2), en los tres idiomas, tienen su palabra acentuada', () => {
    /* Los del guion los trae el molde desde la #37 (`@moldes/idiomas`) y los
       cuida su propio test. Acá quedan los que agrega Mi espacio. */
    const aplanar = (o: Record<string, unknown>, p = ''): [string, string][] => Object.entries(o).flatMap(([k, v]) =>
      typeof v === 'string' ? [[`${p}${k}`, v] as [string, string]] : aplanar(v as Record<string, unknown>, `${p}${k}.`));
    for (const idioma of ['es', 'en', 'pt'] as const) {
      const titulos = aplanar(RECURSOS_I18N[idioma].familia.auth as Record<string, unknown>).filter(([k]) => /(^|\.)(title|waitTitle)$/.test(k));
      expect(titulos.length, `${idioma}: el barrido vio los títulos`).toBeGreaterThanOrEqual(6);
      for (const [clave, titulo] of titulos) expect(partirTituloDeAcceso(titulo).palabra, `${idioma} ${clave}`).not.toBeNull();
    }
  });
});

describe('los textos del acceso, en español neutro (§5, D6)', () => {
  it('los de Mi espacio tutean (que no quede voseo lo mira `check:tuteo`, que barre este JSON); los del guion son del molde', () => {
    const es = JSON.stringify(RECURSOS_I18N.es.familia.auth);
    expect(es).toContain('Si lo pediste tú, confírmalo.');
    expect(es).toContain('Si no lo pediste tú, cancélalo');
    /* Los cuatro cambios de la #35 («Si pierdes el teléfono», «Pide un
       *reseteo*.», «Confirma que eres *tú*.», «Entra de nuevo y listo.») viven
       desde la #37 en `packages/moldes/idiomas/es.json`, que la app no edita. */
    expect(es).not.toContain('Pide un *reseteo*.');
  });
});
