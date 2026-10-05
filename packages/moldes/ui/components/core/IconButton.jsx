import React from 'react';
import { Icon } from './Icon.jsx';

const ICONBUTTON_SIZES = { sm: { box: 28, icon: 14 }, md: { box: 32, icon: 16 }, lg: { box: 40, icon: 20 } };

export function IconButton({
  icon, label, variant = 'ghost', size = 'md', disabled = false, active = false, style, ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const s = ICONBUTTON_SIZES[size] || ICONBUTTON_SIZES.md;
  const on = hover && !disabled;
  let bg = 'transparent', fg = 'var(--text-2)', bd = 'transparent';
  if (variant === 'solid') { bg = on ? 'var(--primary-hover)' : 'var(--primary)'; fg = 'var(--on-primary)'; }
  else if (variant === 'outline') { bg = on ? 'var(--surface-2)' : 'var(--surface)'; fg = 'var(--text-2)'; bd = 'var(--border-strong)'; }
  else if (on) { bg = 'var(--surface-2)'; }
  if (active && variant === 'ghost') { bg = 'var(--primary-soft)'; fg = 'var(--primary-text)'; }
  return React.createElement('button', {
    type: 'button', disabled, 'aria-label': label, title: label,
    onMouseEnter: () => setHover(true), onMouseLeave: () => setHover(false),
    style: {
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: s.box + 'px', height: s.box + 'px', padding: 0,
      borderRadius: 'var(--radius-md)', border: 'var(--border-w) solid ' + bd,
      background: bg, color: fg, cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.45 : 1,
      transition: 'background var(--dur-fast) var(--ease-standard), color var(--dur-fast) var(--ease-standard)',
      ...style
    }, ...rest
  }, React.createElement(Icon, { name: icon, size: s.icon }));
}
