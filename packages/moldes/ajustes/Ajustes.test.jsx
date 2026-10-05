// @vitest-environment jsdom
/**
 * La pantalla de Ajustes armada: escritorio, celular, «Guardado», el botón que
 * se habilita solo cuando algo cambió, lo que ve cada rol y Novedades.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import React from 'react';
import { crearT } from '@moldes/idiomas';
import { Ajustes } from './Ajustes.jsx';

const t = crearT({ comunes: { app: 'Rivera' } });
const DUENO = { manda: true, equipo: true, dueno: true };
const RECEPCION = { manda: false, equipo: true };

function ventana(ancho) {
  window.matchMedia = (q) => ({
    matches: /max-width: 599px/.test(q) ? ancho < 600 : false,
    addEventListener() {}, removeEventListener() {},
  });
}

function Armado({ ctx = DUENO, config = {}, valores = {}, acciones = {}, inicial = 'perfil' }) {
  const [s, setS] = React.useState(inicial);
  return <Ajustes t={t} appNombre="Rivera" ctx={ctx} config={config} valores={valores} acciones={acciones} seccion={s} onSeccion={setS} />;
}

beforeEach(() => ventana(1440));
afterEach(cleanup);

describe('escritorio', () => {
  it('la cabecera del molde, el riel con los dos grupos y la sección activa', () => {
    render(<Armado />);
    expect(screen.getByText('§ · ', { exact: false }).textContent).toContain('Configuración');
    const riel = screen.getByRole('tablist');
    expect(within(riel).getByText('Tú')).toBeTruthy();
    expect(within(riel).getByText('Rivera')).toBeTruthy();
    expect(within(riel).getByRole('tab', { name: 'Perfil' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Perfil.');
  });

  it('tocar una sección la abre', () => {
    render(<Armado />);
    fireEvent.click(screen.getByRole('tab', { name: 'Apariencia' }));
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Apariencia.');
    expect(screen.getByText('Claro, oscuro, o el que use tu aparato.')).toBeTruthy();
  });

  it('un id viejo (?s=seguridad) aterriza en Cuenta y seguridad', () => {
    render(<Armado inicial="seguridad" />);
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Cuenta y seguridad.');
  });

  it('quien no manda no ve Datos ni Plan', () => {
    render(<Armado ctx={RECEPCION} />);
    const riel = screen.getByRole('tablist');
    expect(within(riel).queryByRole('tab', { name: 'Datos' })).toBeNull();
    expect(within(riel).queryByRole('tab', { name: 'Plan y facturación' })).toBeNull();
    expect(within(riel).queryByText('Rivera')).toBeNull();
  });
});

describe('celular: la lista primero, la sección después', () => {
  beforeEach(() => ventana(390));

  it('sin sección pedida, se ve la lista', () => {
    render(<Armado inicial={null} />);
    expect(screen.getByRole('tablist')).toBeTruthy();
    expect(screen.queryByRole('heading', { level: 2 })).toBeNull();
  });

  it('al tocar una, entra con «← Ajustes» arriba, y volver lleva a la lista', () => {
    render(<Armado inicial={null} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Idioma' }));
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Idioma.');
    expect(screen.queryByRole('tablist')).toBeNull();
    fireEvent.click(screen.getByText('← Ajustes'));
    expect(screen.getByRole('tablist')).toBeTruthy();
  });
});

describe('guardar', () => {
  it('«Guardado» aparece cuando la app confirmó, no antes', async () => {
    let resolver;
    const cambiarTema = vi.fn(() => new Promise((r) => { resolver = r; }));
    render(<Armado inicial="apariencia" acciones={{ cambiarTema }} valores={{ tema: 'claro' }} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Oscuro' }));
    expect(cambiarTema).toHaveBeenCalledWith('oscuro');
    expect(screen.queryByText('Guardado')).toBeNull();
    await act(async () => { resolver(); });
    expect(screen.getByText('Guardado')).toBeTruthy();
  });

  it('el botón GUARDAR del nombre se habilita solo cuando algo cambió', async () => {
    const guardarNombre = vi.fn(() => Promise.resolve());
    render(<Armado acciones={{ guardarNombre }} valores={{ perfil: { nombre: 'Ana' } }} />);
    const boton = screen.getByRole('button', { name: 'Guardar' });
    expect(boton.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Ana Rivas' } });
    expect(boton.disabled).toBe(false);
    await act(async () => { fireEvent.click(boton); });
    expect(guardarNombre).toHaveBeenCalledWith('Ana Rivas');
  });
});

describe('Cuenta y seguridad', () => {
  const valores = { correo: 'ana@x.uy', totp: { activo: true, fecha: '3/10' }, respaldoQuedan: 7, aparatos: [{ id: 'a', nombre: 'Mac', este: true }, { id: 'b', nombre: 'iPhone', ultima: 'ayer' }] };

  it('el correo está acá y no en Perfil (reglas-pr-3 §3)', () => {
    render(<Armado inicial="cuenta" valores={valores} />);
    expect(screen.getByDisplayValue('ana@x.uy')).toBeTruthy();
    cleanup(); render(<Armado inicial="perfil" valores={valores} />);
    expect(screen.queryByDisplayValue('ana@x.uy')).toBeNull();
  });

  it('el autenticador dice obligatorio al equipo y opcional al cliente', () => {
    render(<Armado inicial="cuenta" valores={valores} ctx={RECEPCION} />);
    expect(screen.getByText('Activado el 3/10. Es obligatorio para tu rol y no se puede desactivar.')).toBeTruthy();
    cleanup(); render(<Armado inicial="cuenta" valores={valores} ctx={{ manda: false, equipo: false }} />);
    expect(screen.getByText('Activado el 3/10. Puedes desactivarlo con un código del autenticador.')).toBeTruthy();
  });

  it('Actividad solo para quien manda; los aparatos con «Este aparato» marcado', () => {
    render(<Armado inicial="cuenta" valores={valores} acciones={{ abrirActividad: () => {} }} />);
    expect(screen.getByText('Actividad')).toBeTruthy();
    expect(screen.getByText('Este aparato')).toBeTruthy();
    expect(screen.getByText('Te quedan 7 de 10. Verlos pide el código del autenticador.')).toBeTruthy();
    cleanup(); render(<Armado inicial="cuenta" valores={valores} ctx={RECEPCION} />);
    expect(screen.queryByText('Actividad')).toBeNull();
  });
});

describe('Notificaciones: la hora del resumen', () => {
  it('aparece con las 8:00 por defecto, y se va si el resumen pasa a «No»', async () => {
    const cambiarResumen = vi.fn(() => Promise.resolve());
    render(<Armado inicial="notificaciones" acciones={{ cambiarResumen, cambiarHoraResumen: () => Promise.resolve() }} />);
    expect(screen.getByText('A qué hora')).toBeTruthy();
    expect(screen.getByText('Hora local. Si no la cambias, a las 8:00.')).toBeTruthy();
    expect(screen.getByDisplayValue('08:00')).toBeTruthy();
    await act(async () => { fireEvent.click(screen.getByRole('radio', { name: 'No' })); });
    expect(cambiarResumen).toHaveBeenCalledWith('no');
    expect(screen.queryByText('A qué hora')).toBeNull();
  });
});

describe('Privacidad y Acerca de', () => {
  it('borrar la cuenta va en la zona peligrosa, con la palabra', () => {
    render(<Armado inicial="privacidad" acciones={{ borrarCuenta: () => {}, exportar: () => {} }} />);
    expect(screen.getByText('§ · ', { selector: 'section p', exact: false }).textContent).toContain('Zona peligrosa');
    fireEvent.click(screen.getAllByRole('button', { name: 'Borrar mi cuenta' }).at(-1));
    expect(screen.getByText('Escribe BORRAR para confirmar')).toBeTruthy();
  });

  it('Novedades sale del CHANGELOG', () => {
    render(<Armado inicial="acerca" config={{ changelog: '## 1.2.0 · 3/10/2026\n- Ahora se paga por transferencia.\n', version: { numero: '1.2.0', fecha: '3/10/2026' } }} />);
    expect(screen.getByText('Ahora se paga por transferencia.')).toBeTruthy();
    expect(screen.getByText('Versión 1.2.0 · 3/10/2026')).toBeTruthy();
  });
});
