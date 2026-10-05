import React from 'react';
import { Icon } from '../core/Icon.jsx';

/* Una pantalla que todavía no tiene datos — pero que SÍ puede tenerlos hoy.
   Esa es toda la diferencia con PantallaProxima: allá no hay nada que ofrecer
   porque la función no existe; aquí la función existe y está esperando la
   primera fila, así que la acción es el centro y no un adorno.
   No es un error: nada de el aviso ni el error, no late, no se disculpa. */

export function EstadoVacio({ icon, title, description, action, style, ...rest }) {
  return React.createElement('section', {
    style: {
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      textAlign: 'center', gap: 'var(--space-6)',
      minHeight: '100%', padding: 'var(--space-24) var(--space-8)',
      fontFamily: 'var(--font-ui)', color: 'var(--text)', ...style
    }, ...rest
  },
    icon && React.createElement('span', {
      key: 'i',
      style: {
        width: '52px', height: '52px', flex: '0 0 auto',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--surface-2)', color: 'var(--text-3)'
      }
    }, React.createElement(Icon, { name: icon, size: 24 })),

    React.createElement('h2', {
      key: 't',
      style: {
        margin: 0, fontFamily: 'var(--font-display)', fontWeight: 'var(--weight-semibold)',
        fontSize: 'var(--text-2xl)', letterSpacing: 'var(--tracking-tight)', color: 'var(--text)'
      }
    }, title),

    description && React.createElement('p', {
      key: 'd',
      style: {
        margin: 0, maxWidth: '46ch', fontSize: 'var(--text-md)',
        lineHeight: 'var(--leading-relaxed)', color: 'var(--text-2)'
      }
    }, description),

    action && React.createElement('div', { key: 'a', style: { marginTop: 'var(--space-2)' } }, action)
  );
}
