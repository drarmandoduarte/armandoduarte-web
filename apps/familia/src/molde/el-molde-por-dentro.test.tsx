/**
 * Mi espacio dentro del molde — orden #37, PR 3 (fase-2 §5, §6, §9 y §11).
 *
 * «Con cada rol, cada uno ve lo que le corresponde» (§11): el shell, Ajustes,
 * Inicio, Equipo, la Papelera y el Centro de alertas, montados como los monta
 * `App.tsx`, con la API y Supabase simulados. Y §5: en inglés y en portugués,
 * ni un texto en español ni una clave a la vista.
 *
 * Qué decide quién ve qué está en `core` (`mi-espacio/molde.ts`, con su test)
 * y en el molde (sus propios tests, en `moldes-apps`). Acá se prueba que el
 * adaptador se lo pase bien.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { Session } from '@supabase/supabase-js';

const falso = vi.hoisted(() => ({
  respuestas: {} as Record<string, unknown>,
  fallan: new Set<string>(),
  /** Ruta → `code` del servidor con el que falla (409). */
  codigos: {} as Record<string, string>,
  pedidos: [] as { ruta: string; cuerpo?: unknown }[],
  auth: [] as { que: string; datos: unknown }[],
}));

vi.mock('../comun/api', async (original) => {
  const real = await original<typeof import('../comun/api')>();
  return {
    ...real,
    api: async (ruta: string, opciones?: { cuerpo?: unknown }) => {
      falso.pedidos.push({ ruta, cuerpo: opciones?.cuerpo });
      if (falso.fallan.has(ruta)) throw new real.ErrorDeApi('DESCONOCIDO', 400, 'x');
      if (falso.codigos[ruta]) throw new real.ErrorDeApi('DESCONOCIDO', 409, 'x', undefined, falso.codigos[ruta]);
      return falso.respuestas[ruta] ?? { ok: true };
    },
  };
});
/* El autenticador del dueño: `verificarTotp` dice que el código sirvió. */
vi.mock('../acceso/totp', () => ({ verificarTotp: async () => 'ok' }));
vi.mock('../supabase', () => ({
  variablesQueFaltan: () => [],
  supabase: {
    auth: {
      signInWithOtp: async (datos: unknown) => { falso.auth.push({ que: 'signInWithOtp', datos }); return { error: null }; },
      verifyOtp: async (datos: unknown) => { falso.auth.push({ que: 'verifyOtp', datos }); return { error: null }; },
      mfa: { listFactors: async () => ({ data: { totp: [] } }) },
    },
  },
}));

import '../i18n';
import type { Yo } from '../comun/api';
import { tDelMolde } from './arranque';
import { Esqueleto } from './Esqueleto';
import { PaginaDeAjustes, type AccionesDeLaApp } from './ajustes';
import { PaginaDeInicio } from './inicio';
import { PaginaDeEquipo } from './equipo';
import { PaginaDePapelera } from './papelera';
import { PaginaDeAlertas, alertasTraducidas } from './alertas';
import { PaginaDeBienvenida } from './bienvenida';
import type { Lectura } from './lectura';
import { TEXTOS_DEL_MOLDE } from '@codice/core';

type Rol = 'cliente' | 'equipo' | 'dueno';
const persona = { id: 'u-yo', nombre: 'Laura', apellido: 'Prueba', whatsapp: '+529991112233', pais: 'MX', ciudad: 'Mérida', avisos_por_correo: true };
const yoDe = (rol: Rol): Yo => ({
  rol, tipo: rol === 'cliente' ? 'cliente' : 'equipo', territorio: rol === 'equipo' ? 'mexico' : rol === 'dueno' ? 'todos' : null, persona,
});
const sesion = (conAutenticador: boolean) => ({
  user: {
    id: 'u-yo', email: 'laura@ejemplo.mx',
    factors: conAutenticador ? [{ id: 'f-1', factor_type: 'totp', status: 'verified', created_at: '2026-09-29T10:00:00Z' }] : [],
  },
} as unknown as Session);
const LECTURA: Lectura = { cargando: false, abiertos: [], mios: [], enRevision: 3, ediciones: [], noCargo: [] };
const app = (): AccionesDeLaApp => ({
  recargar: async () => {}, alAvisar: vi.fn(), alActivar: vi.fn(), alRegenerar: vi.fn(), alPedirPasoReciente: vi.fn(),
  alSalirDeTodo: async () => {}, alBorrada: vi.fn(async () => {}), cambiarIdioma: async () => {},
});

beforeEach(() => {
  falso.respuestas = {};
  falso.fallan = new Set();
  falso.codigos = {};
  falso.pedidos = [];
  falso.auth = [];
  window.localStorage.clear();
});

