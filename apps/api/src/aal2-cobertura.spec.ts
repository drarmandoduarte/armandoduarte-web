import { describe, it, expect } from 'vitest';
import 'reflect-metadata';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { AppModule } from './app.module';
import { Aal2Guard, readExemptionReason } from './seguridad-512/nucleo/aal2.guard';
import { SinSegundoPaso } from './seguridad-512/nucleo/sin-segundo-paso.decorator';
import {
  collectModules,
  collectRoutes,
  contextFor,
  controllersOf,
} from './seguridad-512/nucleo/cobertura';

/**
 * GUARDIÁN DEL SEGUNDO PASO (Kit de Seguridad 512 · S3) — ADAPTADOR.
 *
 * La maquinaria (recorrer el inventario real de rutas de Nest) vive en el
 * núcleo, en `seguridad-512/nucleo/cobertura.ts`, y sirve igual en cualquier
 * app. Lo que NO puede ser neutro, y por eso se queda acá, es la LISTA de
 * excepciones: cuáles rutas de ESTA app no exigen el segundo paso y por qué.
 * Esa lista es la decisión de seguridad que hay que leer en el review.

Lo adaptado en esta app (orden Códice #15, C): la lista de excepciones, el
inventario de rutas del piso y las rutas del prefijo `/api`. La maquinaria no se
tocó — se importa del núcleo.
 *
 * `Aal2Guard` es global: TODA ruta exige 2FA verificado y reciente. La única
 * salida es `@SinSegundoPaso('razón')`. Este test recorre el inventario real de
 * rutas de Nest (la misma metadata que usa el framework para rutearlas) y exige
 * que el conjunto de excepciones sea EXACTAMENTE el de abajo, razón incluida.
 *
 * Si mañana alguien agrega una excepción y no la escribe acá, este test va a
 * rojo. Es a propósito: obliga a que la excepción quede a la vista, con su
 * razón, en un archivo que se lee en el review.
 *
 * Lo contrario —agregar un controlador nuevo SIN nada— ya no es un agujero: la
 * lógica está invertida y nace protegido. Eso es justamente lo que se compró
 * con S3.
 */

/**
 * LAS ÚNICAS RUTAS QUE NO EXIGEN EL SEGUNDO PASO, Y POR QUÉ.
 *
 * Son **dos**, y las dos comparten la condición que las justifica: se llaman
 * antes de que la sesión pueda llegar a `aal2`. El CEO las revisa una por una;
 * lo que sigue es lo que tiene que poder auditar.
 *
 * ── Lo que NO está acá, y es más importante que lo que está ─────────────
 *  · `GET /api/yo` — **no es excepción, y es deliberado.** Es la primera
 *    llamada de la pantalla, así que la tentación de eximirla es fuerte. No
 *    hace falta: el guard ya distingue: un **cliente** llega con `aal1` y pasa
 *    solo, porque `RolMiddleware` le dejó el rol en el pedido y
 *    `esEquipo('cliente')` es falso; un **equipo** sin segundo paso recibe
 *    `AAL2_REQUIRED` y la pantalla lo manda a enrolar o al reto, que es
 *    exactamente lo que se quiere. Eximirla le daría a una cuenta de equipo una
 *    respuesta completa antes del segundo paso.
 *  · `POST /api/respaldo/generar` y `GET /api/respaldo/cuantos` — se llaman con
 *    la sesión ya en `aal2`, desde Mi espacio. Generar lleva además
 *    `@PasoReciente(5)`.
 *  · `POST /api/sesiones/cerrar-las-otras` — quien la pide ya está adentro.
 *  · `/api/pagos/*` (#27 C) — tampoco: el cliente declara y ve su comprobante
 *    con `aal1` por la misma razón; resolver es del equipo y exige `aal2`.
 *  · `GET /api/talleres` y `POST /api/talleres/inscribirme` (#24 B) — tampoco:
 *    un cliente pasa con `aal1` por la misma razón que en `/api/yo`, y una
 *    cuenta de equipo que quiera anotarse lo hace con su segundo paso.
 */
const EXCEPCIONES: ReadonlyArray<{ ruta: string; razon: string }> = [
  {
    ruta: 'GET /salud',
    razon:
      'chequeo de vida sin datos: no lee la base, no mira el token y no devuelve nada de nadie',
  },
  {
    ruta: 'POST /respaldo/usar',
    razon:
      'se llama desde la pantalla de entrada, con la sesión en aal1: es la vía de quien perdió el '
      + 'autenticador y no puede llegar a aal2 de otra forma',
  },
];

