import React from 'react';
import { Titulo, FilaAjuste, SegmentedControl } from '@moldes/ui';

/* La gramática de la pantalla de Ajustes: la cabecera de cada sección, la
   fila que guarda sola y avisa «Guardado», y la fila de opciones. Las piezas
   genéricas (fila, bloque, zona peligrosa) son del Kit UI; estas tres son de
   ESTA pantalla y por eso viven acá. */

/**
 * «Plan y facturación» → «Plan y *facturación*.»: la última palabra en la serif
 * de la app, en cursiva y acento, con punto final (guion de Ajustes §2). Se
 * deriva del nombre de la sección para que el título y el renglón del riel
 * digan siempre lo mismo, en los tres idiomas, sin una clave más por sección.
 */
export function conUltimaAcentuada(texto) {
  const limpio = String(texto).trim().replace(/[.·]+$/, '');
  const i = limpio.lastIndexOf(' ');
  return i < 0 ? `*${limpio}*.` : `${limpio.slice(0, i + 1)}*${limpio.slice(i + 1)}*.`;
}

/** Título de la sección y su línea de subtítulo (lo que se maneja acá). */
export function CabeceraSeccion({ titulo, hint }) {
  return (
    <header style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginBottom: 'var(--space-16)' }}>
      <Titulo texto={conUltimaAcentuada(titulo)} tamano="pantalla" como="h2" />
      {hint ? <p style={{ fontSize: 'var(--text-lg)', color: 'var(--text-3)', maxWidth: '60ch' }}>{hint}</p> : null}
    </header>
  );
}

/**
 * Guarda y avisa. Devuelve `[guardadoEn, guardar]`: `guardar(...args)` llama a
 * la acción de la app (que devuelve una promesa) y, SOLO si sale bien, cambia
 * `guardadoEn` para que la fila diga «Guardado». Si la app no pasó la acción,
 * no hace nada: una fila sin acción es una fila de solo lectura.
 *
 * Si la promesa falla, la fila no dice «Guardado» —que sería mentir— y el error
 * sigue su camino: avisarlo es de la app, que sabe cómo lo avisa en todas sus
 * pantallas.
 */
export function useGuardar(accion) {
  const [guardadoEn, setGuardadoEn] = React.useState(null);
  const guardar = React.useCallback(async (...args) => {
    if (!accion) return;
    await accion(...args);
    setGuardadoEn(Date.now());
  }, [accion]);
  return [guardadoEn, guardar];
}

/**
 * Una fila con opciones excluyentes (tema, tamaño de texto, resumen) que guarda
 * sola: el valor se ve cambiado en el acto y «Guardado» aparece cuando la app
 * confirmó.
 */
export function FilaDeOpciones({ nombre, explicacion, valor, opciones, accion, textoGuardado }) {
  const [actual, setActual] = React.useState(valor);
  React.useEffect(() => setActual(valor), [valor]);
  const [guardadoEn, guardar] = useGuardar(accion);
  return (
    <FilaAjuste nombre={nombre} explicacion={explicacion} guardadoEn={guardadoEn} textoGuardado={textoGuardado}>
      <SegmentedControl
        label={typeof nombre === 'string' ? nombre : undefined}
        value={actual}
        options={opciones}
        onChange={(v) => { setActual(v); guardar(v).catch(() => setActual(valor)); }}
      />
    </FilaAjuste>
  );
}
