import { useEffect, useRef, useState } from 'react';
import { Boton, BotonGoogle, Campo, Cartel, Enlace, OtpInput, PieLegal, Separador, type OtpInputHandle } from '@moldes/ui';
import { SEGUNDOS_PARA_REENVIAR, intentosQueQuedan } from '@codice/core';
import { supabase } from '../supabase';
import { useNavegar } from '../comun/navegacion';
import { RUTAS, WEB } from '../rutas';
import { consumeInactivityLogout, consumeSesionDesaparecida } from './nucleo/useAalWindow';
import { tituloDeEntrada } from './nucleo/titulo-de-entrada';
import { design } from '../molde/arranque';
import { ErrorDeAcceso, MarcoDeAcceso, Rotulo } from './Marco';
import { useT } from './textos';

/**
 * P1 · Entrada (`/login`) y P2 · Código por correo (`/login/codigo`). Y las dos
 * pantallas de un solo mensaje que se ven al volver: P7 · Sesión cerrada (30
 * minutos sin actividad) y P9 · Pasó un tiempo (la sesión desapareció sin que
 * nadie la cerrara). Orden #37, PR 2: las piezas son las del molde.
 *
 * Lo que no cambió: sin contraseña y sin «registrarse» (la cuenta nace con el
 * primer código: `signInWithOtp` con `shouldCreateUser`); Google arriba y el
 * correo a un separador de distancia; la sesión la decide `onAuthStateChange`
 * en `App`, no esta pantalla.
 *
 * El título de P1 es la frase de marca del `design.json` en el idioma de la
 * pantalla (`tituloDeEntrada`, del núcleo del kit): «Entra a tu *espacio*.»;
 * sin frase en ese idioma, el genérico del molde en ese idioma, nunca la frase
 * en otro.
 *
 * P2 tiene su dirección, pero el correo vive en la memoria de esta pantalla: si
 * alguien recarga en `/login/codigo`, no hay a qué correo verificar y se vuelve
 * a P1. No se guarda en el navegador a propósito: es un dato de la persona.
 */
