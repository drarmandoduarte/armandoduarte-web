/**
 * PLANTILLA · Kit de Acceso · test por app. Se copia, se adaptan las líneas
 * marcadas `← ADAPTAR` (imports, rutas, roles) y recién ahí se corre. Tal cual
 * NO compila: nombra módulos que cada app tiene con su propio nombre.
 * Va en: `<api>/src/auth/` (o cualquier carpeta un nivel abajo de `src/`).
 */
import { describe, it, expect } from 'vitest';
import 'reflect-metadata';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { ModuloRaiz } from '../modulo-raiz'; // ← ADAPTAR: el módulo raíz de Nest de la app, con su nombre y su ruta
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
 * ← ADAPTAR: esta lista (y este comentario) son los de la app de origen. Cada
 * app escribe las suyas, una por una, con su razón; el CEO las revisa en el PR.
 *
 * Todas comparten una sola condición: se llaman ANTES de que la sesión pueda
 * llegar a AAL2. Se verificó una por una leyendo `App.tsx`, `authStore.ts`,
 * `RequireAal2.tsx`, `ForceEnroll.tsx`, `TotpChallenge.tsx` y `Login.tsx`.
 *
 * No están acá, y no deben estar:
 *  - `POST /auth/2fa/backup-codes` (generar) y `GET .../count`: se llaman
 *    DESPUÉS de verificar el TOTP, con la sesión ya en AAL2 (ForceEnroll y
 *    Configuración → Cuenta).
 *  - `POST /auth/2fa/backup-codes/verify`: el re-chequeo intra-app ocurre en
 *    AAL2. El caso "perdí el celular" entra por `/auth/2fa/recover`.
 *  - `PATCH /me/profile`: escribe el perfil, ya dentro de la app.
 *
 * `POST /auth/devices/seen` sí está, y es la única excepción que se agregó
 * después del #16: el momento que hay que avisar —"entraste desde un aparato
 * nuevo"— es justo cuando alguien acaba de entrar con el correo y TODAVÍA no
 * puso el código. Si esperara al segundo paso, el aviso llegaría tarde. La ruta
 * no lee ni escribe datos de negocio y devuelve `{ ok }` a secas.
 */
const EXCEPCIONES: ReadonlyArray<{ ruta: string; razon: string }> = [
  {
    ruta: 'GET /salud',
    razon: 'infra: healthcheck del deploy, sin sesión ni datos de nadie',
  },
  {
    ruta: 'GET /me',
    razon: 'arranque: la app pide /me antes de montar el gate de 2FA',
  },
  {
    ruta: 'POST /alta',
    razon: 'alta: crear la cuenta ocurre antes del enrolamiento del 2FA',
  },
  {
    ruta: 'POST /auth/2fa/recover',
    razon: 'recuperación: la persona perdió el autenticador',
  },
  {
    ruta: 'POST /auth/devices/seen',
    razon: 'aviso de aparato nuevo: se manda al entrar, antes del segundo paso',
  },
];

describe('Cobertura del segundo paso (AAL2) — guardián', () => {
  const reflector = new Reflector();
  const routes = collectRoutes(ModuloRaiz);

  it('hay rutas para inspeccionar (si esto falla, el inventario se rompió)', () => {
    expect(routes.length).toBeGreaterThan(50); // ← ADAPTAR: un piso cerca de las rutas que la app tiene hoy
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
