import React from 'react';
import { Icon } from '../core/Icon.jsx';

/* Pantalla que todavía no existe, dicha con dignidad.
   No es un error ni una falla: es una promesa fechada. Por eso no lleva tono
   de alerta, no late (el pulso es privilegio de lo vivo) y no empuja a
   ninguna acción — no hay ninguna que ofrecer todavía.
   El icono es el mismo que la pieza tiene en el sidebar: quien llega
   reconoce dónde está antes de leer. */

export function PantallaProxima({ icon, title, description, note, style, ...rest }) {
  return React.createElement('section', {
    style: {
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      textAlign: 'center', gap: 'var(--space-6)',
      minHeight: '100%', padding: 'var(--space-12) var(--space-8)',
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

    note && React.createElement('span', {
      key: 'n',
      style: {
        display: 'inline-flex', alignItems: 'center',
        padding: '4px var(--space-5)', borderRadius: 'var(--radius-boton)',
        border: 'var(--border-w) solid var(--border)',
        fontSize: 'var(--text-xs)', color: 'var(--text-3)'
      }
    }, note)
  );
}
