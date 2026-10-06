import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Toast } from '@moldes/ui';
import type { Idioma } from '@moldes/idiomas';
import { necesitaEmpezar, slugDeMeAnoto } from '@codice/core';
import { useSesion } from './comun/sesion';
import { api } from './comun/api';
import { guardarIdioma } from './comun/idioma';
import { rutaQueCorresponde } from './comun/ruta-que-corresponde';
import { destinoGuardado, guardarDestinoDeLaUrl, olvidarDestino } from './comun/destino';
import { Pantalla } from './comun/Piezas';
import { Login } from './acceso/Login';
import { Activar } from './acceso/Activar';
import { Verificacion } from './acceso/Verificacion';
import { Recuperar } from './acceso/Recuperar';
import { Reseteo } from './acceso/Reseteo';
import { Respaldo } from './acceso/Respaldo';
import { Confirmacion } from './acceso/Confirmacion';
import { Rescate } from './acceso/Rescate';
import { useT } from './acceso/textos';
import { PaginaDeMisTalleres, PaginaDeTalleres } from './mi-espacio/MiEspacio';
import { ProveedorDeNavegacion } from './comun/navegacion';
import { Panel } from './equipo/Panel';
import { Esqueleto } from './molde/Esqueleto';
import { useLectura } from './molde/lectura';
import { PaginaDeInicio } from './molde/inicio';
import { PaginaDeAjustes, autenticadorDe } from './molde/ajustes';
import { PaginaDeAlertas, alertasTraducidas } from './molde/alertas';
import { PaginaDePapelera } from './molde/papelera';
import { PaginaDeEquipo } from './molde/equipo';
import { PaginaDeBienvenida } from './molde/bienvenida';
import { RUTAS, lugarDeRuta, rutaDeAjustes } from './rutas';
import { variablesQueFaltan } from './supabase';

/**
 * El flujo entero, en un solo lugar.
 *
 * ── Por qué no hay rutas para cada paso ─────────────────────────────────
 * Porque **no son páginas: son estados de una misma sesión**. «Enrolar» no es
 * un lugar al que se pueda ir: es lo que corresponde cuando una cuenta de
 * equipo no tiene factor. Si fueran rutas, habría que defender cada una de que
 * alguien la escriba en la barra —y esa defensa es exactamente `decidirReto()`,
 * escrita otra vez y con más superficie—. Con estados, la única forma de llegar
 * a una pantalla es que la sesión esté en la condición que la produce.
 *
 * Las rutas que sí existen viven en `rutas.ts` y las usa el `vercel.json` para
 * servir el `index.html` en cualquiera: es una SPA y el servidor no sabe de
 * estados.
 *
 * ── Desde la #35, los estados tienen dirección ──────────────────────────
 * El guion v1 del Kit 512 le da una URL a cada pantalla de acceso (`/login`,
 * `/auth/2fa`…). Siguen siendo estados: la URL **acompaña** a la decisión
 * (`rutaQueCorresponde()`), y escribir una a mano no salta ningún paso.
 *
 * ── Desde la #37 (PR 3), adentro es el molde ───────────────────────────
 * Con la sesión en `pasar`, todo vive en `<Shell>` del molde (`Esqueleto`):
 * Inicio, Talleres, Mis talleres, el Panel, el Centro de alertas, la Papelera,
 * Equipo y Ajustes. La primera entrada es la `<Bienvenida>` del molde. Lo del
 * negocio (talleres, «Me anoto», comprobantes, el panel) no cambió: cuelga del
 * shell como módulo.
 *
 * ── Quién decide ────────────────────────────────────────────────────────
 * `decidirReto()`, del núcleo del kit. Este componente solo traduce su
 * respuesta a una pantalla.
 */
