import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../comun/api';
import { EnlaceInterno } from '../comun/navegacion';
import { RUTAS } from '../rutas';
import { BotonDeAcceso, EnlacesDeAcceso, MarcoDeAcceso, useTextos } from './Marco';

/**
 * P6b · Reseteo con espera (`/auth/2fa/reseteo`) — guion v1, §4. Solo en apps
 * de **rescate solo**, y Mi espacio lo es.
 *
 * ── Sin backend, y declarado ────────────────────────────────────────────
 * La lógica del reseteo (pedirlo, el correo de confirmación, las 48 horas, que
 * se pueda cancelar) es del **núcleo del kit** (§3.3, auto-rescate), y el kit
 * v1.1.0 **no la trae**: no hay nada de rescate en `nucleo/` ni en la
 * referencia de Cenit. La orden #35 dice que eso se resuelve en el kit y no con
 * un parche acá. Así que esta pantalla hace exactamente una cosa: pide
 * `POST /api/rescate/pedir` y, si contesta `{ vence }`, muestra la espera con la
 * fecha y la hora. **Hoy esa ruta no existe** en la API: el pedido falla y la
 * pantalla lo dice con el error genérico. El día que el kit traiga el
 * auto-rescate, esto funciona sin tocar una línea.
 */
export function Reseteo() {
  const { ta, idioma } = useTextos();
  const { t } = useTranslation();
  const [vence, setVence] = useState<Date | null>(null);
  const [pidiendo, setPidiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pedir(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPidiendo(true);
    try {
      const r = await api<{ vence: string }>('rescate/pedir', { metodo: 'POST' });
      setVence(new Date(r.vence));
    } catch {
      setError(t('comun.errorGenerico'));
    } finally {
      setPidiendo(false);
    }
  }

  if (vence) {
    const fecha = new Intl.DateTimeFormat(idioma === 'es' ? 'es-MX' : idioma === 'pt' ? 'pt-BR' : 'en-US', {
      weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit',
    }).format(vence);
    return (
      <MarcoDeAcceso antetitulo={ta('reset.eyebrow')} titulo={ta('reset.waitTitle')} subtitulo={ta('reset.waitSubtitle', { fecha })}>
        <EnlacesDeAcceso>
          <EnlaceInterno a={RUTAS.reto} className="acceso__enlace">{ta('recover.back')}</EnlaceInterno>
        </EnlacesDeAcceso>
      </MarcoDeAcceso>
    );
  }

  return (
    <MarcoDeAcceso antetitulo={ta('reset.eyebrow')} titulo={ta('reset.title')} subtitulo={ta('reset.subtitle')}>
      <form onSubmit={pedir} noValidate>
        {error ? <p className="acceso__error" role="alert">{error}</p> : null}
        <div className="acceso__acciones">
          <BotonDeAcceso cargando={pidiendo}>{ta('reset.request')}</BotonDeAcceso>
        </div>
      </form>
      <EnlacesDeAcceso>
        <EnlaceInterno a={RUTAS.recuperar} className="acceso__enlace">{ta('recover.back')}</EnlaceInterno>
      </EnlacesDeAcceso>
    </MarcoDeAcceso>
  );
}
