import { useRef, useState } from 'react';
import { Boton, Enlace, OtpInput, type OtpInputHandle } from '@moldes/ui';
import { intentosQueQuedan } from '@codice/core';
import { ErrorDeAcceso, MarcoDeAcceso, Rotulo } from './Marco';
import { useT } from './textos';
import { verificarTotp } from './totp';

/**
 * P8 · Confirmación para una acción sensible (`@PasoReciente` del kit). Hoy la
 * única acción así en Mi espacio es regenerar los códigos de respaldo (Ajustes
 * → Seguridad): si la API contesta `PASO_RECIENTE_REQUERIDO`, se muestra esto,
 * y con el código bien puesto se reintenta la acción.
 *
 * Sin código de respaldo: consumir uno no refresca el `amr` que mira el
 * servidor, y ofrecerlo sería mandar a la persona a un callejón. La salida es
 * «Cancelar».
 */
export function Confirmacion({ alConfirmar, alCancelar }: { alConfirmar: () => void; alCancelar: () => void }) {
  const { t } = useT();
  const otp = useRef<OtpInputHandle>(null);
  const [codigo, setCodigo] = useState('');
  const [fallidos, setFallidos] = useState(0);
  const [mal, setMal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificando, setVerificando] = useState(false);
  const sinIntentos = intentosQueQuedan(fallidos) === 0;

  async function confirmar(valor: string) {
    if (valor.length !== 6) return otp.current?.focus();
    if (sinIntentos || verificando) return;
    setError(null);
    setVerificando(true);
    const r = await verificarTotp(valor);
    setVerificando(false);
    if (r === 'ok') return alConfirmar();
    if (r === 'fallo') return setError(t('auth.error.generic'));
    const n = fallidos + 1;
    setFallidos(n);
    setMal(true);
    setError(t('auth.code.wrong', { n: intentosQueQuedan(n) }));
    otp.current?.reset();
  }

  return (
    <MarcoDeAcceso centrada antetitulo={t('auth.stepup.eyebrow')} titulo={t('auth.stepup.title')} subtitulo={t('auth.stepup.subtitle')}>
      <form className="acceso__formulario" onSubmit={(e) => { e.preventDefault(); void confirmar(codigo); }} noValidate>
        <Rotulo>{t('auth.code.label')}</Rotulo>
        <OtpInput
          ref={otp}
          value={codigo}
          onChange={(v) => { setCodigo(v); setMal(false); }}
          onCompleto={(c) => void confirmar(c)}
          error={mal}
          disabled={verificando || sinIntentos}
          autoFocus
          aria-label={t('auth.code.label')}
        />
        {error ? <ErrorDeAcceso>{error}</ErrorDeAcceso> : null}
        <Boton type="submit" ancho="completo" cargando={verificando} disabled={sinIntentos}>{t('auth.enroll.confirm')}</Boton>
      </form>
      <div className="acceso__enlaces">
        <Enlace tono="apagado" onClick={alCancelar}>{t('auth.stepup.cancel')}</Enlace>
      </div>
    </MarcoDeAcceso>
  );
}