const es = tDelMolde('es');

describe('§9 · la barra: con cada rol, lo que le corresponde', () => {
  const filas = () => [...document.querySelectorAll('[data-fila]')].map((b) => b.getAttribute('data-fila'));
  const montar = (rol: Rol) => render(
    <Esqueleto t={es} yo={yoDe(rol)} correo="laura@ejemplo.mx" activo="inicio" alertas={2} onIr={() => {}} onSalir={() => {}}><p>contenido</p></Esqueleto>,
  );

  it('EL CASO: el cliente ve Inicio, Talleres, Mis talleres, Centro de alertas y Papelera — sin Panel ni Equipo', () => {
    montar('cliente');
    expect(filas()).toEqual(['inicio', 'talleres', 'misTalleres', 'alertas', 'papelera']);
  });

  it('el equipo suma el Panel; el dueño, además Equipo (después de la Papelera)', () => {
    montar('equipo');
    expect(filas()).toEqual(['inicio', 'talleres', 'misTalleres', 'panel', 'alertas', 'papelera']);
    document.body.innerHTML = '';
    montar('dueno');
    expect(filas()).toEqual(['inicio', 'talleres', 'misTalleres', 'panel', 'alertas', 'papelera', 'equipo']);
  });

  it('sin asistente: no hay «Pregúntale», y debajo del nombre va el rol', () => {
    montar('equipo');
    expect(filas()).not.toContain('preguntar');
    expect(screen.getByText('Laura Prueba')).toBeTruthy();
    expect(screen.getByText(es('mi.rol.equipoMexico'))).toBeTruthy();
  });
});

