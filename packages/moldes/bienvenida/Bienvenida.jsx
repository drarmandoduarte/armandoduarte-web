import React from 'react';
import { Antetitulo, Titulo, Boton, Enlace } from '@moldes/ui';
import { validarPasos, sePuedeSaltar, esElUltimo } from './reglas.js';

/**
 * La bienvenida: la primera entrada, después de activar el autenticador
 * (orden de la fase 1, §5). Las pantallas las declara la app —qué pregunta,
 * qué guarda—; el molde pone el marco (el mismo de las pantallas de acceso:
 * columna de 560, antetítulo, título con la palabra acentuada), el «Paso n de
 * m», «Siguiente» / «Empezar» y «Saltar» donde se puede.
 *
 * Cada paso: `{ id, titulo, bajada, contenido, obligatoria?, listo?, alSeguir? }`.
 *   · `listo: false` deja el botón apagado (falta completar algo);
 *   · `alSeguir()` guarda lo de ese paso; si falla, no avanza.
 * Al terminar —o al saltar el último— llama `onTerminar()`.
 */
export function Bienvenida({ t, pasos, onTerminar }) {
  validarPasos(pasos);
  const [indice, setIndice] = React.useState(0);
  const [ocupado, setOcupado] = React.useState(false);
  const paso = pasos[indice];
  const ultimo = esElUltimo(pasos, indice);

  const avanzar = async (guardar) => {
    setOcupado(true);
    try {
      if (guardar && paso.alSeguir) await paso.alSeguir();
      if (ultimo) { if (onTerminar) await onTerminar(); } else setIndice(indice + 1);
    } catch {
      /* Si guardar falla, la persona se queda en este paso con lo que escribió.
         Decir qué falló es de la app, dentro de su `alSeguir`: es la que sabe. */
    } finally {
      setOcupado(false);
    }
  };

  return (
    <main style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', alignItems: 'center', padding: 'var(--space-24) 0' }} data-paso={paso.id}>
      <div className="molde-columna" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-12)' }}>
        <Antetitulo texto={t('bienvenida.paso', { n: indice + 1, total: pasos.length })} />
        <Titulo texto={paso.titulo} />
        {paso.bajada ? <p style={{ fontSize: 'var(--text-xl)', color: 'var(--text-3)' }}>{paso.bajada}</p> : null}
        {paso.contenido ? <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>{paso.contenido}</div> : null}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-10)', flexWrap: 'wrap', marginTop: 'var(--space-8)' }}>
          <Boton flecha={!ultimo} disabled={paso.listo === false} cargando={ocupado} onClick={() => avanzar(true)}>
            {ultimo ? t('bienvenida.empezar') : t('bienvenida.siguiente')}
          </Boton>
          {sePuedeSaltar(pasos, indice) ? <Enlace tono="apagado" onClick={() => avanzar(false)}>{t('bienvenida.saltar')}</Enlace> : null}
        </div>
      </div>
    </main>
  );
}
