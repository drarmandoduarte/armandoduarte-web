import { useRef, useState } from 'react';
import { Boton, Enlace, OtpInput, type OtpInputHandle } from '@moldes/ui';
import { intentosQueQuedan } from '@codice/core';
import { useNavegar } from '../comun/navegacion';
import { RUTAS } from '../rutas';
import { ErrorDeAcceso, MarcoDeAcceso, Rotulo } from './Marco';
import { useT } from './textos';
import { verificarTotp } from './totp';

/**
 * P3 · Verificación del autenticador (`/auth/2fa`). Es la pantalla armada de la
 * galería del molde (`PantallaCodigo`), con las piezas del molde.
 *
 * La decisión de mandar acá es del núcleo (`decidirReto()`), no de esta
 * pantalla. Sin «cancelar»: la salida es verificar, usar un código de respaldo
 * (P6) o cerrar sesión.
 */
export function Verificacion({ alVerificar, alSalir }: { alVerificar: () => void; alSalir: () => void }) {
  const { t } = useT();
  const navegar = useNavegar();
  const otp = useRef<OtpInputHandle>(null);
  const [codigo, setCodigo] = useState('');
  const [fallidos, setFallidos] = useState(0);
  const [mal, setMal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificando, setVerificando] = useState(false);
  const sinIntentos = intentosQueQuedan(fallidos) === 0;

  async function verificar(valor: string) {
    if (valor.length !== 6) return otp.current?.focus();
    if (sinIntentos || verificando) return;
    setError(null);
    setVerificando(true);
    const r = await verificarTotp(valor);
    setVerificando(false);
    if (r === 'ok') return alVerificar();
    if (r === 'fallo') return setError(t('auth.error.generic'));
    const n = fallidos + 1;
    setFallidos(n);
    setMal(true);
    setError(t('auth.code.wrong', { n: intentosQueQuedan(n) }));
    otp.current?.reset();
  }

  return (
    <MarcoDeAcceso centrada antetitulo={t('auth.totp.eyebrow')} titulo={t('auth.totp.title')} subtitulo={t('auth.totp.subtitle')}>
      <form className="acceso__formulario" onSubmit={(e) => { e.preventDefault(); void verificar(codigo); }} noValidate>
        <Rotulo>{t('auth.code.label')}</Rotulo>
        <OtpInput
          ref={otp}
          value={codigo}
          onChange={(v) => { setCodigo(v); setMal(false); }}
          onCompleto={(c) => void verificar(c)}
          error={mal}
          disabled={verificando || sinIntentos}
          autoFocus
          aria-label={t('auth.code.label')}
        />
        {error ? <ErrorDeAcceso>{error}</ErrorDeAcceso> : null}
        <Boton type="submit" ancho="completo" cargando={verificando} disabled={sinIntentos}>{t('auth.totp.verify')}</Boton>
      </form>
      <div className="acceso__enlaces">
        <Enlace href={RUTAS.recuperar} onClick={(e) => { e.preventDefault(); navegar(RUTAS.recuperar); }}>{t('auth.totp.lost')}</Enlace>
        <Enlace tono="apagado" onClick={alSalir}>{t('auth.signout')}</Enlace>
      </div>
    </MarcoDeAcceso>
  );
}
