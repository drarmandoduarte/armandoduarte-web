import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { type Express } from 'express';
import { AppModule } from './app.module';

/**
 * Crea la app de Nest sobre un Express, y devuelve el Express.
 *
 * ── Por qué así, y no `NestFactory.create()` a secas ────────────────────
 * Porque el destino es una **función de Vercel**, que no arranca un servidor:
 * recibe `(req, res)` y espera que alguien los atienda. Nest sobre un adaptador
 * de Express deja justamente eso —el `Express` de abajo es un manejador
 * `(req, res)`— sin ningún puente escrito a mano.
 *
 * `init()` en vez de `listen()`: se arma el grafo de dependencias, se registran
 * las rutas, y no se abre ningún puerto.
 */
export async function crearApp(): Promise<Express> {
  const servidorExpress = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(servidorExpress), {
    /* Sin `console`: el logger de Nest, que en Vercel va a su recolector. La
       regla de la casa es Pino y todavía no entró a este repo; hasta que entre,
       lo que NO se hace es `console.log`, y eso el kit lo vigila dentro de
       `acceso/`. Anotado en el informe. */
    logger: ['error', 'warn', 'log'],
  });

  /* Todas las rutas cuelgan de /api: es el prefijo que `vercel.json` manda a
     esta función, y el que la pantalla llama. */
  app.setGlobalPrefix('api');

  /* Todo input HTTP pasa por DTOs (CLAUDE.md). `whitelist` tira lo que no está
     declarado y `forbidNonWhitelisted` lo denuncia en vez de ignorarlo: un
     campo de más en el cuerpo es alguien probando, no un descuido. */
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  await app.init();
  return servidorExpress;
}

/**
 * El manejador que usa la función de Vercel, creado **una sola vez** por
 * instancia.
 *
 * La promesa se guarda, no el resultado: dos invocaciones que lleguen juntas a
 * una instancia fría comparten el mismo arranque en vez de construir dos apps
 * de Nest. Es el patrón de siempre para funciones serverless y el motivo por el
 * que `crearApp()` no abre puerto.
 */
let enCurso: Promise<Express> | null = null;

export function manejadorHttp(): Promise<Express> {
  if (!enCurso) {
    enCurso = crearApp().catch((error: unknown) => {
      /* Si el arranque falla —falta una variable de entorno, por ejemplo— se
         limpia la promesa para que el próximo pedido lo vuelva a intentar. Sin
         esto, una instancia que arrancó mal queda envenenada hasta que Vercel
         la recicle, y el mensaje que diría cuál variable falta no se ve nunca. */
      enCurso = null;
      Logger.error(`La API no pudo arrancar: ${(error as Error)?.message ?? 'sin mensaje'}`);
      throw error;
    });
  }
  return enCurso;
}
