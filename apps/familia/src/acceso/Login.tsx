import { useEffect, useState } from 'react';
import { SEGUNDOS_PARA_REENVIAR, intentosQueQuedan } from '@codice/core';
import { supabase } from '../supabase';
import { OtpInput } from '../comun/OtpInput';
import { useNavegar } from '../comun/navegacion';
import { RUTAS, WEB } from '../rutas';
import { consumeInactivityLogout, consumeSesionDesaparecida } from '../seguridad-512/nucleo/useAalWindow';
import { BotonDeAcceso, EnlacesDeAcceso, Etiqueta, MarcoDeAcceso, useTextos } from './Marco';

/**
 * P1 · Entrada (`/login`) y P2 · Código por correo (`/login/codigo`) — guion v1
 * del Kit 512, §4 (orden #35). Y P7 · Sesión cerrada, que es lo que ve quien
 * vuelve después de 30 minutos sin actividad.
 *
 * Lo del kit que no cambió: sin contraseña y sin «registrarse» (la cuenta nace
 * con el primer código: `signInWithOtp` con `shouldCreateUser`); Google arriba
 * y el correo a un separador de distancia; la sesión la decide
 * `onAuthStateChange` en `App`, no esta pantalla.
 *
 * P2 tiene su dirección (`/login/codigo`, como pide el guion), pero el correo
 * vive en la memoria de esta pantalla: si alguien recarga en `/login/codigo`,
 * no hay a qué correo verificar y se vuelve a P1. No se guarda en el navegador
 * a propósito: es un dato de la persona.
 */
