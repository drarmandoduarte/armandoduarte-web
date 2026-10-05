import React from 'react';
import { Field } from './Field.jsx';
import { Icon } from '../core/Icon.jsx';

export function Input({
  label, hint, error, required, icon, trailing, id, disabled = false, pill = false, style, containerStyle, ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const autoId = React.useId();
  const inputId = id || autoId;
  /* Un campo numérico no dibuja las flechitas del navegador. La
     regla vive en `tokens/base.css` —son pseudo-elementos, y eso no se puede
     decir con estilo en línea— y la clase la pone la pieza, nunca la pantalla:
     así las veintiocho de la app quedaron arregladas sin tocar un call site, y
     la número veintinueve nace bien sin que nadie se acuerde.
     Se compone con lo que venga de afuera en vez de pisarlo: hoy ninguna
     pantalla le pasa `className` a un `Input`, y el día que alguna lo haga no
     tiene que elegir entre su clase y esta. */
  const clases = [rest.type === 'number' ? 'molde-sin-flechas' : null, rest.className]
    .filter(Boolean).join(' ') || undefined;
  const box = {
      width: '100%', minHeight: 'var(--control-h)', padding: '0 var(--space-5)',
      background: disabled ? 'var(--surface-2)' : 'var(--surface)',
      color: 'var(--text)', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-md)',
      border: 'var(--border-w) solid ' + (error ? 'var(--danger)' : focus ? 'var(--primary)' : 'var(--border-strong)'),
      borderRadius: pill ? 'var(--radius-boton)' : 'var(--radius-campo)', outline: 'none',
      transition: 'border-color var(--dur-fast) var(--ease-standard)',
      cursor: disabled ? 'not-allowed' : undefined
    };
  return React.createElement(Field, { label, hint, error, required, htmlFor: inputId, style: containerStyle },
    React.createElement('div', { style: { position: 'relative', display: 'flex', alignItems: 'center' } },
      icon && React.createElement('span', {
        key: 'i', style: { position: 'absolute', left: 'var(--space-5)', color: 'var(--text-3)', pointerEvents: 'none' }
      }, React.createElement(Icon, { name: icon, size: 14 })),
      React.createElement('input', {
        key: 'f', id: inputId, disabled,
        onFocus: () => setFocus(true), onBlur: () => setFocus(false),
        style: { ...box, paddingLeft: icon ? '30px' : box.padding.split(' ')[1], paddingRight: trailing ? '34px' : undefined, ...style },
        ...rest,
        className: clases
      }),
      trailing && React.createElement('span', {
        key: 't', style: { position: 'absolute', right: 'var(--space-4)', color: 'var(--text-3)', display: 'flex' }
      }, trailing)
    )
  );
}
