import React from 'react';

/* «Al continuar aceptas nuestros Términos y la Política de Privacidad.» (guion
   P1), con los dos enlaces. La frase llega entera desde el archivo de idioma, y
   el componente enlaza los dos trozos que se le indiquen —así la frase se
   traduce entera, con su orden propio en cada idioma, y nadie la arma pegando
   pedazos. Si un trozo no aparece en la frase, no se enlaza (y no se rompe). */
export function PieLegal({ texto, terminos, privacidad, style, ...rest }) {
  const enlaces = [terminos, privacidad].filter((e) => e && e.texto && e.href);
  let partes = [texto];
  for (const enlace of enlaces) {
    partes = partes.flatMap((parte) => {
      if (typeof parte !== 'string') return [parte];
      const i = parte.indexOf(enlace.texto);
      if (i < 0) return [parte];
      return [
        parte.slice(0, i),
        React.createElement('a', { key: enlace.href, href: enlace.href, style: { color: 'inherit' } }, enlace.texto),
        parte.slice(i + enlace.texto.length),
      ];
    });
  }
  return React.createElement('p', {
    style: { fontSize: 'var(--text-md)', color: 'var(--text-3)', lineHeight: 'var(--leading-normal)', ...style },
    ...rest,
  }, partes);
}
