import { useState } from 'react';
import { Boton, Enlace } from '@moldes/ui';
import { api } from '../comun/api';
import { useNavegar } from '../comun/navegacion';
import { RUTAS } from '../rutas';
import { ErrorDeAcceso, MarcoDeAcceso } from './Marco';
import { fechaDeVencimiento, useT } from './textos';

/**
 * P6b · Pedir el reseteo (`/auth/2fa/reseteo`, desde P6) — el rescate solo de
 * Mi espacio (orden #37, PR 2 · fase-2 §8). Nadie resetea el autenticador de
 * otra persona: lo pide ella, y espera 48 horas.
 *
 * Desde la #37 tiene backend (`POST /api/rescate/pedir`). Se pide con el correo
 * de la sesión (la persona ya entró con el código por correo y se quedó en el
 * reto), y en el idioma de la pantalla salen los dos correos: el de
 * confirmación y el de aviso, con el enlace para cancelarlo. La API contesta la
 * fecha y esta pantalla la muestra. Cumplidas las 48 h, al entrar otra vez
 * `App` llama a `POST /api/rescate/aplicar` y el núcleo la manda a P4.
 */
export function Reseteo({ correo }: { correo: string | null }) {
  const { t, idioma } = useT();
  const navegar = useNavegar();
  const [vence, setVence] = useState<Date | null>(null);
  const [pidiendo, setPidiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pedir(e: React.FormEvent) {
    e.preventDefault();
    if (!correo || pidiendo) return setError(correo ? null : t('auth.error.generic'));
    setError(null);
    setPidiendo(true);
    try {
      const r = await api<{ vence: string }>('rescate/pedir', { metodo: 'POST', cuerpo: { correo, idioma } });
      setVence(new Date(r.vence));
    } catch {
      setError(t('auth.error.generic'));
    } finally {
      setPidiendo(false);
    }
  }

  const volver = (a: string) => (
    <Enlace href={a} onClick={(e) => { e.preventDefault(); navegar(a); }}>{t('auth.recover.back')}</Enlace>
  );

  if (vence) {
    return (
      <MarcoDeAcceso
        antetitulo={t('auth.reset.eyebrow')}
        titulo={t('auth.reset.waitTitle')}
        subtitulo={t('auth.reset.waitSubtitle', { fecha: fechaDeVencimiento(vence, idioma) })}
      >
        <div className="acceso__enlaces">{volver(RUTAS.reto)}</div>
      </MarcoDeAcceso>
    );
  }

  return (
    <MarcoDeAcceso antetitulo={t('auth.reset.eyebrow')} titulo={t('auth.reset.title')} subtitulo={t('auth.reset.subtitle')}>
      <form className="acceso__formulario" onSubmit={pedir} noValidate>
        {error ? <ErrorDeAcceso>{error}</ErrorDeAcceso> : null}
        <div><Boton type="submit" cargando={pidiendo}>{t('auth.reset.request')}</Boton></div>
      </form>
      <div className="acceso__enlaces">{volver(RUTAS.recuperar)}</div>
    </MarcoDeAcceso>
  );
}
