import React from 'react';
import { Field } from './Field.jsx';

export function Textarea({ label, hint, error, required, id, rows = 4, disabled = false, style, containerStyle, ...rest }) {
  const [focus, setFocus] = React.useState(false);
  const autoId = React.useId();
  const taId = id || autoId;
  return React.createElement(Field, { label, hint, error, required, htmlFor: taId, style: containerStyle },
    React.createElement('textarea', {
      id: taId, rows, disabled,
      onFocus: () => setFocus(true), onBlur: () => setFocus(false),
      style: {
        width: '100%', padding: 'var(--space-5) var(--space-5)', resize: 'vertical',
        background: disabled ? 'var(--surface-2)' : 'var(--surface)', color: 'var(--text)',
        fontFamily: 'var(--font-ui)', fontSize: 'var(--text-md)', lineHeight: 'var(--leading-normal)',
        border: 'var(--border-w) solid ' + (error ? 'var(--danger)' : focus ? 'var(--primary)' : 'var(--border-strong)'),
        borderRadius: 'var(--radius-campo)', outline: 'none',
        transition: 'border-color var(--dur-fast) var(--ease-standard)', ...style
      }, ...rest
    })
  );
}