describe('§6 · Ajustes: el riel de cada rol y sus filas', () => {
  const riel = () => [...document.querySelectorAll('nav button, nav a')].map((b) => b.textContent?.trim()).filter(Boolean);
  const montar = (rol: Rol, seccion: string | null, conAutenticador = rol !== 'cliente', acciones = app()) => render(
    <PaginaDeAjustes t={es} yo={yoDe(rol)} sesion={sesion(conAutenticador)} seccion={seccion} onSeccion={() => {}} app={acciones} />,
  );

  it('EL CASO: Tú (siete) y Armando Duarte (Perfil del taller) y Acerca de — sin Datos, Avisos, Plan, Integraciones ni Asistente', () => {
    montar('cliente', 'perfil');
    expect(riel()).toEqual([
      'Perfil', 'Cuenta y seguridad', 'Apariencia', 'Idioma', 'Notificaciones', 'Privacidad y datos',
      es('mi.ajustes.taller'), 'Acerca de',
    ]);
  });

  it('el dueño ve el mismo riel (Mi espacio no tiene Datos ni Plan), y Actividad en Cuenta', () => {
    montar('dueno', 'cuenta');
    expect(riel()).toContain(es('mi.ajustes.taller'));
    expect(riel()).not.toContain('Datos');
    expect(screen.getByText(es('settings.team.activity'))).toBeTruthy();
  });

  it('el autenticador: obligatorio para el equipo; para el cliente sin él, «Activar», que abre P4', () => {
    montar('equipo', 'cuenta');
    expect(screen.getByText(es('settings.security.totp.d.obligatorio', { fecha: '29/9/2026' }))).toBeTruthy();
    document.body.innerHTML = '';
    const acciones = app();
    montar('cliente', 'cuenta', false, acciones);
    expect(screen.getByText(es('settings.security.totp.d.inactivo'))).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: es('settings.security.totp.activate') }));
    expect(acciones.alActivar).toHaveBeenCalled();
  });

  it('Seguridad está dentro de Cuenta: ?s=seguridad (la #34) abre Cuenta y seguridad', () => {
    montar('equipo', 'seguridad');
    expect(screen.getByRole('heading', { name: /^Cuenta y seguridad/ })).toBeTruthy();
  });

  it('el correo no se cambia desde acá: la fila lo dice, y «Guardar» no manda nada ni dice «Guardado»', async () => {
    montar('cliente', 'cuenta', false);
    expect(screen.getByText(es('settings.profile.email.d'))).toBeTruthy();
    const correo = screen.getByLabelText(es('settings.profile.email'));
    fireEvent.change(correo, { target: { value: 'otro@ejemplo.mx' } });
    fireEvent.click(within(correo.closest('form') as HTMLElement).getByRole('button', { name: es('settings.save') }));
    await new Promise((r) => setTimeout(r, 20));
    expect(falso.pedidos).toEqual([]);
    expect(screen.queryByText(es('settings.saved'))).toBeNull();
  });


  it('Notificaciones: los avisos por correo de la 012, y sin resumen (Mi espacio no lo manda)', async () => {
    montar('cliente', 'notificaciones');
    fireEvent.click(screen.getByRole('switch', { name: es('mi.ajustes.avisos') }));
    await waitFor(() => expect(falso.pedidos).toContainEqual({ ruta: 'yo', cuerpo: { avisos_por_correo: false } }));
    /* «Resumen» queda en «No» y por eso no aparece «A qué hora». */
    expect(screen.queryByText(es('settings.notifications.digest.hour'))).toBeNull();
  });

  it('Apariencia es de este aparato: el tema se guarda en el navegador y pinta <html>', async () => {
    montar('cliente', 'apariencia');
    fireEvent.click(screen.getByRole('radio', { name: es('settings.appearance.theme.dark') }));
    await waitFor(() => expect(document.documentElement.getAttribute('data-theme')).toBe('dark'));
    expect(window.localStorage.getItem('codice.tema')).toBe('oscuro');
    expect(falso.pedidos.some((p) => p.ruta === 'yo')).toBe(false);
  });

  it('Acerca de: la versión y las Novedades del CHANGELOG del molde', () => {
    montar('cliente', 'acerca');
    expect(screen.getByText(es('settings.about.version', { v: '1.1.2', fecha: '5/10/2026' }))).toBeTruthy();
    expect(screen.getByText(/las apps cargan sus colores/i)).toBeTruthy();
  });

  it('EL CASO DE BORRAR (cliente sin autenticador): abrir la zona manda el código por correo; con la palabra y el código, se borra', async () => {
    const acciones = app();
    montar('cliente', 'privacidad', false, acciones);
    fireEvent.click(screen.getByRole('button', { name: es('settings.data.delete') }));
    await waitFor(() => expect(falso.auth.map((a) => a.que)).toEqual(['signInWithOtp']));
    expect(falso.auth[0].datos).toEqual({ email: 'laura@ejemplo.mx', options: { shouldCreateUser: false } });
    fireEvent.change(screen.getByLabelText(es('settings.danger.type', { palabra: es('settings.data.delete.word') })), { target: { value: 'borrar' } });
    fireEvent.change(screen.getByLabelText(es('auth.code.label')), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: es('settings.danger.confirm') }));
    await waitFor(() => expect(acciones.alBorrada).toHaveBeenCalled());
    expect(falso.auth[1]).toEqual({ que: 'verifyOtp', datos: { email: 'laura@ejemplo.mx', token: '123456', type: 'email' } });
    expect(falso.pedidos.map((p) => p.ruta)).toContain('cuenta/borrar');
  });

  it('LA MUTACIÓN QUE SE FRENA: el único dueño recibe UNICO_DUENO, el cartel lo dice y la sesión sigue', async () => {
    const acciones = app();
    falso.codigos['cuenta/borrar'] = 'UNICO_DUENO';
    montar('dueno', 'privacidad', true, acciones);
    fireEvent.click(screen.getByRole('button', { name: es('settings.data.delete') }));
    /* Con autenticador, el código es el suyo: no se manda nada por correo. */
    expect(falso.auth).toEqual([]);
    fireEvent.change(screen.getByLabelText(es('settings.danger.type', { palabra: es('settings.data.delete.word') })), { target: { value: 'BORRAR' } });
    fireEvent.change(screen.getByLabelText(es('auth.code.label')), { target: { value: '654321' } });
    fireEvent.click(screen.getByRole('button', { name: es('settings.danger.confirm') }));
    await waitFor(() => expect(acciones.alAvisar).toHaveBeenCalledWith(es('mi.ajustes.borrar.unicoDueno'), 'danger'));
    expect(acciones.alBorrada).not.toHaveBeenCalled();
  });

});

