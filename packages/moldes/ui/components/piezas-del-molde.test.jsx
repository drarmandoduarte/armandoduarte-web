/**
 * Las piezas nuevas del molde: cada una se dibuja, con los textos que se le
 * pasan y sin ninguno propio, y cumple lo que su guion dice que hace.
 *
 * Render en servidor (`renderToStaticMarkup`), sin DOM: lo que se mira es el
 * marcado. El comportamiento con teclado y foco de la casilla de 6 huecos tiene
 * su propia suite con DOM (`acceso/OtpInput.test.jsx`).
 */
import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { partirAcento } from './acento.js';
import { Titulo } from './acceso/Titulo.jsx';
import { Antetitulo } from './acceso/Antetitulo.jsx';
import { Boton } from './acceso/Boton.jsx';
import { BotonGoogle } from './acceso/BotonGoogle.jsx';
import { Separador } from './acceso/Separador.jsx';
import { Campo } from './acceso/Campo.jsx';
import { CampoMono } from './acceso/CampoMono.jsx';
import { Enlace } from './acceso/Enlace.jsx';
import { Idioma } from './acceso/Idioma.jsx';
import { PieLegal } from './acceso/PieLegal.jsx';
import { Cartel } from './acceso/Cartel.jsx';
import { CodigosRespaldo } from './acceso/CodigosRespaldo.jsx';
import { FilaAjuste } from './ajustes/FilaAjuste.jsx';
import { Bloque } from './ajustes/Bloque.jsx';
import { ZonaPeligrosa } from './ajustes/ZonaPeligrosa.jsx';
import { Barra } from './ajustes/Barra.jsx';
import { BloqueUsoIA } from './ajustes/BloqueUsoIA.jsx';
import { TarjetaConfirmacion } from './asistente/TarjetaConfirmacion.jsx';
import { Cita } from './asistente/Cita.jsx';
import { Panel } from './asistente/Panel.jsx';

const html = (el) => renderToStaticMarkup(el);
const h = React.createElement;

describe('la palabra acentuada', () => {
  it('parte el texto por los asteriscos', () => {
    expect(partirAcento('Verifica tu *identidad*.')).toEqual([
      { acento: false, texto: 'Verifica tu ' }, { acento: true, texto: 'identidad' }, { acento: false, texto: '.' },
    ]);
  });
  it('sin asteriscos, sale tal cual; con uno suelto, no se pierde nada', () => {
    expect(partirAcento('Hola.')).toEqual([{ acento: false, texto: 'Hola.' }]);
    expect(partirAcento('a *b').map((p) => p.texto).join('')).toBe('a *b');
  });
});

describe('acceso', () => {
  it('Titulo: la palabra en <em>, el punto fuera, con la clase que la pinta', () => {
    const s = html(h(Titulo, { texto: 'Verifica tu *identidad*.' }));
    expect(s).toContain('class="molde-display"');
    expect(s).toContain('<em>identidad</em>.');
  });
  it('Antetitulo: pone el § · y deja la palabra', () => {
    expect(html(h(Antetitulo, { texto: 'Código' }))).toContain('§ · Código');
  });
  it('Boton: contorno, mayúsculas, flecha opcional, cargando sin girar', () => {
    const s = html(h(Boton, { flecha: true }, 'Enviar'));
    expect(s).toContain('text-transform:uppercase');
    expect(s).toContain('background:transparent');
    expect(s).toContain('→');
    const c = html(h(Boton, { cargando: true }, 'Enviar'));
    expect(c).toContain('molde-carga');
    expect(c).toContain('disabled=""');
  });
  it('BotonGoogle: ancho completo, la G en una sola tinta', () => {
    const s = html(h(BotonGoogle, null, 'Google'));
    expect(s).toContain('width:100%');
    expect(s).toContain('fill="currentColor"');
  });
  it('Separador: una línea con un círculo, sin texto', () => {
    const s = html(h(Separador));
    expect(s).toContain('role="separator"');
    expect(s.replace(/<[^>]+>/g, '')).toBe('');
  });
  it('Campo: etiqueta conectada, 56 px, error con aria', () => {
    const s = html(h(Campo, { id: 'c', etiqueta: 'Correo', error: 'Mal' }));
    expect(s).toContain('for="c"');
    expect(s).toContain('height:56px');
    expect(s).toContain('aria-invalid="true"');
    expect(s).toContain('aria-describedby="c-error"');
  });
  it('CampoMono: monoespaciado y sin autocorrector', () => {
    const s = html(h(CampoMono, { etiqueta: 'Respaldo' }));
    expect(s).toContain('var(--font-mono)');
    expect(s).toContain('spellCheck="false"');
  });
  it('Enlace: con href es <a>; sin href, botón', () => {
    expect(html(h(Enlace, { href: '/x' }, 'ir'))).toMatch(/^<a /);
    expect(html(h(Enlace, null, 'ir'))).toMatch(/^<button /);
  });
  it('Idioma: los tres códigos, el activo marcado', () => {
    const s = html(h(Idioma, { valor: 'en' }));
    for (const c of ['es', 'en', 'pt']) expect(s).toContain(`lang="${c}"`);
    expect(s).toMatch(/lang="en" aria-pressed="true"/);
  });
  it('PieLegal: enlaza los dos trozos dentro de la frase entera', () => {
    const s = html(h(PieLegal, { texto: 'Acepto los Términos y la Privacidad.', terminos: { texto: 'Términos', href: '/t' }, privacidad: { texto: 'Privacidad', href: '/p' } }));
    expect(s).toContain('<a href="/t"');
    expect(s).toContain('<a href="/p"');
    expect(s.replace(/<[^>]+>/g, '')).toBe('Acepto los Términos y la Privacidad.');
  });
  it('Cartel: antetítulo, título, frase y una salida', () => {
    const s = html(h(Cartel, { antetitulo: 'Sesión', titulo: 'Cerramos tu *sesión*.', texto: 'Pasaron 30 minutos.', accion: { texto: 'Volver' } }));
    for (const t of ['§ · Sesión', '<em>sesión</em>', 'Pasaron 30 minutos.', 'Volver']) expect(s).toContain(t);
  });
  it('CodigosRespaldo: los diez en dos columnas, «Listo» bloqueado al empezar', () => {
    const codigos = Array.from({ length: 10 }, (_, i) => `abcd-${i}`);
    const s = html(h(CodigosRespaldo, { codigos, textos: { descargar: 'D', copiar: 'C', compartir: 'S', listo: 'Listo' } }));
    expect((s.match(/<li>/g) || []).length).toBe(10);
    expect(s).toContain('grid-template-columns:1fr 1fr');
    expect(s).toMatch(/<button[^>]*disabled=""[^>]*>.*Listo/);
  });
});