export function Login({ ruta }: { ruta: string }) {
  const { ta, i18n } = useTextos();
  const t = i18n.t.bind(i18n);
  const navegar = useNavegar();
  const [correo, setCorreo] = useState('');
  const [enviado, setEnviado] = useState<string | null>(null);
  const [codigo, setCodigo] = useState('');
  const [fallidos, setFallidos] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [correoMal, setCorreoMal] = useState(false);
  const [segundos, setSegundos] = useState(0);
  /* P7: el aviso del kit se consume una sola vez. */
  const [sesionCerrada, setSesionCerrada] = useState(() => consumeInactivityLogout());
  /* El otro aviso del kit, que el guion no cubre (la orden #35 lo deja): la
     sesión desapareció sin que nadie la cerrara. Una línea en P1, una vez. */
  const [sesionPerdida] = useState(() => !sesionCerrada && consumeSesionDesaparecida());

  const enCodigo = ruta === RUTAS.loginCodigo && enviado !== null;

  /* `/login/codigo` sin correo en memoria (recarga, enlace pegado): a P1. */
  useEffect(() => {
    if (ruta === RUTAS.loginCodigo && enviado === null) navegar(`${RUTAS.login}${window.location.search}`);
  }, [ruta, enviado, navegar]);

  useEffect(() => {
    if (segundos <= 0) return;
    const reloj = window.setTimeout(() => setSegundos((s) => s - 1), 1000);
    return () => window.clearTimeout(reloj);
  }, [segundos]);

  async function pedirCodigo(direccion: string) {
    setError(null);
    setEnviando(true);
    const { error: fallo } = await supabase.auth.signInWithOtp({ email: direccion, options: { shouldCreateUser: true } });
    setEnviando(false);
    /* El guion no trae texto para «no se pudo mandar»: va el genérico de la
       casa, que existe solo en español (declarado en el informe #35). */
    if (fallo) return setError(t('comun.errorGenerico'));
    setEnviado(direccion);
    setCodigo('');
    setFallidos(0);
    setSegundos(SEGUNDOS_PARA_REENVIAR);
    if (ruta !== RUTAS.loginCodigo) navegar(`${RUTAS.loginCodigo}${window.location.search}`);
  }

  async function verificar(valor: string) {
    if (valor.length !== 6) return document.getElementById('codigo')?.focus();
    if (!enviado || intentosQueQuedan(fallidos) === 0) return;
    setError(null);
    setEnviando(true);
    const { error: fallo } = await supabase.auth.verifyOtp({ email: enviado, token: valor, type: 'email' });
    setEnviando(false);
    if (fallo) {
      const n = fallidos + 1;
      setFallidos(n);
      setError(ta('code.wrong', { n: intentosQueQuedan(n) }));
    }
    /* Bien: no se navega a mano. `onAuthStateChange` avisa y `App` decide. */
  }

  async function conGoogle() {
    setError(null);
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
  }

  if (sesionCerrada) {
    return (
      <MarcoDeAcceso antetitulo={ta('session.eyebrow')} titulo={ta('session.title')} subtitulo={ta('session.subtitle')}>
        <div className="acceso__acciones">
          <BotonDeAcceso type="button" flecha onClick={() => setSesionCerrada(false)}>{ta('session.again')}</BotonDeAcceso>
        </div>
      </MarcoDeAcceso>
    );
  }

  if (enCodigo) {
    const sinIntentos = intentosQueQuedan(fallidos) === 0;
    return (
      <MarcoDeAcceso
        centrada
        antetitulo={ta('code.eyebrow')}
        titulo={ta('code.title')}
        subtitulo={ta('code.subtitle', { email: enviado })}
      >
        <form className="acceso__codigo" onSubmit={(e) => { e.preventDefault(); void verificar(codigo); }} noValidate>
          <Etiqueta htmlFor="codigo">{ta('code.label')}</Etiqueta>
          <OtpInput
            id="codigo"
            value={codigo}
            onChange={setCodigo}
            onComplete={(c) => void verificar(c)}
            errores={fallidos}
            disabled={enviando || sinIntentos}
            autoFocus
            aria-describedby={error ? 'codigo-error' : undefined}
          />
          {error ? <p className="acceso__error" id="codigo-error" role="alert">{error}</p> : null}
          <BotonDeAcceso ancho cargando={enviando} disabled={sinIntentos}>{ta('code.enter')}</BotonDeAcceso>
        </form>
        <EnlacesDeAcceso>
          {segundos > 0 ? (
            <span className="acceso__enlace acceso__enlace--espera" aria-live="polite">{ta('code.resendIn', { s: segundos })}</span>
          ) : (
            <button type="button" className="acceso__enlace" onClick={() => void pedirCodigo(enviado)}>{ta('code.resend')}</button>
          )}
          <button
            type="button"
            className="acceso__enlace acceso__enlace--apagado"
            onClick={() => { setEnviado(null); setCodigo(''); setFallidos(0); setError(null); navegar(`${RUTAS.login}${window.location.search}`); }}
          >
            {ta('code.otherEmail')}
          </button>
        </EnlacesDeAcceso>
      </MarcoDeAcceso>
    );
  }

  const correoValido = /.+@.+\..+/.test(correo.trim());
  return (
    <MarcoDeAcceso
      titulo={ta('login.title')}
      subtitulo={ta('login.subtitle')}
      pie={(
        <p className="acceso__legal">
          <LegalConEnlaces texto={ta('legal')} />
        </p>
      )}
    >
      {sesionPerdida ? <p className="acceso__aviso" role="status">{t('acceso.sesionPerdida')}</p> : null}
      <button type="button" className="acceso__google" onClick={() => void conGoogle()}>
        {/* El logo de Google sin recolorear: marca de un tercero, la única
            excepción de color de la app (`check:tokens`, tope 1). */}
        <img src="/img/google.svg" width={20} height={20} alt="" />
        <span>{ta('google')}</span>
      </button>
      <div className="acceso__separador" aria-hidden="true"><span /></div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          /* El botón no se apaga (la referencia del kit lo muestra entero con
             el campo vacío): sin un correo válido, se marca el campo y el foco
             vuelve a él. */
          if (correoValido) return void pedirCodigo(correo.trim());
          setCorreoMal(true);
          document.getElementById('correo')?.focus();
        }}
        noValidate
      >
        <Etiqueta htmlFor="correo">{ta('email.label')}</Etiqueta>
        <input
          id="correo"
          className="acceso__campo"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder={ta('email.placeholder')}
          value={correo}
          onChange={(e) => { setCorreo(e.target.value); setCorreoMal(false); }}
          aria-invalid={error || correoMal ? true : undefined}
          aria-describedby={error ? 'correo-error' : undefined}
        />
        {error ? <p className="acceso__error" id="correo-error" role="alert">{error}</p> : null}
        <div className="acceso__acciones">
          <BotonDeAcceso flecha cargando={enviando}>{ta('login.send')}</BotonDeAcceso>
        </div>
      </form>
    </MarcoDeAcceso>
  );
}

/**
 * El pie legal (§2): «Al continuar aceptas nuestros Términos y la Política de
 * Privacidad.», con los dos enlaces. La frase es la del guion, tal cual, y los
 * enlaces se ponen sobre sus palabras — en los tres idiomas son la palabra
 * que empieza con «T» y la frase que empieza con «P» con mayúscula.
 */
function LegalConEnlaces({ texto }: { texto: string }) {
  const m = texto.match(/^(.*?)(Terms|Termos|Términos)(.*?)((?:Política de )?Privac[a-z]+(?: Policy)?|Privacy Policy|Política de Privacidade)(.*)$/);
  if (!m) return <>{texto}</>;
  return (
    <>
      {m[1]}<a href={`${WEB}/terminos`}>{m[2]}</a>{m[3]}<a href={`${WEB}/privacidad`}>{m[4]}</a>{m[5]}
    </>
  );
}
