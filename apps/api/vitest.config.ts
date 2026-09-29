import { defineConfig } from 'vitest/config';

/**
 * ── El único archivo del núcleo del kit que NO corre acá, y por qué ──────
 *
 * `src/seguridad-512/nucleo/usuario-del-pedido.spec.ts` viene del kit byte por
 * byte, con su huella, y **no se puede correr en esta app**: importa tres
 * archivos de Cenit que no existen fuera de Cenit —
 *
 *     import { SupabaseAuthGuard } from '../../auth/auth.guard';
 *     import type { ProfilesRepository } from '../../auth/profiles.repository';
 *     import type { SupabaseService } from '../../shared/supabase.service';
 *
 * Es un defecto del kit v1.1.0, no de esta instalación: el `LEEME.md` dice que
 * `nucleo/` se copia byte por byte a cualquier app, y este archivo no es
 * portable. Se arregla **en el kit** —sacándolo de `nucleo/` hacia
 * `tests-por-app/`, que es la carpeta de lo que cada app adapta, con su
 * `VERSION` y sus huellas nuevas— y eso lo decide Dirección de 512. Está en el
 * informe de la #15.
 *
 * ── Lo que NO se hizo, y es lo que importa ──────────────────────────────
 * No se editó el archivo. La huella sigue siendo la del kit y
 * `check-seguridad-512.mjs` compara 19 de 19. Lo que se hace acá es solo **no
 * ejecutarlo**, y se declara en voz alta porque un test que no corre no grita:
 * se calla, y desde afuera un silencio se parece muchísimo a un «todo bien».
 *
 * ── Y la vigilancia que se perdía, se recuperó ──────────────────────────
 * Lo que ese archivo afirma —que el token se valida UNA sola vez por pedido— lo
 * afirma ahora `src/una-sola-validacion.spec.ts`, escrito contra las piezas de
 * esta app (`SupabaseService`, `RolMiddleware`) en vez de las de Cenit. No es
 * la misma prueba: es la misma propiedad, probada donde se puede probar.
 */
export default defineConfig({
  test: {
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      'src/seguridad-512/nucleo/usuario-del-pedido.spec.ts',
    ],
  },
});
