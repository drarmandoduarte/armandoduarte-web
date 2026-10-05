import React from 'react';
import { Antetitulo } from '../acceso/Antetitulo.jsx';
import { Boton } from '../acceso/Boton.jsx';
import { Campo } from '../acceso/Campo.jsx';
import { OtpInput } from '../acceso/OtpInput.jsx';

/* La zona peligrosa (guion de Ajustes §2): un bloque con borde del error al
   final de la sección que corresponda. Cada acción se abre en dos pasos: el
   botón despliega la confirmación, que pide escribir una palabra (BORRAR) y, si
   la acción es irreversible, el código del autenticador. «Confirmar» se habilita
   solo cuando las dos cosas están.

   La palabra se compara sin distinguir mayúsculas y sin espacios de los bordes:
   lo que se pide es intención, no ortografía. El código no se verifica acá —eso
   es del servidor—: se entrega en `onConfirmar(codigo)`. */
export function ZonaPeligrosa({
  antetitulo, nombre, explicacion, palabra, irreversible = true, textos = {},
  onConfirmar, cargando = false, style, ...rest
}) {
  const [abierta, setAbierta] = React.useState(false);
  const [escrito, setEscrito] = React.useState('');
  const [codigo, setCodigo] = React.useState('');
  const palabraOk = escrito.trim().toLowerCase() === String(palabra || '').trim().toLowerCase() && escrito.trim() !== '';
  const codigoOk = !irreversible || codigo.length === 6;
  const cerrar = () => { setAbierta(false); setEscrito(''); setCodigo(''); };

  return React.createElement('section', {
    style: {
      display: 'flex', flexDirection: 'column', gap: 'var(--space-8)', padding: 'var(--space-12)',
      border: 'var(--border-w) solid var(--danger)', borderRadius: 'var(--radius-tarjeta)', ...style,
    },
    ...rest,
  },
  antetitulo ? React.createElement(Antetitulo, { texto: antetitulo, style: { color: 'var(--danger-text)' } }) : null,
  React.createElement('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-8)' } },
    React.createElement('div', { style: { flex: '1 1 16rem', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' } },
      React.createElement('span', { style: { fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-medium)' } }, nombre),
      explicacion ? React.createElement('span', { style: { fontSize: 'var(--text-md)', color: 'var(--text-3)' } }, explicacion) : null),
    abierta ? null : React.createElement(Boton, { variante: 'peligro', onClick: () => setAbierta(true) }, textos.abrir)),
  abierta ? React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 'var(--space-10)' } },
    React.createElement(Campo, { etiqueta: textos.escribiPalabra, value: escrito, onChange: (e) => setEscrito(e.target.value), autoComplete: 'off', autoFocus: true }),
    irreversible ? React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' } },
      React.createElement('span', { style: { fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', letterSpacing: 'var(--tracking-rotulo)', textTransform: 'uppercase', color: 'var(--primary-text)' } }, textos.codigo),
      React.createElement(OtpInput, { value: codigo, onChange: setCodigo, 'aria-label': typeof textos.codigo === 'string' ? textos.codigo : undefined, style: { justifyContent: 'flex-start' } })) : null,
    React.createElement('div', { style: { display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap' } },
      React.createElement(Boton, {
        variante: 'peligro', disabled: !(palabraOk && codigoOk), cargando,
        onClick: () => onConfirmar && onConfirmar(irreversible ? codigo : undefined),
      }, textos.confirmar),
      React.createElement(Boton, { variante: 'secundario', onClick: cerrar }, textos.cancelar))) : null);
}
