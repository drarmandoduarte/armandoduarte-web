import { useCallback, useEffect, useState } from 'react';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { supabase } from '../supabase';
import { api, ErrorDeApi, type Yo } from './api';
import {
  decidirPantalla,
  type DecisionDePantalla,
  type RespuestaDeYo,
} from './decision-de-pantalla';
import {
  useAalWindow,
  markInactivityLogout,
  marcarSalidaDeliberada,
} from '../seguridad-512/nucleo/useAalWindow';

/**
 * La sesión, y qué corresponde mostrar con ella.
 *
 * ── La decisión NO se toma acá ──────────────────────────────────────────
 * La toma `decidirReto()`, que es del núcleo del kit, es una función pura y
 * está probada con una tabla de nueve casos. Este hook solo junta lo que esa
 * función necesita —el nivel actual, el nivel posible, el rol y si venció la
 * ventana— y le pregunta. El día que la regla cambie, cambia en el kit para las
 * cuatro apps a la vez.
 *
 * Es también por qué el orden de las reglas no está escrito acá: está adentro
 * de `decidir-reto.ts`, con su motivo, y repetirlo sería tener dos verdades.
 *
 * Lo único que esta app le agrega es **qué pasa cuando `/api/yo` no contesta**,
 * y tampoco está escrito acá: está en `decision-de-pantalla.ts`, con el caso del
 * 29/9 pegado. Este hook solo guarda cuál de las tres cosas pasó.
 */
export interface EstadoDeSesion {
  cargando: boolean;
  sesion: Session | null;
  yo: Yo | null;
  decision: DecisionDePantalla | null;
  /** Vuelve a preguntar `/api/yo` y a recalcular. */
  recargar: () => Promise<void>;
  salir: (motivo?: 'inactividad' | 'deliberada') => Promise<void>;
  /** Marca que el segundo paso se verificó recién (reinicia los 30 min). */
  marcarVerificado: () => void;
}

/**
 * Los avisos que traen una sesión nueva y obligan a volver a preguntar quién es.
 * `INITIAL_SESSION` no está a propósito: al montar ya pregunta `recargar()`.
 */
const EVENTOS_QUE_RECARGAN: ReadonlySet<AuthChangeEvent> = new Set<AuthChangeEvent>([
  'SIGNED_IN',
  'TOKEN_REFRESHED',
  'MFA_CHALLENGE_VERIFIED',
]);

/**
 * Cuánto se espera, como mucho, a que la sesión, sus niveles y `/api/yo`
 * contesten, las tres juntas (orden #22, que fija el número). Tiene que dejar
 * lugar a un arranque en frío de la función de Vercel con red de celular sin
 * cortarlo, y no tanto que la persona cierre la pestaña antes de ver el error.
 * Un solo tope y no uno por pregunta: a la persona le importa cuánto esperó,
 * no cuál de las tres tardó.
 */
export const TOPE_DE_ESPERA_MS = 12_000;

/** Una promesa, o un rechazo si no se resolvió en `ms`. */
function conTope<T>(promesa: Promise<T>, ms: number): Promise<T> {
  /* Si pierde la carrera y después falla, que no quede un rechazo suelto. */
  promesa.catch(() => {});
  let reloj: ReturnType<typeof setTimeout> | undefined;
  const tope = new Promise<never>((_, rechazar) => {
    reloj = setTimeout(() => rechazar(new Error(`sin respuesta en ${ms} ms`)), ms);
  });
  return Promise.race([promesa, tope]).finally(() => clearTimeout(reloj));
}

