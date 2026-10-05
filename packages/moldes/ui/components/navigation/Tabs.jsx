import React from 'react';
import { Icon } from '../core/Icon.jsx';
import { Badge } from '../core/Badge.jsx';

export function Tabs({ items = [], value, defaultValue, onChange, style, ...rest }) {
  const isControlled = value !== undefined;
  const [internal, setInternal] = React.useState(defaultValue || (items[0] && items[0].value));
  const active = isControlled ? value : internal;
  const select = (v) => { if (!isControlled) setInternal(v); onChange && onChange(v); };
  return React.createElement('div', {
    role: 'tablist',
    style: { display: 'flex', alignItems: 'stretch', gap: 'var(--space-8)', borderBottom: 'var(--border-w) solid var(--border)', overflowX: 'auto', ...style },
    ...rest
  }, items.map((it) => {
    const on = it.value === active;
    return React.createElement('button', {
      key: it.value, role: 'tab', 'aria-selected': on, type: 'button',
      onClick: () => select(it.value),
      style: {
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: 'var(--space-5) 2px', background: 'none', border: 'none',
        borderBottom: '2px solid ' + (on ? 'var(--primary)' : 'transparent'),
        marginBottom: '-1px', color: on ? 'var(--text)' : 'var(--text-3)',
        fontFamily: 'var(--font-ui)', fontSize: 'var(--text-md)',
        fontWeight: on ? 'var(--weight-semibold)' : 'var(--weight-medium)',
        whiteSpace: 'nowrap', cursor: 'pointer',
        transition: 'color var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard)'
      }
    },
      it.icon && React.createElement(Icon, { key: 'i', name: it.icon, size: 14 }),
      it.label,
      it.count != null && React.createElement(Badge, { key: 'c', tone: on ? 'primary' : 'neutral', count: it.count })
    );
  }));
}
