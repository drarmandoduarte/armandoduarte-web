import { describe, expect, it } from 'vitest';
import { RECURSOS_I18N } from '../i18n/recursos';
import {
  TOPE_DE_COMPROBANTE, declaracionParaEnviar, fechaDeHoyEn, montoDesdeTexto, principalDeMiEspacio, puedeDeclarar,
  rutaDeComprobante, validarArchivoDeComprobante, validarDeclaracion,
} from './comprobante';
import { accionesDePago, filtrarPorEstado, filtroInicial, tonoDeEstado, validarResolucion } from '../panel/pagos';

const INSC = '11111111-1111-4111-8111-111111111111';
const UUID = '22222222-2222-4222-8222-222222222222';

/** Que cada clave que devuelven estas funciones exista en familia.json: un error sin texto es un error mudo. */
function existe(clave: string): boolean {
  let nodo: unknown = RECURSOS_I18N.es.familia;
  for (const parte of clave.split('.')) {
    if (typeof nodo !== 'object' || nodo === null) return false;
    nodo = (nodo as Record<string, unknown>)[parte];
  }
  return typeof nodo === 'string' && nodo.length > 0;
}

describe('el archivo, antes de subir', () => {
  it('jpg, png y pdf de hasta 5 MB sirven', () => {
    for (const type of ['image/jpeg', 'image/png', 'application/pdf']) {
      expect(validarArchivoDeComprobante({ type, size: 1000 }), type).toBeNull();
    }
    expect(validarArchivoDeComprobante({ type: 'application/pdf', size: TOPE_DE_COMPROBANTE })).toBeNull();
  });

  it('un byte más que 5 MB, otro tipo, vacío o nada: cada uno con su motivo, y el motivo tiene texto', () => {
    const casos = [
      validarArchivoDeComprobante({ type: 'application/pdf', size: TOPE_DE_COMPROBANTE + 1 }),
      validarArchivoDeComprobante({ type: 'image/heic', size: 1000 }),
      validarArchivoDeComprobante({ type: 'image/png', size: 0 }),
      validarArchivoDeComprobante(null),
    ];
    expect(casos).toEqual([
      'miEspacio.comprobante.errores.pesado',
      'miEspacio.comprobante.errores.tipo',
      'miEspacio.comprobante.errores.falta',
      'miEspacio.comprobante.errores.falta',
    ]);
    for (const c of casos) expect(existe(c!), c!).toBe(true);
  });

  it('la ruta es <inscripción>/<uuid>.<ext>, nunca el nombre del archivo de la persona', () => {
    expect(rutaDeComprobante(INSC, UUID, 'image/jpeg')).toBe(`${INSC}/${UUID}.jpg`);
    expect(rutaDeComprobante(INSC, UUID, 'application/pdf')).toBe(`${INSC}/${UUID}.pdf`);
    expect(() => rutaDeComprobante(INSC, UUID, 'image/gif')).toThrow();
  });
});

describe('la declaración', () => {
  const buena = { fecha_transferencia: '2026-10-01', monto: '1,170', banco: 'Banco de prueba', ultimos4_o_folio: '' };

  it('la fecha de hoy es la de la persona: a las 23:30 de Mérida ya es mañana en UTC', () => {
    const ahora = new Date('2026-10-02T05:30:00Z');
    expect(fechaDeHoyEn('America/Merida', ahora)).toBe('2026-10-01');
    expect(fechaDeHoyEn('Europe/Madrid', ahora)).toBe('2026-10-02');
  });

  it('el monto se lee como lo escribe la gente', () => {
    expect(montoDesdeTexto('1,170')).toBe(1170);
    expect(montoDesdeTexto('$1 170.50')).toBe(1170.5);
    expect(montoDesdeTexto('mil')).toBeNull();
    expect(montoDesdeTexto('1170.555')).toBeNull();
  });

  it('una declaración completa no tiene errores; el folio es opcional', () => {
    expect(validarDeclaracion(buena, '2026-10-01')).toEqual({});
  });

  it('fecha de mañana, monto cero, sin banco: cada campo con su clave, y las claves tienen texto', () => {
    const errores = validarDeclaracion({ ...buena, fecha_transferencia: '2026-10-02', monto: '0', banco: ' ' }, '2026-10-01');
    expect(errores).toEqual({
      fecha_transferencia: 'miEspacio.comprobante.errores.fechaFutura',
      monto: 'miEspacio.comprobante.errores.monto',
      banco: 'miEspacio.comprobante.errores.banco',
    });
    for (const c of Object.values(errores)) expect(existe(c), c).toBe(true);
  });

  it('lo que viaja a la API: número, moneda y el folio vacío como nulo', () => {
    expect(declaracionParaEnviar(buena, INSC, `${INSC}/${UUID}.pdf`, 'MXN')).toEqual({
      inscripcion_id: INSC, comprobante_path: `${INSC}/${UUID}.pdf`, fecha_transferencia: '2026-10-01',
      monto: 1170, moneda: 'MXN', banco: 'Banco de prueba', ultimos4_o_folio: null,
    });
  });

  it('«Ya transferí» solo cuando falta el pago (también después de un rechazo, que vuelve a pendiente)', () => {
    expect(puedeDeclarar('pendiente_de_pago')).toBe(true);
    for (const e of ['en_revision', 'confirmada', 'anulada']) expect(puedeDeclarar(e), e).toBe(false);
  });

  it('un naranja: si vino a anotarse, «Me anoto»; si no, pagar va antes que anotarse, y anotarse antes que guardar', () => {
    expect(principalDeMiEspacio({ vinoAAnotarse: true, hayMeAnoto: true, hayPagoPendiente: true })).toBe('me-anoto');
    expect(principalDeMiEspacio({ vinoAAnotarse: false, hayMeAnoto: true, hayPagoPendiente: true })).toBe('pago');
    expect(principalDeMiEspacio({ vinoAAnotarse: true, hayMeAnoto: false, hayPagoPendiente: true })).toBe('pago');
    expect(principalDeMiEspacio({ vinoAAnotarse: false, hayMeAnoto: true, hayPagoPendiente: false })).toBe('me-anoto');
    expect(principalDeMiEspacio({ vinoAAnotarse: false, hayMeAnoto: false, hayPagoPendiente: false })).toBe('guardar');
  });
});

