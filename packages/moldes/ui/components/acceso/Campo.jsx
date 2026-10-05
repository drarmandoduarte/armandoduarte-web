import React from 'react';

/* El campo de las pantallas del molde (guion §2): etiqueta en mayúsculas
   espaciadas y en el acento, ENCIMA del campo; campo de 56 px, borde fino, radio
   del campo de la app, fondo apenas distinto del de la página (el papel).

   No reemplaza a `Field` + `Input`, que son el campo de trabajo de la app
   (compacto, 32–40 px). Este es el de acceso y ajustes.

   El error va debajo, en el color del error, y además marca `aria-invalid` y
   conecta el mensaje con `aria-describedby`: el color nunca va solo. */
export const Campo = React.forwardRef(function Campo({
  etiqueta, error, id, mono = false, style, estiloCampo, onFocus, onBlur, ...rest
}, ref) {
  const propio = React.useId();
  const idCampo = id || propio;
  const idError = idCampo + '-error';
  const [foco, setFoco] = React.useState(false);
  return React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%', ...style } },
    etiqueta ? React.createElement('label', {
      htmlFor: idCampo,
      style: {
        fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', letterSpacing: 'var(--tracking-rotulo)',
        textTransform: 'uppercase', color: 'var(--primary-text)',
      },
    }, etiqueta) : null,
    React.createElement('input', {
      ref, id: idCampo,
      'aria-invalid': error ? true : undefined,
      'aria-describedby': error ? idError : undefined,
      ...rest,
      onFocus: (e) => { setFoco(true); onFocus && onFocus(e); },
      onBlur: (e) => { setFoco(false); onBlur && onBlur(e); },
      style: {
        width: '100%', height: 56, padding: '0 var(--space-10)',
        fontFamily: mono ? 'var(--font-mono)' : 'var(--font-ui)', fontSize: 'var(--text-lg)',
        letterSpacing: mono ? 'var(--tracking-wide)' : undefined,
        color: 'var(--text)', background: 'var(--surface)',
        border: 'var(--border-w) solid ' + (error ? 'var(--danger)' : foco ? 'var(--primary)' : 'var(--border-strong)'),
        borderRadius: 'var(--radius-campo)', outline: 'none',
        transition: 'border-color var(--dur-fast) var(--ease-standard)',
        ...estiloCampo,
      },
    }),
    error ? React.createElement('p', { id: idError, role: 'alert', style: { fontSize: 'var(--text-sm)', color: 'var(--danger-text)' } }, error) : null);
});
