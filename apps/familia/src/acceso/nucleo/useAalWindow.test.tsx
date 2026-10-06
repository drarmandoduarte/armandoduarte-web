// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import {
  clearAalWindow,
  consumeSesionDesaparecida,
  isAalWindowExpired,
  marcarSalidaDeliberada,
  markAalWindowVerified,
  useAalWindow,
} from './useAalWindow';
import { clave } from './nombres';

const VERIFIED_KEY = clave('aal2_verified_at');
const ACTIVITY_KEY = clave('last_activity_at');

function setWindow(verifiedAt: Date, activityMs: number) {
  localStorage.setItem(VERIFIED_KEY, verifiedAt.toISOString());
  localStorage.setItem(ACTIVITY_KEY, String(activityMs));
}

describe('isAalWindowExpired', () => {
  beforeEach(() => clearAalWindow());

  it('sin marcador → vencida', () => {
    expect(isAalWindowExpired(new Date())).toBe(true);
  });

  it('verificada hoy y con actividad reciente → vigente', () => {
    const now = new Date('2026-07-08T15:00:00');
    setWindow(now, now.getTime());
    expect(isAalWindowExpired(now)).toBe(false);
  });

  it('cruce de día calendario con actividad reciente → NO vence (solo cuenta la inactividad)', () => {
    const verified = new Date('2026-07-07T23:50:00');
    setWindow(verified, verified.getTime());
    // 20 min después, ya en el día siguiente: sigue vigente (actividad < 30 min).
    const nextDay = new Date('2026-07-08T00:10:00');
    expect(isAalWindowExpired(nextDay)).toBe(false);
  });

  it('más de 30 min de inactividad (mismo día) → vencida', () => {
    const now = new Date('2026-07-08T15:31:00');
    const verified = new Date('2026-07-08T15:00:00');
    setWindow(verified, verified.getTime()); // actividad hace 31 min
    expect(isAalWindowExpired(now)).toBe(true);
  });

  it('actividad hace 29 min el mismo día → vigente', () => {
    const now = new Date('2026-07-08T15:29:00');
    const verified = new Date('2026-07-08T15:00:00');
    setWindow(verified, verified.getTime()); // actividad hace 29 min
    expect(isAalWindowExpired(now)).toBe(false);
  });
});

/** Sonda mínima: pinta si la ventana está vencida, según el hook. */
function Sonda() {
  const { expired } = useAalWindow();
  return <p>{expired ? 'vencida' : 'vigente'}</p>;
}

/**
 * CELULAR — el temporizador de 60 s no corre con la pantalla apagada ni con la
 * app en segundo plano. Si el hook se apoyara en él, alguien podía dejar el
 * teléfono media hora bloqueado y encontrar la app abierta al volver. Acá se
 * simula exactamente eso: la hora avanza 31 minutos SIN que corra ningún
 * temporizador, y al volver a primer plano la ventana tiene que estar vencida en
 * el acto.
 */
describe('useAalWindow — volver a primer plano en el celular', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers({ shouldAdvanceTime: false });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('31 minutos con la pantalla apagada → al volver, vencida en el acto', async () => {
    vi.setSystemTime(new Date('2026-09-28T10:00:00'));
    markAalWindowVerified();

    render(<Sonda />);
    expect(screen.getByText('vigente')).toBeTruthy();

    // La pantalla se apaga. Pasa el tiempo real, pero NINGÚN temporizador corre:
    // el celular los congela. `setSystemTime` adelanta el reloj sin disparar nada.
    act(() => {
      vi.setSystemTime(new Date('2026-09-28T10:31:00'));
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(screen.getByText('vencida')).toBeTruthy();
  });

  it('pageshow (caché de páginas de iOS) también recalcula', () => {
    vi.setSystemTime(new Date('2026-09-28T10:00:00'));
    markAalWindowVerified();
    render(<Sonda />);
    expect(screen.getByText('vigente')).toBeTruthy();

    act(() => {
      vi.setSystemTime(new Date('2026-09-28T10:31:00'));
      window.dispatchEvent(new Event('pageshow'));
    });

    expect(screen.getByText('vencida')).toBeTruthy();
  });
});

/**
 * La sesión que se cae sola (iPhone borra el almacenamiento de una app web sin
 * abrir por siete días; o el refresh token vence). No es un error: se avisa.
 */
describe('sesión desaparecida sin que nadie la cerrara', () => {
  beforeEach(() => localStorage.clear());

  it('hubo sesión y ya no hay → se avisa, una sola vez', () => {
    markAalWindowVerified();
    expect(consumeSesionDesaparecida()).toBe(true);
    expect(consumeSesionDesaparecida()).toBe(false);
  });

  it('salida deliberada (botón "cerrar sesión") → NO se avisa', () => {
    markAalWindowVerified();
    marcarSalidaDeliberada();
    expect(consumeSesionDesaparecida()).toBe(false);
  });

  it('clearAalWindow NO borra la huella: cerrar la ventana no es cerrar la sesión', () => {
    markAalWindowVerified();
    clearAalWindow();
    expect(consumeSesionDesaparecida()).toBe(true);
  });

  it('sin sesión previa en este aparato → no se avisa nada', () => {
    expect(consumeSesionDesaparecida()).toBe(false);
  });
});
