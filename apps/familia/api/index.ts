import type { IncomingMessage, ServerResponse } from 'node:http';
import { manejadorHttp } from '@codice/api';

/**
 * LA FUNCIÓN DE VERCEL QUE SIRVE LA API — orden Códice #15, B.
 *
 * ── El mecanismo elegido, y por qué éste ────────────────────────────────
 * La orden deja elegir entre «soporte nativo de NestJS en Vercel» y «una
 * función `api/` que envuelve la app». Es **la segunda**, y son tres motivos:
 *
 * 1. **Vercel no tiene soporte nativo de NestJS.** Tiene soporte de funciones
 *    Node en `api/`, y todas las guías de «Nest en Vercel» terminan siendo
 *    exactamente este archivo. Llamarlo de la otra forma sería nombrar una
 *    cosa que no existe.
 * 2. **Un solo proyecto, una sola raíz.** La pantalla es estática
 *    (`apps/familia/dist`) y la API es esta función. Las dos salen de
 *    `apps/familia`, que es la **Root Directory** del proyecto de Vercel — y
 *    así el `vercel.json` que las gobierna es `apps/familia/vercel.json` y no
 *    el de la raíz del repo, que es de la web pública y **no se toca** (lo dice
 *    la orden en «Qué no se toca»).
 * 3. **La app de Nest no sabe que está en Vercel.** `@codice/api` exporta una
 *    fábrica; este archivo es el único que conoce el entorno. El día que la API
 *    se mude a un contenedor, se escribe un `listen()` de cuatro líneas y no
 *    cambia nada más.
 *
 * ── Lo que NO está verificado, y hay que decirlo ────────────────────────
 * Que Vercel resuelva `@codice/api` a través del workspace de pnpm con la Root
 * Directory en `apps/familia`. **No se pudo probar esta noche**: el proyecto de
 * Vercel lo crea dirección (§H) y sin él no hay despliegue contra el cual
 * medir. Es el primer punto de la prueba en vivo F.4 y está en el informe como
 * pendiente. Si Vercel no lo resuelve, la salida conocida es agregar
 * `"installCommand": "pnpm install --filter @codice/familia..."` — pero eso se
 * escribe **después** de verlo fallar, no por las dudas.
 */
export default async function handler(
  pedido: IncomingMessage,
  respuesta: ServerResponse,
): Promise<void> {
  const app = await manejadorHttp();
  app(pedido as never, respuesta as never);
}