export function useSesion(): EstadoDeSesion {
  const [cargando, setCargando] = useState(true);
  const [sesion, setSesion] = useState<Session | null>(null);
  const [yo, setYo] = useState<Yo | null>(null);
  const [respuestaDeYo, setRespuestaDeYo] = useState<RespuestaDeYo>('sin-sesion');
  const [nivelPosible, setNivelPosible] = useState<'aal1' | 'aal2'>('aal1');
  const { expired, markVerified, clearWindow } = useAalWindow();

  /** Los dos niveles de la sesión, según Supabase. */
  const leerNiveles = useCallback(async () => {
    const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    setNivelPosible(data?.nextLevel === 'aal2' ? 'aal2' : 'aal1');
    return data;
  }, []);

  /** Las tres preguntas en orden: la sesión, sus niveles y quién es. */
  const preguntar = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    setSesion(data.session);
    if (!data.session) {
      setYo(null);
      /* Sin sesión no se le preguntó nada a la API: no es «no contestó». */
      setRespuestaDeYo('sin-sesion');
      return;
    }
    await leerNiveles();
    try {
      setYo(await api<Yo>('yo'));
      setRespuestaDeYo('respondio');
    } catch (error) {
      setYo(null);
      /* `AAL2_REQUIRED` no es un fallo: es el servidor diciendo que esta cuenta
         es de equipo y todavía no pasó el segundo paso. La pantalla lo resuelve
         con `decidirReto`, que para eso mira el nivel de la sesión. El rol lo va
         a traer el `/api/yo` de después del reto.

         Cualquier otra cosa —un 500, un 401, la red caída— es **no saber quién
         es**, y antes se relanzaba: la excepción no la atrapaba nadie (el hook
         se llama con `void recargar()`), `yo` quedaba en null y la pantalla
         terminaba pidiéndole un autenticador a quien no lo necesita. Ahora se
         guarda y `decidirPantalla` lo convierte en un error visible. */
      const esSegundoPaso = error instanceof ErrorDeApi && error.codigo === 'AAL2_REQUIRED';
      setRespuestaDeYo(esSegundoPaso ? 'falta-el-segundo-paso' : 'no-contesto');
    }
  }, [leerNiveles]);

  /**
   * ── Nunca un «Un momento…» eterno (orden Códice #22) ──────────────────
   * El caso, del 30/9: armando las pruebas de la #18, un JWT mal formado hizo
   * que `leerNiveles()` tirara una excepción. Nadie la atrapaba, `cargando` no
   * bajaba nunca y la pantalla quedaba en «Un momento…» para siempre. Una mamá
   * que ve eso cierra la pestaña.
   *
   * Ahora las tres preguntas van adentro de un `try/finally` que **siempre**
   * baja `cargando`, y cualquier falla —incluida la de `leerNiveles`— se anota
   * como «no contestó»: la pantalla de error que ya existe, con «Volver a
   * intentar» y «Cerrar sesión». Y las tres juntas tienen un solo tope,
   * `TOPE_DE_ESPERA_MS`: lo que no contesta, tampoco puede dejar la espera
   * abierta.
   *
   * Si la respuesta llega después del tope, igual se aplica: la pantalla pasa
   * del error a donde corresponde, que es lo que la persona quería.
   */
  const recargar = useCallback(async () => {
    try {
      await conTope(preguntar(), TOPE_DE_ESPERA_MS);
    } catch {
      setYo(null);
      setRespuestaDeYo('no-contesto');
    } finally {
      setCargando(false);
    }
  }, [preguntar]);

  useEffect(() => {
    void recargar();
    let vivo = true;
    const { data } = supabase.auth.onAuthStateChange((evento, nueva) => {
      setSesion(nueva);
      if (!nueva) {
        setYo(null);
        setRespuestaDeYo('sin-sesion');
        return;
      }
      /* ── F.4, cuarta corrida (30/9/2026) ────────────────────────────────
         Acá antes solo se guardaba la sesión. Al montar sin sesión `recargar()`
         ya había corrido; después del login nadie la volvía a llamar, no salía
         ningún `GET /api/yo` y la pantalla quedaba en error. `Entrar.tsx` no
         navega a mano —este aviso es el que decide—, así que el aviso tiene
         que preguntar.

         Fuera del callback, con `setTimeout(0)`: supabase-js avisa que llamar
         a sus métodos (`getSession`, el `mfa.*` de `leerNiveles`) adentro de
         este callback puede trabarse con su propio lock. */
      if (EVENTOS_QUE_RECARGAN.has(evento)) {
        setTimeout(() => {
          if (vivo) void recargar();
        }, 0);
      }
    });
    return () => {
      vivo = false;
      data.subscription.unsubscribe();
    };
  }, [recargar]);

  const salir = useCallback(
    async (motivo: 'inactividad' | 'deliberada' = 'deliberada') => {
      /* El aviso se marca ANTES de cerrar: `signOut` dispara el cambio de
         estado que desmonta esta pantalla, y lo que se escriba después puede no
         llegar a ejecutarse. */
      if (motivo === 'inactividad') markInactivityLogout();
      else marcarSalidaDeliberada();
      clearWindow();
      await supabase.auth.signOut();
      setYo(null);
      setRespuestaDeYo('sin-sesion');
    },
    [clearWindow],
  );

  const nivelActual: 'aal1' | 'aal2' =
    sesion?.access_token && leerAal(sesion.access_token) === 'aal2' ? 'aal2' : 'aal1';

  /* Sin sesión no hay nada que decidir… salvo que ni siquiera se haya podido
     saber si la hay: `getSession` que no contestó en el tope (#22). Eso es el
     mismo «no sé quién sos» que un `/api/yo` caído, y va a la misma pantalla. */
  const decision: DecisionDePantalla | null = sesion
    ? decidirPantalla({ nivelActual, nivelPosible, rol: yo?.rol, ventanaVencida: expired, respuestaDeYo })
    : respuestaDeYo === 'no-contesto' ? 'error' : null;

  return { cargando, sesion, yo, decision, recargar, salir, marcarVerificado: markVerified };
}

/**
 * El claim `aal` del token.
 *
 * Se lee del JWT y no de `getAuthenticatorAssuranceLevel()` porque son dos
 * cosas distintas: aquél dice a qué nivel **puede** llegar la sesión y éste a
 * cuál **está**. La pantalla necesita los dos y confundirlos es mandar al reto
 * a alguien que ya lo pasó.
 *
 * Es una lectura **sin verificar la firma**, y está bien que lo sea: acá no se
 * decide nada de seguridad. Quien decide es la API, que valida el token contra
 * el proveedor antes de mirar un solo claim. Esto es para saber qué pantalla
 * pintar; si alguien se falsifica el suyo, lo único que se gana es ver una
 * pantalla que después la API no le contesta.
 */
function leerAal(token: string): string | undefined {
  try {
    const partes = token.split('.');
    if (partes.length !== 3) return undefined;
    const b64 = partes[1].replace(/-/g, '+').replace(/_/g, '/');
    const relleno = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    const payload = JSON.parse(atob(relleno)) as { aal?: unknown };
    return typeof payload.aal === 'string' ? payload.aal : undefined;
  } catch {
    return undefined;
  }
}
