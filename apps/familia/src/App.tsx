import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSesion } from './comun/sesion';
import { api } from './comun/api';
import { SECCIONES_DE_AJUSTES, necesitaEmpezar, slugDeMeAnoto, type SeccionDeAjustes } from '@codice/core';
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
import { PaginaDeMisTalleres, PaginaDeTalleres } from './mi-espacio/MiEspacio';
import { Ajustes } from './mi-espacio/Ajustes';
import { Inicio } from './mi-espacio/Inicio';
import { Empezar } from './mi-espacio/Empezar';
import { Marco } from './comun/Marco';
import { ProveedorDeNavegacion } from './comun/navegacion';
import { Panel } from './equipo/Panel';
import { RUTAS, RUTA_DE_SECCION } from './rutas';
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
 * Las rutas que sí existen (`/mi-espacio` y, desde la #29, los lugares de la
 * barra lateral y `/empezar`) viven en `rutas.ts` y las usa el `vercel.json`
 * para servir el `index.html` en cualquiera: es una SPA y el servidor no sabe de
 * estados.
 *
 * ── Desde la #35, los estados tienen dirección ──────────────────────────
 * El guion v1 del Kit 512 le da una URL a cada pantalla de acceso (`/login`,
 * `/auth/2fa`…). Siguen siendo estados: la URL **acompaña** a la decisión
 * (`rutaQueCorresponde()`), y escribir una a mano no salta ningún paso. Lo que
 * sí cambia es que dentro de un estado la ruta elige la pantalla: en `reto`,
 * `/auth/2fa` es P3, `/auth/2fa/recuperar` es P6 y `/auth/2fa/reseteo` es P6b.
 *
 * ── Quién decide ────────────────────────────────────────────────────────
 * `decidirReto()`, del núcleo del kit. Este componente solo traduce su
 * respuesta a una pantalla. El orden de las reglas —y por qué «sin factor» va
 * antes que «ventana vencida»— está escrito allá, con su motivo.
 */
