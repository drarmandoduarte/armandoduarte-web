/**
 * KIT DE ACCESO · ADAPTADOR (S0) — este archivo SÍ se edita por app.
 *
 * Es el único lugar donde el kit sabe cómo se llama esta app y qué es cada rol.
 * Todo el núcleo (`nucleo/`) lo lee de acá y por eso queda neutro: el mismo
 * archivo de núcleo sirve, byte por byte, en todas las apps.
 *
 * Copia backend ↔ frontend: los dos archivos tienen que ser IDÉNTICOS (lo
 * verifica `guardian/check.mjs`). No se pueden importar entre
 * workspaces sin inventar un paquete nuevo, así que se duplican y se controlan.
 */

/**
 * Qué clase de cuenta es un rol:
 *  - `equipo`  : trabaja adentro y VE datos de otras personas (dueños, clientes,
 *                montos). Segundo paso OBLIGATORIO, sin excepción.
 *  - `cliente` : ve lo suyo y nada más (un portal del propietario, por ejemplo).
 *                El segundo paso no se le impone.
 *
 * La clasificación es de seguridad, no de producto: ante la duda, `equipo`.
 */
export type TipoDeCuenta = 'equipo' | 'cliente';

export interface ConfigAcceso {
  /**
   * Nombre de la app. De acá salen (vía `nucleo/nombres.ts`) el nombre que
   * muestra el autenticador, el nombre del archivo de códigos de respaldo y el
   * prefijo de las claves de almacenamiento local. Antes estaban escritos a
   * mano en tres archivos distintos.
   */
  app: string;
  /**
   * TODOS los roles de la app, clasificados. Si mañana aparece un rol nuevo en
   * la base y no está acá, `roles-clasificados.spec.ts` va a rojo: la
   * clasificación es una decisión de seguridad y no puede quedar implícita.
   */
  roles: Readonly<Record<string, TipoDeCuenta>>;
  /**
   * Quién destraba a alguien que perdió el autenticador y los códigos de
   * respaldo (fase-2 §8 del molde; lo leen Equipo y Ajustes del molde como
   * `kit.rescate`):
   *  - `dueno`: el dueño lo resetea desde Equipo.
   *  - `solo` : nadie resetea a otra persona; lo pide ella y espera 48 h.
   * Agregado por Mi espacio (orden #37, PR 2): la plantilla 1.3.0 no lo trae.
   */
  rescate: 'dueno' | 'solo';
}

/**
 * ── Mi espacio · Armando Duarte (orden Códice #15, C; Kit de Acceso 1.3.0 en la #37) ──
 *
 * `app: 'Armando Duarte'` y no «Códice» ni «Mi espacio»: de acá salen, vía
 * `nucleo/nombres.ts`, **el nombre que la persona ve en su app de
 * autenticación** y el del archivo de códigos de respaldo. Quien abre Google
 * Authenticator tiene que reconocer de quién es esa cuenta, y «Códice» es el
 * nombre de la plataforma por dentro: no lo conoce nadie de la familia.
 *
 * ── Los tres roles, y por qué el cliente es el único `cliente` ───────────
 * Son exactamente los tres de la migración `001` de la #13 (el enum
 * `rol_miembro` más la ausencia de fila). `roles-clasificados.spec.ts` los
 * compara contra la base: si mañana aparece un cuarto y nadie lo clasifica, se
 * pone rojo.
 *
 *  · `dueno`   → **equipo**. Armando ve todo, de las dos regiones.
 *  · `equipo`  → **equipo**. Gabi y Diana ven a las personas de su territorio:
 *                nombres, WhatsApp, inscripciones y comprobantes de terceros.
 *  · `cliente` → **cliente**. Ve lo suyo y nada más. Es la mamá que se inscribe
 *                a un taller, y el segundo paso **no se le impone**: obligarla a
 *                configurar un autenticador para ver su propia inscripción es
 *                lo que hace que no entre nunca más. Puede ponérselo si quiere.
 *
 * La clasificación es de seguridad, no de producto, y ante la duda es `equipo`.
 * Acá no hay duda: el corte es «¿ve datos de otra persona?», y la #13 lo dejó
 * escrito en las policies antes que acá.
 *
 * ── `rescate: 'solo'` (orden #37, PR 2 · fase-2 §8) ──────────────────────
 * Mi espacio es la app de rescate solo: Armando no resetea el autenticador de
 * nadie (#13). Quien lo perdió con los códigos lo pide con su correo, lo
 * confirma desde el enlace y, a las 48 h, configura uno nuevo
 * (`apps/api/src/rescate/`, migración 013).
 */
export const ACCESO: ConfigAcceso = {
  app: 'Armando Duarte',
  roles: {
    dueno: 'equipo',
    equipo: 'equipo',
    cliente: 'cliente',
  },
  rescate: 'solo',
};
