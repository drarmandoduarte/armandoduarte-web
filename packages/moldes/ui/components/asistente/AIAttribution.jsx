import React from 'react';
import { Icon } from '../core/Icon.jsx';

/* La IA detecta, describe y recuerda; la persona decide, firma y pone el criterio.
   Todo lo que escribe la IA lleva atribución visible y espacio para ese criterio.
   `source` («Asistente de {app}») y `note` llegan traducidos: el molde no trae textos. */
export function AIAttribution({ source, note, children, actions, style, ...rest }) {
  return React.createElement('div', {
    style: {
      background: 'var(--info-soft)', border: 'var(--border-w) solid var(--info-linea)',
      borderRadius: 'var(--radius-xl)', padding: 'var(--space-6) var(--space-7)',
      color: 'var(--text)', ...style
    }, ...rest
  },
    React.createElement('div', { key: 'h', style: { display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--info-text)', marginBottom: 'var(--space-4)' } },
      React.createElement(Icon, { key: 'i', name: 'sparkles', size: 12 }),
      React.createElement('span', { key: 's', style: { fontSize: 'var(--text-2xs)', fontWeight: 'var(--weight-bold)', letterSpacing: 'var(--tracking-wide)', textTransform: 'uppercase' } }, source),
      React.createElement('span', { key: 'n', style: { fontSize: 'var(--text-2xs)', color: 'var(--text-3)', letterSpacing: 0, textTransform: 'none', fontWeight: 'var(--weight-medium)' } }, note)
    ),
    React.createElement('div', { key: 'b', style: { fontSize: 'var(--text-base)', lineHeight: 'var(--leading-normal)', color: 'var(--text-2)' } }, children),
    actions && React.createElement('div', { key: 'a', style: { display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-6)' } }, actions)
  );
}
