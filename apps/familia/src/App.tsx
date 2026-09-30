import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSesion } from './comun/sesion';
import { api } from './comun/api';
import { rutaQueCorresponde } from './comun/ruta-que-corresponde';
import { Pantalla } from './comun/Piezas';
import { Entrar } from './entrar/Entrar';
import { Enrolar } from './entrar/Enrolar';
import { Reto } from './entrar/Reto';
import { CodigosDeRespaldo } from './entrar/CodigosDeRespaldo';
import { MiEspacio } from './mi-espacio/MiEspacio';
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
 * Las dos rutas que sí existen (`/entrar` y `/mi-espacio`) viven en `rutas.ts`
 * y las usa el `vercel.json` para servir el `index.html` en cualquiera: es una
 * SPA y el servidor no sabe de estados.
 *
 * ── Quién decide ────────────────────────────────────────────────────────
 * `decidirReto()`, del núcleo del kit. Este componente solo traduce su
 * respuesta a una pantalla. El orden de las reglas —y por qué «sin factor» va
 * antes que «ventana vencida»— está escrito allá, con su motivo.
 */
export function App() {
  const { t } = useTranslation();
  const { cargando, sesion, yo, decision, recargar, salir, marcarVerificado } = useSesion();
  /** Los diez códigos recién generados, mientras la pantalla 4 los muestra. */
  const [codigosNuevos, setCodigosNuevos] = useState<string[] | null>(null);

  /* F · la URL dice dónde está la persona: `/mi-espacio` cuando entró,
     `/entrar` cuando no. Quién decide es `rutaQueCorresponde()`, pura y con
     tabla; acá solo se aplica. `replaceState` y no `pushState`: el «atrás»
     del navegador no tiene que volver a una pantalla de entrada que ya no
     corresponde. */
  useEffect(() => {
    const destino = rutaQueCorresponde({
      cargando,
      haySesion: !!sesion,
      hayYo: !!yo,
      decision,
      rutaActual: window.location.pathname,
    });
    if (destino) window.history.replaceState(null, '', destino);
  }, [cargando, sesion, yo, decision]);

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

  /* `esperando`: hay sesión y el `/api/yo` está en camino (recién entró). */
  if (cargando || decision === 'esperando') {
    return (
      <Pantalla>
        <p className="bajada" role="status">{t('comun.cargando')}</p>
      </Pantalla>
    );
  }

  if (!sesion) return <Entrar />;

  /* Los códigos nuevos tapan todo lo demás mientras estén en pantalla: se ven
     una sola vez y no se pueden volver a pedir. */
  if (codigosNuevos) {
    return (
      <CodigosDeRespaldo
        codigos={codigosNuevos}
        alTerminar={() => { setCodigosNuevos(null); void recargar(); }}
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
      <Enrolar
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
    return <Reto alVerificar={() => { marcarVerificado(); void recargar(); }} />;
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

  return (
    <MiEspacio
      yo={yo}
      recargar={recargar}
      alSalir={() => void salir('deliberada')}
      alRegenerar={setCodigosNuevos}
    />
  );
}
