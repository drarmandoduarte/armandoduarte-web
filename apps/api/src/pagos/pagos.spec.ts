/**
 * Pagos y correo, con dobles — orden #27 C.
 *
 * Lo que se prueba acá es **lo que decide el controlador**, no la base: los
 * códigos de error que la orden nombra, que un insert fallido intenta borrar el
 * archivo, que el correo nunca tumba una confirmación y que su texto es el de
 * `familia.json`. Las consultas, contra el esquema de verdad, están en
 * `las-consultas-corren-contra-la-base.spec.ts`.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import 'reflect-metadata';
import { RECURSOS_I18N } from '@codice/core';
import type { SupabaseService } from '../identidad/supabase.service';
import { CorreoService } from '../correo/correo.service';
import { TEXTOS_DE_CORREO } from '../correo/textos';
import { PagosController, armarCorreo } from './pagos.controller';
import type { PagosRepositorio, Renglon } from './pagos.repositorio';

const INSC = '11111111-1111-4111-8111-111111111111';
const OTRA = '22222222-2222-4222-8222-222222222222';
const ARCHIVO = '33333333-3333-4333-8333-333333333333';
const pedido = { headers: { authorization: 'Bearer token-de-prueba' } };

const renglon = (orden: number, tipo: string, extra: Partial<Renglon> = {}): Renglon => ({
  orden, tipo, nota: null, comprobante_path: null, monto: null, moneda: null, created_at: '2026-10-01T00:00:00Z', ...extra,
});

function armar({ rol = 'cliente', libro = [] as Renglon[], anotarFalla = false, correoSale = true } = {}) {
  const supabase = {
    getUserFromToken: vi.fn().mockResolvedValue({ id: 'persona-1' }),
    rolDe: vi.fn().mockResolvedValue(rol),
  } as unknown as SupabaseService;
  const repo = {
    inscripcion: vi.fn().mockResolvedValue({ id: INSC, referencia: 'AD-0042', persona_id: 'persona-1', edicion_id: 'e' }),
    libro: vi.fn().mockResolvedValue(libro),
    anotar: vi.fn().mockImplementation(async () => { if (anotarFalla) throw new Error('42501'); }),
    borrarComprobante: vi.fn().mockResolvedValue(false),
    urlFirmada: vi.fn().mockResolvedValue('https://firmada.invalid/x'),
    datosParaElCorreo: vi.fn().mockResolvedValue({
      email: 'clienta@ejemplo.com', nombre: 'Clienta', referencia: 'AD-0042', curso: 'Taller de prueba',
      inicio: '2026-11-05T14:30:00Z', fin: '2026-11-05T19:00:00Z', zona: 'America/Merida', sede: 'Sede de prueba', ciudad: 'Mérida',
    }),
  };
  const correo = { enviar: vi.fn().mockResolvedValue(correoSale) };
  const controlador = new PagosController(supabase, repo as unknown as PagosRepositorio, correo as unknown as CorreoService);
  return { controlador, repo, correo };
}

const declaracion = (campos: Record<string, unknown> = {}) => ({
  inscripcion_id: INSC, comprobante_path: `${INSC}/${ARCHIVO}.pdf`, fecha_transferencia: '2026-10-01',
  monto: 1170, moneda: 'MXN', banco: 'Banco de prueba', ultimos4_o_folio: '0000', ...campos,
});

const codigoDe = async (promesa: Promise<unknown>) => {
  try {
    await promesa;
    return null;
  } catch (e) {
    return ((e as { getResponse?: () => unknown }).getResponse?.() as { code?: string } | undefined)?.code ?? (e as Error).message;
  }
};

describe('POST /pagos/declarar', () => {
  it('con un archivo de la carpeta de OTRA inscripción: 403 RUTA_AJENA, y no se anota nada', async () => {
    const { controlador, repo } = armar();
    expect(await codigoDe(controlador.declarar(pedido, declaracion({ comprobante_path: `${OTRA}/${ARCHIVO}.pdf` })))).toBe('RUTA_AJENA');
    expect(repo.anotar).not.toHaveBeenCalled();
  });

  it('una inscripción que no es de quien pide: 403 SIN_PERMISO', async () => {
    const { controlador, repo } = armar();
    repo.inscripcion.mockResolvedValueOnce({ id: INSC, referencia: 'AD-1', persona_id: 'otra-persona', edicion_id: 'e' });
    expect(await codigoDe(controlador.declarar(pedido, declaracion()))).toBe('SIN_PERMISO');
  });

  it('con uno en revisión, confirmado o anulado: 409 NO_ESPERA_COMPROBANTE; después de un rechazo, sí', async () => {
    for (const tipo of ['declarado', 'confirmado', 'anulado']) {
      const { controlador } = armar({ libro: [renglon(1, tipo)] });
      expect(await codigoDe(controlador.declarar(pedido, declaracion())), tipo).toBe('NO_ESPERA_COMPROBANTE');
    }
    const { controlador, repo } = armar({ libro: [renglon(2, 'rechazado'), renglon(1, 'declarado')] });
    await expect(controlador.declarar(pedido, declaracion())).resolves.toEqual({ ok: true, estado: 'en_revision' });
    expect(repo.anotar).toHaveBeenCalledWith('token-de-prueba', expect.objectContaining({ tipo: 'declarado', hecho_por: 'persona-1' }));
  });

  it('si el insert falla, intenta borrar el archivo recién subido —con el token del cliente— y devuelve el error', async () => {
    const { controlador, repo } = armar({ anotarFalla: true });
    expect(await codigoDe(controlador.declarar(pedido, declaracion()))).toBe('42501');
    expect(repo.borrarComprobante).toHaveBeenCalledWith('token-de-prueba', `${INSC}/${ARCHIVO}.pdf`);
  });

  it('si el insert sale bien, el archivo no se toca', async () => {
    const { controlador, repo } = armar();
    await controlador.declarar(pedido, declaracion());
    expect(repo.borrarComprobante).not.toHaveBeenCalled();
  });
});

describe('POST /pagos/resolver', () => {
  const enRevision = [renglon(1, 'declarado', { monto: '1170.00', moneda: 'MXN', comprobante_path: `${INSC}/${ARCHIVO}.pdf` })];

  it('un cliente: 403 SOLO_EQUIPO', async () => {
    const { controlador } = armar({ rol: 'cliente', libro: enRevision });
    expect(await codigoDe(controlador.resolver(pedido, { inscripcion_id: INSC, tipo: 'confirmado' }))).toBe('SOLO_EQUIPO');
  });

  it('`rechazado` sin motivo (o con espacios): 400 FALTA_MOTIVO', async () => {
    const { controlador, repo } = armar({ rol: 'equipo', libro: enRevision });
    expect(await codigoDe(controlador.resolver(pedido, { inscripcion_id: INSC, tipo: 'rechazado' }))).toBe('FALTA_MOTIVO');
    expect(await codigoDe(controlador.resolver(pedido, { inscripcion_id: INSC, tipo: 'rechazado', nota: '   ' }))).toBe('FALTA_MOTIVO');
    expect(repo.anotar).not.toHaveBeenCalled();
  });

  it('`anulado` por el equipo: 403 SOLO_DUENO, aunque la policy lo dejara', async () => {
    const { controlador, repo } = armar({ rol: 'equipo', libro: enRevision });
    expect(await codigoDe(controlador.resolver(pedido, { inscripcion_id: INSC, tipo: 'anulado', nota: 'Pidió la devolución' }))).toBe('SOLO_DUENO');
    expect(repo.anotar).not.toHaveBeenCalled();
  });

  it('el dueño anula, con motivo, y no se manda correo', async () => {
    const { controlador, correo } = armar({ rol: 'dueno', libro: [renglon(2, 'confirmado'), ...enRevision] });
    await expect(controlador.resolver(pedido, { inscripcion_id: INSC, tipo: 'anulado', nota: 'Pidió la devolución' }))
      .resolves.toEqual({ ok: true, correo: 'no_corresponde' });
    expect(correo.enviar).not.toHaveBeenCalled();
  });

  it('confirmar algo que no está en revisión: 409 NO_ESTA_EN_REVISION', async () => {
    const { controlador } = armar({ rol: 'equipo', libro: [] });
    expect(await codigoDe(controlador.resolver(pedido, { inscripcion_id: INSC, tipo: 'confirmado' }))).toBe('NO_ESTA_EN_REVISION');
  });

  it('confirmar toma el monto declarado si no viene otro, y manda el correo', async () => {
    const { controlador, repo, correo } = armar({ rol: 'equipo', libro: enRevision });
    await expect(controlador.resolver(pedido, { inscripcion_id: INSC, tipo: 'confirmado' }))
      .resolves.toEqual({ ok: true, correo: 'enviado' });
    expect(repo.anotar).toHaveBeenCalledWith('token-de-prueba', expect.objectContaining({ tipo: 'confirmado', monto: 1170, moneda: 'MXN', hecho_por: 'persona-1' }));
    expect(correo.enviar).toHaveBeenCalledWith(expect.objectContaining({ para: 'clienta@ejemplo.com' }));
  });

  it('si el correo falla, la confirmación queda hecha igual', async () => {
    const { controlador, repo } = armar({ rol: 'equipo', libro: enRevision, correoSale: false });
    await expect(controlador.resolver(pedido, { inscripcion_id: INSC, tipo: 'confirmado' }))
      .resolves.toEqual({ ok: true, correo: 'no_enviado' });
    expect(repo.anotar).toHaveBeenCalledTimes(1);
  });

  it('…y si leer los datos del correo revienta, también', async () => {
    const { controlador, repo } = armar({ rol: 'equipo', libro: enRevision });
    repo.datosParaElCorreo.mockRejectedValueOnce(new Error('se cayó la red'));
    await expect(controlador.resolver(pedido, { inscripcion_id: INSC, tipo: 'rechazado', nota: 'El monto no coincide' }))
      .resolves.toEqual({ ok: true, correo: 'no_enviado' });
  });
});

describe('GET /pagos/comprobante/:inscripcion', () => {
  it('firma el ÚLTIMO comprobante declarado', async () => {
    const { controlador, repo } = armar({
      libro: [renglon(3, 'declarado', { comprobante_path: 'nuevo.pdf' }), renglon(2, 'rechazado'), renglon(1, 'declarado', { comprobante_path: 'viejo.pdf' })],
    });
    await expect(controlador.comprobante(pedido, INSC)).resolves.toEqual({ url: 'https://firmada.invalid/x' });
    expect(repo.urlFirmada).toHaveBeenCalledWith('token-de-prueba', 'nuevo.pdf');
  });

  it('sin comprobante (o sin libro visible para quien pide): 404 SIN_COMPROBANTE', async () => {
    const { controlador } = armar({ libro: [] });
    expect(await codigoDe(controlador.comprobante(pedido, INSC))).toBe('SIN_COMPROBANTE');
  });
});

describe('el correo', () => {
  const datos = {
    email: 'clienta@ejemplo.com', nombre: 'Clienta', referencia: 'AD-0042', curso: 'Taller de prueba',
    inicio: '2026-11-05T14:30:00Z', fin: '2026-11-05T19:00:00Z', zona: 'America/Merida', sede: 'Sede de prueba', ciudad: 'Mérida',
  };

  it('el texto de la API es el de familia.json, campo por campo (la API no puede importar core)', () => {
    /* EL PISO: que familia.json tenga los textos. Sin esto, comparar contra
       `undefined` daría un rojo que habla de la copia y no de la fuente. */
    const fuente = (RECURSOS_I18N.es.familia as unknown as { correos?: typeof TEXTOS_DE_CORREO }).correos;
    expect(fuente, 'familia.json no tiene `correos`').toBeDefined();
    expect(TEXTOS_DE_CORREO).toEqual(fuente);
  });

  it('confirmado: asunto con curso y referencia; fecha y hora en la zona de la edición; sede y enlace', () => {
    const c = armarCorreo(datos, 'confirmado', null);
    expect(c.asunto).toBe('Tu lugar en Taller de prueba está confirmado · AD-0042');
    expect(c.texto).toMatch(/^Hola, Clienta:/);
    /* 14:30 UTC es 8:30 en Mérida: la hora es la de la edición, no la del servidor. */
    expect(c.texto).toContain('jueves, 5 de noviembre, 8:30 a 13:00 (hora de Mérida)');
    expect(c.texto).toContain('Dónde: Sede de prueba');
    expect(c.texto).toContain('https://familia.armandoduarte.com/mi-espacio');
    expect(c.texto).not.toMatch(/\{\{|<[a-z]/i);
  });

  it('rechazado: lleva el motivo que escribió el equipo; sin nombre, «Hola:»', () => {
    const c = armarCorreo({ ...datos, nombre: null }, 'rechazado', 'El monto no coincide');
    expect(c.asunto).toBe('Revisamos tu comprobante de Taller de prueba · AD-0042');
    expect(c.texto).toMatch(/^Hola:\n/);
    expect(c.texto).toContain('El monto no coincide');
  });
});

