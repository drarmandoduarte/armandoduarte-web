import { SetMetadata, type CustomDecorator } from '@nestjs/common';

/**
 * KIT DE ACCESO · NÚCLEO (S3) — NO se edita en una app. Una mejora se
 * hace en el kit, sube la versión y se regeneran las huellas.
 */

/** Clave de metadata que lee `Aal2Guard` para saltear el segundo paso. */
export const SIN_SEGUNDO_PASO_KEY = 'sin_segundo_paso';

/**
 * Marca una ruta como EXCEPCIÓN al segundo paso (2FA), con su razón escrita.
 *
 * Desde el Kit de Acceso (S3) la lógica está invertida: `Aal2Guard` es
 * global (`APP_GUARD` en `app.module.ts`), así que **todo endpoint exige AAL2
 * por defecto**. Una ruta nueva nace protegida aunque quien la escriba se
 * olvide del guard. Para dejar pasar una ruta hay que declararla aquí, y la
 * razón es obligatoria: si no se puede escribir por qué, no es una excepción.
 *
 * La lista completa de excepciones vive además en `aal2-cobertura.spec.ts`:
 * agregar una sin anotarla ahí deja el test guardián en rojo.
 *
 * @param razon Por qué esta ruta se llama antes de que la sesión llegue a AAL2.
 */
export function SinSegundoPaso(razon: string): CustomDecorator<string> {
  if (typeof razon !== 'string' || razon.trim() === '') {
    throw new Error(
      '@SinSegundoPaso exige una razón no vacía: escribe por qué esta ruta no puede pedir 2FA.',
    );
  }
  return SetMetadata(SIN_SEGUNDO_PASO_KEY, razon.trim());
}
