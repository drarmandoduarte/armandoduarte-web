import React from 'react';
import { Icon } from '../core/Icon.jsx';
import { IconButton } from '../core/IconButton.jsx';

const TOAST_TONES = {
  neutral: { icon: 'info',        bd: 'var(--floating-border)', fg: 'var(--text-2)' },
  success: { icon: 'check',       bd: 'var(--success-linea)', fg: 'var(--success-text)' },
  warning: { icon: 'triangle-alert', bd: 'var(--warning-linea)',  fg: 'var(--warning-text)' },
  danger:  { icon: 'octagon-alert',  bd: 'var(--danger-linea)',  fg: 'var(--danger-text)' }
};

export function Toast({ tone = 'neutral', title, description, action, onClose, closeLabel, style, ...rest }) {
  const t = TOAST_TONES[tone] || TOAST_TONES.neutral;
  return React.createElement('div', {
    role: 'status',
    style: {
      display: 'flex', alignItems: 'flex-start', gap: 'var(--space-6)',
      minWidth: '280px', maxWidth: '420px', padding: 'var(--space-6) var(--space-7)',
      background: 'var(--floating-surface)', color: 'var(--text)',
      border: 'var(--border-w) solid ' + t.bd, borderRadius: 'var(--radius-xl)',
      boxShadow: 'var(--shadow-pop)', ...style
    }, ...rest
  },
    React.createElement('span', { key: 'i', style: { color: t.fg, marginTop: '1px' } }, React.createElement(Icon, { name: t.icon, size: 16 })),
    React.createElement('div', { key: 'b', style: { flex: 1, minWidth: 0 } },
      title && React.createElement('p', { key: 't', style: { fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', lineHeight: 'var(--leading-snug)' } }, title),
      description && React.createElement('p', { key: 'd', style: { marginTop: '2px', fontSize: 'var(--text-sm)', color: 'var(--text-3)', lineHeight: 'var(--leading-snug)' } }, description),
      action && React.createElement('div', { key: 'a', style: { marginTop: 'var(--space-5)' } }, action)
    ),
    onClose && React.createElement(IconButton, { key: 'x', icon: 'x', label: closeLabel, size: 'sm', onClick: onClose })
  );
}