describe('§9 · Inicio: lo que ve cada rol si nunca lo acomodó', () => {
  const cuadros = () => [...document.querySelectorAll('[data-widget]')].map((w) => w.getAttribute('data-widget'));
  const montar = (rol: Rol, inicio: unknown = null) => render(
    <PaginaDeInicio t={es} yo={{ ...yoDe(rol), persona: { ...persona, inicio } }} lectura={LECTURA} alertas={[]} onIr={() => {}} alGuardar={async () => {}} />,
  );

  it('EL CASO: el cliente, su próximo taller, sus datos y ayuda', () => {
    montar('cliente');
    expect(cuadros()).toEqual(['proximo', 'datos', 'ayuda']);
  });

  it('el equipo y el dueño, el panel primero (con los comprobantes en revisión) y el próximo taller', () => {
    montar('equipo');
    expect(cuadros()).toEqual(['panel', 'proximo']);
    expect(screen.getByText(es('mi.inicio.panel.enRevision', { n: 3 }))).toBeTruthy();
  });

  it('lo guardado pasa por sanear(): un cuadro que no existe se cae, y el del panel no lo ve un cliente aunque esté guardado', () => {
    montar('cliente', { orden: ['ayuda', 'no-existe', 'panel'] });
    expect(cuadros()).toEqual(['ayuda']);
  });

  it('«Ajustar» → «Listo» guarda lo acomodado (Subir y Bajar, sin arrastrar)', async () => {
    const alGuardar = vi.fn(async () => {});
    render(<PaginaDeInicio t={es} yo={yoDe('cliente')} lectura={LECTURA} alertas={[]} onIr={() => {}} alGuardar={alGuardar} />);
    fireEvent.click(screen.getByRole('button', { name: es('inicio.ajustar.accion') }));
    fireEvent.click(screen.getByRole('button', { name: es('inicio.ajustar.bajar', { widget: es('mi.inicio.proximo') }) }));
    fireEvent.click(screen.getByRole('button', { name: es('inicio.ajustar.listo') }));
    await waitFor(() => expect(alGuardar).toHaveBeenCalledWith({ orden: ['datos', 'proximo', 'ayuda'] }));
  });
});

describe('§8 y §9 · Equipo (rescate solo), Papelera y el Centro de alertas', () => {
  it('EL CASO: el dueño ve a su equipo y NO existe «Resetear autenticador» (rescate solo)', async () => {
    falso.respuestas['equipo/miembros'] = { miembros: [
      { id: 'u-yo', nombre: 'Laura', apellido: 'Prueba', email: 'laura@ejemplo.mx', rol: 'dueno', territorio: 'todos', activo: true },
      { id: 'u-gabi', nombre: 'Gabi', apellido: null, email: 'gabi@ejemplo.mx', rol: 'equipo', territorio: 'mexico', activo: true },
    ] };
    render(<PaginaDeEquipo t={es} yo={yoDe('dueno')} onIr={() => {}} alAvisar={() => {}} />);
    expect(await screen.findByText('Gabi')).toBeTruthy();
    expect(screen.queryByRole('button', { name: es('settings.team.reset2fa') })).toBeNull();
    expect(screen.queryByText(es('settings.team.reset2fa'))).toBeNull();
    /* Nadie se suspende a sí mismo. */
    expect(within(document.querySelector('[data-persona="u-yo"]') as HTMLElement).queryByRole('button')).toBeNull();
    fireEvent.click(within(document.querySelector('[data-persona="u-gabi"]') as HTMLElement).getByRole('button', { name: es('settings.team.suspend') }));
    await waitFor(() => expect(falso.pedidos.map((p) => p.ruta)).toContain('equipo/miembros/u-gabi/quitar'));
  });

  it('la Papelera de un cliente está vacía y no le pregunta nada a la API; la del equipo lee y restaura', async () => {
    render(<PaginaDePapelera t={es} yo={yoDe('cliente')} alAvisar={() => {}} />);
    expect(screen.getByText(es('papelera.vacia'))).toBeTruthy();
    expect(falso.pedidos).toEqual([]);
    document.body.innerHTML = '';
    falso.respuestas.papelera = { items: [{ tipo: 'curso', id: 'c-1', nombre: 'Taller viejo', borrado_el: new Date().toISOString(), persona: 'Gabi' }] };
    render(<PaginaDePapelera t={es} yo={yoDe('equipo')} alAvisar={() => {}} />);
    expect(await screen.findByText('Taller viejo')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: es('papelera.restaurar') }));
    await waitFor(() => expect(falso.pedidos).toContainEqual({ ruta: 'papelera/restaurar', cuerpo: { tipo: 'curso', id: 'c-1' } }));
  });

  it('el Centro de alertas: un comprobante rechazado va en «Crítico», con su motivo y la acción a Mis talleres', () => {
    const ir = vi.fn();
    const lectura: Lectura = { ...LECTURA, mios: [{
      referencia: 'AD-0001', inscripto_el: '', curso_titulo: 'El arte de amar', curso_slug: 'el-arte', inicio: '2030-01-01T15:00:00Z',
      fin: '2030-01-01T19:00:00Z', zona: 'America/Merida', sede: null, ciudad: null, estado: 'pendiente_de_pago', motivo_rechazo: 'El monto no coincide.',
    }] };
    render(<PaginaDeAlertas t={es} alertas={alertasTraducidas(es, 'es', yoDe('cliente'), lectura, ir)} />);
    const critico = document.querySelector('[data-columna="critico"]') as HTMLElement;
    expect(within(critico).getByText(es('mi.alertas.rechazado', { taller: 'El arte de amar' }))).toBeTruthy();
    expect(within(critico).getByText('El monto no coincide.')).toBeTruthy();
    fireEvent.click(within(critico).getByRole('button', { name: es('mi.alertas.rechazado.accion') }));
    expect(ir).toHaveBeenCalledWith('/mis-talleres');
  });
});

