import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
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

export function useSesion(): EstadoDeSesion {
  const [cargando, setCargando] = useState(true);
  const [sesion, setSesion] = useState<Session | null>(null);
  const [yo, setYo] = useState<Yo | null>(null);
  const [respuestaDeYo, setRespuestaDeYo] = useState<RespuestaDeYo>('no-contesto');
  const [nivelPosible, setNivelPosible] = useState<'aal1' | 'aal2'>('aal1');
  const { expired, markVerified, clearWindow } = useAalWindow();

  /** Los dos niveles de la sesión, según Supabase. */
  const leerNiveles = useCallback(async () => {
    const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    setNivelPosible(data?.nextLevel === 'aal2' ? 'aal2' : 'aal1');
    return data;
  }, []);

  const recargar = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    setSesion(data.session);
    if (!data.session) {
      setYo(null);
      setRespuestaDeYo('no-contesto');
      setCargando(false);
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
    } finally {
      setCargando(false);
    }
  }, [leerNiveles]);

  useEffect(() => {
    void recargar();
    const { data } = supabase.auth.onAuthStateChange((_evento, nueva) => {
      setSesion(nueva);
      if (!nueva) {
        setYo(null);
        setRespuestaDeYo('no-contesto');
      }
    });
    return () => data.subscription.unsubscribe();
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
      setRespuestaDeYo('no-contesto');
    },
    [clearWindow],
  );

  const nivelActual: 'aal1' | 'aal2' =
    sesion?.access_token && leerAal(sesion.access_token) === 'aal2' ? 'aal2' : 'aal1';

  const decision: DecisionDePantalla | null = sesion
    ? decidirPantalla({ nivelActual, nivelPosible, rol: yo?.rol, ventanaVencida: expired, respuestaDeYo })
    : null;

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
