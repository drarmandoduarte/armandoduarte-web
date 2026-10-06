import { decidirReto, type Decision, type EstadoDeLaSesion } from '../acceso/nucleo/decidir-reto';

/**
 * Qué pantalla corresponde, **contando también que `/api/yo` puede no contestar**.
 *
 * ── El defecto que esta función existe para que no vuelva ───────────────
 * El 29/9/2026, con `/api/yo` devolviendo un error, la pantalla mostraba
 * **«Protege tu cuenta»** —enrolar un autenticador— a una cuenta que no es de
 * equipo. La cadena, con archivo y línea de aquel día:
 *
 *     sesion.ts:59-66   un error de /api/yo dejaba `yo` en null
 *     decidir-reto.ts   recibía `rol: undefined`
 *     roles.ts          esEquipo(undefined) === true  (falla cerrado, y hace bien)
 *     →                 'enrolar'
 *
 * **Una mamá cuyo `/api/yo` falle por lo que sea es mandada a instalar un
 * autenticador.** Y el `esEquipo(undefined) === true` del kit no está mal: es su
 * regla S0 y falla cerrado a propósito. Lo que estaba mal es llegar hasta ahí
 * sin rol: «no sé quién es» y «sé que no tiene factor» son dos cosas distintas, y
 * la que faltaba decir era la primera.
 *
 * ── Por qué acá y no adentro del kit ────────────────────────────────────
 * Porque `decidirReto()` es del núcleo y el núcleo no se edita en una app. Esta
 * función lo **envuelve**: si hubo respuesta, decide el kit, con su tabla de
 * nueve casos intacta; si no la hubo, ni se lo pregunta. El día que el kit
 * incorpore el caso, esta envoltura se borra en un renglón.
 *
 * ── Y por qué es una función pura y no un `if` en el `.tsx` ─────────────
 * Por la regla 1 de la casa —las pantallas solo muestran— y porque así se prueba
 * con una tabla, sin montar React: `decision-de-pantalla.test.ts`.
 */

/** Qué contestó `GET /api/yo` en el último intento. */
export type RespuestaDeYo =
  /** Contestó: hay rol. */
  | 'respondio'
  /** Contestó `403 AAL2_REQUIRED`: **es una respuesta**, no un fallo. El
   *  servidor está diciendo «esta cuenta es de equipo y falta el segundo
   *  paso», y el rol llega después del reto. */
  | 'falta-el-segundo-paso'
  /** No contestó, o contestó cualquier otra cosa. No se sabe quién es. */
  | 'no-contesto'
  /** Todavía no se preguntó: no había sesión cuando se miró por última vez.
   *
   *  **No es un error, y confundirlo fue el defecto de F.4, cuarta corrida
   *  (30/9/2026).** Al montar sin sesión se anotaba `'no-contesto'`; después
   *  del login la sesión aparecía, nadie volvía a preguntar, y la pantalla
   *  mostraba «No pudimos confirmar tu cuenta» a alguien que acababa de entrar
   *  bien. Con sesión y este valor, lo que pasa es que el `/api/yo` está en
   *  camino: se espera. */
  | 'sin-sesion';

export type DecisionDePantalla = Decision | 'error' | 'esperando';

export function decidirPantalla(
  estado: EstadoDeLaSesion & { respuestaDeYo: RespuestaDeYo },
): DecisionDePantalla {
  /* Va PRIMERO, antes que cualquier regla del kit: sin saber quién es, ninguna
     de las otras cuatro decisiones se puede tomar con honestidad. */
  if (estado.respuestaDeYo === 'no-contesto') return 'error';
  /* Y tampoco se le pregunta al kit sin haber preguntado a la API: con
     `rol: undefined` diría `enrolar`, que es el defecto del 29/9 por otra
     puerta. Se espera a que `/api/yo` conteste. */
  if (estado.respuestaDeYo === 'sin-sesion') return 'esperando';
  return decidirReto(estado);
}