describe('§5 · en inglés y en portugués: ni un texto en español ni una clave a la vista', () => {
  /* Qué busca: en cada nodo de texto de cada pantalla del molde, (a) una clave
     (`mi.algo`, `settings.algo`…) y (b) un texto de `es/molde.json` que en ese
     idioma es distinto, **igual al nodo entero** (no una subcadena: «Aviso de
     privacidad» está dentro de «Aviso de privacidade»). Qué NO busca: el cuerpo
     de Talleres y del panel (siguen en español, lo declara el informe), los
     datos de la persona, y la lista de Novedades de Acerca de, que es el
     CHANGELOG del molde y existe solo en español (limitación del molde, «a
     decidir» desde su PR 3; va en el informe). */
  const nodos = () => {
    const fuera = new Set([...document.querySelectorAll('li')]);
    const caminante = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const salida: string[] = [];
    for (let n = caminante.nextNode(); n; n = caminante.nextNode()) {
      const padre = n.parentElement;
      if (padre && [...fuera].some((li) => li.contains(padre))) continue;
      const x = (n.textContent ?? '').trim();
      if (x) salida.push(x);
    }
    return salida;
  };
  const CLAVE = /\b(mi|settings|inicio|shell|alertas|papelera|equipo|bienvenida|comun|auth)\.[a-zA-Z]+(\.[a-zA-Z]+)*\b/;
  const ES = Object.values(TEXTOS_DEL_MOLDE.es as Record<string, string>).filter((v) => !/[{*]/.test(v));
  /* Lo que se escribe igual a propósito, por idioma. Sin esta lista explícita,
     «distinto del español» se calculaba comparando los dos archivos, y un texto
     copiado igual al inglés se excluía solo: la mutación no daba rojo. */
  const IGUALES: Record<'en' | 'pt', string[]> = {
    en: ['WhatsApp'],
    pt: ['WhatsApp', 'Cliente', 'país', 'País', 'Ver', 'Curso', 'Restaurado.', 'Este navegador'],
  };

  for (const idioma of ['en', 'pt'] as const) {
    const t = tDelMolde(idioma);
    const enEspanol = ES.filter((v) => !IGUALES[idioma].includes(v));
    const pantallas: Array<[string, () => void]> = [
      ['la barra', () => render(<Esqueleto t={t} yo={yoDe('dueno')} correo="x@y.z" activo="inicio" alertas={1} onIr={() => {}} onSalir={() => {}}><p /></Esqueleto>)],
      ['Inicio', () => render(<PaginaDeInicio t={t} yo={yoDe('cliente')} lectura={LECTURA} alertas={[]} onIr={() => {}} alGuardar={async () => {}} />)],
      ...(['perfil', 'cuenta', 'apariencia', 'idioma', 'notificaciones', 'privacidad', 'taller', 'acerca'] as const).map((s): [string, () => void] => [
        `Ajustes → ${s}`, () => render(<PaginaDeAjustes t={t} yo={yoDe('cliente')} sesion={sesion(false)} seccion={s} onSeccion={() => {}} app={app()} />),
      ]),
      ['la Bienvenida', () => render(<PaginaDeBienvenida t={t} yo={{ ...yoDe('cliente'), persona: { ...persona, apellido: null } }} autenticadorActivo={false} alActivar={() => {}} alTerminar={async () => {}} />)],
      ['la Papelera', () => render(<PaginaDePapelera t={t} yo={yoDe('cliente')} alAvisar={() => {}} />)],
    ];
    for (const [nombre, montar] of pantallas) {
      it(`${idioma} · ${nombre}`, async () => {
        const i18n = (await import('../i18n')).default;
        await i18n.changeLanguage(idioma);
        montar();
        const textos = nodos();
        expect(textos.length, 'la pantalla dibujó algo').toBeGreaterThan(2);
        expect(textos.filter((x) => CLAVE.test(x)), 'una clave a la vista').toEqual([]);
        expect(textos.filter((x) => enEspanol.includes(x)), 'texto en español').toEqual([]);
        await i18n.changeLanguage('es');
      });
    }
  }
});