describe('CorreoService: nunca tira', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });
  const correo = { para: 'clienta@ejemplo.com', asunto: 'a', texto: 't' };

  it('sin RESEND_API_KEY no sale a la red y devuelve false', async () => {
    vi.stubEnv('RESEND_API_KEY', '');
    vi.stubEnv('CORREO_REMITENTE', 'Prueba <prueba@ejemplo.com>');
    const red = vi.fn();
    vi.stubGlobal('fetch', red);
    await expect(new CorreoService().enviar(correo)).resolves.toBe(false);
    expect(red).not.toHaveBeenCalled();
  });

  it('con las dos variables, manda texto plano a Resend y devuelve true', async () => {
    vi.stubEnv('RESEND_API_KEY', 'clave-de-prueba');
    vi.stubEnv('CORREO_REMITENTE', 'Prueba <prueba@ejemplo.com>');
    const red = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', red);
    await expect(new CorreoService().enviar(correo)).resolves.toBe(true);
    const [url, opciones] = red.mock.calls[0] as [string, { body: string; headers: Record<string, string> }];
    expect(url).toBe('https://api.resend.com/emails');
    expect(JSON.parse(opciones.body)).toEqual({ from: 'Prueba <prueba@ejemplo.com>', to: ['clienta@ejemplo.com'], subject: 'a', text: 't' });
  });

  it('Resend contesta 500, o la red se cae: false, sin tirar', async () => {
    vi.stubEnv('RESEND_API_KEY', 'clave-de-prueba');
    vi.stubEnv('CORREO_REMITENTE', 'Prueba <prueba@ejemplo.com>');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 500 })));
    await expect(new CorreoService().enviar(correo)).resolves.toBe(false);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')));
    await expect(new CorreoService().enviar(correo)).resolves.toBe(false);
  });
});
