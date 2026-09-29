import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabase';
import { Aviso, BotonPrincipal, Campo, CampoDeCodigo, Pantalla } from '../comun/Piezas';
import {
  consumeInactivityLogout,
  consumeSesionDesaparecida,
} from '../seguridad-512/nucleo/useAalWindow';

/**
 * PANTALLA 1 · `/entrar` — correo, código de seis dígitos, y Google.
 *
 * ── Sin contraseña, y sin «registrarse» ─────────────────────────────────
 * Es una regla del kit, de las que ninguna app cambia. La cuenta **nace con el
 * primer código**: `signInWithOtp` crea la persona si no existía, y el trigger
 * de la migración `001` le arma su fila en `personas` con el mail y nada más.
 * Por eso no hay dos botones ni dos caminos: una sola pantalla que sirve para
 * entrar y para empezar.
 *
 * ── «Entrar con Google», visible para todos ─────────────────────────────
 * Decisión de dirección del 29/9 (orden #15, G.1), y va **debajo** del código,
 * no arriba: el camino principal es el correo. Un cliente que entra con Google
 * sigue siendo cliente — el rol no sale de cómo entró, sale de si tiene fila en
 * `miembros`.
 *
 * ── Los sesenta segundos para reenviar ──────────────────────────────────
 * No es una decisión de diseño: Supabase rechaza un segundo `signInWithOtp`
 * antes de los 60 s y devuelve un error. Mostrar la cuenta regresiva es
 * decirle a la persona lo que va a pasar en vez de dejarla tocar un botón que
 * falla.
 */
export function Entrar() {
  const { t } = useTranslation();
  const [paso, setPaso] = useState<'correo' | 'codigo'>('correo');
  const [correo, setCorreo] = useState('');
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [segundos, setSegundos] = useState(0);

  /* Los dos avisos del kit. Se consumen una sola vez: si la persona recarga la
     pantalla de entrada, el aviso ya no tiene nada que decir. */
  const [aviso] = useState(() => {
    if (consumeInactivityLogout()) return t('entrar.avisoInactividad');
    if (consumeSesionDesaparecida()) return t('entrar.avisoSesionPerdida');
    return null;
  });

  useEffect(() => {
    if (segundos <= 0) return;
    const reloj = window.setTimeout(() => setSegundos((s) => s - 1), 1000);
    return () => window.clearTimeout(reloj);
  }, [segundos]);

  async function pedirCodigo(evento: React.FormEvent) {
    evento.preventDefault();
    if (!/.+@.+\..+/.test(correo)) return setError(t('entrar.correoInvalido'));
    setError(null);
    setEnviando(true);
    const { error: fallo } = await supabase.auth.signInWithOtp({
      email: correo.trim(),
      options: { shouldCreateUser: true },
    });
    setEnviando(false);
    if (fallo) return setError(t('comun.errorGenerico'));
    setPaso('codigo');
    setSegundos(60);
  }

  async function verificar(evento: React.FormEvent) {
    evento.preventDefault();
    setError(null);
    setEnviando(true);
    const { error: fallo } = await supabase.auth.verifyOtp({
      email: correo.trim(),
      token: codigo,
      type: 'email',
    });
    setEnviando(false);
    if (fallo) return setError(t('entrar.codigoInvalido'));
    /* No se navega a mano: `onAuthStateChange` avisa y `App` decide a dónde,
       que es lo que hace que el flujo sea uno solo y no dos. */
  }

  async function conGoogle() {
    setError(null);
    const { error: fallo } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (fallo) setError(t('comun.errorGenerico'));
  }

  return (
    <Pantalla>
      {aviso ? <Aviso>{aviso}</Aviso> : null}
      <h1 className="titulo">{t('entrar.titulo')}</h1>

      {paso === 'correo' ? (
        <>
          <p className="bajada">{t('entrar.bajada')}</p>
          <form onSubmit={pedirCodigo} noValidate>
            <Campo
              id="correo"
              rotulo={t('entrar.correoEtiqueta')}
              ayuda={t('entrar.correoAyuda')}
              error={error}
              type="email"
              inputMode="email"
              autoComplete="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              autoFocus
            />
            <div className="fila">
              <BotonPrincipal cargando={enviando} textoCargando={t('entrar.enviando')}>
                {t('entrar.enviarCodigo')}
              </BotonPrincipal>
            </div>
          </form>
        </>
      ) : (
        <>
          <h2 className="subtitulo u-mt-4">{t('entrar.codigoTitulo')}</h2>
          <p className="bajada">{t('entrar.codigoBajada', { correo })}</p>
          <form onSubmit={verificar} noValidate>
            <CampoDeCodigo
              id="codigo"
              rotulo={t('entrar.codigoEtiqueta')}
              valor={codigo}
              alCambiar={setCodigo}
              error={error}
              autoFocus
            />
            <div className="fila">
              <BotonPrincipal cargando={enviando} textoCargando={t('entrar.verificando')}>
                {t('entrar.verificar')}
              </BotonPrincipal>
            </div>
          </form>
          <div className="fila fila--suelta">
            <button
              type="button"
              className="enlace"
              onClick={pedirCodigo}
              disabled={segundos > 0}
            >
              {segundos > 0 ? t('entrar.reenviarEn', { segundos }) : t('entrar.reenviar')}
            </button>
            <button type="button" className="enlace" onClick={() => { setPaso('correo'); setCodigo(''); setError(null); }}>
              {t('entrar.cambiarCorreo')}
            </button>
          </div>
        </>
      )}

      {/* Google, debajo del código y visible para todos (decisión del 29/9). */}
      <div className="separador"><span>{t('entrar.oBien')}</span></div>
      <button type="button" className="btn btn--ancho" onClick={conGoogle}>
        {t('entrar.conGoogle')}
      </button>
    </Pantalla>
  );
}
