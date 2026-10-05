import React from 'react';

/* `§ · PALABRA` — el antetítulo de las pantallas de acceso, de cada bloque de
   Ajustes y de las secciones del asistente (guion §2). Mayúsculas espaciadas,
   chico, en el color del acento. El `§ ·` es del componente y no del texto: el
   archivo de idioma trae solo la palabra («Verificación»). */
export function Antetitulo({ texto, tono = 'acento', style, ...rest }) {
  return React.createElement('p', {
    style: {
      fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)',
      letterSpacing: 'var(--tracking-rotulo)', textTransform: 'uppercase',
      color: tono === 'apagado' ? 'var(--text-3)' : 'var(--primary-text)',
      ...style,
    },
    ...rest,
  }, '§ · ', texto);
}
