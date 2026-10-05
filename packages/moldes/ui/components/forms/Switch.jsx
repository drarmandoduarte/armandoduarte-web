import React from 'react';

export function Switch({ label, description, checked, defaultChecked, onChange, disabled = false, id, style, ...rest }) {
  const isControlled = checked !== undefined;
  const [internal, setInternal] = React.useState(!!defaultChecked);
  const on = isControlled ? checked : internal;
  const autoId = React.useId();
  const sId = id || autoId;
  return React.createElement('label', {
    htmlFor: sId,
    style: { display: 'inline-flex', alignItems: 'center', gap: 'var(--space-6)', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, ...style }
  },
    React.createElement('input', {
      key: 'i', id: sId, type: 'checkbox', role: 'switch', checked: on, disabled,
      onChange: (e) => { if (!isControlled) setInternal(e.target.checked); onChange && onChange(e); },
      style: { position: 'absolute', opacity: 0, width: 0, height: 0 }, ...rest
    }),
    React.createElement('span', {
      key: 'b', 'aria-hidden': true,
      style: {
        flex: '0 0 auto', width: '36px', height: '20px', padding: '2px', borderRadius: 'var(--radius-pill)',
        background: on ? 'var(--primary)' : 'var(--border-strong)',
        display: 'inline-flex', alignItems: 'center',
        transition: 'background var(--dur-fast) var(--ease-standard)'
      }
    }, React.createElement('span', {
      style: {
        width: '16px', height: '16px', borderRadius: '50%', background: 'var(--surface)',
        transform: on ? 'translateX(16px)' : 'translateX(0)',
        transition: 'transform var(--dur-fast) var(--ease-standard)'
      }
    })),
    (label || description) && React.createElement('span', { key: 't', style: { minWidth: 0 } },
      label && React.createElement('span', { key: 'a', style: { display: 'block', fontSize: 'var(--text-md)', color: 'var(--text)', lineHeight: 'var(--leading-snug)' } }, label),
      description && React.createElement('span', { key: 'd', style: { display: 'block', marginTop: '2px', fontSize: 'var(--text-xs)', color: 'var(--text-3)', lineHeight: 'var(--leading-snug)' } }, description)
    )
  );
}
