import { useState } from 'react';
import { Boton, CampoMono, Enlace } from '@moldes/ui';
import { api, ErrorDeApi } from '../comun/api';
import { useNavegar } from '../comun/navegacion';
import { RUTAS } from '../rutas';
import { MarcoDeAcceso } from './Marco';
import { useT } from './textos';

/**
 * P6 · Recuperación (`/auth/2fa/recuperar`, desde P3).
 *
 * El código de respaldo **no usa la casilla de 6**: tiene diez caracteres y va
 * en el campo monoespaciado del molde (`CampoMono`), con espacios permitidos.
 * La regla es del kit y no cambió: `POST /api/respaldo/usar` (con
 * `@SinSegundoPaso`) borra el autenticador viejo y `App` manda a P4 a
 * configurar uno nuevo; nunca es un atajo hacia los datos.
 *
 * Mi espacio es de **rescate solo** (fase-2 §8): por eso el segundo enlace,
 * «Tampoco tengo los códigos» → P6b.
 */
export function Recuperar({ alRecuperar }: { alRecuperar: () => void }) {
  const { t } = useT();
  const navegar = useNavegar();
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
      /* NUESTRO texto, nunca el del servidor (ver `comun/api.ts`). */
      setError(fallo instanceof ErrorDeApi && fallo.estado === 400 ? t('auth.recover.invalid') : t('auth.error.generic'));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <MarcoDeAcceso antetitulo={t('auth.recover.eyebrow')} titulo={t('auth.recover.title')} subtitulo={t('auth.recover.subtitle')}>
      <form className="acceso__formulario" onSubmit={usar} noValidate>
        <CampoMono
          id="respaldo"
          aria-label={t('auth.recover.label')}
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.toUpperCase())}
          autoComplete="one-time-code"
          autoCapitalize="characters"
          spellCheck={false}
          autoFocus
          error={error ?? undefined}
        />
        <Boton type="submit" ancho="completo" flecha cargando={enviando}>{t('auth.recover.continue')}</Boton>
      </form>
      <div className="acceso__enlaces">
        <Enlace href={RUTAS.reto} onClick={(e) => { e.preventDefault(); navegar(RUTAS.reto); }}>{t('auth.recover.back')}</Enlace>
        <Enlace tono="apagado" href={RUTAS.reseteo} onClick={(e) => { e.preventDefault(); navegar(RUTAS.reseteo); }}>{t('auth.recover.noCodes')}</Enlace>
      </div>
    </MarcoDeAcceso>
  );
}
