import React from 'react';
import { inicialesDeNombre } from './iniciales.js';

/* La cara de quien trabaja en la cuenta, o sus iniciales.

   ── Por qué el respaldo va en relleno pleno ─────────────────────────────────
   Porque el respaldo no se viste igual, y la diferencia es de rol, no de gusto.
   El avatar de un cliente final cae en suave: hay muchos por pantalla —una agenda, un
   tablero, una lista de doscientas fichas— y veinte círculos de relleno pleno
   serían veinte manchas. Los del equipo son diez en toda la cuenta y cada
   uno encabeza una tarjeta: ahí el acento pleno de la app es lo que hace que
   una ficha de persona se lea como una presentación y no como una fila de
   admin.

   **Las iniciales no son un dato que falta: son una identidad.** Por eso ocupan
   exactamente el mismo círculo que la foto, con el mismo lado. Un hueco gris con
   forma de foto sí se leería como algo pendiente de completar.

   ── El acento de noche ─────────────────────────────────────────────────────
   De noche `--primary` suele ser un acento claro —figura— y `--on-primary` la
   tinta oscura que mejor se lee encima (la elige el resolver, midiendo). El
   avatar ES la figura, así que no contradice «el acento de noche es figura,
   nunca fondo». El contraste está medido, contra todos los `design.json` de
   muestra, en `avatar-persona.test.js`.

   `alt` vacío y `aria-hidden` en las iniciales a propósito: el nombre está
   escrito al lado en las tres pantallas que usan esto, y leerlo dos veces es
   ruido para quien navega con lector de pantalla. */

const TIPOGRAFIA = { 32: 'var(--text-xs)', 40: 'var(--text-sm)', 48: 'var(--text-md)', 72: 'var(--text-xl)', 88: 'var(--text-2xl)' };

export function AvatarPersona({ nombre = '', fotoUrl, size = 48, style, ...rest }) {
  const [rota, setRota] = React.useState(false);
  React.useEffect(() => { setRota(false); }, [fotoUrl]);

  const caja = {
    width: size, height: size, flex: 'none', borderRadius: 'var(--radius-pill)',
    overflow: 'hidden', display: 'grid', placeItems: 'center', ...style,
  };

  /* Una URL que ya no responde —el archivo borrado a mano, la cuenta sin
     conexión— cae en las iniciales en vez de dejar el marco vacío. */
  if (fotoUrl && !rota) {
    return React.createElement('span', { style: caja, ...rest },
      React.createElement('img', {
        src: fotoUrl, alt: '', width: size, height: size, loading: 'lazy',
        onError: () => setRota(true),
        style: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
      }));
  }

  return React.createElement('span', {
    'aria-hidden': 'true',
    style: {
      ...caja,
      background: 'var(--primary)',
      color: 'var(--on-primary)',
      fontFamily: 'var(--font-ui)',
      fontSize: TIPOGRAFIA[size] || 'var(--text-sm)',
      fontWeight: 'var(--weight-semibold)',
      letterSpacing: '0.02em',
      lineHeight: 1,
    },
    ...rest,
  }, inicialesDeNombre(nombre));
}
