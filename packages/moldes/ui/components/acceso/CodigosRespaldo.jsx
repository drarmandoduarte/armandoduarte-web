import React from 'react';
import { Icon } from '../core/Icon.jsx';
import { Boton } from './Boton.jsx';

/* Los 10 códigos de respaldo (guion P5): dos columnas monoespaciadas, tres
   botones chicos —Descargar · Copiar · Compartir— y «LISTO, LOS GUARDÉ»
   deshabilitado hasta que se use uno de los tres. No se vuelven a mostrar, así
   que el botón de salida no se habilita por pasar el tiempo: se habilita cuando
   hay prueba de que se guardaron en algún lado.

   «Compartir» aparece solo donde el aparato sabe compartir (`navigator.share`).
   El archivo que se descarga es texto plano, un código por renglón: es lo que
   cualquier persona puede abrir dentro de un año sin la app. */

function accionChica(icono, texto, onClick) {
  return React.createElement('button', {
    type: 'button', onClick,
    style: {
      display: 'inline-flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) var(--space-6)',
      fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--text-2)', background: 'transparent',
      border: 'var(--border-w) solid var(--border-strong)', borderRadius: 'var(--radius-boton)', cursor: 'pointer',
    },
  }, React.createElement(Icon, { name: icono, size: 14, 'aria-hidden': true }), texto);
}

export function CodigosRespaldo({ codigos = [], textos = {}, nombreArchivo = 'respaldo-2fa.txt', onListo, style, ...rest }) {
  const [guardados, setGuardados] = React.useState(false);
  const comoTexto = codigos.join('\n');
  const puedeCompartir = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const descargar = () => {
    const url = URL.createObjectURL(new Blob([comoTexto + '\n'], { type: 'text/plain' }));
    const a = document.createElement('a');
    a.href = url; a.download = nombreArchivo; a.click();
    URL.revokeObjectURL(url);
    setGuardados(true);
  };
  const copiar = async () => {
    try { await navigator.clipboard.writeText(comoTexto); setGuardados(true); } catch { /* sin permiso: no cuenta como guardado */ }
  };
  const compartir = async () => {
    try { await navigator.share({ text: comoTexto }); setGuardados(true); } catch { /* cancelado: no cuenta */ }
  };

  return React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 'var(--space-12)', ...style }, ...rest },
    React.createElement('ol', {
      style: {
        listStyle: 'none', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4) var(--space-16)',
        padding: 'var(--space-12)', background: 'var(--surface)', border: 'var(--border-w) solid var(--border)',
        borderRadius: 'var(--radius-tarjeta)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-lg)',
        letterSpacing: 'var(--tracking-wide)', color: 'var(--text)', textAlign: 'center',
      },
    }, codigos.map((c) => React.createElement('li', { key: c }, c))),
    React.createElement('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)', justifyContent: 'center' } },
      accionChica('download', textos.descargar, descargar),
      accionChica('copy', textos.copiar, copiar),
      puedeCompartir ? accionChica('share-2', textos.compartir, compartir) : null),
    React.createElement(Boton, { ancho: 'completo', disabled: !guardados, onClick: onListo }, textos.listo));
}
