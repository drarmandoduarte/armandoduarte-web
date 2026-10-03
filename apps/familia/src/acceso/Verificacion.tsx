import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { intentosQueQuedan } from '@codice/core';
import { OtpInput } from '../comun/OtpInput';
import { EnlaceInterno } from '../comun/navegacion';
import { RUTAS } from '../rutas';
import { BotonDeAcceso, EnlacesDeAcceso, Etiqueta, MarcoDeAcceso, useTextos } from './Marco';
import { verificarTotp } from './totp';

/**
 * P3 · Verificación del autenticador (`/auth/2fa`) — guion v1, §4. Es la
 * captura `03` del kit.
 *
 * La decisión de mandar acá es del núcleo (`decidirReto()`), no de esta
 * pantalla. Sin «cancelar»: la salida es verificar, usar un código de
 * respaldo (P6) o cerrar sesión.
 */
export function Verificacion({ alVerificar, alSalir }: { alVerificar: () => void; alSalir: () => void }) {
  const { ta } = useTextos();
  const { t } = useTranslation();
  const [codigo, setCodigo] = useState('');
  const [fallidos, setFallidos] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [verificando, setVerificando] = useState(false);
  const sinIntentos = intentosQueQuedan(fallidos) === 0;

  async function verificar(valor: string) {
    if (valor.length !== 6) return document.getElementById('totp')?.focus();
    if (sinIntentos || verificando) return;
    setError(null);
    setVerificando(true);
    const r = await verificarTotp(valor);
    setVerificando(false);
    if (r === 'ok') return alVerificar();
    if (r === 'fallo') return setError(t('comun.errorGenerico'));
    const n = fallidos + 1;
    setFallidos(n);
    setError(ta('code.wrong', { n: intentosQueQuedan(n) }));
  }

  return (
    <MarcoDeAcceso centrada antetitulo={ta('totp.eyebrow')} titulo={ta('totp.title')} subtitulo={ta('totp.subtitle')}>
      <form className="acceso__codigo" onSubmit={(e) => { e.preventDefault(); void verificar(codigo); }} noValidate>
        <Etiqueta htmlFor="totp">{ta('code.label')}</Etiqueta>
        <OtpInput
          id="totp"
          value={codigo}
          onChange={setCodigo}
          onComplete={(c) => void verificar(c)}
          errores={fallidos}
          disabled={verificando || sinIntentos}
          autoFocus
          aria-describedby={error ? 'totp-error' : undefined}
        />
        {error ? <p className="acceso__error" id="totp-error" role="alert">{error}</p> : null}
        <BotonDeAcceso ancho cargando={verificando} disabled={sinIntentos}>{ta('totp.verify')}</BotonDeAcceso>
      </form>
      <EnlacesDeAcceso>
        <EnlaceInterno a={RUTAS.recuperar} className="acceso__enlace">{ta('totp.lost')}</EnlaceInterno>
        <button type="button" className="acceso__enlace acceso__enlace--apagado" onClick={alSalir}>{ta('signout')}</button>
      </EnlacesDeAcceso>
    </MarcoDeAcceso>
  );
}
