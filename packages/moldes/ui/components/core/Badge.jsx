import React from 'react';

const BADGE_TONES = {
  neutral: { bg: 'var(--surface-2)', fg: 'var(--text-2)', bd: 'var(--border)' },
  primary: { bg: 'var(--primary-soft-2)', fg: 'var(--primary-soft-fg)', bd: 'transparent' },
  warning: { bg: 'var(--warning-soft-2)', fg: 'var(--warning-soft-fg)', bd: 'transparent' },
  info:    { bg: 'var(--info-soft-2)', fg: 'var(--info-text)', bd: 'transparent' },
  danger:  { bg: 'var(--danger)', fg: 'var(--on-danger)', bd: 'transparent' }
};

/* `accent` es el nombre viejo de `warning`: se acepta para que las apps de las
   que salió el kit no se rompan al instalarlo, y no se documenta. */
const ALIAS = { accent: 'warning' };

export function Badge({ tone = 'neutral', count, children, style, ...rest }) {
  const t = BADGE_TONES[ALIAS[tone] || tone] || BADGE_TONES.neutral;
  const numeric = count != null;
  return React.createElement('span', {
    style: {
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
      minWidth: numeric ? '18px' : undefined, height: numeric ? '18px' : undefined,
      padding: numeric ? '0 5px' : '2px 7px',
      background: t.bg, color: t.fg, border: 'var(--border-w) solid ' + t.bd,
      borderRadius: numeric ? 'var(--radius-pill)' : 'var(--radius-xs)',
      fontSize: 'var(--text-2xs)', fontWeight: 'var(--weight-bold)',
      letterSpacing: '.04em', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', ...style
    }, ...rest
  }, numeric ? count : children);
}
