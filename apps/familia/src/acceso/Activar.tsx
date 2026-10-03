import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { intentosQueQuedan } from '@codice/core';
import { supabase } from '../supabase';
import { OtpInput } from '../comun/OtpInput';
import { nombreDelAutenticador } from '../seguridad-512/nucleo/nombres';
import { BotonDeAcceso, EnlacesDeAcceso, Etiqueta, MarcoDeAcceso, useTextos } from './Marco';
import { verificarTotp } from './totp';

/**
 * P4 · Activar el autenticador (`/auth/2fa/activar`), obligatoria para el
 * equipo — guion v1, §4. **Sin forma de saltearla**: la única salida es
 * cerrar sesión (regla del kit: un «después» es un «nunca» con buenos modales).
 *
 * El QR sale de Supabase (`auth.mfa.enroll()` lo devuelve dibujado como `data:`
 * de SVG; por eso la CSP lleva `img-src 'self' data:`), sin biblioteca de QR.
 * «Abrir en mi app de autenticación» es el enlace `otpauth://`, para quien
 * está en el mismo teléfono que muestra el QR.
 */
export function Activar({ alTerminar, alSalir }: { alTerminar: () => void; alSalir: () => void }) {
  const { ta } = useTextos();
  const { t } = useTranslation();
  const [factor, setFactor] = useState<{ id: string; qr: string; secreto: string; uri: string } | null>(null);
  const [codigo, setCodigo] = useState('');
  const [fallidos, setFallidos] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [copiada, setCopiada] = useState(false);
  const sinIntentos = intentosQueQuedan(fallidos) === 0;

  useEffect(() => {
    let vivo = true;
    void (async () => {
      /* El nombre sale del núcleo del kit: «Armando Duarte» y la fecha. */
      const { data, error: fallo } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: nombreDelAutenticador() });
      if (!vivo) return;
      if (fallo || !data) return setError(t('comun.errorGenerico'));
      setFactor({ id: data.id, qr: data.totp.qr_code, secreto: data.totp.secret, uri: data.totp.uri });
    })();
    return () => { vivo = false; };
  }, [t]);

  async function confirmar(valor: string) {
    if (valor.length !== 6) return document.getElementById('totp')?.focus();
    if (!factor || sinIntentos || confirmando) return;
    setError(null);
    setConfirmando(true);
    const r = await verificarTotp(valor, factor.id);
    setConfirmando(false);
    if (r === 'ok') return alTerminar();
    if (r === 'fallo') return setError(t('comun.errorGenerico'));
    const n = fallidos + 1;
    setFallidos(n);
    setError(ta('code.wrong', { n: intentosQueQuedan(n) }));
  }

  return (
    <MarcoDeAcceso centrada antetitulo={ta('enroll.eyebrow')} titulo={ta('enroll.title')} subtitulo={ta('enroll.subtitle')}>
      <div className="acceso__qr">
        {/* `alt` vacío: el QR no se puede leer en voz alta, y la alternativa
            real —abrir la app o copiar la clave— está justo abajo. */}
        {factor ? <img src={factor.qr} alt="" width={200} height={200} /> : <span className="acceso__qr-vacio" />}
      </div>
      <div className="acceso__chicos">
        {factor ? <a className="acceso__chico" href={factor.uri}>{ta('enroll.open')}</a> : null}
        {factor ? (
          <button
            type="button"
            className="acceso__chico"
            aria-pressed={copiada}
            onClick={() => { void navigator.clipboard?.writeText(factor.secreto); setCopiada(true); }}
          >
            {ta('enroll.copy')}
          </button>
        ) : null}
      </div>
      <form className="acceso__codigo" onSubmit={(e) => { e.preventDefault(); void confirmar(codigo); }} noValidate>
        <Etiqueta htmlFor="totp">{ta('enroll.confirmLabel')}</Etiqueta>
        <OtpInput
          id="totp"
          value={codigo}
          onChange={setCodigo}
          onComplete={(c) => void confirmar(c)}
          errores={fallidos}
          disabled={!factor || confirmando || sinIntentos}
          aria-describedby={error ? 'totp-error' : undefined}
        />
        {error ? <p className="acceso__error" id="totp-error" role="alert">{error}</p> : null}
        <BotonDeAcceso ancho cargando={confirmando} disabled={!factor || sinIntentos}>{ta('enroll.confirm')}</BotonDeAcceso>
      </form>
      <EnlacesDeAcceso>
        <button type="button" className="acceso__enlace acceso__enlace--apagado" onClick={alSalir}>{ta('signout')}</button>
      </EnlacesDeAcceso>
    </MarcoDeAcceso>
  );
}
