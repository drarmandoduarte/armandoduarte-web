import React from 'react';
import { Boton } from '../acceso/Boton.jsx';
import { OtpInput } from '../acceso/OtpInput.jsx';

/* Lo que el asistente muestra ANTES de hacer algo (concepto del Asistente §7):
   «Voy a {acción}», la vista previa de lo que va a quedar, y Confirmar / No. Si
   la acción no se deshace, pide además el código del autenticador, con la misma
   casilla de 6 huecos de siempre.

   El asistente nunca hace sin esta tarjeta. Confirmar se habilita con el código
   completo cuando es irreversible; el código lo verifica el servidor. */
export function TarjetaConfirmacion({ accion, vista, irreversible = false, textos = {}, onConfirmar, onCancelar, cargando = false, style, ...rest }) {
  const [codigo, setCodigo] = React.useState('');
  return React.createElement('div', {
    role: 'group', 'aria-label': typeof accion === 'string' ? accion : undefined,
    style: {
      display: 'flex', flexDirection: 'column', gap: 'var(--space-8)', padding: 'var(--space-10)',
      background: 'var(--surface)', border: 'var(--border-w) solid var(--primary-linea)', borderRadius: 'var(--radius-tarjeta)',
      ...style,
    },
    ...rest,
  },
  React.createElement('p', { style: { fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-medium)' } }, accion),
  vista ? React.createElement('div', {
    style: { padding: 'var(--space-8)', background: 'var(--surface-2)', borderRadius: 'var(--radius-campo)', fontSize: 'var(--text-md)', color: 'var(--text-2)' },
  }, vista) : null,
  irreversible ? React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' } },
    React.createElement('span', { style: { fontSize: 'var(--text-xs)', letterSpacing: 'var(--tracking-rotulo)', textTransform: 'uppercase', color: 'var(--primary-text)' } }, textos.codigo),
    React.createElement(OtpInput, { value: codigo, onChange: setCodigo, 'aria-label': typeof textos.codigo === 'string' ? textos.codigo : undefined })) : null,
  React.createElement('div', { style: { display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap' } },
    React.createElement(Boton, { disabled: irreversible && codigo.length !== 6, cargando, onClick: () => onConfirmar && onConfirmar(irreversible ? codigo : undefined) }, textos.confirmar),
    React.createElement(Boton, { variante: 'secundario', onClick: onCancelar }, textos.no)));
}
