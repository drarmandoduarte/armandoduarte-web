import { RUTA_RESERVAR_MERIDA, enlaceAMiEspacio } from '@codice/core';

/**
 * Los enlaces de la web a Mi espacio — orden #25.
 *
 * La dirección es la de `@codice/core` (`APP_FAMILIA`). La única forma de
 * cambiarla es **la variable de entorno de build** `VITE_APP_FAMILIA`, para que
 * el preview pueda apuntar a la app en Vercel mientras el subdominio no
 * exista. Nunca se escribe una URL de Vercel en el código: el repo es público
 * y `la-web-no-nombra-vercel.test.ts` lo mira en `dist`.
 */
const BASE = import.meta.env.VITE_APP_FAMILIA as string | undefined;

/** `…/entrar`, o `…/entrar?ir=<destino>`. */
export const enlaceMiEspacio = (destino?: string) => enlaceAMiEspacio(destino, BASE);

/** «Reservar mi lugar»: entra y cae en «Me anoto» con el taller de Mérida elegido. */
export const enlaceReservarMiLugar = () => enlaceAMiEspacio(RUTA_RESERVAR_MERIDA, BASE);
