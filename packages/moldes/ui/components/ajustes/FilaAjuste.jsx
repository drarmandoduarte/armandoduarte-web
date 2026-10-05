import React from 'react';

/* La fila de un ajuste (guion de Ajustes §2): a la izquierda el nombre y una
   línea gris que explica; a la derecha el control. La línea gris ES la ayuda:
   no hay «?» ni tooltips.

   «Guardado»: los interruptores y selectores guardan solos, y la fila lo dice
   dos segundos a la derecha del control. La fila no sabe cuándo se guardó — se lo avisa la
   pantalla cambiando `guardadoEn` (cualquier valor nuevo: una hora, un
   contador). Así el aviso aparece solo cuando el servidor confirmó, no cuando
   se tocó el control. */
const DURACION = 2000;

export function FilaAjuste({ nombre, explicacion, children, guardadoEn, textoGuardado, style, ...rest }) {
  const [visible, setVisible] = React.useState(false);
  const primera = React.useRef(true);
  React.useEffect(() => {
    if (primera.current) { primera.current = false; return undefined; }
    if (guardadoEn === undefined || guardadoEn === null) return undefined;
    setVisible(true);
    const reloj = setTimeout(() => setVisible(false), DURACION);
    return () => clearTimeout(reloj);
  }, [guardadoEn]);

  return React.createElement('div', {
    style: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap',
      gap: 'var(--space-6) var(--space-12)', padding: 'var(--space-10) 0', ...style,
    },
    ...rest,
  },
  React.createElement('div', { style: { flex: '1 1 16rem', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' } },
    React.createElement('span', { style: { fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-medium)', color: 'var(--text)' } }, nombre),
    explicacion ? React.createElement('span', { style: { fontSize: 'var(--text-md)', color: 'var(--text-3)', lineHeight: 'var(--leading-snug)' } }, explicacion) : null),
  /* El control y, a SU derecha, «Guardado» (guion §2). En celular el control
     baja debajo del nombre y puede achicarse hasta el ancho de la pantalla: un
     campo con su botón no se sale nunca de la columna. */
  React.createElement('div', { style: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', flex: '0 1 auto', minWidth: 0, maxWidth: '100%' } },
    children,
    /* Existe siempre (un aviso `aria-live` tiene que estar antes de hablar),
       pero ocupa lugar solo cuando dice algo. */
    React.createElement('span', {
      role: 'status', 'aria-live': 'polite',
      style: {
        fontSize: 'var(--text-sm)', color: 'var(--success-text)', paddingInlineStart: visible ? 'var(--space-6)' : 0,
        opacity: visible ? 1 : 0, transition: 'opacity var(--dur-slow) var(--ease-standard)',
      },
    }, visible ? textoGuardado : '')));
}