describe('Inscriptos: filtro y acciones', () => {
  const filas = [
    { estado: 'en_revision', comprobante_path: 'a.pdf' },
    { estado: 'confirmada', comprobante_path: 'b.pdf' },
    { estado: 'pendiente_de_pago', comprobante_path: null },
    { estado: 'anulada', comprobante_path: null },
  ];

  it('cada filtro muestra su estado; «Todos», las cuatro (las anuladas solo ahí)', () => {
    expect(filtrarPorEstado(filas, 'todos')).toHaveLength(4);
    expect(filtrarPorEstado(filas, 'en_revision').map((f) => f.estado)).toEqual(['en_revision']);
    expect(filtrarPorEstado(filas, 'confirmada').map((f) => f.estado)).toEqual(['confirmada']);
    expect(filtrarPorEstado(filas, 'pendiente_de_pago').map((f) => f.estado)).toEqual(['pendiente_de_pago']);
  });

  it('arranca en «En revisión» si hay alguna; si no, en «Todos»', () => {
    expect(filtroInicial(filas)).toBe('en_revision');
    expect(filtroInicial(filas.slice(1))).toBe('todos');
  });

  it('Ver con comprobante; Confirmar y Rechazar solo en revisión; Anular solo el dueño', () => {
    expect(accionesDePago('equipo', filas[0])).toEqual({ ver: true, confirmar: true, rechazar: true, anular: false });
    expect(accionesDePago('dueno', filas[0])).toEqual({ ver: true, confirmar: true, rechazar: true, anular: true });
    expect(accionesDePago('equipo', filas[1])).toEqual({ ver: true, confirmar: false, rechazar: false, anular: false });
    expect(accionesDePago('dueno', filas[3]).anular, 'lo anulado no se anula dos veces').toBe(false);
    expect(accionesDePago('cliente', filas[0])).toEqual({ ver: false, confirmar: false, rechazar: false, anular: false });
  });

  it('rechazar y anular piden motivo; confirmar no; el motivo tiene tope; las claves tienen texto', () => {
    expect(validarResolucion('confirmado', '')).toBeNull();
    expect(validarResolucion('rechazado', '  ')).toBe('equipo.inscriptos.pago.errores.motivo');
    expect(validarResolucion('anulado', '')).toBe('equipo.inscriptos.pago.errores.motivo');
    expect(validarResolucion('rechazado', 'x'.repeat(501))).toBe('equipo.inscriptos.pago.errores.largo');
    expect(validarResolucion('rechazado', 'El monto no coincide')).toBeNull();
    for (const c of ['equipo.inscriptos.pago.errores.motivo', 'equipo.inscriptos.pago.errores.largo']) expect(existe(c), c).toBe(true);
  });

  it('el tono de cada estado', () => {
    expect(['confirmada', 'en_revision', 'pendiente_de_pago', 'anulada', 'otro'].map(tonoDeEstado))
      .toEqual(['confirmada', 'en_revision', 'pendiente', 'anulada', 'pendiente']);
  });
});
