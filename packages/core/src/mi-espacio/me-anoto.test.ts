import { describe, expect, it } from 'vitest';
import {
  claveDeEstado, datosParaEnviar, datosQueFaltan, edicionElegida, edicionPrincipal,
  enlaceParaPedirLosDatosDeCobro, estadoDelTaller, fechasDelTaller, rutaInternaSegura, slugDeMeAnoto,
  validarDatosParaAnotarse,
} from './me-anoto';

describe('?ir= — solo rutas de esta app (orden #24 B, a)', () => {
  it('deja pasar rutas internas, con su consulta', () => {
    expect(rutaInternaSegura('/me-anoto/el-arte-de-amar-a-tu-adolescente')).toBe('/me-anoto/el-arte-de-amar-a-tu-adolescente');
    expect(rutaInternaSegura('/mi-espacio')).toBe('/mi-espacio');
    expect(rutaInternaSegura('/mi-espacio?x=1#y')).toBe('/mi-espacio?x=1#y');
  });

  it('cualquier otra cosa es null — y quien llama manda a Mi espacio', () => {
    for (const ir of [
      'https://otro.sitio', 'http://otro.sitio/mi-espacio', 'javascript:alert(1)', '//otro.sitio',
      '/\\otro.sitio', '\\\\otro.sitio', 'mi-espacio', ' /mi-espacio', '/mi\tespacio', '/mi\nespacio',
      '', null, undefined, `/${'a'.repeat(600)}`,
    ]) {
      expect(rutaInternaSegura(ir), JSON.stringify(ir)).toBeNull();
    }
  });
});

describe('/me-anoto/<slug>', () => {
  it('saca el slug, con o sin barra final', () => {
    expect(slugDeMeAnoto('/me-anoto/el-arte-de-amar-a-tu-adolescente')).toBe('el-arte-de-amar-a-tu-adolescente');
    expect(slugDeMeAnoto('/me-anoto/limites/')).toBe('limites');
  });

  it('una ruta que no es ésa, o un slug sin forma de slug, es null', () => {
    expect(slugDeMeAnoto('/mi-espacio')).toBeNull();
    expect(slugDeMeAnoto('/me-anoto/')).toBeNull();
    expect(slugDeMeAnoto('/me-anoto/El-Arte')).toBeNull();
    expect(slugDeMeAnoto('/me-anoto/a/b')).toBeNull();
  });
});

describe('los datos para anotarse', () => {
  it('faltan los vacíos, y un WhatsApp que no sirve cuenta como faltante', () => {
    expect(datosQueFaltan(null)).toEqual(['nombre', 'apellido', 'whatsapp']);
    expect(datosQueFaltan({ nombre: 'Laura', apellido: ' ', whatsapp: '123' })).toEqual(['apellido', 'whatsapp']);
    expect(datosQueFaltan({ nombre: 'Laura', apellido: 'Prueba', whatsapp: '+52 999 123 4567' })).toEqual([]);
  });

  it('valida solo lo que se pidió, con claves de i18n', () => {
    /* #32: vacío pide el número; uno que no es de su país lo dice por el país. */
    expect(validarDatosParaAnotarse({ nombre: '', whatsapp: '12' }, ['nombre', 'whatsapp']))
      .toEqual({ nombre: 'miEspacio.errores.nombre', whatsapp: 'miEspacio.errores.whatsappPais' });
    expect(validarDatosParaAnotarse({ whatsapp: '' }, ['whatsapp'])).toEqual({ whatsapp: 'miEspacio.errores.whatsapp' });
    expect(validarDatosParaAnotarse({ apellido: 'x'.repeat(81) }, ['apellido'])).toEqual({ apellido: 'miEspacio.errores.largo' });
    expect(validarDatosParaAnotarse({}, [])).toEqual({});
  });

  it('a la API viaja solo lo pedido, recortado; el WhatsApp en E.164 (#32)', () => {
    expect(datosParaEnviar({ nombre: ' Laura ', apellido: 'X', whatsapp: '+52 1' }, ['nombre'])).toEqual({ nombre: 'Laura' });
    expect(datosParaEnviar({ whatsapp: '+52 999 123 4567' }, ['whatsapp'])).toEqual({ whatsapp: '+529991234567' });
  });
});

