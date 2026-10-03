import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { intentosQueQuedan } from '@codice/core';
import { OtpInput } from '../comun/OtpInput';
import { BotonDeAcceso, EnlacesDeAcceso, Etiqueta, MarcoDeAcceso, useTextos } from './Marco';
import { verificarTotp } from './totp';

/**
 * P8 · Confirmación para una acción sensible (`@PasoReciente` del kit) —
 * guion v1, §4. Hoy la única acción así en Mi espacio es regenerar los códigos
 * de respaldo (Ajustes → Seguridad): si la API contesta
 * `PASO_RECIENTE_REQUERIDO`, se muestra esto, y con el código bien puesto se
 * reintenta la acción.
 *
 * Sin código de respaldo, como el reto de acción del kit (`TotpChallenge`
 * con `onCancel`): consumir uno no refresca el `amr` que mira el servidor, y
 * ofrecerlo sería mandar a la persona a un callejón. La salida es «Cancelar».
 */
export function Confirmacion({ alConfirmar, alCancelar }: { alConfirmar: () => void; alCancelar: () => void }) {
  const { ta } = useTextos();
  const { t } = useTranslation();
  const [codigo, setCodigo] = useState('');
  const [fallidos, setFallidos] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [verificando, setVerificando] = useState(false);
  const sinIntentos = intentosQueQuedan(fallidos) === 0;

  async function confirmar(valor: string) {
    if (valor.length !== 6) return document.getElementById('paso-reciente')?.focus();
    if (sinIntentos || verificando) return;
    setError(null);
    setVerificando(true);
    const r = await verificarTotp(valor);
    setVerificando(false);
    if (r === 'ok') return alConfirmar();
    if (r === 'fallo') return setError(t('comun.errorGenerico'));
    const n = fallidos + 1;
    setFallidos(n);
    setError(ta('code.wrong', { n: intentosQueQuedan(n) }));
  }

  return (
    <MarcoDeAcceso centrada antetitulo={ta('stepup.eyebrow')} titulo={ta('stepup.title')} subtitulo={ta('stepup.subtitle')}>
      <form className="acceso__codigo" onSubmit={(e) => { e.preventDefault(); void confirmar(codigo); }} noValidate>
        <Etiqueta htmlFor="paso-reciente">{ta('code.label')}</Etiqueta>
        <OtpInput
          id="paso-reciente"
          value={codigo}
          onChange={setCodigo}
          onComplete={(c) => void confirmar(c)}
          errores={fallidos}
          disabled={verificando || sinIntentos}
          autoFocus
          aria-describedby={error ? 'paso-reciente-error' : undefined}
        />
        {error ? <p className="acceso__error" id="paso-reciente-error" role="alert">{error}</p> : null}
        <BotonDeAcceso ancho cargando={verificando} disabled={sinIntentos}>{ta('enroll.confirm')}</BotonDeAcceso>
      </form>
      <EnlacesDeAcceso>
        <button type="button" className="acceso__enlace acceso__enlace--apagado" onClick={alCancelar}>{ta('stepup.cancel')}</button>
      </EnlacesDeAcceso>
    </MarcoDeAcceso>
  );
}
