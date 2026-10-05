import React from 'react';
import { Campo } from './Campo.jsx';

/* El campo único de los códigos de respaldo (guion §3 y P6): monoespaciado,
   espacios permitidos, sin autocorrector ni mayúscula automática. Los códigos de
   respaldo NO usan la casilla de 6 huecos: tienen 10 caracteres. */
export const CampoMono = React.forwardRef(function CampoMono(props, ref) {
  return React.createElement(Campo, {
    ref, mono: true, autoComplete: 'off', autoCorrect: 'off', autoCapitalize: 'none', spellCheck: false,
    ...props,
  });
});
