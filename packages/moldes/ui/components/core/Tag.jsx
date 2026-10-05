import React from 'react';
import { Icon } from './Icon.jsx';

export function Tag({ icon, tone, onRemove, removeLabel, children, style, ...rest }) {
  /* Dos tonos con color y ni uno más, cada uno con su rol del sistema:
     - "alergia" (el error suave): la seguridad de la persona se ve antes de leerse.
     - "aviso" (el aviso suave): algo que hay que atender y que NO es una urgencia
       urgencia — una mensualidad vencida, un dato que caducó. el aviso avisa; el
       relleno sólido y el rojo siguen siendo privilegio de la urgencia. */
  const alergia = tone === 'alergia';
  const aviso = tone === 'aviso';
  const teñido = alergia || aviso;
  return React.createElement('span', {
    style: {
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      padding: '4px 8px',
      background: alergia ? 'var(--danger-soft)' : aviso ? 'var(--warning-soft)' : 'var(--surface)',
      border: 'var(--border-w) solid ' + (teñido ? 'transparent' : 'var(--border-strong)'),
      borderRadius: 'var(--radius-sm)',
      color: alergia ? 'var(--danger-text)' : aviso ? 'var(--warning-text)' : 'var(--text-2)',
      fontSize: 'var(--text-sm)', fontWeight: teñido ? 'var(--weight-semibold)' : 'var(--weight-medium)',
      maxWidth: '100%', flex: '0 0 auto', ...style
    }, ...rest
  },
    icon && React.createElement(Icon, { key: 'i', name: icon, size: 12 }),
    React.createElement('span', { key: 't', style: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, children),
    onRemove && React.createElement('button', {
      key: 'x', type: 'button', onClick: onRemove, 'aria-label': removeLabel,
      style: { display: 'inline-flex', border: 'none', background: 'none', padding: 0, cursor: 'pointer', color: alergia ? 'var(--danger-text)' : aviso ? 'var(--warning-text)' : 'var(--text-3)' }
    }, React.createElement(Icon, { name: 'x', size: 12 }))
  );
}
