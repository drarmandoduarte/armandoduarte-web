import { useEffect, useRef, useState } from 'react';
import { Boton, Enlace, OtpInput, type OtpInputHandle } from '@moldes/ui';
import { intentosQueQuedan } from '@codice/core';
import { supabase } from '../supabase';
import { nombreDelAutenticador } from './nucleo/nombres';
import { ErrorDeAcceso, MarcoDeAcceso, Rotulo } from './Marco';
import { useT } from './textos';
import { verificarTotp } from './totp';

/**
 * P4 · Activar el autenticador (`/auth/2fa/activar`), obligatoria para el
 * equipo. **Sin forma de saltearla**: la única salida es cerrar sesión (regla
 * del kit: un «después» es un «nunca» con buenos modales). También es adonde
 * llega quien terminó un rescate (#37 PR 2, §8): su autenticador viejo se borró
 * y el núcleo la manda acá.
 *
 * El QR sale de Supabase (`auth.mfa.enroll()` lo devuelve dibujado como `data:`
 * de SVG; por eso la CSP lleva `img-src 'self' data:`), sin biblioteca de QR.
 * «Abrir en mi app de autenticación» es el enlace `otpauth://`, para quien
 * está en el mismo teléfono que muestra el QR.
 */
export function Activar({ alTerminar, alSalir }: { alTerminar: () => void; alSalir: () => void }) {
  const { t } = useT();
  const otp = useRef<OtpInputHandle>(null);
  const [factor, setFactor] = useState<{ id: string; qr: string; secreto: string; uri: string } | null>(null);
  const [codigo, setCodigo] = useState('');
  const [fallidos, setFallidos] = useState(0);
  const [mal, setMal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const sinIntentos = intentosQueQuedan(fallidos) === 0;
  const errorGenerico = t('auth.error.generic');

  useEffect(() => {
    let vivo = true;
    void (async () => {
      /* El nombre sale del núcleo del kit: «Armando Duarte» y la fecha. */
      const { data, error: fallo } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: nombreDelAutenticador() });
      if (!vivo) return;
      if (fallo || !data) return setError(errorGenerico);
      setFactor({ id: data.id, qr: data.totp.qr_code, secreto: data.totp.secret, uri: data.totp.uri });
    })();
    return () => { vivo = false; };
  }, [errorGenerico]);

  async function confirmar(valor: string) {
    if (valor.length !== 6) return otp.current?.focus();
    if (!factor || sinIntentos || confirmando) return;
    setError(null);
    setConfirmando(true);
    const r = await verificarTotp(valor, factor.id);
    setConfirmando(false);
    if (r === 'ok') return alTerminar();
    if (r === 'fallo') return setError(errorGenerico);
    const n = fallidos + 1;
    setFallidos(n);
    setMal(true);
    setError(t('auth.code.wrong', { n: intentosQueQuedan(n) }));
    otp.current?.reset();
  }

  return (
    <MarcoDeAcceso centrada antetitulo={t('auth.enroll.eyebrow')} titulo={t('auth.enroll.title')} subtitulo={t('auth.enroll.subtitle')}>
      <div className="acceso__qr">
        {/* `alt` vacío: el QR no se puede leer en voz alta, y la alternativa
            real —abrir la app o copiar la clave— está justo abajo. */}
        {factor ? <img src={factor.qr} alt="" width={200} height={200} /> : <span className="acceso__qr-vacio" />}
      </div>
      {factor ? (
        <div className="acceso__chicos">
          <Enlace href={factor.uri}>{t('auth.enroll.open')}</Enlace>
          <Enlace onClick={() => { void navigator.clipboard?.writeText(factor.secreto); }}>{t('auth.enroll.copy')}</Enlace>
        </div>
      ) : null}
      <form className="acceso__formulario" onSubmit={(e) => { e.preventDefault(); void confirmar(codigo); }} noValidate>
        <Rotulo>{t('auth.enroll.confirmLabel')}</Rotulo>
        <OtpInput
          ref={otp}
          value={codigo}
          onChange={(v) => { setCodigo(v); setMal(false); }}
          onCompleto={(c) => void confirmar(c)}
          error={mal}
          disabled={!factor || confirmando || sinIntentos}
          aria-label={t('auth.enroll.confirmLabel')}
        />
        {error ? <ErrorDeAcceso>{error}</ErrorDeAcceso> : null}
        <Boton type="submit" ancho="completo" cargando={confirmando} disabled={!factor || sinIntentos}>{t('auth.enroll.confirm')}</Boton>
      </form>
      <div className="acceso__enlaces">
        <Enlace tono="apagado" onClick={alSalir}>{t('auth.signout')}</Enlace>
      </div>
    </MarcoDeAcceso>
  );
}
