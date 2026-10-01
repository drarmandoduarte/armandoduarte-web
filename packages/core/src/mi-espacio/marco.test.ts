import { describe, expect, it } from 'vitest';
import { edicionesVigentes, empezarParaEnviar, faltanEnLaFicha, necesitaEmpezar, proximoTaller, validarEmpezar } from './marco';

const completa = { nombre: 'Ana', apellido: 'Pérez', whatsapp: '+52 999 123 4567', pais: 'MX', ciudad: 'Mérida' };
const AHORA = new Date('2026-10-01T12:00:00Z');

describe('necesitaEmpezar (orden #29, C.1)', () => {
  it('EL CASO: sin ficha, o sin nombre, apellido o WhatsApp → /empezar', () => {
    expect(necesitaEmpezar(null)).toBe(true);
    expect(necesitaEmpezar({ ...completa, nombre: '' })).toBe(true);
    expect(necesitaEmpezar({ ...completa, apellido: '  ' })).toBe(true);
    expect(necesitaEmpezar({ ...completa, whatsapp: null })).toBe(true);
  });

  it('un WhatsApp que no sirve (menos de 8 dígitos) cuenta como que falta', () => {
    expect(necesitaEmpezar({ ...completa, whatsapp: '123' })).toBe(true);
  });

  it('con los tres, nunca — aunque falten país y ciudad', () => {
    expect(necesitaEmpezar(completa)).toBe(false);
    expect(necesitaEmpezar({ ...completa, pais: null, ciudad: null })).toBe(false);
  });
});

describe('faltanEnLaFicha (la tarjeta «Tus datos» de Inicio)', () => {
  it('completa → nada', () => {
    expect(faltanEnLaFicha(completa)).toEqual([]);
  });

  it('nombra lo que falta, en orden: «WhatsApp, ciudad»', () => {
    expect(faltanEnLaFicha({ ...completa, whatsapp: '12', ciudad: '' })).toEqual(['whatsapp', 'ciudad']);
    expect(faltanEnLaFicha(null)).toEqual(['nombre', 'apellido', 'whatsapp', 'pais', 'ciudad']);
  });
});

describe('proximoTaller', () => {
  const t = (inicio: string, fin: string, estado = 'pendiente_de_pago') => ({ inicio, fin, estado });

  it('el que empieza antes, entre los que no terminaron y no están anulados', () => {
    const mios = [
      t('2026-12-01T14:00:00Z', '2026-12-01T18:00:00Z'),
      t('2026-11-05T14:30:00Z', '2026-11-05T19:00:00Z', 'confirmada'),
      t('2026-10-20T14:00:00Z', '2026-10-20T18:00:00Z', 'anulada'),
      t('2026-09-01T14:00:00Z', '2026-09-01T18:00:00Z', 'confirmada'),
    ];
    expect(proximoTaller(mios, AHORA)).toBe(mios[1]);
  });

  it('uno que está pasando ahora todavía cuenta; sin ninguno, null', () => {
    const enCurso = t('2026-10-01T10:00:00Z', '2026-10-01T14:00:00Z');
    expect(proximoTaller([enCurso], AHORA)).toBe(enCurso);
    expect(proximoTaller([], AHORA)).toBeNull();
    expect(proximoTaller([t('2026-09-01T14:00:00Z', '2026-09-01T18:00:00Z')], AHORA)).toBeNull();
  });
});

describe('edicionesVigentes', () => {
  it('las que no terminaron', () => {
    const e = [{ fin: '2026-09-30T00:00:00Z' }, { fin: '2026-11-05T19:00:00Z' }];
    expect(edicionesVigentes(e, AHORA)).toEqual([e[1]]);
  });
});

describe('/empezar: validar y enviar', () => {
  const lleno = { nombre: 'Ana', apellido: 'Pérez', whatsapp: '+52 999 123 4567', pais: 'MX', ciudad: '' };

  it('los tres obligatorios se piden; ciudad no', () => {
    expect(validarEmpezar(lleno)).toEqual({});
    expect(validarEmpezar({ ...lleno, nombre: ' ', apellido: '', whatsapp: '12' })).toEqual({
      nombre: 'miEspacio.errores.nombre', apellido: 'miEspacio.errores.apellido', whatsapp: 'miEspacio.errores.whatsappPais',
    });
  });

  it('un país que no existe y una ciudad demasiado larga se dicen', () => {
    expect(validarEmpezar({ ...lleno, pais: 'XX', ciudad: 'x'.repeat(121) })).toEqual({
      pais: 'miEspacio.perfil.errores.pais', ciudad: 'miEspacio.errores.largo',
    });
  });

  it('la ciudad vacía no viaja (null borraría la de Mis datos); con texto, recortada', () => {
    /* #32: el WhatsApp viaja en E.164. */
    expect(empezarParaEnviar({ ...lleno, nombre: ' Ana ' })).toEqual({ nombre: 'Ana', apellido: 'Pérez', whatsapp: '+529991234567', pais: 'MX' });
    expect(empezarParaEnviar({ ...lleno, ciudad: ' Mérida ' }).ciudad).toBe('Mérida');
  });
});
