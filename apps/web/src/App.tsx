import { Route, Routes } from 'react-router-dom';
import { Inicio } from './web/inicio/Inicio';
import { Taller } from './web/taller/Taller';
import { Privacidad } from './web/legal/Privacidad';
import { Terminos } from './web/legal/Terminos';

/**
 * El árbol de la web pública. Las rutas están declaradas en `rutas.ts` —el
 * prerender y el guardián de fidelidad leen esa misma lista— y acá se montan.
 */
export function App() {
  return (
    <Routes>
      <Route path="/" element={<Inicio />} />
      <Route path="/taller" element={<Taller />} />
      <Route path="/privacidad" element={<Privacidad />} />
      <Route path="/terminos" element={<Terminos />} />
    </Routes>
  );
}