export function App() {
  const { t } = useTranslation();
  const { cargando, sesion, yo, decision, recargar, salir, marcarVerificado } = useSesion();
  /** Los diez códigos recién generados, mientras P5 los muestra. */
  const [codigosNuevos, setCodigosNuevos] = useState<string[] | null>(null);
  /** P8: la acción que espera el código del autenticador (`PASO_RECIENTE_REQUERIDO`). */
  const [pasoReciente, setPasoReciente] = useState<{ reintentar: () => void; cancelar: () => void } | null>(null);
  /** La ruta que la pantalla pinta. Es estado (#24 B) porque `replaceState` no
   *  vuelve a pintar: sin esto, al llegar a `/me-anoto/<slug>` después de
   *  entrar, la pantalla seguía mostrando lo de la ruta anterior. */
  const [ruta, setRuta] = useState(() => window.location.pathname);
  /** #29 C: a la ficha le falta nombre, apellido o WhatsApp → primero `/empezar`. Lo decide `core`. */
  const faltanDatos = yo ? necesitaEmpezar(yo.persona) : false;

  /* #29: la barra lateral navega sin recargar (ver `comun/navegacion.tsx`).
     `pushState` y no `replaceState`: entre Talleres y Ajustes el «atrás»
     del navegador sí tiene que volver. */
  const navegar = useCallback((destino: string) => {
    window.history.pushState(null, '', destino);
    setRuta(window.location.pathname);
    window.scrollTo({ top: 0 });
  }, []);
  useEffect(() => {
    const alVolver = () => setRuta(window.location.pathname);
    window.addEventListener('popstate', alVolver);
    return () => window.removeEventListener('popstate', alVolver);
  }, []);

  /* F · la URL dice dónde está la persona: `/mi-espacio` cuando entró,
     `/entrar` cuando no. Quién decide es `rutaQueCorresponde()`, pura y con
     tabla; acá solo se aplica. `replaceState` y no `pushState`: el «atrás»
     del navegador no tiene que volver a una pantalla de entrada que ya no
     corresponde. */
  useEffect(() => {
    /* #24 B: el `?ir=` de `/entrar` se guarda antes de decidir, y se olvida
       en cuanto se lo usa (ver `comun/destino.ts`). */
    guardarDestinoDeLaUrl();
    const guardado = destinoGuardado();
    const destino = rutaQueCorresponde({
      cargando,
      haySesion: !!sesion,
      hayYo: !!yo,
      decision,
      rutaActual: window.location.pathname,
      esEquipo: yo?.tipo === 'equipo',
      destinoGuardado: guardado,
      faltanDatos,
      mostrandoCodigos: codigosNuevos !== null,
      busqueda: window.location.search,
    });
    /* El destino se olvida cuando se usa, y no mientras falten los datos:
       ahí espera a que `/empezar` termine (#29 C). */
    if (sesion && yo && decision === 'pasar' && !faltanDatos) olvidarDestino();
    if (destino) {
      window.history.replaceState(null, '', destino);
      guardarDestinoDeLaUrl();
    }
    setRuta(window.location.pathname);
  }, [cargando, sesion, yo, decision, faltanDatos, ruta, codigosNuevos]);

  /* #37 PR 2 · cumplidas las 48 h de un rescate confirmado, la persona entra
     con el código por correo y queda en el reto: acá se le pide a la API que
     aplique el reseteo. Si lo aplicó, su autenticador ya no existe y, al
     recargar, el núcleo (`decidirReto()`) la manda a enrolar uno nuevo. Si no
     había nada listo, no cambia nada. Una vez por llegada al reto. */
  const quien = sesion?.user?.id ?? null;
  useEffect(() => {
    if (decision !== 'reto' || !quien) return;
    let vivo = true;
    void api<{ aplicado: boolean }>('rescate/aplicar', { metodo: 'POST' })
      .then((r) => { if (vivo && r.aplicado) void recargar(); })
      .catch(() => { /* Sin rescate o sin red: sigue el reto de siempre. */ });
    return () => { vivo = false; };
  }, [decision, quien, recargar]);

  /* Lo primero, antes que cualquier pantalla: si falta una variable, se dice
     SU NOMBRE. Quien va a leer esto es dirección cargando el proyecto en
     Vercel, y lo único que necesita saber es cuál falta. Nunca un valor. */
  const faltan = variablesQueFaltan();
  if (faltan.length > 0) {
    return (
      <Pantalla>
        <h1 className="titulo">{t('comun.errorGenerico')}</h1>
        <p className="bajada">
          Faltan variables de entorno en este despliegue: <code>{faltan.join(', ')}</code>
        </p>
      </Pantalla>
    );
  }

  /* Los enlaces de los correos del rescate: antes que cualquier otra pantalla,
     con o sin sesión (`rutaQueCorresponde()` no la mueve). */
  if (ruta === RUTAS.rescate) return <Rescate />;

  /* `esperando`: hay sesión y el `/api/yo` está en camino (recién entró). */
  if (cargando || decision === 'esperando') {
    return (
      <Pantalla>
        <p className="bajada" role="status">{t('comun.cargando')}</p>
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
        alTerminar={() => { setCodigosNuevos(null); void recargar(); }}
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

  /* ── Antes que cualquier pantalla del flujo, y después de los códigos ──
     Si `/api/yo` no contestó, no se sabe quién es quien está del otro lado: no
     corresponde ni enrolar, ni el reto, ni Mi espacio. Va después de
     `codigosNuevos` a propósito —esos se ven una sola vez y no se pueden volver
     a pedir— y antes de todo lo demás.

     Quién decide es `decidirPantalla()`, que para eso es una función pura y
     está probada con tabla; acá solo se pinta lo que decidió. */
  if (decision === 'error') {
    return (
      <Pantalla>
        <h1 className="titulo">{t('comun.noConfirmamos')}</h1>
        <div className="seccion">
          <button type="button" className="btn btn--ancho" onClick={() => void recargar()}>
            {t('comun.reintentar')}
          </button>
        </div>
        <div className="seccion">
          <button type="button" className="btn btn--ancho" onClick={() => void salir('deliberada')}>
            {t('comun.cerrarSesion')}
          </button>
        </div>
      </Pantalla>
    );
  }

  if (decision === 'enrolar') {
    return (
      <Activar
        alSalir={() => void salir('deliberada')}
        alTerminar={async () => {
          marcarVerificado();
          /* Recién enrolado, la cuenta todavía no tiene códigos de respaldo.
             Se generan y se muestran acá mismo: es el único momento del flujo
             en que se puede obligar a guardarlos antes de seguir. */
          try {
            const r = await api<{ codigos: string[] }>('respaldo/generar', { metodo: 'POST' });
            setCodigosNuevos(r.codigos);
          } catch {
            /* Si la generación falla, no se traba la entrada: la persona ya
               tiene su autenticador. Los códigos se pueden generar después
               desde Seguridad, y la pantalla lo ofrece. */
            await recargar();
          }
        }}
      />
    );
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
        <p className="bajada" role="status">{t('comun.cargando')}</p>
      </Pantalla>
    );
  }

  if (!yo) {
    return (
      <Pantalla>
        <p className="bajada" role="status">{t('comun.cargando')}</p>
      </Pantalla>
    );
  }

  /* #29 C: sin nombre, apellido o WhatsApp, `/empezar` antes que cualquier
     otra pantalla — también mientras la URL todavía no cambió, para que no
     asome un segundo otra cosa. */
  if (faltanDatos) return <Empezar yo={yo} recargar={recargar} />;

  const esEquipo = yo.tipo === 'equipo';
  const slug = slugDeMeAnoto(ruta);
  /* `/equipo` (#24 A): el panel, solo para el equipo. A un cliente que escribe
     `/equipo` se le muestra Inicio y `rutaQueCorresponde()` corrige la URL:
     nunca ve un error. La API y la base lo frenan igual (`SOLO_EQUIPO`, RLS). */
  const enElPanel = ruta === RUTAS.equipo && esEquipo;
  /* #34 B: la sección de Ajustes que dice la ruta. `/ajustes/seguridad` para
     un cliente no es suya: Inicio, y la URL la corrige `rutaQueCorresponde()`. */
  const seccion: SeccionDeAjustes | null = SECCIONES_DE_AJUSTES.find((s) => RUTA_DE_SECCION[s] === ruta) ?? null;
  const enAjustes = seccion !== null && (seccion !== 'seguridad' || esEquipo);
  const correo = sesion?.user?.email ?? null;
  const proveedores = (sesion?.user?.app_metadata?.providers as string[] | undefined) ?? null;
  const pagina = enElPanel ? <Panel yo={yo} />
    : slug !== null || ruta === RUTAS.talleres ? <PaginaDeTalleres key={ruta} yo={yo} slugElegido={slug} recargar={recargar} />
      : ruta === RUTAS.misTalleres ? <PaginaDeMisTalleres yo={yo} />
        : enAjustes ? (
          <Ajustes
            yo={yo}
            correo={correo}
            proveedores={proveedores}
            seccion={seccion}
            recargar={recargar}
            alRegenerar={setCodigosNuevos}
            alPedirPasoReciente={setPasoReciente}
            alSalirDeTodo={() => salir('deliberada', 'global')}
          />
        )
          : <Inicio yo={yo} />;

  return (
    <ProveedorDeNavegacion navegar={navegar}>
      <Marco
        ruta={enElPanel ? RUTAS.equipo : ruta}
        usuario={{ yo, correo }}
        alSalir={() => void salir('deliberada')}
        ancha={enElPanel || enAjustes}
      >
        {pagina}
      </Marco>
    </ProveedorDeNavegacion>
  );
}
