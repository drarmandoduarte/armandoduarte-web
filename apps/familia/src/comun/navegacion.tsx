import { createContext, useContext, type AnchorHTMLAttributes, type MouseEvent, type ReactNode } from 'react';

/**
 * Navegar dentro de Mi espacio sin recargar — orden #29.
 *
 * ── Por qué ahora y no antes ────────────────────────────────────────────
 * Hasta la #28 Mi espacio era una pantalla y un panel, y pasar de uno al otro
 * con una carga completa no costaba nada. Con la barra lateral son cinco
 * lugares: recargar en cada clic volvería a preguntar la sesión y `/api/yo`, y
 * la barra parpadearía. `App.tsx` ya guardaba la ruta en un estado (#24 B);
 * esto le da una forma de cambiarla: `pushState` + ese estado.
 *
 * Sin `react-router` (que está en el `package.json` y nadie usa): son cinco
 * rutas fijas, y quién decide si una ruta es un lugar ya lo dice
 * `rutaQueCorresponde()`. Un router sería una segunda opinión.
 *
 * El enlace sigue siendo un `<a href>` de verdad: abrir en otra pestaña, copiar
 * el enlace o el clic del medio hacen lo de siempre. Solo el clic simple se
 * queda adentro.
 */
const Navegar = createContext<(ruta: string) => void>((ruta) => window.location.assign(ruta));

export function ProveedorDeNavegacion({ navegar, children }: { navegar: (ruta: string) => void; children: ReactNode }) {
  return <Navegar.Provider value={navegar}>{children}</Navegar.Provider>;
}

export function useNavegar(): (ruta: string) => void {
  return useContext(Navegar);
}

/** Un `<a>` a una ruta de Mi espacio que, con el clic simple, navega sin recargar. */
export function EnlaceInterno({
  a,
  onClick,
  ...resto
}: { a: string } & AnchorHTMLAttributes<HTMLAnchorElement>) {
  const navegar = useNavegar();
  const alClic = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    navegar(a);
  };
  return <a href={a} onClick={alClic} {...resto} />;
}
