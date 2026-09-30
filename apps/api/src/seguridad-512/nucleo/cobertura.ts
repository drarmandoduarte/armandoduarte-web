import { RequestMethod } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { PATH_METADATA, METHOD_METADATA } from '@nestjs/common/constants';

/**
 * KIT DE SEGURIDAD 512 · NÚCLEO (S3) — NO se edita en una app.
 *
 * Maquinaria del test guardián de cobertura: recorre el inventario REAL de
 * rutas HTTP de una app Nest leyendo la misma metadata que usa el framework
 * para rutearlas. Es neutra a propósito — la LISTA de excepciones de cada app
 * (y sus aserciones) vive en el adaptador `aal2-cobertura.spec.ts`, porque las
 * excepciones son una decisión de esa app y tienen que leerse en su review.
 */

export type Ctor = new (...args: never[]) => object;

/** Módulos alcanzables desde el módulo raíz (ignora los dinámicos, que son objetos). */
export function collectModules(root: unknown): Ctor[] {
  const seen = new Set<object>();
  const out: Ctor[] = [];
  const visit = (mod: unknown): void => {
    if (typeof mod !== 'function' || seen.has(mod)) return;
    seen.add(mod);
    out.push(mod as Ctor);
    for (const imp of (Reflect.getMetadata('imports', mod) ?? []) as unknown[]) visit(imp);
  };
  visit(root);
  return out;
}

export function controllersOf(mod: Ctor): Ctor[] {
  return (Reflect.getMetadata('controllers', mod) ?? []) as Ctor[];
}

const METHOD_NAMES: Record<number, string> = {
  [RequestMethod.GET]: 'GET',
  [RequestMethod.POST]: 'POST',
  [RequestMethod.PUT]: 'PUT',
  [RequestMethod.DELETE]: 'DELETE',
  [RequestMethod.PATCH]: 'PATCH',
  [RequestMethod.ALL]: 'ALL',
  [RequestMethod.OPTIONS]: 'OPTIONS',
  [RequestMethod.HEAD]: 'HEAD',
};

function joinPath(base: unknown, sub: unknown): string {
  const clean = (p: unknown): string => (typeof p === 'string' ? p.replace(/^\/+|\/+$/g, '') : '');
  const segments = [clean(base), clean(sub)].filter(Boolean);
  return `/${segments.join('/')}`;
}

export interface RouteInfo {
  /** `"POST /team/invite"` — como se lee en el navegador, no como se declara. */
  label: string;
  controller: Ctor;
  handler: (...args: never[]) => unknown;
}

/** Inventario real de rutas HTTP registradas, desde la metadata de Nest. */
export function collectRoutes(root: unknown): RouteInfo[] {
  const routes: RouteInfo[] = [];
  for (const mod of collectModules(root)) {
    for (const controller of controllersOf(mod)) {
      const basePath = Reflect.getMetadata(PATH_METADATA, controller) as unknown;
      const proto = controller.prototype as Record<string, unknown>;
      for (const name of Object.getOwnPropertyNames(proto)) {
        if (name === 'constructor') continue;
        const handler = proto[name];
        if (typeof handler !== 'function') continue;
        const subPath = Reflect.getMetadata(PATH_METADATA, handler) as unknown;
        if (subPath === undefined) continue; // no es un handler de ruta
        const verb = Reflect.getMetadata(METHOD_METADATA, handler) as number | undefined;
        const method = METHOD_NAMES[verb ?? RequestMethod.GET] ?? 'GET';
        routes.push({
          label: `${method} ${joinPath(basePath, subPath)}`,
          controller,
          handler: handler as (...args: never[]) => unknown,
        });
      }
    }
  }
  return routes;
}

/** Contexto mínimo con la ruta REAL, para preguntarle al guard lo mismo que Nest. */
export function contextFor(route: RouteInfo): ExecutionContext {
  return {
    getHandler: () => route.handler,
    getClass: () => route.controller,
  } as unknown as ExecutionContext;
}
