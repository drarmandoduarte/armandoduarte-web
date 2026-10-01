import { Module, type MiddlewareConsumer, type NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Aal2Guard } from './seguridad-512/nucleo/aal2.guard';
import { VERIFICADOR_DE_TOKEN } from './seguridad-512/nucleo/verificador-de-token';
import { SupabaseService } from './identidad/supabase.service';
import { RolMiddleware } from './identidad/rol.middleware';
import { SaludController } from './salud.controller';
import { YoController } from './yo/yo.controller';
import { RespaldoController } from './respaldo/respaldo.controller';
import { SesionesController } from './sesiones/sesiones.controller';
import { EquipoController } from './equipo/equipo.controller';
import { EquipoRepositorio } from './equipo/equipo.repositorio';
import { TalleresController } from './talleres/talleres.controller';
import { TalleresRepositorio } from './talleres/talleres.repositorio';
import { PagosController } from './pagos/pagos.controller';
import { PagosRepositorio } from './pagos/pagos.repositorio';
import { CorreoService } from './correo/correo.service';

/**
 * El módulo raíz de la API de Mi espacio.
 *
 * ── Las dos líneas que hacen toda la seguridad ──────────────────────────
 * `APP_GUARD` con el `Aal2Guard` del kit: **deny-by-default**. Toda ruta exige
 * el segundo paso desde el momento en que existe, aunque quien la escriba se
 * olvide de todo. Una ruta nueva nace protegida; para dejarla pasar hay que
 * escribir `@SinSegundoPaso('razón')` y anotarla en `aal2-cobertura.spec.ts`,
 * que son dos actos visibles en un diff.
 *
 * Y `VERIFICADOR_DE_TOKEN` apuntando a `SupabaseService`, que es el enchufe que
 * el núcleo declara y no implementa. Son las dos únicas puertas por las que
 * entra algo de esta app al kit; la tercera es `seguridad-512.config.ts`.
 */
@Module({
  controllers: [SaludController, YoController, RespaldoController, SesionesController, EquipoController, TalleresController, PagosController],
  providers: [
    SupabaseService,
    EquipoRepositorio,
    TalleresRepositorio,
    PagosRepositorio,
    CorreoService,
    { provide: VERIFICADOR_DE_TOKEN, useExisting: SupabaseService },
    { provide: APP_GUARD, useClass: Aal2Guard },
  ],
})
export class AppModule implements NestModule {
  configure(consumidor: MiddlewareConsumer): void {
    /* Sobre TODAS las rutas: el guard necesita el rol en cualquiera de ellas
       para poder distinguir un cliente de un equipo. */
    consumidor.apply(RolMiddleware).forRoutes('*path');
  }
}