describe('Cobertura del segundo paso (AAL2) — guardián', () => {
  const reflector = new Reflector();
  const routes = collectRoutes(AppModule);

  /* ── Las rutas van SIN el `/api`, y eso es lo correcto ──────────────────
     `collectRoutes` del núcleo lee la metadata que Nest usa para rutear, o sea
     lo que **declara** cada controlador. El `/api` no está ahí: lo agrega
     `app.setGlobalPrefix('api')` en `servidor.ts`, en tiempo de arranque.
     Escribirlo acá haría que el test no encontrara ninguna ruta y se pusiera
     rojo por una razón que no es la suya. Lo que la persona ve en el navegador
     es `/api/yo`; lo que este inventario mira es `/yo`.

     EL PISO, PRIMERO. Cenit pedía más de 50 rutas; esta app tiene **seis** y
     el número se baja acá, que es un renglón que se lee. Con la #24 A suma las
     nueve de `/equipo`, **ninguna exceptuada**: el panel es del equipo y el
     equipo entra con segundo paso. Sin esto, «todas las
     rutas exigen el segundo paso» sobre un inventario vacío sale verde, y un
     inventario vacío es exactamente lo que deja un `AppModule` que no compiló. */
  it('hay rutas para inspeccionar (si esto falla, el inventario se rompió)', () => {
    expect(
      routes.map((r) => r.label).sort(),
      'el inventario real de rutas de Nest cambió. Si agregaste una, súmala acá; si el barrido '
      + 'devolvió menos de las que hay, la metadata no se leyó y nada de lo que sigue afirma nada.',
    ).toEqual([
      'GET /equipo/clientes',
      'GET /equipo/cursos',
      'GET /equipo/inscriptos/:edicion',
      'GET /pagos/comprobante/:inscripcion',
      'GET /respaldo/cuantos',
      'GET /salud',
      'GET /talleres',
      'GET /yo',
      'POST /equipo/cursos',
      'POST /equipo/cursos/:id',
      'POST /equipo/ediciones',
      'POST /equipo/ediciones/:id',
      'POST /equipo/miembros',
      'POST /equipo/miembros/:id/quitar',
      'POST /pagos/declarar',
      'POST /pagos/resolver',
      'POST /respaldo/generar',
      'POST /respaldo/usar',
      'POST /sesiones/cerrar-las-otras',
      'POST /talleres/inscribirme',
    ]);
  });

  it('Aal2Guard está registrado como guard GLOBAL en AppModule', () => {
    const providers = (Reflect.getMetadata('providers', AppModule) ?? []) as unknown[];
    const globales = providers.filter(
      (p): p is { provide: unknown; useClass: unknown } =>
        typeof p === 'object' && p !== null && 'provide' in p && 'useClass' in p,
    );
    expect(globales.some((p) => p.provide === APP_GUARD && p.useClass === Aal2Guard)).toBe(true);
  });

  it('las excepciones son EXACTAMENTE las declaradas en este archivo, con su razón', () => {
    const encontradas = routes
      .map((route) => ({
        ruta: route.label,
        razon: readExemptionReason(reflector, contextFor(route)),
      }))
      .filter((r): r is { ruta: string; razon: string } => r.razon !== undefined)
      .sort((a, b) => a.ruta.localeCompare(b.ruta));

    const esperadas = [...EXCEPCIONES].sort((a, b) => a.ruta.localeCompare(b.ruta));

    expect(
      encontradas,
      'Cambió el inventario de excepciones al 2FA. Si agregaste una, escribila en ' +
        'EXCEPCIONES con su razón; si sacaste una, borrala de la lista.',
    ).toEqual(esperadas);
  });

  it('toda ruta que no es excepción exige el segundo paso', () => {
    const exentas = new Set(EXCEPCIONES.map((e) => e.ruta));
    const sinCubrir = routes
      .filter((route) => !exentas.has(route.label))
      .filter((route) => readExemptionReason(reflector, contextFor(route)) !== undefined)
      .map((route) => route.label);
    expect(sinCubrir, `rutas exentas sin declarar: ${sinCubrir.join(', ')}`).toEqual([]);
  });

  it('ninguna razón queda en blanco', () => {
    for (const excepcion of EXCEPCIONES) {
      expect(excepcion.razon.trim(), `${excepcion.ruta} sin razón`).not.toBe('');
    }
  });

  /**
   * El guard global hace el trabajo: repetirlo por controlador es ruido, y peor,
   * invita a creer que quitarlo de un controlador lo desprotege. Ya no.
   */
  it('ningún controlador vuelve a declarar Aal2Guard a mano', () => {
    const duplicados: string[] = [];
    for (const mod of collectModules(AppModule)) {
      for (const controller of controllersOf(mod)) {
        const deClase = (Reflect.getMetadata(GUARDS_METADATA, controller) ?? []) as unknown[];
        if (deClase.includes(Aal2Guard)) duplicados.push(controller.name);
        const proto = controller.prototype as Record<string, unknown>;
        for (const name of Object.getOwnPropertyNames(proto)) {
          if (name === 'constructor') continue;
          const handler = proto[name];
          if (typeof handler !== 'function') continue;
          const deRuta = (Reflect.getMetadata(GUARDS_METADATA, handler) ?? []) as unknown[];
          if (deRuta.includes(Aal2Guard)) duplicados.push(`${controller.name}.${name}`);
        }
      }
    }
    expect(duplicados, `Aal2Guard duplicado en: ${duplicados.join(', ')}`).toEqual([]);
  });
});

describe('@SinSegundoPaso — la razón es obligatoria', () => {
  it('acepta una razón escrita', () => {
    expect(() => SinSegundoPaso('porque sí, y acá está el porqué')).not.toThrow();
  });

  it('rechaza una razón vacía o en blanco', () => {
    expect(() => SinSegundoPaso('')).toThrow(/razón no vacía/);
    expect(() => SinSegundoPaso('   ')).toThrow(/razón no vacía/);
  });
});