describe('los lugares', () => {
  it('«Quedan N» solo con 15 o menos; sin tope o con más, no se dice el número', () => {
    expect(estadoDelTaller({ lugares: 12, mi_referencia: null })).toEqual({ tipo: 'disponible', quedan: 12 });
    expect(estadoDelTaller({ lugares: 15, mi_referencia: null })).toEqual({ tipo: 'disponible', quedan: 15 });
    expect(estadoDelTaller({ lugares: 16, mi_referencia: null })).toEqual({ tipo: 'disponible', quedan: null });
    expect(estadoDelTaller({ lugares: null, mi_referencia: null })).toEqual({ tipo: 'disponible', quedan: null });
  });

  it('sin lugares con 0; y anotada gana a todo, aunque el taller se haya llenado', () => {
    expect(estadoDelTaller({ lugares: 0, mi_referencia: null })).toEqual({ tipo: 'sin-lugares' });
    expect(estadoDelTaller({ lugares: 0, mi_referencia: 'AD-0007' })).toEqual({ tipo: 'anotado', referencia: 'AD-0007' });
  });
});

describe('la fecha en dos zonas (D15)', () => {
  const merida = { inicio: '2026-11-05T14:30:00.000Z', fin: '2026-11-05T19:00:00.000Z', zona: 'America/Merida', ciudad: 'Mérida' };

  it('en la zona de la edición: el día y «8:30 a 13:00», con la ciudad de la edición', () => {
    const f = fechasDelTaller(merida, 'America/Merida');
    expect(f).toEqual({ dia: 'Jueves, 5 de noviembre de 2026', horario: '8:30 a 13:00', ciudad: 'Mérida', enTuZona: null });
  });

  it('desde Madrid, la suya al lado', () => {
    expect(fechasDelTaller(merida, 'Europe/Madrid').enTuZona).toEqual({ dia: 'jueves, 5 de noviembre', horario: '15:30 a 20:00' });
  });

  it('otra zona con la misma hora de pared no se repite (Ciudad de México en noviembre)', () => {
    expect(fechasDelTaller(merida, 'America/Mexico_City').enTuZona).toBeNull();
  });

  it('sin zona de la persona, o una que no existe, no se inventa; sin ciudad, sale de la zona', () => {
    expect(fechasDelTaller(merida, null).enTuZona).toBeNull();
    expect(fechasDelTaller(merida, 'Marte/Olimpo').enTuZona).toBeNull();
    expect(fechasDelTaller({ ...merida, ciudad: null }, null).ciudad).toBe('Merida');
  });
});

describe('qué taller se abre y cuál va en naranja', () => {
  const t = (edicion_id: string, curso_slug: string, lugares: number | null, mi_referencia: string | null = null) =>
    ({ edicion_id, curso_slug, lugares, mi_referencia });
  const lista = [t('e1', 'a', 0), t('e2', 'a', 5), t('e3', 'b', null), t('e4', 'c', 0, 'AD-0001')];

  it('por slug: la primera disponible del curso; si no hay, la primera del curso; si no está, null', () => {
    expect(edicionElegida(lista, 'a')?.edicion_id).toBe('e2');
    expect(edicionElegida(lista, 'c')?.edicion_id).toBe('e4');
    expect(edicionElegida(lista, 'zzz')).toBeNull();
    expect(edicionElegida(lista, null)).toBeNull();
  });

  it('un solo naranja: la elegida si está disponible, si no la primera disponible', () => {
    expect(edicionPrincipal(lista, 'e3')).toBe('e3');
    expect(edicionPrincipal(lista, 'e4')).toBe('e2');
    expect(edicionPrincipal(lista, null)).toBe('e2');
    expect(edicionPrincipal([t('e1', 'a', 0)], null)).toBeNull();
  });
});

describe('estado y enlace a Gaby', () => {
  it('el estado es una clave; uno desconocido no rompe la pantalla', () => {
    expect(claveDeEstado('pendiente_de_pago')).toBe('miEspacio.estados.pendiente_de_pago');
    expect(claveDeEstado('otra')).toBe('miEspacio.estados.desconocido');
  });

  it('sin datos de cobro, el enlace es al WhatsApp de Gaby con la referencia escrita', () => {
    expect(enlaceParaPedirLosDatosDeCobro('Mi referencia es AD-0001'))
      .toBe('https://wa.me/524621993143?text=Mi%20referencia%20es%20AD-0001');
  });
});
