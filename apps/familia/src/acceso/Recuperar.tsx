import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api, ErrorDeApi } from '../comun/api';
import { EnlaceInterno } from '../comun/navegacion';
import { RUTAS } from '../rutas';
import { BotonDeAcceso, EnlacesDeAcceso, MarcoDeAcceso, useTextos } from './Marco';

/**
 * P6 · Recuperación (`/auth/2fa/recuperar`, desde P3) — guion v1, §4.
 *
 * El código de respaldo **no usa la casilla de 6** (§3): tiene diez caracteres
 * y va en un campo único, monoespaciado, con espacios permitidos. La regla es
 * del kit y no cambió: `POST /api/respaldo/usar` (una de las dos rutas con
 * `@SinSegundoPaso`) borra el autenticador viejo y `App` manda a P4 a
 * configurar uno nuevo; nunca es un atajo hacia los datos.
 *
 * Mi espacio es de **rescate solo** (Armando no resetea el autenticador de
 * nadie, #13): por eso el segundo enlace, «Tampoco tengo los códigos» → P6b.
 */
export function Recuperar({ alRecuperar }: { alRecuperar: () => void }) {
  const { ta } = useTextos();
  const { t } = useTranslation();
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function usar(e: React.FormEvent) {
    e.preventDefault();
    if (codigo.replace(/\s+/g, '').length < 10) return document.getElementById('respaldo')?.focus();
    setError(null);
    setEnviando(true);
    try {
      await api('respaldo/usar', { metodo: 'POST', cuerpo: { codigo: codigo.replace(/\s+/g, '').toUpperCase() } });
      alRecuperar();
    } catch (fallo) {
      /* NUESTRO texto, nunca el del servidor (ver `comun/api.ts`). El guion no
         trae uno para «ese código no sirve»; va el de la casa (informe #35). */
      setError(fallo instanceof ErrorDeApi && fallo.estado === 400 ? t('acceso.respaldoInvalido') : t('comun.errorGenerico'));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <MarcoDeAcceso antetitulo={ta('recover.eyebrow')} titulo={ta('recover.title')} subtitulo={ta('recover.subtitle')}>
      <form onSubmit={usar} noValidate>
        {/* El guion no pone etiqueta visible en P6 (§4): el campo se nombra para
            el lector de pantalla con la palabra del antetítulo. */}
        <input
          id="respaldo"
          aria-label={ta('recover.eyebrow')}
          className="acceso__campo acceso__campo--mono"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.toUpperCase())}
          autoComplete="one-time-code"
          autoCapitalize="characters"
          spellCheck={false}
          autoFocus
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'respaldo-error' : undefined}
        />
        {error ? <p className="acceso__error" id="respaldo-error" role="alert">{error}</p> : null}
        <div className="acceso__acciones acceso__acciones--ancho">
          <BotonDeAcceso ancho flecha cargando={enviando}>{ta('recover.continue')}</BotonDeAcceso>
        </div>
      </form>
      <EnlacesDeAcceso>
        <EnlaceInterno a={RUTAS.reto} className="acceso__enlace">{ta('recover.back')}</EnlaceInterno>
        <EnlaceInterno a={RUTAS.reseteo} className="acceso__enlace acceso__enlace--apagado">{ta('recover.noCodes')}</EnlaceInterno>
      </EnlacesDeAcceso>
    </MarcoDeAcceso>
  );
}
