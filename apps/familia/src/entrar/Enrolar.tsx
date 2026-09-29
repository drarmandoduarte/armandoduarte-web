import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabase';
import { BotonPrincipal, CampoDeCodigo, Pantalla } from '../comun/Piezas';
import { nombreDelAutenticador } from '../seguridad-512/nucleo/nombres';

/**
 * PANTALLA 2 · el autenticador, obligatorio para el equipo.
 *
 * ── Sin botón de «después» ──────────────────────────────────────────────
 * Es del kit y no se negocia: una cuenta de equipo ve datos de otras personas
 * —nombres, WhatsApp, comprobantes de pago— y el segundo paso es la única
 * defensa si le roban la contraseña… que acá ni existe, porque se entra con un
 * código al correo. Un «después» es un «nunca» con buenos modales. La única
 * salida de esta pantalla es cerrar sesión.
 *
 * ── El QR sale de Supabase, sin dependencias ────────────────────────────
 * `auth.mfa.enroll()` devuelve `totp.qr_code` ya dibujado, como un `data:` URL
 * de SVG. Por eso la CSP de esta app lleva `img-src 'self' data:` y la web
 * pública no: es la única razón, y está escrita acá para que nadie la afloje
 * «por las dudas» más adelante. No entra ninguna biblioteca de QR — una
 * dependencia que la orden no pide no entra (CLAUDE.md).
 *
 * ── El handoff `otpauth://`, para quien está en el celular ──────────────
 * Escanear un QR con el mismo teléfono que lo muestra es imposible. El enlace
 * `otpauth://` abre la app de autenticación directamente, que es lo que hace
 * usable esta pantalla en un celular — y es la mitad de los casos.
 */
export function Enrolar({ alTerminar }: { alTerminar: () => void }) {
  const { t } = useTranslation();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [secreto, setSecreto] = useState<string | null>(null);
  const [uri, setUri] = useState<string | null>(null);
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [copiada, setCopiada] = useState(false);

  useEffect(() => {
    let vivo = true;
    void (async () => {
      const { data, error: fallo } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        /* El nombre sale del núcleo del kit, que lo arma con el nombre de la
           app de `seguridad-512.config.ts` («Armando Duarte») y la fecha. La
           fecha distingue dos enrolamientos sucesivos de la misma persona. */
        friendlyName: nombreDelAutenticador(),
      });
      if (!vivo) return;
      if (fallo || !data) return setError(t('comun.errorGenerico'));
      setFactorId(data.id);
      setQr(data.totp.qr_code);
      setSecreto(data.totp.secret);
      setUri(data.totp.uri);
    })();
    return () => { vivo = false; };
  }, [t]);

  async function confirmar(evento: React.FormEvent) {
    evento.preventDefault();
    if (!factorId) return;
    setError(null);
    setConfirmando(true);
    const reto = await supabase.auth.mfa.challenge({ factorId });
    if (reto.error || !reto.data) {
      setConfirmando(false);
      return setError(t('comun.errorGenerico'));
    }
    const { error: fallo } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: reto.data.id,
      code: codigo,
    });
    setConfirmando(false);
    if (fallo) return setError(t('enrolar.codigoInvalido'));
    alTerminar();
  }

  return (
    <Pantalla arriba>
      <h1 className="titulo">{t('enrolar.titulo')}</h1>
      <p className="bajada">{t('enrolar.bajada')}</p>

      <div className="seccion">
        <h2 className="subtitulo">{t('enrolar.paso1')}</h2>
        <p className="nota">{t('enrolar.paso1Ayuda')}</p>
      </div>

      <div className="seccion">
        <h2 className="subtitulo">{t('enrolar.paso2')}</h2>
        <p className="nota">{t('enrolar.paso2Ayuda')}</p>
        {qr ? (
          <div className="qr">
            {/* `alt` vacío y `aria-hidden`: el QR no es información que un
                lector de pantalla pueda leer, y la alternativa real —la clave a
                mano— está justo abajo, en texto. Un `alt` que dijera «código
                QR» sería ruido sin salida. */}
            <img src={qr} alt="" aria-hidden="true" width={200} height={200} />
          </div>
        ) : null}
        {uri ? (
          <div className="fila">
            <a className="btn btn--ancho" href={uri}>{t('enrolar.abrirEnElCelular')}</a>
          </div>
        ) : null}
        {secreto ? (
          <>
            <p className="nota u-mt-4">{t('enrolar.aMano')}</p>
            <p className="clave-a-mano">{secreto}</p>
            <button
              type="button"
              className="enlace"
              onClick={() => { void navigator.clipboard?.writeText(secreto); setCopiada(true); }}
            >
              {copiada ? t('enrolar.copiada') : t('enrolar.copiarClave')}
            </button>
          </>
        ) : null}
      </div>

      <div className="seccion">
        <h2 className="subtitulo">{t('enrolar.paso3')}</h2>
        <form onSubmit={confirmar} noValidate>
          <CampoDeCodigo
            id="totp"
            rotulo={t('reto.codigoEtiqueta')}
            valor={codigo}
            alCambiar={setCodigo}
            error={error}
          />
          <div className="fila">
            <BotonPrincipal cargando={confirmando} textoCargando={t('enrolar.confirmando')}>
              {t('enrolar.confirmar')}
            </BotonPrincipal>
          </div>
        </form>
        <p className="nota u-mt-4">{t('enrolar.sinSalida')}</p>
      </div>
    </Pantalla>
  );
}
