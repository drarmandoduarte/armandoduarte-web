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
}

/**
 * EJEMPLO: una app con dos roles de equipo y uno de cliente. Cada app escribe
 * los SUYOS, todos, tal como están en su base (`roles-clasificados.spec.ts`
 * falla si falta uno). Ante la duda, `equipo`.
 */
export const ACCESO: ConfigAcceso = {
  app: 'NombreDeLaApp',
  roles: {
    dueno: 'equipo',
    recepcion: 'equipo',
    cliente: 'cliente',
  },
};