export function Login({ ruta }: { ruta: string }) {
  const { t, idioma } = useT();
  const navegar = useNavegar();
  const otp = useRef<OtpInputHandle>(null);
  const [correo, setCorreo] = useState('');
  const [enviado, setEnviado] = useState<string | null>(null);
  const [codigo, setCodigo] = useState('');
  const [fallidos, setFallidos] = useState(0);
  const [mal, setMal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [correoMal, setCorreoMal] = useState(false);
  const [segundos, setSegundos] = useState(0);
  /* P7: el aviso del kit se consume una sola vez. */
  const [sesionCerrada, setSesionCerrada] = useState(() => consumeInactivityLogout());
  /* P9: la sesión desapareció sin que nadie la cerrara. También una sola vez. */
  const [sesionPerdida, setSesionPerdida] = useState(() => !sesionCerrada && consumeSesionDesaparecida());

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
    /* El molde no trae texto para «no se pudo mandar»: va el genérico de Mi espacio, en los tres idiomas. */
    if (fallo) return setError(t('auth.error.generic'));
    setEnviado(direccion);
    setCodigo('');
    setFallidos(0);
    setMal(false);
    setSegundos(SEGUNDOS_PARA_REENVIAR);
    if (ruta !== RUTAS.loginCodigo) navegar(`${RUTAS.loginCodigo}${window.location.search}`);
  }

  async function verificar(valor: string) {
    if (valor.length !== 6) return otp.current?.focus();
    if (!enviado || intentosQueQuedan(fallidos) === 0 || enviando) return;
    setError(null);
    setEnviando(true);
    const { error: fallo } = await supabase.auth.verifyOtp({ email: enviado, token: valor, type: 'email' });
    setEnviando(false);
    if (fallo) {
      const n = fallidos + 1;
      setFallidos(n);
      setMal(true);
      setError(t('auth.code.wrong', { n: intentosQueQuedan(n) }));
      otp.current?.reset();
    }
    /* Bien: no se navega a mano. `onAuthStateChange` avisa y `App` decide. */
  }

  async function conGoogle() {
    setError(null);
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
  }

  if (sesionCerrada) {
    return (
      <Cartel
        lang={idioma}
        antetitulo={t('auth.session.eyebrow')}
        titulo={t('auth.session.title')}
        texto={t('auth.session.subtitle')}
        accion={{ texto: t('auth.session.again'), onClick: () => setSesionCerrada(false) }}
      />
    );
  }

  if (sesionPerdida) {
    return (
      <Cartel
        lang={idioma}
        titulo={t('auth.evicted.title')}
        texto={t('auth.evicted.subtitle')}
        accion={{ texto: t('auth.evicted.enter'), onClick: () => setSesionPerdida(false) }}
      />
    );
  }

  if (enCodigo) {
    const sinIntentos = intentosQueQuedan(fallidos) === 0;
    return (
      <MarcoDeAcceso
        centrada
        antetitulo={t('auth.code.eyebrow')}
        titulo={t('auth.code.title')}
        subtitulo={t('auth.code.subtitle', { email: enviado })}
      >
        <form className="acceso__formulario" onSubmit={(e) => { e.preventDefault(); void verificar(codigo); }} noValidate>
          <Rotulo>{t('auth.code.label')}</Rotulo>
          <OtpInput
            ref={otp}
            value={codigo}
            onChange={(v) => { setCodigo(v); setMal(false); }}
            onCompleto={(c) => void verificar(c)}
            error={mal}
            disabled={enviando || sinIntentos}
            autoFocus
            aria-label={t('auth.code.label')}
          />
          {error ? <ErrorDeAcceso id="codigo-error">{error}</ErrorDeAcceso> : null}
          <Boton type="submit" ancho="completo" cargando={enviando} disabled={sinIntentos}>{t('auth.code.enter')}</Boton>
        </form>
        <div className="acceso__enlaces">
          {segundos > 0 ? (
            <span className="acceso__bajada" aria-live="polite">{t('auth.code.resendIn', { s: segundos })}</span>
          ) : (
            <Enlace onClick={() => void pedirCodigo(enviado)}>{t('auth.code.resend')}</Enlace>
          )}
          <Enlace
            tono="apagado"
            onClick={() => { setEnviado(null); setCodigo(''); setFallidos(0); setMal(false); setError(null); navegar(`${RUTAS.login}${window.location.search}`); }}
          >
            {t('auth.code.otherEmail')}
          </Enlace>
        </div>
      </MarcoDeAcceso>
    );
  }

  const correoValido = /.+@.+\..+/.test(correo.trim());
  return (
    <MarcoDeAcceso
      portada
      titulo={tituloDeEntrada(design.app.frase, idioma, t('auth.login.titleDefault'))}
      subtitulo={t('auth.login.subtitle')}
    >
      <BotonGoogle onClick={() => void conGoogle()}>{t('auth.google')}</BotonGoogle>
      <Separador />
      <form
        className="acceso__formulario"
        onSubmit={(e) => {
          e.preventDefault();
          /* El botón no se apaga con el campo vacío (la referencia lo muestra
             entero): sin un correo válido, se marca el campo y el foco vuelve. */
          if (correoValido) return void pedirCodigo(correo.trim());
          setCorreoMal(true);
          document.getElementById('correo')?.focus();
        }}
        noValidate
      >
        <Campo
          id="correo"
          etiqueta={t('auth.email.label')}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder={t('auth.email.placeholder')}
          value={correo}
          onChange={(e) => { setCorreo(e.target.value); setCorreoMal(false); }}
          error={error ?? undefined}
          aria-invalid={correoMal || error ? true : undefined}
        />
        <div><Boton type="submit" flecha cargando={enviando}>{t('auth.login.send')}</Boton></div>
      </form>
      <PieLegal
        texto={t('auth.legal')}
        terminos={{ texto: t('auth.legal.terms'), href: `${WEB}/terminos` }}
        privacidad={{ texto: t('auth.legal.privacy'), href: `${WEB}/privacidad` }}
      />
    </MarcoDeAcceso>
  );
}