export function App() {
  const { t: ti, i18n } = useTranslation();
  const { t, idioma } = useT();
  const { cargando, sesion, yo, decision, recargar, salir, marcarVerificado } = useSesion();
  /** Los diez códigos recién generados, mientras P5 los muestra. */
  const [codigosNuevos, setCodigosNuevos] = useState<string[] | null>(null);
  /** P8: la acción que espera el código del autenticador (`PASO_RECIENTE_REQUERIDO`). */
  const [pasoReciente, setPasoReciente] = useState<{ reintentar: () => void; cancelar: () => void } | null>(null);
  /** P4 por elección (#37 PR 3): un cliente que activa su autenticador, o cualquiera que suma un segundo. */
  const [activando, setActivando] = useState(false);
  /** El cartel de la app (fase-2 §6: avisar el error de una acción es de la app). */
  const [aviso, setAviso] = useState<{ texto: string; tono: 'neutral' | 'success' | 'danger' } | null>(null);
  /** La ruta y la búsqueda que la pantalla pinta. Son estado (#24 B) porque `replaceState` no vuelve a pintar. */
  const [ruta, setRuta] = useState(() => window.location.pathname);
  const [busqueda, setBusqueda] = useState(() => window.location.search);
  /** #29 C: a la ficha le falta nombre, apellido o WhatsApp → primero la Bienvenida. Lo decide `core`. */
  const faltanDatos = yo ? necesitaEmpezar(yo.persona) : false;
  const adentro = Boolean(yo) && decision === 'pasar' && !faltanDatos;
  const lectura = useLectura(adentro ? yo : null);

  const leerUbicacion = useCallback(() => {
    setRuta(window.location.pathname);
    setBusqueda(window.location.search);
  }, []);

  /* El shell navega sin recargar. `pushState` y no `replaceState`: entre
     Talleres y Ajustes el «atrás» del navegador sí tiene que volver. */
  const navegar = useCallback((destino: string) => {
    window.history.pushState(null, '', destino);
    leerUbicacion();
    window.scrollTo({ top: 0 });
  }, [leerUbicacion]);
  useEffect(() => {
    window.addEventListener('popstate', leerUbicacion);
    return () => window.removeEventListener('popstate', leerUbicacion);
  }, [leerUbicacion]);

  const avisar = useCallback((texto: string, tono: 'neutral' | 'success' | 'danger' = 'neutral') => setAviso({ texto, tono }), []);
  useEffect(() => {
    if (!aviso) return;
    const reloj = setTimeout(() => setAviso(null), 6000);
    return () => clearTimeout(reloj);
  }, [aviso]);

  /* La URL dice dónde está la persona. Quién decide es `rutaQueCorresponde()`,
     pura y con tabla; acá solo se aplica. `replaceState` y no `pushState`: el
     «atrás» no tiene que volver a una pantalla que ya no corresponde. */
  useEffect(() => {
    guardarDestinoDeLaUrl();
    const guardado = destinoGuardado();
    const destino = rutaQueCorresponde({
      cargando,
      haySesion: !!sesion,
      hayYo: !!yo,
      decision,
      rutaActual: window.location.pathname,
      esEquipo: yo?.tipo === 'equipo',
      esDueno: yo?.rol === 'dueno',
      destinoGuardado: guardado,
      faltanDatos,
      mostrandoCodigos: codigosNuevos !== null,
      busqueda: window.location.search,
    });
    if (sesion && yo && decision === 'pasar' && !faltanDatos) olvidarDestino();
    if (destino) {
      window.history.replaceState(null, '', destino);
      guardarDestinoDeLaUrl();
    }
    leerUbicacion();
  }, [cargando, sesion, yo, decision, faltanDatos, ruta, busqueda, codigosNuevos, leerUbicacion]);

  /* El idioma: gana el del perfil (fase-2 §5, `elegirIdioma`). Si la persona
     entró con otro en la entrada, la app pasa al suyo y este aparato lo recuerda. */
  const idiomaDelPerfil = yo?.persona?.idioma;
  useEffect(() => {
    if (!idiomaDelPerfil || idiomaDelPerfil === i18n.language) return;
    guardarIdioma(idiomaDelPerfil);
    void i18n.changeLanguage(idiomaDelPerfil);
  }, [idiomaDelPerfil, i18n]);

  const cambiarIdioma = useCallback(async (nuevo: Idioma) => {
    guardarIdioma(nuevo);
    await i18n.changeLanguage(nuevo);
    await api('yo', { metodo: 'POST', cuerpo: { idioma: nuevo } });
    await recargar();
  }, [i18n, recargar]);

  /* Inicio y el Centro de alertas muestran lo último: al llegar, se vuelve a leer. */
  const lugar = lugarDeRuta(ruta);
  const releer = lectura.releer;
  useEffect(() => {
    if (adentro && (lugar === 'inicio' || lugar === 'alertas')) void releer();
  }, [adentro, lugar, releer]);

  /* #37 PR 2 · cumplidas las 48 h de un rescate confirmado, la persona entra
     con el código por correo y queda en el reto: acá se le pide a la API que
     aplique el reseteo. Si lo aplicó, su autenticador ya no existe y, al
     recargar, el núcleo (`decidirReto()`) la manda a enrolar uno nuevo. */
  const quien = sesion?.user?.id ?? null;
  useEffect(() => {
    if (decision !== 'reto' || !quien) return;
    let vivo = true;
    void api<{ aplicado: boolean }>('rescate/aplicar', { metodo: 'POST' })
      .then((r) => { if (vivo && r.aplicado) void recargar(); })
      .catch(() => { /* Sin rescate o sin red: sigue el reto de siempre. */ });
    return () => { vivo = false; };
  }, [decision, quien, recargar]);

  /** Recién activado un autenticador (P4): se generan los códigos de respaldo y se muestran. */
  const alActivado = async () => {
    marcarVerificado();
    try {
      const r = await api<{ codigos: string[] }>('respaldo/generar', { metodo: 'POST' });
      setCodigosNuevos(r.codigos);
    } catch {
      /* Si la generación falla, no se traba nada: los códigos se generan
         después desde Cuenta y seguridad. */
      await recargar();
    }
  };

  /* Lo primero, antes que cualquier pantalla: si falta una variable, se dice
     SU NOMBRE. Nunca un valor. */
  const faltan = variablesQueFaltan();
  if (faltan.length > 0) {
    return (
      <Pantalla>
        <h1 className="titulo">{ti('comun.errorGenerico')}</h1>
        <p className="bajada">
          Faltan variables de entorno en este despliegue: <code>{faltan.join(', ')}</code>
        </p>
      </Pantalla>
    );
  }

  /* Los enlaces de los correos del rescate: antes que cualquier otra pantalla,
     con o sin sesión (`rutaQueCorresponde()` no la mueve). */
  if (ruta === RUTAS.rescate) return <Rescate />;

  if (cargando || decision === 'esperando') {
    return (
      <Pantalla>
        <p className="bajada" role="status">{ti('comun.cargando')}</p>
      </Pantalla>
    );
  }

  /* Sin sesión, a la entrada — salvo que no se haya podido saber si la hay
     (#22): eso va a la pantalla de error de abajo, no a pedir el correo. */
  if (!sesion && decision !== 'error') {
    return <ProveedorDeNavegacion navegar={navegar}><Login ruta={ruta} /></ProveedorDeNavegacion>;
  }

  /* Los códigos nuevos tapan todo lo demás mientras estén en pantalla: se ven
     una sola vez y no se pueden volver a pedir. */
  if (codigosNuevos) {
    return (
      <Respaldo
        codigos={codigosNuevos}
        alTerminar={() => { setCodigosNuevos(null); setActivando(false); void recargar(); }}
      />
    );
  }

  /* P8, encima de la pantalla en la que se pidió la acción. */
  if (pasoReciente) {
    return (
      <Confirmacion
        alConfirmar={() => { marcarVerificado(); const { reintentar } = pasoReciente; setPasoReciente(null); reintentar(); }}
        alCancelar={() => { const { cancelar } = pasoReciente; setPasoReciente(null); cancelar(); }}
      />
    );
  }

  if (decision === 'error') {
    return (
      <Pantalla>
        <h1 className="titulo">{ti('comun.noConfirmamos')}</h1>
        <div className="seccion">
          <button type="button" className="btn btn--ancho" onClick={() => void recargar()}>
            {ti('comun.reintentar')}
          </button>
        </div>
        <div className="seccion">
          <button type="button" className="btn btn--ancho" onClick={() => void salir('deliberada')}>
            {ti('comun.cerrarSesion')}
          </button>
        </div>
      </Pantalla>
    );
  }

  if (decision === 'enrolar') {
    return <Activar alSalir={() => void salir('deliberada')} alTerminar={() => void alActivado()} />;
  }

  if (decision === 'reto') {
    const alVerificar = () => { marcarVerificado(); void recargar(); };
    return (
      <ProveedorDeNavegacion navegar={navegar}>
        {ruta === RUTAS.recuperar ? <Recuperar alRecuperar={alVerificar} />
          : ruta === RUTAS.reseteo ? <Reseteo correo={sesion?.user?.email ?? null} />
            : <Verificacion alVerificar={alVerificar} alSalir={() => void salir('deliberada')} />}
      </ProveedorDeNavegacion>
    );
  }

  if (decision === 'cerrar-sesion') {
    /* Treinta minutos sin actividad. El kit cierra la sesión en vez de re-pedir
       el código, y el aviso se muestra en la pantalla de entrada. */
    void salir('inactividad');
    return (
      <Pantalla>
        <p className="bajada" role="status">{ti('comun.cargando')}</p>
      </Pantalla>
    );
  }

  if (!yo) {
    return (
      <Pantalla>
        <p className="bajada" role="status">{ti('comun.cargando')}</p>
      </Pantalla>
    );
  }

  /* P4 por elección: el cliente activa su autenticador (opcional, fase-2 §5)
     o alguien suma un segundo. Se puede cancelar: no es la P4 obligatoria. */
  if (activando) {
    return <Activar alCancelar={() => setActivando(false)} alSalir={() => void salir('deliberada')} alTerminar={() => void alActivado()} />;
  }

  const autenticador = autenticadorDe(sesion);

  /* La primera entrada (#29 C → #37 PR 3): sin nombre, apellido o WhatsApp,
     la Bienvenida antes que cualquier otra pantalla — también mientras la URL
     todavía no cambió, para que no asome un segundo otra cosa. */
  if (faltanDatos) {
    return (
      <PaginaDeBienvenida t={t} yo={yo} autenticadorActivo={Boolean(autenticador)} alActivar={() => setActivando(true)} alTerminar={recargar} />
    );
  }

  const esEquipo = yo.tipo === 'equipo';
  const esDueno = yo.rol === 'dueno';
  const slug = slugDeMeAnoto(ruta);
  const alertas = alertasTraducidas(t, idioma, yo, lectura, navegar);
  const releerTodo = async () => { await recargar(); await lectura.releer(); };

  let pagina;
  if (ruta === RUTAS.equipo && esEquipo) pagina = <Panel yo={yo} />;
  else if (ruta === RUTAS.equipoPersonas && esDueno) pagina = <PaginaDeEquipo t={t} yo={yo} onIr={navegar} alAvisar={avisar} />;
  else if (slug !== null || ruta === RUTAS.talleres) pagina = <PaginaDeTalleres key={ruta} yo={yo} slugElegido={slug} recargar={releerTodo} />;
  else if (ruta === RUTAS.misTalleres) pagina = <PaginaDeMisTalleres yo={yo} />;
  else if (ruta === RUTAS.alertas) pagina = <PaginaDeAlertas t={t} alertas={alertas} />;
  else if (ruta === RUTAS.papelera) pagina = <PaginaDePapelera t={t} yo={yo} alAvisar={avisar} />;
  else if (ruta === RUTAS.ajustes) {
    pagina = (
      <PaginaDeAjustes
        t={t}
        yo={yo}
        sesion={sesion}
        seccion={new URLSearchParams(busqueda).get('s')}
        onSeccion={(s) => navegar(rutaDeAjustes(s))}
        app={{
          recargar,
          alAvisar: avisar,
          alActivar: () => setActivando(true),
          alRegenerar: setCodigosNuevos,
          alPedirPasoReciente: setPasoReciente,
          alSalirDeTodo: () => salir('deliberada', 'global'),
          alBorrada: () => salir('deliberada', 'global'),
          cambiarIdioma,
        }}
      />
    );
  } else {
    pagina = (
      <PaginaDeInicio
        t={t}
        yo={yo}
        lectura={lectura}
        alertas={alertas}
        onIr={navegar}
        alGuardar={async (config) => {
          try {
            await api('yo', { metodo: 'POST', cuerpo: { inicio: config } });
            await recargar();
          } catch (e) {
            avisar(t('mi.ajustes.error'), 'danger');
            throw e;
          }
        }}
      />
    );
  }

  return (
    <ProveedorDeNavegacion navegar={navegar}>
      <Esqueleto
        t={t}
        yo={yo}
        correo={sesion?.user?.email ?? null}
        activo={lugar}
        alertas={alertas.length}
        onIr={navegar}
        onSalir={() => void salir('deliberada')}
      >
        {pagina}
      </Esqueleto>
      {aviso ? (
        <div className="aviso-de-la-app" role="status">
          <Toast closeLabel={t('comun.cerrar')} tone={aviso.tono} title={aviso.texto} onClose={() => setAviso(null)} />
        </div>
      ) : null}
    </ProveedorDeNavegacion>
  );
}