describe('ajustes', () => {
  it('FilaAjuste: nombre, explicación, control; «Guardado» empieza oculto', () => {
    const s = html(h(FilaAjuste, { nombre: 'Tema', explicacion: 'Claro u oscuro.', textoGuardado: 'Guardado' }, h('input')));
    expect(s).toContain('Tema');
    expect(s).toContain('Claro u oscuro.');
    expect(s).toContain('role="status"');
    expect(s).not.toContain('Guardado');
  });
  it('Bloque: antetítulo y una línea ENTRE filas, no antes de la primera', () => {
    const s = html(h(Bloque, { antetitulo: 'Apariencia' }, h('p', { key: 1 }, 'a'), h('p', { key: 2 }, 'b'), h('p', { key: 3 }, 'c')));
    expect(s).toContain('§ · Apariencia');
    expect((s.match(/border-top:var\(--border-w\) solid var\(--border\)/g) || []).length).toBe(2);
  });
  it('ZonaPeligrosa: borde del error, y cerrada hasta que se toca', () => {
    const s = html(h(ZonaPeligrosa, { nombre: 'Borrar', palabra: 'BORRAR', textos: { abrir: 'Borrar mi cuenta' } }));
    expect(s).toContain('solid var(--danger)');
    expect(s).toContain('Borrar mi cuenta');
    expect(s).not.toContain('data-casilla');
  });
  it('Barra: progressbar con su número, y no se sale de la caja', () => {
    expect(html(h(Barra, { valor: 0.41 }))).toContain('aria-valuenow="41"');
    expect(html(h(Barra, { valor: 1.7 }))).toContain('width:100%');
    expect(html(h(Barra, { valor: 0.4, marca: 0.8, etiquetaMarca: 'Aviso' }))).toContain('left:80%');
  });
  it('BloqueUsoIA: normal y al tope', () => {
    const uso = { frase: 'Vas *bien*.', usados: '1,24 M', deTotal: 'de 3 M', proporcion: 0.41, porcentajeTexto: '41 %', dias: [{ valor: 1 }, { valor: 2 }], hoy: 'Hoy', porPersona: [{ nombre: 'Ana', valor: '1 k', proporcion: 0.5 }] };
    const s = html(h(BloqueUsoIA, { uso, textos: { antetitulo: 'Uso de IA', aviso: 'Aviso', porPersona: 'Por persona' } }));
    for (const t of ['<em>bien</em>', '1,24 M', '41 %', 'left:80%', 'Por persona', 'Ana']) expect(s).toContain(t);
    const tope = html(h(BloqueUsoIA, { uso: { ...uso, proporcion: 1, pausado: 'Pausado' }, textos: {} }));
    expect(tope).toContain('Pausado');
    expect(tope).not.toContain('left:80%');
    expect(tope).not.toContain('Ana');
  });
});

describe('asistente', () => {
  it('TarjetaConfirmacion: pide código solo si es irreversible', () => {
    const t = { confirmar: 'Confirmar', no: 'No' };
    expect(html(h(TarjetaConfirmacion, { accion: 'Voy a mandar 3.', textos: t }))).not.toContain('data-casilla');
    const s = html(h(TarjetaConfirmacion, { accion: 'Voy a borrar.', irreversible: true, textos: t }));
    expect((s.match(/data-casilla/g) || []).length).toBe(6);
    expect(s).toMatch(/<button[^>]*disabled=""[^>]*>.*Confirmar/);
  });
  it('Cita: [etiqueta] con su tipo y su id', () => {
    const s = html(h(Cita, { tipo: 'propiedad', id: 1234, etiqueta: 'Rivera 1234' }));
    expect(s).toContain('data-tipo="propiedad"');
    expect(s.replace(/<[^>]+>/g, '')).toBe('[Rivera 1234]');
  });
  it('Panel: cerrado no dibuja nada', () => {
    expect(html(h(Panel, { abierto: false, titulo: 'Asistente' }, 'x'))).toBe('');
  });
});
