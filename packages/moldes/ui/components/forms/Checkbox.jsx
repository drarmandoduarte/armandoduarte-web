import React from 'react';
import { Icon } from '../core/Icon.jsx';

export function Checkbox({ label, description, checked, defaultChecked, onChange, disabled = false, id, style, ...rest }) {
  const isControlled = checked !== undefined;
  const [internal, setInternal] = React.useState(!!defaultChecked);
  const on = isControlled ? checked : internal;
  const autoId = React.useId();
  const cbId = id || autoId;
  return React.createElement('label', {
    htmlFor: cbId,
    style: { display: 'inline-flex', alignItems: 'flex-start', gap: 'var(--space-5)', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, ...style }
  },
    React.createElement('input', {
      key: 'i', id: cbId, type: 'checkbox', checked: on, disabled,
      onChange: (e) => { if (!isControlled) setInternal(e.target.checked); onChange && onChange(e); },
      style: { position: 'absolute', opacity: 0, width: 0, height: 0 }, ...rest
    }),
    React.createElement('span', {
      key: 'b', 'aria-hidden': true,
      style: {
        flex: '0 0 auto', width: '17px', height: '17px', marginTop: '1px',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 'var(--radius-xs)',
        border: 'var(--border-w) solid ' + (on ? 'var(--primary)' : 'var(--border-strong)'),
        background: on ? 'var(--primary)' : 'var(--surface)', color: 'var(--on-primary)',
        transition: 'background var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard)'
      }
    }, on && React.createElement(Icon, { name: 'check', size: 12, strokeWidth: 2.25 })),
    (label || description) && React.createElement('span', { key: 't', style: { minWidth: 0 } },
      label && React.createElement('span', { key: 'a', style: { display: 'block', fontSize: 'var(--text-md)', color: 'var(--text)', lineHeight: 'var(--leading-snug)' } }, label),
      description && React.createElement('span', { key: 'd', style: { display: 'block', marginTop: '2px', fontSize: 'var(--text-xs)', color: 'var(--text-3)', lineHeight: 'var(--leading-snug)' } }, description)
    )
  );
}
