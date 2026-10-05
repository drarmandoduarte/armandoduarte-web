import React from 'react';

const BUTTON_SIZES = {
  sm: { h: 32, px: 14, fs: 'var(--text-sm)', gap: 6 },
  md: { h: 40, px: 18, fs: 'var(--text-md)', gap: 8 },
  lg: { h: 48, px: 22, fs: 'var(--text-lg)', gap: 9 }
};

function palette(variant, hover) {
  switch (variant) {
    case 'secondary':
      return { background: hover ? 'var(--primary-soft)' : 'transparent', color: 'var(--primary-text)', borderColor: 'var(--primary)' };
    // El fantasma con su caja dibujada. Es para el control que ES una acción
    // pero no es del negocio de la pantalla —ajustar el Inicio, no atender un
    // persona—: no puede gastar el acento, que es el color de lo que la app
    // hace, y tampoco puede quedarse sin caja al lado de dos hermanos que la
    // tienen. Mismo material que el `outline` de IconButton, que ya existía.
    case 'tertiary':
      return { background: hover ? 'var(--surface-2)' : 'transparent', color: 'var(--text-2)', borderColor: 'var(--border-strong)' };
    case 'ghost':
      return { background: hover ? 'var(--surface-2)' : 'transparent', color: 'var(--text-2)', borderColor: 'transparent' };
    case 'danger':
      return { background: hover ? 'var(--danger-hover)' : 'var(--danger)', color: 'var(--on-danger)', borderColor: 'transparent' };
    // Destructivo, pero no urgente. el error es el único relleno sólido del sistema
    // y se gasta una vez: en outline el acto sigue diciendo "esto deshace algo"
    // sin gritar. Mismo trato que `secondary` le da a el acento.
    case 'danger-secondary':
      return { background: hover ? 'var(--danger-soft)' : 'transparent', color: 'var(--danger-text)', borderColor: 'var(--danger)' };
    default:
      return { background: hover ? 'var(--primary-hover)' : 'var(--primary)', color: 'var(--on-primary)', borderColor: 'transparent' };
  }
}

export function Button({
  variant = 'primary', size = 'md', disabled = false, fullWidth = false,
  type = 'button', children, style, onMouseEnter, onMouseLeave, ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const s = BUTTON_SIZES[size] || BUTTON_SIZES.md;
  const p = palette(variant, hover && !disabled);
  return React.createElement('button', {
    type, disabled,
    onMouseEnter: (e) => { setHover(true); onMouseEnter && onMouseEnter(e); },
    onMouseLeave: (e) => { setHover(false); onMouseLeave && onMouseLeave(e); },
    style: {
      display: fullWidth ? 'flex' : 'inline-flex', width: fullWidth ? '100%' : undefined,
      alignItems: 'center', justifyContent: 'center', gap: s.gap + 'px',
      minHeight: s.h + 'px', padding: '6px ' + s.px + 'px',
      fontFamily: 'var(--font-ui)', fontSize: s.fs, fontWeight: 'var(--weight-semibold)',
      lineHeight: 'var(--leading-snug)', textAlign: 'center', whiteSpace: 'nowrap',
      borderRadius: 'var(--radius-boton)', border: 'var(--border-w) solid ' + p.borderColor,
      background: p.background, color: p.color, boxShadow: 'var(--shadow-none)',
      cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.45 : 1,
      transition: 'background var(--dur-fast) var(--ease-standard), color var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard)',
      ...style
    }, ...rest
  }, children);
}
