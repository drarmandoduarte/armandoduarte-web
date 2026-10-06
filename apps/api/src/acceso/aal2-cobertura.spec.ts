/**
 * PLANTILLA · Kit de Acceso · test por app. Se copia, se adaptan las líneas
 * marcadas `← ADAPTAR` (imports, rutas, roles) y recién ahí se corre. Tal cual
 * NO compila: nombra módulos que cada app tiene con su propio nombre.
 * Va en: `<api>/src/auth/` (o cualquier carpeta un nivel abajo de `src/`). En Mi espacio: `apps/api/src/acceso/`.
 */
import { describe, it, expect } from 'vitest';
import 'reflect-metadata';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { AppModule as ModuloRaiz } from '../app.module'; // ← ADAPTAR: hecho, el módulo raíz de Mi espacio (`AppModule`)
import { Aal2Guard, readExemptionReason } from '../acceso/nucleo/aal2.guard';
import { SinSegundoPaso } from '../acceso/nucleo/sin-segundo-paso.decorator';
import {
  collectModules,
  collectRoutes,
  contextFor,
  controllersOf,
} from '../acceso/nucleo/cobertura';

/**
 * GUARDIÁN DEL SEGUNDO PASO (Kit de Acceso · S3) — ADAPTADOR.
 *
 * La maquinaria (recorrer el inventario real de rutas de Nest) vive en el
 * núcleo, en `acceso/nucleo/cobertura.ts`, y sirve igual en cualquier
 * app. Lo que NO puede ser neutro, y por eso se queda acá, es la LISTA de
 * excepciones: cuáles rutas de ESTA app no exigen el segundo paso y por qué.
 * Esa lista es la decisión de seguridad que hay que leer en el review.
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
 * ← ADAPTAR: hecho. La lista de Mi espacio (orden #15, C; el rescate, #37 PR 2).
 *
 * Son **seis**, y todas comparten la condición que las justifica: se llaman
 * antes de que la sesión pueda llegar a `aal2`, o sin sesión. El CEO las revisa
 * una por una; lo que sigue es lo que tiene que poder auditar.
 *
 *  · `GET /salud` — chequeo de vida, sin datos de nadie.
 *  · `POST /respaldo/usar` — la vía de quien perdió el autenticador y tiene un
 *    código de respaldo (P6). Se llama con la sesión en `aal1`.
 *  · `POST /rescate/pedir`, `/confirmar` y `/cancelar` — el rescate solo
 *    (fase-2 §8): quien no tiene ni el teléfono ni los códigos pide el reseteo
 *    con su correo, **sin sesión**, y lo confirma o lo cancela desde el enlace
 *    del correo, que puede abrir en otro aparato. Lo que las hace seguras no es
 *    el guard: `pedir` no dice si el correo existe y contesta igual siempre, y
 *    `confirmar`/`cancelar` piden el token del enlace (32 bytes al azar; en la
 *    base solo su SHA-256).
 *  · `POST /rescate/aplicar` — a las 48 h, la persona entra con el código por
 *    correo (`aal1`) y esta ruta borra su autenticador viejo para que enrole
 *    uno nuevo. Solo hace algo si hay un rescate suyo confirmado, sin cancelar,
 *    sin usar y vencido; si no, contesta `{ aplicado: false }` y no toca nada.
 *
 * ── Lo que NO está acá, y es más importante que lo que está ─────────────
 *  · `GET /yo` — **no es excepción, y es deliberado.** Un **cliente** llega con
 *    `aal1` y pasa solo, porque `RolMiddleware` le dejó el rol en el pedido y
 *    `esEquipo('cliente')` es falso; un **equipo** sin segundo paso recibe
 *    `AAL2_REQUIRED` y la pantalla lo manda a enrolar o al reto.
 *  · `POST /respaldo/generar` y `GET /respaldo/cuantos` — con la sesión ya en
 *    `aal2`. Generar lleva además `@PasoReciente(5)`.
 *  · `POST /sesiones/cerrar-las-otras`, `/pagos/*`, `/talleres/*`, `/equipo/*`
 *    — quien las pide ya está adentro; el cliente pasa con `aal1` por su rol.
 *  · **Ninguna ruta resetea el autenticador de otra persona.** Mi espacio es de
 *    rescate solo: no existe `/equipo/.../resetear`, y el piso de abajo lo
 *    afirma (la lista de rutas es exacta).
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
  {
    ruta: 'POST /rescate/pedir',
    razon:
      'rescate solo: lo pide quien perdió el autenticador y los códigos, sin sesión; contesta igual exista o no el correo',
  },
  {
    ruta: 'POST /rescate/confirmar',
    razon: 'rescate solo: se abre desde el enlace del correo, sin sesión; vale solo con el token del enlace',
  },
  {
    ruta: 'POST /rescate/cancelar',
    razon: 'rescate solo: se abre desde el enlace del correo de aviso, sin sesión; vale solo con el token del enlace',
  },
  {
    ruta: 'POST /rescate/aplicar',
    razon:
      'rescate solo: a las 48 h la persona entra con el código por correo (aal1) y no puede llegar a aal2 sin autenticador',
  },
];

describe('Cobertura del segundo paso (AAL2) — guardián', () => {
  const reflector = new Reflector();
  const routes = collectRoutes(ModuloRaiz);

  it('hay rutas para inspeccionar (si esto falla, el inventario se rompió)', () => {
    /* ← ADAPTAR: hecho, y más estricto que un piso: la lista EXACTA de rutas de
       Mi espacio. Van sin el `/api` (lo agrega `setGlobalPrefix` al arrancar,
       no está en la metadata que lee `collectRoutes`). Una ruta nueva se suma
       acá a la vista; un barrido que devuelve menos, se pone rojo. */
    expect(
      routes.map((r) => r.label).sort(),
      'el inventario real de rutas de Nest cambió. Si agregaste una, súmala acá; si el barrido '
      + 'devolvió menos de las que hay, la metadata no se leyó y nada de lo que sigue afirma nada.',
    ).toEqual([
      'GET /equipo/clientes',
      'GET /equipo/clientes/:id',
      'GET /equipo/cursos',
      'GET /equipo/inscriptos/:edicion',
      'GET /pagos/comprobante/:inscripcion',
      'GET /respaldo/cuantos',
      'GET /salud',
      'GET /talleres',
      'GET /yo',
      'POST /equipo/clientes/:id/notas',
      'POST /equipo/cursos',
      'POST /equipo/cursos/:id',
      'POST /equipo/ediciones',
      'POST /equipo/ediciones/:id',
      'POST /equipo/miembros',
      'POST /equipo/miembros/:id/quitar',
      'POST /pagos/declarar',
      'POST /pagos/resolver',
      'POST /rescate/aplicar',
      'POST /rescate/cancelar',
      'POST /rescate/confirmar',
      'POST /rescate/pedir',
      'POST /respaldo/generar',
      'POST /respaldo/usar',
      'POST /sesiones/cerrar-las-otras',
      'POST /talleres/inscribirme',
      'POST /yo',
    ]);
  });

  it('Aal2Guard está registrado como guard GLOBAL en el módulo raíz', () => {
    const providers = (Reflect.getMetadata('providers', ModuloRaiz) ?? []) as unknown[];
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
    for (const mod of collectModules(ModuloRaiz)) {
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
