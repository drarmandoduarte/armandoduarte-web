import React from 'react';

export function Tooltip({ label, placement = 'top', children, style, ...rest }) {
  const [open, setOpen] = React.useState(false);
  const pos = {
    top: { bottom: '100%', left: '50%', transform: 'translate(-50%,-6px)' },
    bottom: { top: '100%', left: '50%', transform: 'translate(-50%,6px)' },
    left: { right: '100%', top: '50%', transform: 'translate(-6px,-50%)' },
    right: { left: '100%', top: '50%', transform: 'translate(6px,-50%)' }
  }[placement];
  return React.createElement('span', {
    style: { position: 'relative', display: 'inline-flex', ...style },
    onMouseEnter: () => setOpen(true), onMouseLeave: () => setOpen(false),
    onFocus: () => setOpen(true), onBlur: () => setOpen(false), ...rest
  },
    children,
    open && React.createElement('span', {
      role: 'tooltip',
      style: {
        position: 'absolute', zIndex: 50, ...pos,
        padding: '4px 8px', background: 'var(--tooltip-bg, var(--text))', color: 'var(--tooltip-fg, var(--text-inverse))',
        border: 'var(--border-w) solid var(--float-border-tone, transparent)',
        borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)',
        whiteSpace: 'nowrap', boxShadow: 'var(--shadow-pop)', pointerEvents: 'none'
      }
    }, label)
  );
}
