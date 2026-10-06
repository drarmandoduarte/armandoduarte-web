import { useState } from 'react';
import { Cartel } from '@moldes/ui';
import { leerEnlaceDelRescate } from '@codice/core';
import { api } from '../comun/api';
import { RUTAS } from '../rutas';
import { fechaDeVencimiento, useT } from './textos';

/**
 * `/rescate` — la página que abren los dos enlaces de los correos del rescate
 * solo (orden #37, PR 2 · fase-2 §8): «confirmar» desde el correo de
 * confirmación y «cancelar» desde el de aviso.
 *
 * **No hace nada sola.** Muestra qué va a pasar y un botón, y recién el botón
 * llama a la API: un lector de correo que abre los enlaces para revisarlos (lo
 * hacen varios) no confirma ni cancela nada. Se abre con o sin sesión —se puede
 * abrir en otro aparato— y no pide entrar: vale el token del enlace.
 *
 * Es una pantalla de un solo mensaje y una sola salida: el `Cartel` del molde.
 */
type Paso = 'preguntar' | 'listo' | 'invalido';

export function Rescate() {
  const { t, idioma } = useT();
  const [enlace] = useState(() => leerEnlaceDelRescate(window.location.search));
  const [paso, setPaso] = useState<Paso>(enlace ? 'preguntar' : 'invalido');
  const [vence, setVence] = useState<Date | null>(null);
  const [enviando, setEnviando] = useState(false);
  const irALaEntrada = { texto: t('auth.reset.toLogin'), onClick: () => window.location.assign(RUTAS.login) };

  async function hacer() {
    if (!enlace || enviando) return;
    setEnviando(true);
    try {
      const r = await api<{ vence?: string }>(`rescate/${enlace.accion}`, {
        metodo: 'POST',
        cuerpo: { id: enlace.id, token: enlace.token },
        /* Vale el token del enlace, no la sesión: se puede abrir en otro aparato. */
        sinSesion: true,
      });
      if (r.vence) setVence(new Date(r.vence));
      setPaso('listo');
    } catch {
      setPaso('invalido');
    } finally {
      setEnviando(false);
    }
  }

  if (paso === 'invalido' || !enlace) {
    return <Cartel lang={idioma} antetitulo={t('auth.reset.eyebrow')} titulo={t('auth.reset.invalid.title')} texto={t('auth.reset.invalid.subtitle')} accion={irALaEntrada} />;
  }

  if (paso === 'listo') {
    return enlace.accion === 'confirmar' ? (
      <Cartel
        lang={idioma}
        antetitulo={t('auth.reset.eyebrow')}
        titulo={t('auth.reset.confirmed.title')}
        texto={t('auth.reset.confirmed.subtitle', { fecha: vence ? fechaDeVencimiento(vence, idioma) : '' })}
        accion={irALaEntrada}
      />
    ) : (
      <Cartel lang={idioma} antetitulo={t('auth.reset.eyebrow')} titulo={t('auth.reset.cancelled.title')} texto={t('auth.reset.cancelled.subtitle')} accion={irALaEntrada} />
    );
  }

  const textos = enlace.accion === 'confirmar'
    ? { titulo: t('auth.reset.confirm.title'), texto: t('auth.reset.confirm.subtitle'), boton: t('auth.reset.confirm.button') }
    : { titulo: t('auth.reset.cancel.title'), texto: t('auth.reset.cancel.subtitle'), boton: t('auth.reset.cancel.button') };
  return (
    <Cartel
      lang={idioma}
      antetitulo={t('auth.reset.eyebrow')}
      titulo={textos.titulo}
      texto={textos.texto}
      accion={{ texto: textos.boton, onClick: () => void hacer() }}
    />
  );
}
