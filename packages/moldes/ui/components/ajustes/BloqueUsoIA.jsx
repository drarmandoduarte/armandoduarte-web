import React from 'react';
import { Antetitulo } from '../acceso/Antetitulo.jsx';
import { Titulo } from '../acceso/Titulo.jsx';
import { Boton } from '../acceso/Boton.jsx';
import { conAcento } from '../acento.js';
import { Barra } from './Barra.jsx';

/* El bloque «Uso de IA» de Plan y facturación — la maqueta de Ajustes, entera:
   la frase en lenguaje de persona, el número grande, la barra con la marca del
   aviso, renovación y proyección, los 30 días, los límites, por persona y en qué
   se usó, qué es un token y «Sumar tokens». Y el estado al llegar al tope.

   No calcula nada ni formatea números: recibe el objeto del contador ya armado y
   en el idioma de la persona (`1,24 M`, `41 %`, `1 de noviembre`). Un componente
   que formatea elige un idioma, y el molde no elige idiomas. */

const cifra = { fontFamily: 'var(--font-mono)', fontSize: 'var(--text-base)', color: 'var(--text-3)', textAlign: 'right' };
const columna = (gap) => ({ display: 'flex', flexDirection: 'column', gap });

function Lista({ titulo, filas = [] }) {
  return React.createElement('div', { style: columna('var(--space-8)') },
    React.createElement(Antetitulo, { texto: titulo, tono: 'apagado' }),
    React.createElement('div', { style: columna('var(--space-5)') }, filas.map((f, i) => React.createElement('div', {
      key: i, style: { display: 'grid', gridTemplateColumns: '1fr auto', gap: 'var(--space-3) var(--space-6)', alignItems: 'center', fontSize: 'var(--text-md)' },
    },
    React.createElement('span', { style: { fontWeight: 'var(--weight-medium)' } }, f.nombre),
    React.createElement('span', { style: cifra }, f.valor),
    React.createElement(Barra, { valor: f.proporcion, alto: 4, style: { gridColumn: '1 / -1', opacity: 0.85 } })))));
}

export function BloqueUsoIA({ uso, textos = {}, onSumar, style, ...rest }) {
  const pausado = Boolean(uso.pausado);
  const maximo = Math.max(1, ...(uso.dias || []).map((d) => d.valor || 0));
  return React.createElement('section', { style: { ...columna('var(--space-9)'), ...style }, ...rest },
    React.createElement('div', null,
      React.createElement(Antetitulo, { texto: textos.antetitulo }),
      textos.titulo ? React.createElement(Titulo, { texto: textos.titulo, tamano: 'bloque', como: 'h2', style: { marginTop: 'var(--space-3)' } }) : null),
    uso.frase ? React.createElement('p', { className: 'molde-display', style: { fontSize: 'var(--text-2xl)', lineHeight: 'var(--leading-snug)', textWrap: 'balance' } }, conAcento(uso.frase)) : null,
    React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 'var(--space-6)', flexWrap: 'wrap' } },
      React.createElement('div', { style: { fontSize: 'var(--text-5xl)', fontWeight: 'var(--weight-medium)', fontVariantNumeric: 'tabular-nums', letterSpacing: 'var(--tracking-tight)' } },
        uso.usados, ' ', React.createElement('small', { style: { fontSize: 'var(--text-lg)', color: 'var(--text-3)', fontWeight: 'var(--weight-regular)' } }, uso.deTotal)),
      pausado
        ? React.createElement('span', { style: { fontSize: 'var(--text-2xs)', letterSpacing: 'var(--tracking-rotulo)', textTransform: 'uppercase', fontWeight: 'var(--weight-semibold)', padding: '3px var(--space-5)', borderRadius: 'var(--radius-pill)', border: 'var(--border-w) solid var(--warning)', color: 'var(--warning-text)' } }, uso.pausado)
        : React.createElement('span', { style: { ...cifra, fontSize: 'var(--text-md)' } }, uso.porcentajeTexto)),
    React.createElement(Barra, { valor: uso.proporcion, marca: pausado ? undefined : 0.8, etiquetaMarca: pausado ? undefined : textos.aviso, etiqueta: textos.antetitulo }),
    React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', gap: 'var(--space-6)', flexWrap: 'wrap', fontSize: 'var(--text-base)', color: 'var(--text-3)' } },
      React.createElement('span', null, uso.renovacion), uso.proyeccion ? React.createElement('span', null, uso.proyeccion) : null),
    uso.dias && uso.dias.length && !pausado ? React.createElement('div', null,
      React.createElement('div', {
        role: 'img', 'aria-label': textos.porDia,
        style: { display: 'grid', gridTemplateColumns: `repeat(${uso.dias.length}, 1fr)`, gap: 3, alignItems: 'end', height: 48 },
      }, uso.dias.map((d, i) => React.createElement('i', {
        key: i,
        style: { display: 'block', height: ((d.valor || 0) / maximo * 100) + '%', minHeight: 2, background: 'var(--primary)', opacity: i === uso.dias.length - 1 ? 1 : 0.35, borderRadius: 'var(--radius-xs) var(--radius-xs) 0 0' },
      }))),
      React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-base)', color: 'var(--text-3)', marginTop: 'var(--space-3)' } },
        React.createElement('span', null, textos.hace30), React.createElement('span', null, uso.hoy))) : null,
    uso.limites && uso.limites.length && !pausado ? React.createElement('div', { style: columna('var(--space-7)') }, uso.limites.map((l, i) => React.createElement('div', { key: i, className: 'molde-limite' },
      React.createElement('div', null,
        React.createElement('span', { style: { display: 'block', fontWeight: 'var(--weight-medium)', fontSize: 'var(--text-md)' } }, l.nombre),
        React.createElement('span', { style: { display: 'block', fontSize: 'var(--text-sm)', color: 'var(--text-3)' } }, l.detalle)),
      React.createElement(Barra, { valor: l.proporcion, alto: 6, className: 'molde-limite-barra' }),
      React.createElement('span', { style: { ...cifra, minWidth: '4ch' } }, l.texto)))) : null,
    (uso.porPersona || uso.porUso) && !pausado ? React.createElement('div', { style: { borderTop: 'var(--border-w) solid var(--border)', paddingTop: 'var(--space-9)' } },
      React.createElement('div', { className: 'molde-dos' },
        uso.porPersona ? React.createElement(Lista, { titulo: textos.porPersona, filas: uso.porPersona }) : null,
        uso.porUso ? React.createElement(Lista, { titulo: textos.enQue, filas: uso.porUso }) : null)) : null,
    uso.nota ? React.createElement('p', { style: { fontSize: 'var(--text-base)', color: 'var(--text-3)', maxWidth: '60ch' } }, uso.nota) : null,
    onSumar ? React.createElement(Boton, { onClick: onSumar, style: { alignSelf: 'flex-start' } }, textos.sumar) : null);
}
