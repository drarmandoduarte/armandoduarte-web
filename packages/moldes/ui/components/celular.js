import React from 'react';

/* ¿Estamos en un celular? — el corte de todo el molde: 600 px (el mismo de la
   casilla de 6 huecos y de las pantallas de acceso).

   Vive suelto porque lo usan dos piezas que cambian de FORMA, no solo de
   tamaño, en celular: el panel del asistente (lateral → hoja desde abajo) y
   Ajustes (dos columnas → lista primero, sección después). Lo que solo cambia
   de tamaño se resuelve en CSS (`tokens/piezas.css`). */
export const CORTE_CELULAR = '(max-width: 599px)';

export function useEsCelular() {
  const consulta = () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(CORTE_CELULAR).matches : false);
  const [es, setEs] = React.useState(consulta);
  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const m = window.matchMedia(CORTE_CELULAR);
    const cambio = () => setEs(m.matches);
    cambio();
    m.addEventListener('change', cambio);
    return () => m.removeEventListener('change', cambio);
  }, []);
  return es;
}
